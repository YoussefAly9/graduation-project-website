# Grocery Robot — ROS 2 Integration

ROS 2 side of the smart-grocery website ↔ robot integration.

```
ros2/
├── src/
│   ├── grocery_robot_interfaces/   # msg / srv / action definitions
│   └── grocery_robot_bridge/       # website_bridge + robot_executor (sim) nodes
├── tools/
│   └── rest_robot_simulator.py     # demo/test WITHOUT ROS 2 (pure REST)
├── requirements.txt
└── .env.example
```

Quick start (no ROS needed):
```bash
pip install -r requirements.txt
python tools/rest_robot_simulator.py --base-url http://localhost:5000
```

Full ROS 2:
```bash
colcon build && source install/setup.bash
export BACKEND_BASE_URL=http://localhost:5000
ros2 launch grocery_robot_bridge integration.launch.py
```

See **[../docs/ROS2_INTEGRATION.md](../docs/ROS2_INTEGRATION.md)** for the full
architecture, API reference, payload examples, and testing guide.
