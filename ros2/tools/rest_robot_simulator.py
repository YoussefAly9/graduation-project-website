#!/usr/bin/env python3
"""Pure-REST robot simulator (NO ROS 2 required).

This lets you demo and test the FULL website integration — order dispatch, live
status pipeline, DB updates — without installing ROS 2. It behaves exactly like
the ROS 2 bridge + robot would, but talks only to the backend REST API.

It:
  1. Registers/heartbeats a robot controller.
  2. Polls GET /api/robot/tasks/next for a queued task.
  3. Walks each item through navigating -> product_found -> picking -> placing,
     POSTing to /api/robot/update-status after each step.
  4. Completes (or fails, with --fail-on-item N) the task.

Usage:
    python rest_robot_simulator.py --base-url http://localhost:5000 --robot RPI-HUB-01
    python rest_robot_simulator.py --base-url https://your-site.vercel.app --once
"""
import argparse
import sys
import time

try:
    import requests
except ImportError:
    sys.exit("Missing dependency. Run: pip install requests")


def api(base_url):
    base = base_url.rstrip('/')
    return base if base.endswith('/api') else base + '/api'


def post(url, payload, timeout):
    try:
        r = requests.post(url, json=payload, timeout=timeout)
        return r.json() if r.content else {}, r.status_code
    except requests.RequestException as exc:
        print(f'  ! POST failed: {exc}')
        return None, 0


def get(url, params, timeout):
    try:
        r = requests.get(url, params=params, timeout=timeout)
        return r.json() if r.content else {}, r.status_code
    except requests.RequestException as exc:
        print(f'  ! GET failed: {exc}')
        return None, 0


def run(args):
    base = api(args.base_url)
    print(f'Robot simulator -> {base} as {args.robot}')

    while True:
        # Heartbeat (keeps the robot "online" on the website).
        post(f'{base}/robot/controllers/heartbeat',
             {'identifier': args.robot, 'status': 'active', 'batteryLevel': 90},
             args.timeout)

        # Pull next task.
        data, _ = get(f'{base}/robot/tasks/next', {'identifier': args.robot}, args.timeout)
        task = (data or {}).get('data')
        if not task:
            if args.once:
                print('No queued tasks. Exiting (--once).')
                return
            time.sleep(args.poll)
            continue

        task_id = task.get('_id')
        order = task.get('order')
        order_id = order.get('_id') if isinstance(order, dict) else order
        items = task.get('items', [])
        print(f'\nExecuting task {task_id} (order {order_id}) with {len(items)} item(s)')

        def report(state, step, progress, error_message='', location=None):
            payload = {'taskId': task_id, 'orderId': order_id, 'state': state,
                       'step': step, 'progress': progress, 'robotId': args.robot}
            if error_message:
                payload['errorMessage'] = error_message
            if location:
                payload['location'] = location
            _, code = post(f'{base}/robot/update-status', payload, args.timeout)
            print(f'  [{state}] {step} ({progress}%) -> {code}')

        total = max(len(items), 1)
        failed = False
        for idx, item in enumerate(items):
            product = item.get('product') if isinstance(item.get('product'), dict) else {}
            loc = item.get('storageLocation') or {}
            name = (product.get('title') or product.get('sku') or 'item')
            label = f"{name} (Aisle {loc.get('zone', '?')} / {loc.get('shelf', '?')})"
            base_p = int((idx / total) * 100)
            span = int((1 / total) * 100)

            report('navigating', f'Navigating to {label}', base_p + span // 4,
                   location={'zone': loc.get('zone'), 'label': label})
            time.sleep(args.delay)
            report('product_found', f'Detected {name}', base_p + span // 2,
                   location={'zone': loc.get('zone'), 'label': label})
            time.sleep(args.delay)

            if idx == args.fail_on_item:
                report('failed', f'Could not pick {name}', base_p + span // 2,
                       error_message='Pick-and-place failed: item out of reach')
                failed = True
                break

            report('picking', f'Picking {item.get("quantity", 1)} x {name}',
                   base_p + (span * 3) // 4, location={'zone': loc.get('zone'), 'label': label})
            time.sleep(args.delay)
            report('placing', f'Placing {name} into tote', base_p + span,
                   location={'zone': loc.get('zone'), 'label': label})
            time.sleep(args.delay)

        if not failed:
            report('completed', 'Order completed', 100)
            print('Task completed.\n')

        if args.once:
            return


def main():
    p = argparse.ArgumentParser(description='Pure-REST robot simulator')
    p.add_argument('--base-url', default='http://localhost:5000',
                   help='Website backend base URL (with or without /api)')
    p.add_argument('--robot', default='RPI-HUB-01', help='Robot/controller identifier')
    p.add_argument('--poll', type=float, default=2.0, help='Poll interval (s)')
    p.add_argument('--delay', type=float, default=1.5, help='Delay between steps (s)')
    p.add_argument('--timeout', type=float, default=10.0, help='HTTP timeout (s)')
    p.add_argument('--fail-on-item', type=int, default=-1,
                   help='Simulate a failure on this item index')
    p.add_argument('--once', action='store_true', help='Process one task then exit')
    args = p.parse_args()
    try:
        run(args)
    except KeyboardInterrupt:
        print('\nStopped.')


if __name__ == '__main__':
    main()
