import React, { useState } from 'react';
import { X, BookOpen, Code, HelpCircle, Copy, Check, Terminal, ExternalLink } from 'lucide-react';

interface ProjectDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectDocsModal: React.FC<ProjectDocsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'docs' | 'python-code' | 'viva'>('docs');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const appPyCode = `# Python Flask App for HAR (python-har/app.py)
import time
import cv2
import numpy as np
from flask import Flask, Response, jsonify, render_template_string
from activity_detection import HumanActivityRecognitionSystem

app = Flask(__name__)
har_system = HumanActivityRecognitionSystem()

# Activity history buffer
activity_history = []
activity_counts = {"Standing": 0, "Sitting": 0, "Walking": 0, "Running": 0}

@app.route("/")
def index():
    return "<h1>Human Activity Recognition Flask Server</h1><img src='/video_feed'>"

def generate_frames():
    camera = cv2.VideoCapture(0)
    while True:
        success, frame = camera.read()
        if not success:
            break
        annotated_frame, info = har_system.process_frame(frame)
        ret, buffer = cv2.imencode('.jpg', annotated_frame)
        yield (b'--frame\\r\\nContent-Type: image/jpeg\\r\\n\\r\\n' + buffer.tobytes() + b'\\r\\n')

@app.route("/video_feed")
def video_feed():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)`;

  const activityDetectionPyCode = `# activity_detection.py
import math
import numpy as np
import cv2
import mediapipe as mp
from collections import deque

class PoseFeatureExtractor:
    def __init__(self, history_len=15):
        self.ankle_history = deque(maxlen=history_len)

    @staticmethod
    def calculate_angle(p1, p2, p3):
        a, b, c = np.array(p1), np.array(p2), np.array(p3)
        radians = np.arctan2(c[1] - b[1], c[0] - b[0]) - np.arctan2(a[1] - b[1], a[0] - b[0])
        angle = np.abs(radians * 180.0 / np.pi)
        return 360.0 - angle if angle > 180.0 else angle

    def extract_features(self, landmarks, frame_w, frame_h):
        # 11: L Shoulder, 12: R Shoulder, 23: L Hip, 24: R Hip, 25: L Knee, 26: R Knee
        # 27: L Ankle, 28: R Ankle
        coords = lambda i: (landmarks[i].x * frame_w, landmarks[i].y * frame_h)
        knee_angle = (self.calculate_angle(coords(23), coords(25), coords(27)) +
                      self.calculate_angle(coords(24), coords(26), coords(28))) / 2.0
        hip_angle = (self.calculate_angle(coords(11), coords(23), coords(25)) +
                     self.calculate_angle(coords(12), coords(24), coords(26))) / 2.0
        return {"knee_angle": round(knee_angle, 1), "hip_angle": round(hip_angle, 1)}

class ActivityClassifier:
    def classify(self, features, velocity=0.0):
        knee = features["knee_angle"]
        hip = features["hip_angle"]
        if knee < 138.0 and hip < 148.0:
            return {"activity": "Sitting", "confidence": 89}
        elif velocity >= 2.2:
            return {"activity": "Running", "confidence": 94}
        elif velocity >= 0.7:
            return {"activity": "Walking", "confidence": 85}
        else:
            return {"activity": "Standing", "confidence": 92}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              Project Report, Python Code & Viva Guide
            </h2>
            <p className="text-xs text-slate-500">
              Human Activity Recognition System
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-5 bg-white text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('docs')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'docs'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Project Documentation
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('python-code')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'python-code'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Code className="w-4 h-4" />
            Python Source Code Files
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('viva')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'viva'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            Viva Voce Examination Q&A
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 text-slate-700 text-sm leading-relaxed">
          {activeTab === 'docs' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-1">1. Abstract & Objective</h3>
                <p className="text-xs text-slate-600">
                  Human Activity Recognition (HAR) is a pivotal domain in computer vision, ambient assisted living, healthcare monitoring, and sports science. This project implements a lightweight prototype that captures monocular video frames, detects human pose landmarks using Google MediaPipe Pose, extracts geometric joint angles (Hip-Knee-Ankle, Shoulder-Hip-Knee) and kinematic velocity vectors, and classifies basic activities: <strong>Standing, Sitting, Walking, and Running</strong>.
                </p>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 mb-1">2. Core Processing Pipeline</h3>
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs font-mono text-blue-900">
                  Webcam Frame &rarr; Person Detection &rarr; MediaPipe 33-Landmark Pose Extraction &rarr; Trigonometric Feature Extraction &rarr; Rule-Based Classification &rarr; Telemetry & History Dashboard
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 mb-1">3. Mathematical Formulation of Joint Angles</h3>
                <p className="text-xs text-slate-600 mb-2">
                  Joint angles at vertex $B(x_2, y_2)$ formed by rays $BA$ and $BC$ are computed via the four-quadrant inverse tangent function:
                </p>
                <div className="p-2.5 rounded bg-slate-100 font-mono text-xs text-slate-800">
                  θ = |atan2(y_c - y_b, x_c - x_b) - atan2(y_a - y_b, x_a - x_b)| × (180 / π)
                  <br />
                  if θ &gt; 180°: θ = 360° - θ
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 mb-1">4. Classification Logic & Decision Boundaries</h3>
                <ul className="text-xs space-y-1.5 list-disc pl-5 text-slate-600">
                  <li><strong>Sitting:</strong> Knee angle &lt; 138° AND Hip angle &lt; 148°. Lowered torso relative to hip-ankle distance.</li>
                  <li><strong>Standing:</strong> Knee angle &ge; 145° with low kinetic displacement velocity (v &lt; 0.65 units).</li>
                  <li><strong>Walking:</strong> Upright posture with cyclic limb displacement (0.65 &le; v &lt; 2.0 units).</li>
                  <li><strong>Running:</strong> Upright posture with high stride displacement velocity (v &ge; 2.0 units) and increased cadence.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 mb-1">5. Limitations</h3>
                <p className="text-xs text-slate-600">
                  1) Monocular 2D projection foreshortening when camera perspective is angled. 2) Lower-body occlusion when the subject sits behind a desk. 3) Rule-based boundaries require empirical tuning compared to statistical machine learning.
                </p>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 mb-1">6. Future Scope</h3>
                <p className="text-xs text-slate-600">
                  Integration with recurrent neural networks (LSTM/GRU) or 1D-CNNs trained on benchmark datasets (UCI HAR, NTU RGB+D) to classify transitions (sit-to-stand), fall detection, and complex sports maneuvers.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'python-code' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                <span>The complete Python code is saved in <code>/python-har/</code> directory!</span>
                <span className="font-semibold">Python 3.10 • Flask • OpenCV • MediaPipe</span>
              </div>

              {/* Install and Run commands */}
              <div className="bg-slate-900 text-slate-100 rounded-lg p-3 text-xs font-mono">
                <div className="text-slate-400 text-[11px] mb-1"># Quick Terminal Commands to Run Locally:</div>
                <div className="text-emerald-400">cd python-har</div>
                <div className="text-emerald-400">pip install -r requirements.txt</div>
                <div className="text-emerald-400">python app.py</div>
                <div className="text-slate-400 mt-1"># Opens at http://localhost:5000</div>
              </div>

              {/* Code viewer 1: app.py */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-800 font-mono">python-har/app.py</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(appPyCode, 'app')}
                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                  >
                    {copiedKey === 'app' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'app' ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                </div>
                <pre className="bg-slate-900 text-slate-200 p-3 rounded-lg text-xs font-mono overflow-x-auto max-h-56">
                  {appPyCode}
                </pre>
              </div>

              {/* Code viewer 2: activity_detection.py */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-800 font-mono">python-har/activity_detection.py</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(activityDetectionPyCode, 'act')}
                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                  >
                    {copiedKey === 'act' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'act' ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                </div>
                <pre className="bg-slate-900 text-slate-200 p-3 rounded-lg text-xs font-mono overflow-x-auto max-h-56">
                  {activityDetectionPyCode}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'viva' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900">
                <strong>Viva Voce Examination Preparation Guide:</strong> Standard questions typically asked by external examiners and university evaluators with recommended concise answers.
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-900 mb-1">
                    Q1: What is the difference between Sensor-based HAR and Vision-based HAR?
                  </h4>
                  <p className="text-xs text-slate-600">
                    <strong>Answer:</strong> Sensor-based HAR uses wearable devices like accelerometers and gyroscopes on smartphones or smartwatches. Vision-based HAR uses cameras to extract visual spatial-temporal information without requiring the subject to wear intrusive equipment.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-900 mb-1">
                    Q2: How does MediaPipe detect pose landmarks?
                  </h4>
                  <p className="text-xs text-slate-600">
                    <strong>Answer:</strong> MediaPipe uses a two-stage convolutional pipeline: first, a detector model locates the person/region of interest (ROI) in the image; second, a landmark model predicts 33 3D skeletal keypoint coordinates with sub-pixel accuracy within that ROI.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-900 mb-1">
                    Q3: How do you mathematically differentiate between Standing and Sitting?
                  </h4>
                  <p className="text-xs text-slate-600">
                    <strong>Answer:</strong> By computing the flexion angle at the knee joint formed by the hip, knee, and ankle. In standing, the knee angle is approximately 160°–180° (extended). In sitting, the knee angle flexes to approximately 80°–110° (less than our 138° threshold), accompanied by lowered hip position.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-900 mb-1">
                    Q4: How do you differentiate between Walking and Running?
                  </h4>
                  <p className="text-xs text-slate-600">
                    <strong>Answer:</strong> Using kinematic displacement velocity over a rolling frame window. Walking displays moderate cyclic foot velocity (0.65–2.0 units), while running displays high kinetic velocity (&ge; 2.0 units) and higher stride frequency.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-900 mb-1">
                    Q5: How can this prototype be upgraded to Deep Learning?
                  </h4>
                  <p className="text-xs text-slate-600">
                    <strong>Answer:</strong> Because the code separates feature extraction from classification, we can collect landmark sequences across 30 consecutive frames and train an LSTM (Long Short-Term Memory) or GRU network, or a 1D-CNN classifier to output softmax activity probabilities.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
