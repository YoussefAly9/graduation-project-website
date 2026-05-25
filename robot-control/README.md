# Robot Control Package (Raspberry Pi 5 + 2x Arduino Uno)

This folder contains:

- `raspberry_pi_hub.py` - Polls website API for queued tasks, sends commands to both Arduino boards, and reports status back to API.
- `arduino_base_controller/arduino_base_controller.ino` - Base motion controller sketch.
- `arduino_arm_controller/arduino_arm_controller.ino` - Arm motion controller sketch.

## 1) Flash Arduino boards

1. Open Arduino IDE.
2. Flash `arduino_base_controller.ino` to Uno #1 (base).
3. Flash `arduino_arm_controller.ino` to Uno #2 (arm).
4. Keep both connected via USB to Raspberry Pi.

## 2) Install dependencies on Raspberry Pi 5

```bash
sudo apt update
sudo apt install -y python3-pip
pip3 install requests pyserial
```

## 3) Update Raspberry Pi config

Edit `raspberry_pi_hub.py` values:

- `API_BASE` - Your backend URL (for example `http://192.168.1.50:5000/api`)
- `IDENTIFIER` - Should match your robot controller identifier in DB (for example `RPI-HUB-01`)
- `BASE_PORT` / `ARM_PORT` - Serial ports (commonly `/dev/ttyACM0`, `/dev/ttyACM1`)

## 4) Run

```bash
cd robot-control
python3 raspberry_pi_hub.py
```

## 5) Screenshot-based rebuild notes

Code has been rebuilt to match the hardware layout from your screenshot:

- Base Uno sketch is mapped for **Cytron MDD10A motor drivers** + encoder inputs + aux servo.
- Arm Uno sketch is mapped for **3 stepper drivers (PUL/DIR with shared EN)** + gripper servo.

## 6) Applied pin map

### Base Arduino Uno (drive base)

- `D2` -> `M1_DIR`
- `D3` -> `M1_PWM`
- `D4` -> `M2_DIR`
- `D5` -> `M2_PWM`
- `D6` -> `M3_PWM`
- `D7` -> `M3_DIR`
- `D9` -> `AUX_SERVO`
- `D10` -> `ENC1_A`
- `D11` -> `ENC1_B`
- `D12` -> `ENC2_A`
- `D13` -> `ENC2_B`
- `A4/A5` -> IMU I2C (`SDA/SCL`)

### Arm Arduino Uno (robot arm)

- `D2` -> `J1_STEP`
- `D3` -> `J1_DIR`
- `D4` -> `J2_STEP`
- `D5` -> `J2_DIR`
- `D6` -> `J3_STEP`
- `D7` -> `J3_DIR`
- `D8` -> `DRV_EN` (shared enable)
- `D9` -> `GRIPPER_SERVO`

