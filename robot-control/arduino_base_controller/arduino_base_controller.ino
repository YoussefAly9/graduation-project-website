/*
  COMPLETE TEST - Motors + Encoders + MDD10A Drivers
  Updated with RR_PWM = D13 (no conflict)
*/

#include <Encoder.h>

// ========== MOTOR PINS (MDD10A Drivers) ==========
// Driver 1 (Front wheels)
const int FL_DIR = 4;
const int FL_PWM = 5;
const int FR_DIR = 6;
const int FR_PWM = 9;

// Driver 2 (Rear wheels)
const int RL_DIR = 10;
const int RL_PWM = 11;
const int RR_DIR = 12;
const int RR_PWM = 13;  // Changed to D13

// ========== ENCODER PINS ==========
// Front Right Encoder (with interrupts)
const int ENC_R_A = 2;   // Interrupt 0
const int ENC_R_B = 3;   // Interrupt 1 (now free!)

// Front Left Encoder
const int ENC_L_A = 7;
const int ENC_L_B = 8;

// Create encoder objects
Encoder encLeft(ENC_L_A, ENC_L_B);
Encoder encRight(ENC_R_A, ENC_R_B);

void setup() {
  Serial.begin(115200);
  
  // ===== Setup Motor Pins =====
  pinMode(FL_DIR, OUTPUT); pinMode(FL_PWM, OUTPUT);
  pinMode(FR_DIR, OUTPUT); pinMode(FR_PWM, OUTPUT);
  pinMode(RL_DIR, OUTPUT); pinMode(RL_PWM, OUTPUT);
  pinMode(RR_DIR, OUTPUT); pinMode(RR_PWM, OUTPUT);
  
  // ===== Setup Encoder Pins =====
  pinMode(ENC_L_A, INPUT_PULLUP);
  pinMode(ENC_L_B, INPUT_PULLUP);
  pinMode(ENC_R_A, INPUT_PULLUP);
  pinMode(ENC_R_B, INPUT_PULLUP);
  
  // Stop all motors
  stopAllMotors();
  
  // Reset encoders
  encLeft.write(0);
  encRight.write(0);
  
  Serial.println("=== COMPLETE TEST: MOTORS + ENCODERS ===");
  Serial.println("\n--- TESTING EACH MOTOR (watch encoders) ---\n");
  
  // Test each motor and show encoder counts
  testMotorWithEncoder("Front Left (FL)", FL_PWM, FL_DIR, encLeft);
  testMotorWithEncoder("Front Right (FR)", FR_PWM, FR_DIR, encRight);
  testMotorWithEncoder("Rear Left (RL)", RL_PWM, RL_DIR, encLeft);
  testMotorWithEncoder("Rear Right (RR)", RR_PWM, RR_DIR, encRight);
  
  Serial.println("\n=== DIAGNOSTIC COMPLETE ===");
  printCommands();
}

void testMotorWithEncoder(String name, int pwmPin, int dirPin, Encoder &encoder) {
  long before = encoder.read();
  
  Serial.print(name);
  Serial.print(" - Forward: ");
  
  // Run forward for 1 second
  digitalWrite(dirPin, HIGH);
  analogWrite(pwmPin, 180);
  delay(1000);
  
  // Stop and read encoder
  analogWrite(pwmPin, 0);
  delay(500);
  long afterForward = encoder.read();
  Serial.print(afterForward - before);
  Serial.print(" pulses");
  
  // Run backward for 1 second
  Serial.print(" | Backward: ");
  digitalWrite(dirPin, LOW);
  analogWrite(pwmPin, 180);
  delay(1000);
  
  // Stop and read encoder
  analogWrite(pwmPin, 0);
  delay(500);
  long afterBackward = encoder.read();
  Serial.print(afterBackward - afterForward);
  Serial.println(" pulses");
  
  delay(500);
}

void loop() {
  if (Serial.available() > 0) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    cmd.toUpperCase();
    
    if (cmd == "F" || cmd == "FORWARD") {
      moveForward(180);
      Serial.println("MOVING FORWARD");
    }
    else if (cmd == "B" || cmd == "BACKWARD") {
      moveBackward(180);
      Serial.println("MOVING BACKWARD");
    }
    else if (cmd == "L" || cmd == "LEFT") {
      turnLeft(180);
      Serial.println("TURNING LEFT");
    }
    else if (cmd == "R" || cmd == "RIGHT") {
      turnRight(180);
      Serial.println("TURNING RIGHT");
    }
    else if (cmd == "S" || cmd == "STOP") {
      stopAllMotors();
      Serial.println("STOPPED");
    }
    else if (cmd == "ENC" || cmd == "ENCODERS") {
      readEncoders();
    }
    else if (cmd == "RESET") {
      encLeft.write(0);
      encRight.write(0);
      Serial.println("ENCODERS RESET TO ZERO");
    }
    else if (cmd == "HELP") {
      printCommands();
    }
  }
}

// Movement functions
void moveForward(int speed) {
  setMotor(FL_PWM, FL_DIR, speed);
  setMotor(FR_PWM, FR_DIR, speed);
  setMotor(RL_PWM, RL_DIR, speed);
  setMotor(RR_PWM, RR_DIR, speed);
}

void moveBackward(int speed) {
  setMotor(FL_PWM, FL_DIR, -speed);
  setMotor(FR_PWM, FR_DIR, -speed);
  setMotor(RL_PWM, RL_DIR, -speed);
  setMotor(RR_PWM, RR_DIR, -speed);
}

void turnLeft(int speed) {
  setMotor(FL_PWM, FL_DIR, -speed);  // Left backward
  setMotor(FR_PWM, FR_DIR, speed);   // Right forward
  setMotor(RL_PWM, RL_DIR, -speed);  // Left backward
  setMotor(RR_PWM, RR_DIR, speed);   // Right forward
}

void turnRight(int speed) {
  setMotor(FL_PWM, FL_DIR, speed);   // Left forward
  setMotor(FR_PWM, FR_DIR, -speed);  // Right backward
  setMotor(RL_PWM, RL_DIR, speed);   // Left forward
  setMotor(RR_PWM, RR_DIR, -speed);  // Right backward
}

void setMotor(int pwmPin, int dirPin, int speed) {
  speed = constrain(speed, -255, 255);
  if (speed > 0) {
    digitalWrite(dirPin, HIGH);
    analogWrite(pwmPin, speed);
  } else if (speed < 0) {
    digitalWrite(dirPin, LOW);
    analogWrite(pwmPin, -speed);
  } else {
    analogWrite(pwmPin, 0);
  }
}

void stopAllMotors() {
  setMotor(FL_PWM, FL_DIR, 0);
  setMotor(FR_PWM, FR_DIR, 0);
  setMotor(RL_PWM, RL_DIR, 0);
  setMotor(RR_PWM, RR_DIR, 0);
}

void readEncoders() {
  long left = encLeft.read();
  long right = encRight.read();
  Serial.println("=== ENCODER VALUES ===");
  Serial.print("Left Encoder:  ");
  Serial.println(left);
  Serial.print("Right Encoder: ");
  Serial.println(right);
  Serial.println("======================");
}

void printCommands() {
  Serial.println("\n=== AVAILABLE COMMANDS ===");
  Serial.println("  F or FORWARD   - Move forward");
  Serial.println("  B or BACKWARD  - Move backward");
  Serial.println("  L or LEFT      - Turn left");
  Serial.println("  R or RIGHT     - Turn right");
  Serial.println("  S or STOP      - Stop all motors");
  Serial.println("  ENC or ENCODERS- Read encoder values");
  Serial.println("  RESET          - Reset encoders to zero");
  Serial.println("  HELP           - Show this menu");
  Serial.println("==========================\n");
}