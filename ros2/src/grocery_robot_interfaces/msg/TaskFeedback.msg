# Step-by-step execution feedback, published on /robot/task_feedback.
string order_id
string task_id
string robot_id
# One of: accepted, rejected, navigating, product_found, picking, placing,
#         completed, failed
string state
string step            # Human-readable description of the current step
float32 progress       # 0..100
string error_message   # Set when state == failed/rejected
RobotLocation location
