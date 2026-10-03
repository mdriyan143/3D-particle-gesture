# ✨ LoveMotion — 3D Particle Gesture Experience

**LoveMotion** is an interactive 3D particle experience built with **React, Three.js, React Three Fiber, and MediaPipe**.

Use your **webcam and hand gestures** to control different 3D particle scenes in real time. You can also switch between modes manually using the on-screen controls or keyboard shortcuts.

## 🌐 Live Demo


**Live:** https://heart-wave-mdriyan.vercel.app/


---

## ✨ Features

* 🎥 Real-time webcam hand tracking
* ✋ Gesture-based scene switching
* ❤️ Interactive 3D heart particles
* 🪐 Saturn-inspired particle scene
* 💕 "I LOVE YOU" particle mode
* 🌌 Cosmic space particle mode
* 🖱️ Manual mode selection
* ⌨️ Keyboard shortcuts
* 📱 Responsive interface
* ⚡ Real-time 3D rendering
* 🎨 Glassmorphism-style UI
* 🌑 Dark immersive interface
* 🔄 Camera status and hand-detection indicators
* 🚫 Manual fallback when camera or hand tracking is unavailable

---

## 🖐️ Gesture Controls

| Gesture        | Mode            | Keyboard |
| -------------- | --------------- | -------- |
| ✊ Closed fist  | ❤️ Heart        | `1`      |
| ☝️ One finger  | 🪐 Saturn       | `2`      |
| ✌️ Two fingers | 💕 I LOVE YOU   | `3`      |
| 🖐️ Open hand  | 🌌 Cosmic Space | `4`      |

You can also click the mode buttons at the bottom of the screen.

---

## 🛠️ Technologies Used

* **React 18**
* **Vite**
* **Three.js**
* **React Three Fiber**
* **React Three Drei**
* **MediaPipe Tasks Vision**
* **Tailwind CSS**
* **JavaScript (ES Modules)**

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/mdriyan143/3D-particle-gesture.git
```

### 2. Open the project

```bash
cd 3D-particle-gesture
```

### 3. Install dependencies

```bash
npm install
```

### 4. Start the development server

```bash
npm run dev
```

Vite will start the development server.

Open the local URL shown in your terminal, usually:

```text
http://localhost:5173
```

---

## 📱 How to Use

### Camera Mode

1. Open the website.
2. Allow camera access when requested.
3. Show your hand in front of the webcam.
4. Make one of the supported gestures.
5. The particle scene changes automatically.

### Manual Mode

If camera access is unavailable, you can still use the application manually.

Click one of the mode buttons at the bottom of the screen.

You can also use:

```text
1 → Heart
2 → Saturn
3 → I LOVE YOU
4 → Cosmic Space
```

---

## 🎨 Particle Modes

### ❤️ Heart

A heart-shaped particle formation controlled by the gesture system.

**Gesture:** Closed fist

### 🪐 Saturn

A planetary particle composition inspired by Saturn and its rings.

**Gesture:** One finger

### 💕 I LOVE YOU

A particle-based text visualization displaying:

**I LOVE YOU**

**Gesture:** Two fingers

### 🌌 Cosmic Space

A space-inspired particle environment with a large collection of particles creating a cosmic atmosphere.

**Gesture:** Open hand

---

## 🧠 How Hand Tracking Works

The project uses **MediaPipe Tasks Vision** to detect hand landmarks through the webcam.

The tracking system:

1. Requests webcam access.
2. Processes the video stream.
3. Detects hand landmarks.
4. Determines the current hand gesture.
5. Converts the gesture into a particle mode.
6. Updates the 3D scene in real time.

The application also provides a manual fallback if the camera or tracking system cannot be used.

---
## 🌍 Deployment

This project can be deployed using platforms such as:

* Vercel
* Netlify
* GitHub Pages
* Cloudflare Pages

For camera-based features, make sure the deployed website uses **HTTPS**, because browsers generally require a secure context for webcam access.

---

## 🔐 Camera Permission

LoveMotion requires camera access for real-time hand tracking.

The camera is used to:

* Detect hand gestures
* Track hand position
* Control the interactive experience

If camera permission is denied or unavailable, the application provides manual controls instead.

---

## 🤖 AI Note

Some of the code and implementation ideas in this project were generated with the help of AI.

## 👨‍💻 Author

### Md Riyan Biswas

Frontend Developer & Computer Science Student

* GitHub: `https://github.com/mdriyan143`

---

