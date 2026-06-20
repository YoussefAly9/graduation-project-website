# An order dispatched from the website to the robot system.
string order_id        # MongoDB order _id
string task_id         # MongoDB RobotTask _id
string user_id         # Customer identifier (optional)
int32 priority         # 1 (low) .. 5 (high)
int64 timestamp        # Unix epoch seconds when dispatched
ProductItem[] items    # Products + quantities + locations
