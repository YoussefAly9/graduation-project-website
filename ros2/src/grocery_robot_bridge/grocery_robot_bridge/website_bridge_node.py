"""website_bridge_node.

Bridges the smart-grocery website backend (REST API) with the ROS 2 robot system.

Flow:
  1. Periodically send a heartbeat so the website knows the robot is online.
  2. Poll the backend for the next queued task (GET /api/robot/tasks/next).
  3. Convert the task into an OrderTask message and:
       - publish it on /website/orders (for any interested ROS 2 node), and
       - send it as a goal to the ExecuteOrder action server (the robot).
  4. Relay execution feedback back to the website
     (POST /api/robot/update-status) so the UI updates live.

Why REST (and not rosbridge/MQTT)?
  - The website backend is deployed as serverless functions (Vercel) that cannot
    hold inbound persistent connections. REST polling is initiated *outbound* by
    the robot, so it works through NAT/firewalls and on serverless with zero
    extra infrastructure. ROS 2 stays native on the robot side.
"""
import json

import rclpy
import requests
from rclpy.action import ActionClient
from rclpy.node import Node

from grocery_robot_interfaces.action import ExecuteOrder
from grocery_robot_interfaces.msg import OrderTask, ProductItem, RobotStatus, TaskFeedback

from .config import get_config


class WebsiteBridge(Node):
    def __init__(self):
        super().__init__('website_bridge')
        self.cfg = get_config()
        self.get_logger().info(f"Bridge -> backend: {self.cfg['api_url']} "
                               f"as robot '{self.cfg['robot_identifier']}'")

        # Publisher: orders coming from the website.
        self.orders_pub = self.create_publisher(OrderTask, '/website/orders', 10)

        # Action client to the robot executor.
        self._action_client = ActionClient(self, ExecuteOrder, 'execute_order')

        # Optional: relay raw feedback topics from robots that don't use the action.
        if self.cfg['feedback_source'] == 'topic':
            self.create_subscription(TaskFeedback, '/robot/task_feedback',
                                     self._on_task_feedback, 10)
        # Monitor robot health.
        self.create_subscription(RobotStatus, '/robot/status', self._on_robot_status, 10)

        self._busy = False
        self._current = None  # {order_id, task_id}

        # Main loop.
        self.create_timer(self.cfg['poll_interval'], self._tick)

    # ----------------------------- REST helpers -----------------------------
    def _post(self, path, payload):
        try:
            resp = requests.post(f"{self.cfg['api_url']}{path}", json=payload,
                                 timeout=self.cfg['request_timeout'])
            return resp.json() if resp.content else {}
        except requests.RequestException as exc:
            self.get_logger().warn(f'POST {path} failed: {exc}')
            return None

    def _get(self, path, params=None):
        try:
            resp = requests.get(f"{self.cfg['api_url']}{path}", params=params,
                                timeout=self.cfg['request_timeout'])
            return resp.json() if resp.content else {}
        except requests.RequestException as exc:
            self.get_logger().warn(f'GET {path} failed: {exc}')
            return None

    def _report(self, state, step='', progress=0.0, error_message='', location=None):
        """Push an execution update to the website."""
        if not self._current:
            return
        payload = {
            'taskId': self._current['task_id'],
            'orderId': self._current['order_id'],
            'state': state,
            'step': step,
            'progress': progress,
            'robotId': self.cfg['robot_identifier'],
        }
        if error_message:
            payload['errorMessage'] = error_message
        if location:
            payload['location'] = location
        self._post('/robot/update-status', payload)

    # ------------------------------ main loop -------------------------------
    def _tick(self):
        # Heartbeat keeps the robot shown as "online" on the website.
        self._post('/robot/controllers/heartbeat', {
            'identifier': self.cfg['robot_identifier'],
            'status': 'active',
        })

        if self._busy:
            return

        data = self._get('/robot/tasks/next', {'identifier': self.cfg['robot_identifier']})
        if not data or not data.get('data'):
            return

        task = data['data']
        self._dispatch(task)

    def _dispatch(self, task):
        order_id = str(task.get('order', {}).get('_id') if isinstance(task.get('order'), dict)
                       else task.get('order', ''))
        task_id = str(task.get('_id', ''))
        self._current = {'order_id': order_id, 'task_id': task_id}
        self._busy = True

        msg = self._to_order_task(task, order_id, task_id)
        self.orders_pub.publish(msg)
        self.get_logger().info(f'Dispatching order {order_id} ({len(msg.items)} items)')

        if self.cfg['feedback_source'] == 'action':
            self._send_action_goal(msg)
        # If feedback_source == 'topic', we just wait for /robot/task_feedback.

    def _to_order_task(self, task, order_id, task_id):
        msg = OrderTask()
        msg.order_id = order_id
        msg.task_id = task_id
        msg.user_id = ''
        msg.priority = int(task.get('priority', 3))
        msg.timestamp = 0
        items = []
        for it in task.get('items', []):
            product = it.get('product') if isinstance(it.get('product'), dict) else {}
            loc = it.get('storageLocation') or (product.get('storageLocation') if product else {}) or {}
            pi = ProductItem()
            pi.product_id = str(product.get('_id', '')) if product else ''
            pi.sku = str(product.get('sku', '')) if product else ''
            pi.title = str(product.get('title', '')) if product else ''
            pi.quantity = int(it.get('quantity', 1))
            pi.zone = str(loc.get('zone', '') or '')
            pi.aisle = str(loc.get('aisle', '') or '')
            pi.shelf = str(loc.get('shelf', '') or '')
            pi.bin = str(loc.get('bin', '') or '')
            items.append(pi)
        msg.items = items
        return msg

    # ------------------------------ action path -----------------------------
    def _send_action_goal(self, order_msg):
        if not self._action_client.wait_for_server(timeout_sec=3.0):
            self.get_logger().warn('No ExecuteOrder action server; reporting rejected.')
            self._report('rejected', 'No robot executor available',
                         error_message='Action server unavailable')
            self._finish()
            return

        goal = ExecuteOrder.Goal()
        goal.order = order_msg
        self._report('accepted', 'Robot accepted the task', 5.0)
        send_future = self._action_client.send_goal_async(
            goal, feedback_callback=self._on_action_feedback)
        send_future.add_done_callback(self._on_goal_response)

    def _on_goal_response(self, future):
        handle = future.result()
        if not handle.accepted:
            self._report('rejected', 'Robot rejected the task',
                         error_message='Goal rejected')
            self._finish()
            return
        handle.get_result_async().add_done_callback(self._on_action_result)

    def _on_action_feedback(self, feedback_msg):
        fb = feedback_msg.feedback.feedback
        loc = None
        if fb.location and (fb.location.label or fb.location.zone):
            loc = {'x': fb.location.x, 'y': fb.location.y,
                   'zone': fb.location.zone, 'label': fb.location.label}
        self._report(fb.state, fb.step, float(fb.progress), fb.error_message, loc)

    def _on_action_result(self, future):
        result = future.result().result
        if result.success:
            self._report('completed', result.message or 'Order completed', 100.0)
        else:
            self._report('failed', result.message or 'Order failed',
                         error_message=result.message)
        self._finish()

    def _finish(self):
        self._busy = False
        self._current = None

    # ------------------------------ topic path ------------------------------
    def _on_task_feedback(self, msg: TaskFeedback):
        if not self._current:
            return
        loc = None
        if msg.location and (msg.location.label or msg.location.zone):
            loc = {'x': msg.location.x, 'y': msg.location.y,
                   'zone': msg.location.zone, 'label': msg.location.label}
        self._report(msg.state, msg.step, float(msg.progress), msg.error_message, loc)
        if msg.state in ('completed', 'failed', 'rejected'):
            self._finish()

    def _on_robot_status(self, msg: RobotStatus):
        # Forward battery/state to the website heartbeat endpoint.
        self._post('/robot/controllers/heartbeat', {
            'identifier': self.cfg['robot_identifier'],
            'status': 'active' if msg.state in ('idle', 'busy') else msg.state,
            'batteryLevel': float(msg.battery_level) if msg.battery_level else None,
        })


def main(args=None):
    rclpy.init(args=args)
    node = WebsiteBridge()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()


if __name__ == '__main__':
    main()
