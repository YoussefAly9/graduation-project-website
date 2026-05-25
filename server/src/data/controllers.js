export const defaultControllers = [
  {
    name: 'Aisle Picker 01',
    identifier: 'ARD-PICK-01',
    type: 'arduino',
    hardware: 'Arduino Mega 2560',
    firmwareVersion: '1.0.0',
    capabilities: ['picker', 'conveyor'],
    description: 'Primary picker arm controller for aisles A and B'
  },
  {
    name: 'Aisle Picker 02',
    identifier: 'ARD-PICK-02',
    type: 'arduino',
    hardware: 'Arduino Mega 2560',
    firmwareVersion: '1.0.0',
    capabilities: ['picker'],
    description: 'Secondary picker arm controller for aisles C and D'
  },
  {
    name: 'Drive Base Controller',
    identifier: 'ARD-DRIVE-03',
    type: 'arduino',
    hardware: 'Arduino Due',
    firmwareVersion: '1.0.0',
    capabilities: ['drive', 'lift'],
    description: 'Autonomous base and lift controller for robot navigation'
  },
  {
    name: 'Vision & Coordination Hub',
    identifier: 'RPI-HUB-01',
    type: 'raspberry_pi',
    hardware: 'Raspberry Pi 4 Model B 8GB',
    firmwareVersion: '2.1.0',
    capabilities: ['vision', 'task-coordinator', 'network'],
    description: 'Main compute module running YOLOv8 inference and dispatching tasks'
  }
];


