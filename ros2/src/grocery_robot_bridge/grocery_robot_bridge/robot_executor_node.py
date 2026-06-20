"""robot_executor_node.

A SIMULATED robot that fulfills the ExecuteOrder action so the whole integration
can be demoed without physical hardware. Replace this node with your real
navigation + perception + manipulation stack; keep the same action/topic
contract and the website integration keeps working unchanged.

For each item it walks through: navigating -> product_found -> picking -> placing,
publishing TaskFeedback + RobotLocation + RobotStatus, and finally returns a
result. Set FAIL_ON_ITEM env var to simulate a failure on a given item index.
"""
import os
import time

import rclpy
from rclpy.action import ActionServer
from rclpy.node import Node

from grocery_robot_interfaces.action import ExecuteOrder
from grocery_robot_interfaces.msg import RobotLocation, RobotStatus, TaskFeedback

from .config import get_config


class RobotExecutor(Node):
    def __init__(self):
        super().__init__('robot_executor')
        self.cfg = get_config()
        self.robot_id = self.cfg['robot_identifier']
        self.step_delay = self.cfg['sim_step_delay']
        self.fail_on_item = int(os.environ.get('FAIL_ON_ITEM', '-1'))

        self.status_pub = self.create_publisher(RobotStatus, '/robot/status', 10)
        self.location_pub = self.create_publisher(RobotLocation, '/robot/location', 10)
        self.feedback_pub = self.create_publisher(TaskFeedback, '/robot/task_feedback', 10)

        self._action_server = ActionServer(
            self, ExecuteOrder, 'execute_order', self._execute_cb)

        # Idle heartbeat.
        self.create_timer(2.0, self._publish_idle_status)
        self._busy = False
        self.get_logger().info(f"Simulated robot '{self.robot_id}' ready (execute_order).")

    def _publish_idle_status(self):
        if self._busy:
            return
        msg = RobotStatus()
        msg.robot_id = self.robot_id
        msg.state = 'idle'
        msg.battery_level = 95.0
        msg.message = 'Waiting for orders'
        self.status_pub.publish(msg)

    def _feedback(self, goal_handle, order, state, step, progress,
                  location=None, error_message=''):
        loc = RobotLocation()
        loc.robot_id = self.robot_id
        if location:
            loc.zone = location.get('zone', '')
            loc.label = location.get('label', '')
            loc.x = location.get('x', 0.0)
            loc.y = location.get('y', 0.0)
        self.location_pub.publish(loc)

        fb_msg = TaskFeedback()
        fb_msg.order_id = order.order_id
        fb_msg.task_id = order.task_id
        fb_msg.robot_id = self.robot_id
        fb_msg.state = state
        fb_msg.step = step
        fb_msg.progress = float(progress)
        fb_msg.error_message = error_message
        fb_msg.location = loc
        self.feedback_pub.publish(fb_msg)

        # Stream as action feedback too.
        action_fb = ExecuteOrder.Feedback()
        action_fb.feedback = fb_msg
        goal_handle.publish_feedback(action_fb)

        self.get_logger().info(f'[{state}] {step} ({progress:.0f}%)')

    def _execute_cb(self, goal_handle):
        self._busy = True
        order = goal_handle.request.order
        items = order.items
        total = max(len(items), 1)
        result = ExecuteOrder.Result()

        busy_status = RobotStatus()
        busy_status.robot_id = self.robot_id
        busy_status.state = 'busy'
        busy_status.battery_level = 92.0
        busy_status.current_order_id = order.order_id
        busy_status.message = 'Executing order'
        self.status_pub.publish(busy_status)

        for idx, item in enumerate(items):
            label = f'{item.title or item.sku} (Aisle {item.zone or "?"} / {item.shelf or "?"})'
            base = (idx / total) * 100.0
            span = (1 / total) * 100.0

            # Navigate
            self._feedback(goal_handle, order, 'navigating',
                           f'Navigating to {label}', base + span * 0.25,
                           {'zone': item.zone, 'label': label})
            time.sleep(self.step_delay)

            # Detect
            self._feedback(goal_handle, order, 'product_found',
                           f'Detected {item.title or item.sku}', base + span * 0.5,
                           {'zone': item.zone, 'label': label})
            time.sleep(self.step_delay)

            # Simulated failure path
            if idx == self.fail_on_item:
                self._feedback(goal_handle, order, 'failed',
                               f'Could not pick {item.title or item.sku}', base + span * 0.5,
                               {'zone': item.zone, 'label': label},
                               error_message='Pick-and-place failed: item out of reach')
                goal_handle.abort()
                result.success = False
                result.final_state = 'failed'
                result.message = 'Pick-and-place failed'
                self._busy = False
                return result

            # Pick
            self._feedback(goal_handle, order, 'picking',
                           f'Picking {item.quantity} x {item.title or item.sku}',
                           base + span * 0.75, {'zone': item.zone, 'label': label})
            time.sleep(self.step_delay)

            # Place
            self._feedback(goal_handle, order, 'placing',
                           f'Placing {item.title or item.sku} into tote',
                           base + span * 0.95, {'zone': item.zone, 'label': label})
            time.sleep(self.step_delay)

        self._feedback(goal_handle, order, 'completed', 'Order completed', 100.0)
        goal_handle.succeed()
        result.success = True
        result.final_state = 'completed'
        result.message = 'All items picked and placed'
        self._busy = False
        return result


def main(args=None):
    rclpy.init(args=args)
    node = RobotExecutor()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()


if __name__ == '__main__':
    main()
