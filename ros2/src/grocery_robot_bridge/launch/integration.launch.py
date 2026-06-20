"""Launch the website bridge and the simulated robot executor together.

Usage:
    BACKEND_BASE_URL=http://localhost:5000 ros2 launch grocery_robot_bridge integration.launch.py
"""
from launch import LaunchDescription
from launch_ros.actions import Node


def generate_launch_description():
    return LaunchDescription([
        Node(
            package='grocery_robot_bridge',
            executable='robot_executor',
            name='robot_executor',
            output='screen',
        ),
        Node(
            package='grocery_robot_bridge',
            executable='website_bridge',
            name='website_bridge',
            output='screen',
        ),
    ])
