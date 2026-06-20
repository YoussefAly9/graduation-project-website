# High-level robot health/state, published periodically on /robot/status.
string robot_id
string state           # idle | busy | charging | error | offline
float32 battery_level  # 0..100
string current_order_id
string message
