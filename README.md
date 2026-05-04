# 🔥 ESP32 Heater & Vibration Controller

A simple and powerful IoT project using ESP32 that lets you control a **heating pad (relay)** and a **vibration motor** through a web interface with toggle switches.

---

## 🚀 Features

* 🔘 Toggle switch to control **Heater (Relay)**
* 📳 Toggle switch to control **Vibration Motor**
* 🌡 Real-time temperature monitoring using **DHT11**
* 🌐 Web-based control panel (runs locally)
* 📡 ESP32 communicates over WiFi
* 🔄 Stable and responsive system

---

## 📁 Project Structure

```plaintext
ESP-CONTROLLER/
│
├── index.html        # UI with switches
├── styles.css        # Styling
├── script.js         # Button logic (fetch requests)
├── server.js         # Node.js backend
├── package.json
├── README.md
└── .gitignore
```

---

## ⚙️ Hardware Setup

| Component       | ESP32 Pin |
| --------------- | --------- |
| Relay Module    | GPIO 26   |
| Vibration Motor | GPIO 25   |
| DHT11 Sensor    | GPIO 13   |
| VCC             | 3.3V / 5V |
| GND             | GND       |

> ⚠️ Use **5V for relay module**
> ⚠️ Add **4.7kΩ resistor** between VCC and DATA (DHT11)

---

## 💻 Backend Setup

### 1. Install dependencies

```bash
npm install
```

---

### 2. Run server

```bash
node server.js
```

---

### 3. Open website

```plaintext
http://localhost:3000
```

---

## 📡 ESP32 Setup

### 1. Update WiFi credentials in code

```cpp
const char* ssid = "YOUR_WIFI";
const char* password = "YOUR_PASSWORD";
```

---

### 2. Upload code to ESP32

* Select **ESP32 Dev Module**
* Upload using Arduino IDE
* Open Serial Monitor (115200 baud)

---

## 🌐 How It Works

```plaintext
Website (Switch UI)
        ↓
   HTTP Request
        ↓
     ESP32
        ↓
Relay / Motor Control
```

---

## 🧪 API Used

| Endpoint           | Function        |
| ------------------ | --------------- |
| `/heat?state=on`   | Turn heater ON  |
| `/heat?state=off`  | Turn heater OFF |
| `/motor?state=on`  | Motor ON        |
| `/motor?state=off` | Motor OFF       |
| `/status`          | Get system data |

---

## ⚠️ Common Issues

### Relay not working

* Ensure relay VCC is **5V**
* Check active LOW logic

---

### WiFi not connecting

* Use **2.4GHz network**
* Avoid special characters in SSID

---

### Temperature unstable

* Add resistor to DHT11
* Keep sensor away from heating pad

---

## 📸 UI Preview

*(Add your screenshot here)*

```markdown
![UI](./screenshot.png)
```

---

## 👨‍💻 Author

Krishnanshu Singh

---

## ⭐ Support

If you like this project, give it a ⭐ on GitHub!
