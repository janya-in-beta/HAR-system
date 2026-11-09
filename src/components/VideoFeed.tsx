import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, Play, Square, Video, Layers, RefreshCw, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { PoseLandmark, InputMode } from '../types';
import { POSE_CONNECTIONS } from '../utils/poseDetector';

interface VideoFeedProps {
  isDetecting: boolean;
  onToggleDetection: () => void;
  inputMode: InputMode;
  onChangeInputMode: (mode: InputMode) => void;
  landmarks: PoseLandmark[] | null;
  personDetected: boolean;
  leftKneeAngle: number;
  rightKneeAngle: number;
  cameraError: string | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  imageRef?: React.RefObject<HTMLImageElement | null>;
  currentImageUrl?: string | null;
  imageFileName?: string | null;
  fps: number;
}

export const VideoFeed: React.FC<VideoFeedProps> = ({
  isDetecting,
  onToggleDetection,
  inputMode,
  onChangeInputMode,
  landmarks,
  personDetected,
  leftKneeAngle,
  rightKneeAngle,
  cameraError,
  videoRef,
  canvasRef,
  imageRef,
  currentImageUrl,
  imageFileName,
  fps,
}) => {
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [showAngles, setShowAngles] = useState(true);
  const [mirrorView, setMirrorView] = useState(true);

  const isImageMode = inputMode === 'image-upload';

  // Render Skeleton, landmarks, and joint angles on canvas
  const drawOverlay = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!isDetecting || !landmarks || landmarks.length === 0) {
      return;
    }

    const w = canvas.width;
    const h = canvas.height;
    // In image mode, never mirror
    const applyMirror = mirrorView && !isImageMode;

    // Draw Skeleton Connections
    if (showSkeleton) {
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = '#2563eb'; // blue line
      ctx.lineCap = 'round';

      for (const [i, j] of POSE_CONNECTIONS) {
        const p1 = landmarks[i];
        const p2 = landmarks[j];
        if (p1 && p2 && (p1.visibility ?? 1) > 0.4 && (p2.visibility ?? 1) > 0.4) {
          const x1 = applyMirror ? (1 - p1.x) * w : p1.x * w;
          const y1 = p1.y * h;
          const x2 = applyMirror ? (1 - p2.x) * w : p2.x * w;
          const y2 = p2.y * h;

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      }
    }

    // Draw Joint Landmark Nodes
    if (showLandmarks) {
      landmarks.forEach((lm, idx) => {
        if ((lm.visibility ?? 1) > 0.4) {
          const x = applyMirror ? (1 - lm.x) * w : lm.x * w;
          const y = lm.y * h;

          // Highlight primary joints (knees, hips, ankles) in distinct color
          const isKeyJoint = [23, 24, 25, 26, 27, 28].includes(idx);

          ctx.beginPath();
          ctx.arc(x, y, isKeyJoint ? 5.5 : 3.5, 0, 2 * Math.PI);
          ctx.fillStyle = isKeyJoint ? '#f59e0b' : '#38bdf8'; // Amber for key joints, cyan for upper body
          ctx.fill();
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = '#ffffff';
          ctx.stroke();
        }
      });
    }

    // Draw Angle Annotations near Knees
    if (showAngles && personDetected) {
      ctx.font = 'bold 12px monospace';
      ctx.fillStyle = '#ffffff';

      // Left Knee (idx 25)
      const lk = landmarks[25];
      if (lk && (lk.visibility ?? 1) > 0.4 && leftKneeAngle > 0) {
        const x = applyMirror ? (1 - lk.x) * w : lk.x * w;
        const y = lk.y * h;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(x + 8, y - 10, 48, 18);
        ctx.fillStyle = '#38bdf8';
        ctx.fillText(`${leftKneeAngle}°`, x + 12, y + 4);
      }

      // Right Knee (idx 26)
      const rk = landmarks[26];
      if (rk && (rk.visibility ?? 1) > 0.4 && rightKneeAngle > 0) {
        const x = applyMirror ? (1 - rk.x) * w : rk.x * w;
        const y = rk.y * h;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(x - 54, y - 10, 48, 18);
        ctx.fillStyle = '#38bdf8';
        ctx.fillText(`${rightKneeAngle}°`, x - 50, y + 4);
      }
    }
  }, [canvasRef, isDetecting, landmarks, showSkeleton, showLandmarks, showAngles, mirrorView, isImageMode, personDetected, leftKneeAngle, rightKneeAngle]);

  useEffect(() => {
    drawOverlay();
  }, [drawOverlay]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
      {/* Feed Title & Source Selectors */}
      <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-blue-600" />
          <h2 className="text-sm font-bold text-slate-800">
            {isImageMode ? 'Static Image Analysis View' : 'Computer Vision Feed'}
          </h2>
          {isDetecting && !isImageMode && (
            <span className="flex items-center gap-1 text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              {fps} FPS
            </span>
          )}
          {isImageMode && (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-blue-100 text-blue-800">
              {imageFileName || 'Photo Loaded'}
            </span>
          )}
        </div>

        {/* Input Mode Selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="feed-source" className="text-xs text-slate-500 font-medium">Source:</label>
          <select
            id="feed-source"
            value={inputMode}
            onChange={(e) => onChangeInputMode(e.target.value as InputMode)}
            className="text-xs bg-white border border-slate-300 rounded-md px-2.5 py-1 text-slate-700 font-medium focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          >
            <option value="webcam">🎥 Live Webcam (Real-time)</option>
            <option value="image-upload">🖼️ Insert Image (Photo Upload)</option>
            <option value="sample-standing">🧍 Test Simulation: Standing</option>
            <option value="sample-sitting">🪑 Test Simulation: Sitting</option>
            <option value="sample-walking">🚶 Test Simulation: Walking</option>
            <option value="sample-running">🏃 Test Simulation: Running</option>
          </select>
        </div>
      </div>

      {/* Video / Canvas Viewport */}
      <div className="relative aspect-4/3 sm:aspect-16/10 bg-slate-950 flex items-center justify-center overflow-hidden">
        {/* Hidden or visible HTML5 Video */}
        {inputMode === 'webcam' && (
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className={`absolute inset-0 w-full h-full object-cover ${
              mirrorView ? '-scale-x-100' : ''
            } opacity-90`}
          />
        )}

        {/* Static Image Viewport */}
        {isImageMode && currentImageUrl && (
          <img
            ref={imageRef}
            src={currentImageUrl}
            alt="Uploaded for activity recognition"
            crossOrigin="anonymous"
            className="absolute inset-0 w-full h-full object-contain bg-slate-900"
          />
        )}

        {/* Synthetic background when using simulation mode */}
        {inputMode !== 'webcam' && !isImageMode && (
          <div className="absolute inset-0 bg-linear-to-b from-slate-900 to-slate-950 flex flex-col items-center justify-center p-6 text-center">
            {/* Grid pattern */}
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />
            <div className="relative z-10">
              <div className="inline-block px-3 py-1 rounded-full bg-blue-900/60 border border-blue-500/30 text-blue-300 text-xs font-semibold mb-2">
                Simulated Pose Motion Clip
              </div>
              <p className="text-xs text-slate-400 max-w-xs">
                Generating mathematically accurate 33-landmark bipedal motion for validation.
              </p>
            </div>
          </div>
        )}

        {/* Overlay Canvas for Pose Skeleton */}
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10"
        />

        {/* Camera Error Message */}
        {cameraError && inputMode === 'webcam' && (
          <div className="absolute inset-0 bg-slate-900/90 z-20 flex flex-col items-center justify-center p-6 text-center">
            <AlertCircle className="w-10 h-10 text-amber-400 mb-3" />
            <h3 className="text-white text-sm font-semibold mb-1">Webcam Access Notice</h3>
            <p className="text-slate-300 text-xs max-w-sm mb-4">{cameraError}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onChangeInputMode('image-upload')}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium"
              >
                Insert Image Instead
              </button>
              <button
                type="button"
                onClick={() => onChangeInputMode('sample-standing')}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs font-medium"
              >
                Test Simulation
              </button>
            </div>
          </div>
        )}

        {/* Top-left subject detection badge */}
        <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold backdrop-blur-md shadow-xs bg-slate-900/80 border border-slate-700">
          <span
            className={`w-2 h-2 rounded-full ${
              personDetected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
            }`}
          />
          <span className={personDetected ? 'text-emerald-300' : 'text-rose-300'}>
            {personDetected ? 'Subject In View' : 'Searching Subject'}
          </span>
        </div>

        {/* Top-right joint angle badge */}
        {personDetected && (
          <div className="absolute top-3 right-3 z-20 hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-mono backdrop-blur-md bg-slate-900/80 border border-slate-700 text-slate-300">
            <span>Knee Flexion: <strong className="text-amber-400">{Math.round((leftKneeAngle + rightKneeAngle) / 2)}°</strong></span>
          </div>
        )}
      </div>

      {/* Control Bar */}
      <div className="p-3 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
        {/* Main Start / Stop Button */}
        <button
          type="button"
          onClick={onToggleDetection}
          className={`inline-flex items-center gap-2 px-5 py-2 rounded-lg font-bold text-sm transition-all shadow-xs ${
            isDetecting
              ? 'bg-rose-600 hover:bg-rose-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isDetecting ? (
            <>
              <Square className="w-4 h-4 fill-current" />
              <span>{isImageMode ? 'Clear Analysis' : 'Stop Detection'}</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>{isImageMode ? 'Analyze Image' : 'Start Detection'}</span>
            </>
          )}
        </button>

        {/* View toggles */}
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs">
          <button
            type="button"
            onClick={() => setShowSkeleton(!showSkeleton)}
            className={`px-2.5 py-1.5 rounded border transition-colors ${
              showSkeleton
                ? 'bg-blue-50 border-blue-200 text-blue-700 font-semibold'
                : 'bg-slate-100 border-slate-200 text-slate-500'
            }`}
          >
            Skeleton
          </button>
          <button
            type="button"
            onClick={() => setShowLandmarks(!showLandmarks)}
            className={`px-2.5 py-1.5 rounded border transition-colors ${
              showLandmarks
                ? 'bg-blue-50 border-blue-200 text-blue-700 font-semibold'
                : 'bg-slate-100 border-slate-200 text-slate-500'
            }`}
          >
            Landmarks
          </button>
          <button
            type="button"
            onClick={() => setShowAngles(!showAngles)}
            className={`px-2.5 py-1.5 rounded border transition-colors ${
              showAngles
                ? 'bg-blue-50 border-blue-200 text-blue-700 font-semibold'
                : 'bg-slate-100 border-slate-200 text-slate-500'
            }`}
          >
            Angles
          </button>
          {inputMode === 'webcam' && (
            <button
              type="button"
              onClick={() => setMirrorView(!mirrorView)}
              className="p-1.5 rounded border bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200"
              title="Mirror Camera View"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

