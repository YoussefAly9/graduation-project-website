#!/usr/bin/env python3
"""
Raspberry Pi 5 hub:
- Pulls robot tasks from your website backend API.
- Dispatches commands to two Arduino Uno boards over USB serial.
- Reports task progress/completion back to the API.
- Subscribes to MQTT command topics and publishes controller status.

Before running:
1) pip install requests pyserial paho-mqtt
2) Update BASE_PORT / ARM_PORT and IDENTIFIER below.
3) Replace command mapping with your exact movement logic.
"""

from __future__ import annotations

import json
import time
from collections import deque
from dataclasses import dataclass
from threading import Lock
from typing import Any, Deque, Dict, List, Optional, Tuple

import paho.mqtt.client as mqtt
import requests
import serial


# -----------------------------
# Configuration
# -----------------------------
API_BASE = "http://localhost:5000/api"
IDENTIFIER = "RPI-HUB-01"

BASE_PORT = "/dev/ttyACM0"
ARM_PORT = "/dev/ttyACM1"
SERIAL_BAUD = 115200
SERIAL_TIMEOUT_S = 2.0

HEARTBEAT_INTERVAL_S = 15
IDLE_POLL_INTERVAL_S = 2

MQTT_BROKER_HOST = "localhost"
MQTT_BROKER_PORT = 1883
MQTT_KEEPALIVE_S = 60
MQTT_USERNAME: Optional[str] = None
MQTT_PASSWORD: Optional[str] = None


def mqtt_topic_base_cmd() -> str:
    return f"robot/{IDENTIFIER}/base/cmd"


def mqtt_topic_arm_cmd() -> str:
    return f"robot/{IDENTIFIER}/arm/cmd"


def mqtt_topic_hub_cmd() -> str:
    return f"robot/{IDENTIFIER}/hub/cmd"


def mqtt_topic_status(target: str) -> str:
    return f"robot/{IDENTIFIER}/{target}/status"


@dataclass
class SerialController:
    name: str
    port: str
    baud: int = SERIAL_BAUD
    timeout_s: float = SERIAL_TIMEOUT_S

    def __post_init__(self) -> None:
        self.serial = serial.Serial(self.port, self.baud, timeout=self.timeout_s)
        # Let the Arduino reset after opening serial.
        time.sleep(2.0)
        self._flush_input()

    def _flush_input(self) -> None:
        try:
            self.serial.reset_input_buffer()
            self.serial.reset_output_buffer()
        except Exception:
            pass

    def send_command(self, command: str, expected_ack: str = "OK", retries: int = 2) -> None:
        payload = f"{command}\n".encode("utf-8")
        last_response = ""

        for attempt in range(retries + 1):
            self.serial.write(payload)
            self.serial.flush()
            response = self.serial.readline().decode("utf-8", errors="replace").strip()
            last_response = response
            if response.startswith(expected_ack):
                return
            time.sleep(0.2)

        raise RuntimeError(
            f"[{self.name}] Command failed after retries. "
            f"command={command!r}, last_response={last_response!r}"
        )


class RobotHub:
    def __init__(self) -> None:
        self.http = requests.Session()
        self.base_ctrl = SerialController("BASE", BASE_PORT)
        self.arm_ctrl = SerialController("ARM", ARM_PORT)
        self.last_heartbeat = 0.0
        self.pending_commands: Deque[Tuple[str, str, str]] = deque()
        self.pending_lock = Lock()

        self.mqtt = mqtt.Client(client_id=f"{IDENTIFIER}-hub")
        if MQTT_USERNAME:
            self.mqtt.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
        self.mqtt.on_connect = self._on_mqtt_connect
        self.mqtt.on_message = self._on_mqtt_message

    def start_mqtt(self) -> None:
        self.mqtt.connect(MQTT_BROKER_HOST, MQTT_BROKER_PORT, MQTT_KEEPALIVE_S)
        self.mqtt.loop_start()
        self.publish_mqtt_status("hub", "ONLINE", retained=True)

    def stop_mqtt(self) -> None:
        try:
            self.publish_mqtt_status("hub", "OFFLINE", retained=True)
        except Exception:
            pass
        self.mqtt.loop_stop()
        self.mqtt.disconnect()

    def _on_mqtt_connect(self, client: mqtt.Client, userdata: Any, flags: Dict[str, Any], rc: int) -> None:
        if rc != 0:
            print(f"[MQTT] Connect failed rc={rc}")
            return
        client.subscribe(mqtt_topic_base_cmd(), qos=1)
        client.subscribe(mqtt_topic_arm_cmd(), qos=1)
        client.subscribe(mqtt_topic_hub_cmd(), qos=1)
        print("[MQTT] Connected and subscribed.")

    def _on_mqtt_message(self, client: mqtt.Client, userdata: Any, msg: mqtt.MQTTMessage) -> None:
        topic = msg.topic
        payload = msg.payload.decode("utf-8", errors="replace").strip()
        target = "hub"
        expected_ack = "OK"
        command = payload

        if topic.endswith("/base/cmd"):
            target = "base"
        elif topic.endswith("/arm/cmd"):
            target = "arm"
        elif topic.endswith("/hub/cmd"):
            target = "hub"

        # Optional JSON payload:
        # {"command":"BASE_FORWARD","expectedAck":"OK","target":"base"}
        if payload.startswith("{"):
            try:
                body = json.loads(payload)
                command = str(body.get("command", "")).strip()
                expected_ack = str(body.get("expectedAck", "OK")).strip() or "OK"
                target = str(body.get("target", target)).strip().lower() or target
            except Exception as exc:
                self.publish_mqtt_status("hub", f"ERR BAD_JSON {exc}")
                return

        if not command:
            self.publish_mqtt_status("hub", "ERR EMPTY_COMMAND")
            return

        with self.pending_lock:
            self.pending_commands.append((target, command, expected_ack))

    def publish_mqtt_status(self, target: str, message: str, retained: bool = False) -> None:
        self.mqtt.publish(mqtt_topic_status(target), payload=message, qos=1, retain=retained)

    def process_pending_mqtt_commands(self) -> None:
        while True:
            with self.pending_lock:
                if not self.pending_commands:
                    break
                target, command, expected_ack = self.pending_commands.popleft()

            try:
                if target == "base":
                    self.base_ctrl.send_command(command, expected_ack=expected_ack)
                    self.publish_mqtt_status("base", f"OK {command}")
                elif target == "arm":
                    self.arm_ctrl.send_command(command, expected_ack=expected_ack)
                    self.publish_mqtt_status("arm", f"OK {command}")
                elif target == "hub":
                    if command == "PING":
                        self.publish_mqtt_status("hub", "PONG")
                    else:
                        self.publish_mqtt_status("hub", f"ERR UNKNOWN_HUB_CMD {command}")
                else:
                    self.publish_mqtt_status("hub", f"ERR UNKNOWN_TARGET {target}")
            except Exception as exc:
                self.publish_mqtt_status(target, f"ERR {command} {exc}")

    # -----------------------------
    # API helpers
    # -----------------------------
    def _request(self, method: str, path: str, **kwargs: Any) -> Dict[str, Any]:
        url = f"{API_BASE}{path}"
        response = self.http.request(method, url, timeout=10, **kwargs)
        response.raise_for_status()
        return response.json()

    def send_heartbeat(self) -> None:
        now = time.time()
        if now - self.last_heartbeat < HEARTBEAT_INTERVAL_S:
            return

        payload = {
            "identifier": IDENTIFIER,
            "status": "active",
            "ipAddress": "raspberrypi.local",
        }
        self._request("POST", "/robot/controllers/heartbeat", json=payload)
        self.last_heartbeat = now

    def fetch_next_task(self) -> Optional[Dict[str, Any]]:
        data = self._request("GET", "/robot/tasks/next", params={"identifier": IDENTIFIER})
        return data.get("data")

    def update_task_status(
        self,
        task_id: str,
        status: str,
        detections: Optional[List[Dict[str, Any]]] = None,
        error_message: Optional[str] = None,
    ) -> None:
        payload: Dict[str, Any] = {"status": status}
        if detections is not None:
            payload["detections"] = detections
        if error_message:
            payload["errorMessage"] = error_message
        self._request("PATCH", f"/robot/tasks/{task_id}/status", json=payload)

    # -----------------------------
    # Task orchestration
    # -----------------------------
    def run_pick_cycle_for_item(self, item: Dict[str, Any]) -> None:
        """
        Convert one task item into base+arm commands.
        Update this mapping with your real robot kinematics and path planner.
        """
        qty = int(item.get("quantity", 1))
        location = item.get("storageLocation") or {}
        zone = str(location.get("zone", "A"))
        aisle = str(location.get("aisle", "1"))
        shelf = str(location.get("shelf", "1"))
        bin_id = str(location.get("bin", "1"))

        # Base navigation command (go to storage location).
        self.base_ctrl.send_command(f"NAVIGATE {zone} {aisle} {shelf} {bin_id}")
        self.base_ctrl.send_command("HOLD")

        # Arm pick sequence for quantity.
        for _ in range(qty):
            self.arm_ctrl.send_command("ARM_PREPARE")
            self.arm_ctrl.send_command("ARM_PICK")
            self.arm_ctrl.send_command("ARM_RETRACT")

        # Return base to drop station and place items.
        self.base_ctrl.send_command("NAVIGATE DROP 0 0 0")
        self.arm_ctrl.send_command("ARM_PLACE")

    def process_task(self, task: Dict[str, Any]) -> None:
        task_id = task["_id"]
        items = task.get("items") or []
        try:
            # Explicitly keep task in progress while running.
            self.update_task_status(task_id, "in_progress")

            for item in items:
                self.run_pick_cycle_for_item(item)

            # Placeholder detections; replace with your YOLO output from Pi camera pipeline.
            detections = [
                {
                    "label": "item-picked",
                    "confidence": 0.99,
                    "meta": {"source": "raspberry_pi_hub", "note": "placeholder"},
                }
            ]
            self.update_task_status(task_id, "completed", detections=detections)
        except Exception as exc:
            self.update_task_status(task_id, "failed", error_message=str(exc))
            raise

    def loop_forever(self) -> None:
        self.start_mqtt()
        while True:
            try:
                self.process_pending_mqtt_commands()
                self.send_heartbeat()
                task = self.fetch_next_task()
                if not task:
                    time.sleep(IDLE_POLL_INTERVAL_S)
                    continue

                self.process_task(task)

            except KeyboardInterrupt:
                print("Stopping hub...")
                break
            except Exception as exc:
                print(f"[ERROR] {exc}")
                # If we have a task in hand, mark it failed.
                # In this simple skeleton we only know the task inside process flow,
                # so failures here remain transient unless raised during process_task.
                time.sleep(2)
        self.stop_mqtt()


def main() -> None:
    hub = RobotHub()
    hub.loop_forever()


if __name__ == "__main__":
    main()

