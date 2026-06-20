from setuptools import setup

package_name = 'grocery_robot_bridge'

setup(
    name=package_name,
    version='1.0.0',
    packages=[package_name],
    data_files=[
        ('share/ament_index/resource_index/packages', ['resource/' + package_name]),
        ('share/' + package_name, ['package.xml']),
        ('share/' + package_name + '/launch', ['launch/integration.launch.py']),
    ],
    install_requires=['setuptools', 'requests'],
    zip_safe=True,
    maintainer='Graduation Project Team',
    maintainer_email='team@example.com',
    description='ROS 2 <-> website backend bridge for smart-grocery robot fulfillment.',
    license='MIT',
    tests_require=['pytest'],
    entry_points={
        'console_scripts': [
            # Bridge between the website REST API and ROS 2.
            'website_bridge = grocery_robot_bridge.website_bridge_node:main',
            # Simulated robot that executes orders (for demos without hardware).
            'robot_executor = grocery_robot_bridge.robot_executor_node:main',
        ],
    },
)
