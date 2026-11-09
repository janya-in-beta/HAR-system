# Human Activity Recognition System

---

## 1. Project Overview
This project presents an academic prototype of a **Human Activity Recognition (HAR)** system. Using a standard monocular webcam, the system detects a human body, tracks 33 skeletal landmarks using Google MediaPipe Pose, extracts geometric joint angles and kinematic velocities, and classifies the current human activity into one of four primary classes:
- 🧍 **Standing**
- 🪑 **Sitting**
- 🚶 **Walking**
- 🏃 **Running**

The design emphasizes modularity, separating **Data Acquisition**, **Pose Estimation**, **Feature Extraction**, and **Classification** so that rule-based heuristics can easily be substituted with machine learning models (e.g., Random Forests, SVMs, or LSTM neural networks).

---

## 2. Technologies Used
- **Python 3.10+**: Core programming language
- **OpenCV (`cv2`)**: Real-time video stream capture, image preprocessing, and graphical annotations
- **MediaPipe Pose**: High-fidelity 33-landmark 3D human pose tracking
- **NumPy**: Vector mathematics, trigonometric joint angle calculations, and coordinate transformations
- **Flask**: Lightweight web framework for streaming multipart JPEG video and providing RESTful telemetry endpoints
- **HTML / CSS / JavaScript (and React SPA)**: Clean, responsive user dashboard with telemetry meters, activity log table, and demo modes

---

## 3. System Architecture & Flow Pipeline
The HAR pipeline operates as a sequential feedforward flow:

```
[ Webcam / Video Input ]
          │
          ▼
[ Person Detection ]  ──>  Verifies presence of human subject
          │
          ▼
[ Pose Detection (MediaPipe) ]  ──>  Extracts (x, y, z, visibility) for 33 landmarks
          │
          ▼
[ Feature Extraction ]
   ├── Knee Flexion Angle (Hip - Knee - Ankle)
   ├── Hip Flexion Angle (Shoulder - Hip - Knee)
   ├── Torso-to-Leg Aspect Ratio
   └── Kinematic Displacement Velocity (Ankle & Hip trajectories over Δt)
          │
          ▼
[ Activity Classification ]  ──>  Evaluates posture + kinematics
          │
          ▼
[ Result Display & Dashboard ]  ──>  Live skeleton render, confidence score, history log, counters
```

---

## 4. How Activity Recognition Works
### A. Joint Angle Calculation
The angle $\theta$ between three joint points $A(x_1, y_1)$, $B(x_2, y_2)$ (vertex), and $C(x_3, y_3)$ is computed using the arctangent formulation:
$$\theta = |\text{atan2}(y_3 - y_2, x_3 - x_2) - \text{atan2}(y_1 - y_2, x_1 - x_2)| \times \frac{180}{\pi}$$
If $\theta > 180^\circ$, we compute $360^\circ - \theta$.

### B. Classification Heuristics
1. **Sitting**:
   - Both knees exhibit significant flexion: $\theta_{\text{knee}} < 138^\circ$.
   - Hip joint angle is bent: $\theta_{\text{hip}} < 148^\circ$.
   - Vertical displacement of hips is lowered relative to baseline torso height.
2. **Standing**:
   - Legs are extended: $\theta_{\text{knee}} \ge 145^\circ$.
   - Kinematic velocity index $v < 0.75$ (low motion).
3. **Walking**:
   - Upright posture ($\theta_{\text{knee}} \ge 140^\circ$).
   - Moderate periodic foot displacement: $0.75 \le v < 2.30$.
4. **Running**:
   - Upright or forward-leaning posture.
   - High kinematic velocity index: $v \ge 2.30$ with large stride displacement.

---

## 5. How to Install and Run Locally

### Step 1: Clone the repository or navigate to directory
```bash
cd python-har
```

### Step 2: Create a virtual environment (recommended)
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### Step 3: Install dependencies
```bash
pip install -r requirements.txt
```

### Step 4: Launch the application
```bash
python app.py
```

### Step 5: Open your web browser
Visit: **`http://localhost:5000`**

Allow webcam access when prompted by the browser.

---

## 6. Limitations
1. **Occlusion**: If the lower body is occluded by desks or tables, knee angles cannot be accurately computed.
2. **2D Projection Error**: Monocular 2D landmarks may foreshorten angles when viewing the subject directly front-facing versus side-profile.
3. **Lighting & Contrast**: Low lighting can degrade MediaPipe's landmark confidence.
4. **Rule Boundary Edge Cases**: Slow walking vs standing sway can occasionally exhibit overlapping velocity thresholds.

---

## 7. Future Scope & Improvements
- **Machine Learning Integration**: Replace the rule-based classifier with a pre-trained Random Forest or Support Vector Machine trained on the UCI HAR or NTU-RGB+D dataset.
- **Temporal Deep Learning**: Employ a Long Short-Term Memory (LSTM) or GRU recurrent network over a 30-frame temporal window to detect complex continuous activities (e.g., jumping, squats, stairs).
- **Multi-Person Tracking**: Integrate YOLOv8 + ByteTrack for multi-person pose association and activity recognition in crowded environments.
- **Edge Deployment**: Optimize using TensorRT or ONNX Runtime for deployment on embedded edge devices like NVIDIA Jetson or Raspberry Pi.

---
*Created for Academic Project Demonstration & Viva Voce Examination.*
