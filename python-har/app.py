"""
College Project: Design and Development of Human Activity Recognition System
Module: app.py (Flask Web Application Server)
Run Command:
    python app.py
Access at:
    http://localhost:5000
"""

import json
import time
import cv2
from flask import Flask, Response, jsonify, render_template_string, request
from activity_detection import HumanActivityRecognitionSystem

app = Flask(__name__)
har_system = HumanActivityRecognitionSystem()

# Activity history buffer
activity_history = []
activity_counts = {"Standing": 0, "Sitting": 0, "Walking": 0, "Running": 0}
last_logged_activity = None
last_logged_time = 0

HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Human Activity Recognition System</title>
    <style>
        :root {
            --bg-color: #f8fafc;
            --card-bg: #ffffff;
            --navy: #0f172a;
            --blue: #2563eb;
            --blue-light: #eff6ff;
            --border: #e2e8f0;
            --text-muted: #64748b;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: var(--bg-color);
            color: var(--navy);
            margin: 0;
            padding: 24px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .header {
            margin-bottom: 24px;
            border-bottom: 2px solid var(--border);
            padding-bottom: 16px;
        }
        h1 { margin: 0 0 6px 0; font-size: 26px; color: var(--navy); }
        p.subtitle { margin: 0; color: var(--text-muted); font-size: 14px; }
        .grid {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 24px;
        }
        .card {
            background: var(--card-bg);
            border-radius: 12px;
            padding: 20px;
            border: 1px solid var(--border);
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .video-box {
            width: 100%;
            border-radius: 8px;
            overflow: hidden;
            background: #000;
            aspect-ratio: 4/3;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .video-box img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        .stat-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 16px;
        }
        .stat-box {
            background: var(--blue-light);
            padding: 12px;
            border-radius: 8px;
            text-align: center;
        }
        .stat-box .count { font-size: 22px; font-weight: bold; color: var(--blue); }
        .stat-box .label { font-size: 12px; color: var(--text-muted); text-transform: uppercase; }
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
        }
        th, td {
            text-align: left;
            padding: 8px 12px;
            border-bottom: 1px solid var(--border);
        }
        th { background: #f1f5f9; color: var(--navy); }
        .badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 9999px;
            font-size: 12px;
            font-weight: 600;
            background: #e0f2fe;
            color: #0369a1;
        }
        .pipeline {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: white;
            padding: 16px;
            border-radius: 10px;
            border: 1px solid var(--border);
            margin-bottom: 24px;
            font-size: 13px;
            font-weight: 500;
        }
        .pipe-step {
            padding: 6px 12px;
            border-radius: 6px;
            background: #f8fafc;
            border: 1px solid #cbd5e1;
        }
        .arrow { color: var(--blue); font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Design and Development of Human Activity Recognition System</h1>
            <p class="subtitle">College Project Prototype | Computer Vision & Rule-Based Classification (OpenCV + MediaPipe)</p>
        </div>

        <!-- Pipeline Flow Diagram -->
        <div class="pipeline">
            <span class="pipe-step">1. Webcam Input</span>
            <span class="arrow">&rarr;</span>
            <span class="pipe-step">2. Person Detection</span>
            <span class="arrow">&rarr;</span>
            <span class="pipe-step">3. Pose Landmarks</span>
            <span class="arrow">&rarr;</span>
            <span class="pipe-step">4. Feature Extraction</span>
            <span class="arrow">&rarr;</span>
            <span class="pipe-step">5. Classification</span>
            <span class="arrow">&rarr;</span>
            <span class="pipe-step" style="background:#dbeafe; border-color:#93c5fd; color:#1d4ed8;">6. Result Display</span>
        </div>

        <div class="grid">
            <!-- Left Column: Video Feed & Real-time Info -->
            <div>
                <div class="card">
                    <h3 style="margin-top:0;">Live Camera & Pose Skeleton</h3>
                    <div class="video-box">
                        <img src="/video_feed" alt="Video Feed" />
                    </div>
                </div>
            </div>

            <!-- Right Column: Status, Counters, History -->
            <div>
                <div class="card" style="margin-bottom: 20px;">
                    <h3 style="margin-top:0;">Activity Summary Counter</h3>
                    <div class="stat-grid" id="counters">
                        <div class="stat-box"><div class="count" id="c-standing">0</div><div class="label">Standing</div></div>
                        <div class="stat-box"><div class="count" id="c-sitting">0</div><div class="label">Sitting</div></div>
                        <div class="stat-box"><div class="count" id="c-walking">0</div><div class="label">Walking</div></div>
                        <div class="stat-box"><div class="count" id="c-running">0</div><div class="label">Running</div></div>
                    </div>
                    <div style="font-size: 14px; margin-top: 10px;">
                        <strong>Current Status:</strong> <span id="current-act" class="badge">Detecting...</span>
                    </div>
                </div>

                <div class="card">
                    <h3 style="margin-top:0;">Detection Log (History)</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Time</th>
                                <th>Activity</th>
                                <th>Confidence</th>
                            </tr>
                        </thead>
                        <tbody id="history-rows">
                            <tr><td colspan="3" style="text-align:center; color:#94a3b8;">Awaiting detection events...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <script>
        async function fetchStatus() {
            try {
                const res = await fetch('/status');
                const data = await res.json();
                if (data.counts) {
                    document.getElementById('c-standing').innerText = data.counts.Standing || 0;
                    document.getElementById('c-sitting').innerText = data.counts.Sitting || 0;
                    document.getElementById('c-walking').innerText = data.counts.Walking || 0;
                    document.getElementById('c-running').innerText = data.counts.Running || 0;
                }
                if (data.latest) {
                    document.getElementById('current-act').innerText = `${data.latest.activity} (${data.latest.confidence}%)`;
                }
                if (data.history && data.history.length > 0) {
                    const tbody = document.getElementById('history-rows');
                    tbody.innerHTML = data.history.slice(-8).reverse().map(item => `
                        <tr>
                            <td>${item.time}</td>
                            <td><strong>${item.activity}</strong></td>
                            <td>${item.confidence}%</td>
                        </tr>
                    `).join('');
                }
            } catch (e) {
                console.error(e);
            }
        }
        setInterval(fetchStatus, 1000);
    </script>
</body>
</html>
"""


def generate_frames():
    """Video streaming generator function."""
    camera = cv2.VideoCapture(0)
    global last_logged_activity, last_logged_time

    while True:
        success, frame = camera.read()
        if not success:
            # Fallback black frame with text if camera unavailable
            blank = np.zeros((480, 640, 3), dtype=np.uint8)
            cv2.putText(blank, "Camera Not Connected", (120, 240), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
            ret, buffer = cv2.imencode(".jpg", blank)
            yield (b"--frame\r\nContent-Type: image/jpeg\r\n\r\n" + buffer.tobytes() + b"\r\n")
            time.sleep(0.5)
            continue

        annotated_frame, info = har_system.process_frame(frame)

        # Log activity periodically or on change
        current_time = time.time()
        act = info.get("activity")
        if info.get("person_detected") and act in activity_counts:
            if act != last_logged_activity or (current_time - last_logged_time) > 4:
                activity_counts[act] += 1
                activity_history.append(
                    {
                        "time": time.strftime("%H:%M:%S"),
                        "activity": act,
                        "confidence": info.get("confidence", 0),
                    }
                )
                last_logged_activity = act
                last_logged_time = current_time

        ret, buffer = cv2.imencode(".jpg", annotated_frame)
        frame_bytes = buffer.tobytes()
        yield (b"--frame\r\nContent-Type: image/jpeg\r\n\r\n" + frame_bytes + b"\r\n")


@app.route("/")
def index():
    return render_template_string(HTML_TEMPLATE)


@app.route("/video_feed")
def video_feed():
    return Response(generate_frames(), mimetype="multipart/x-mixed-replace; boundary=frame")


@app.route("/status")
def status():
    latest = activity_history[-1] if activity_history else {"activity": "Initializing", "confidence": 0}
    return jsonify(
        {
            "counts": activity_counts,
            "latest": latest,
            "history": activity_history[-15:],
        }
    )


@app.route("/upload_image", methods=["POST"])
def upload_image():
    """
    Accepts an uploaded image file via multipart/form-data ('image'),
    processes the pose skeleton, and returns the recognized activity.
    """
    if "image" not in request.files:
        return jsonify({"error": "No image part in request"}), 400

    file = request.files["image"]
    if file.filename == "":
        return jsonify({"error": "Empty filename"}), 400

    import numpy as np

    file_bytes = np.frombuffer(file.read(), np.uint8)
    img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

    if img is None:
        return jsonify({"error": "Invalid image format"}), 400

    annotated_img, results = har_system.process_image(img)

    # Log to history
    act = results.get("activity")
    if results.get("person_detected") and act in activity_counts:
        activity_counts[act] += 1
        activity_history.append(
            {
                "time": time.strftime("%H:%M:%S"),
                "activity": act,
                "confidence": results.get("confidence", 0),
                "source": "image",
            }
        )

    return jsonify(results)


if __name__ == "__main__":
    print("Starting Human Activity Recognition Flask Server on http://localhost:5000")
    app.run(host="0.0.0.0", port=5000, debug=True)
