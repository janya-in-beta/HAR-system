import React, { useRef, useState } from 'react';
import { Upload, Image as ImageIcon, Sparkles, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { SAMPLE_IMAGES, SampleImageItem } from '../utils/sampleImages';
import { PoseLandmark } from '../types';

interface ImageAnalysisSectionProps {
  currentImageUrl: string | null;
  onImageSelected: (dataUrl: string, presetLandmarks?: PoseLandmark[], fileName?: string) => void;
  isProcessing: boolean;
  onSwitchToWebcam: () => void;
  selectedSampleId: string | null;
}

export const ImageAnalysisSection: React.FC<ImageAnalysisSectionProps> = ({
  currentImageUrl,
  onImageSelected,
  isProcessing,
  onSwitchToWebcam,
  selectedSampleId,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    setUploadError(null);
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (JPEG, PNG, WebP).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Image size is too large (max 10MB).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        onImageSelected(dataUrl, undefined, file.name);
      }
    };
    reader.onerror = () => {
      setUploadError('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs mb-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3 border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
            <ImageIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Image-Based Activity Recognition
            </h3>
            <p className="text-xs text-slate-500">
              Upload a human photo or select a test sample to identify the activity.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onSwitchToWebcam}
          className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 self-start sm:self-auto"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Switch to Live Webcam</span>
        </button>
      </div>

      {/* Preset Academic Test Photos */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            Instant Academic Test Samples (1-Click Evaluation):
          </span>
          <span className="text-[11px] text-slate-400">Pre-calibrated ground truth</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SAMPLE_IMAGES.map((sample) => {
            const isSelected = selectedSampleId === sample.id;
            return (
              <button
                key={sample.id}
                type="button"
                onClick={() => onImageSelected(sample.dataUrl, sample.landmarks, sample.name)}
                className={`p-2 rounded-lg border text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100/80 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-slate-800 truncate">
                    {sample.label}
                  </span>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                </div>
                <div className="text-[10px] text-slate-500 line-clamp-2 leading-tight">
                  {sample.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50/60'
            : 'border-slate-300 bg-slate-50 hover:bg-slate-100/70 hover:border-slate-400'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <div className="flex flex-col items-center justify-center gap-1.5">
          <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
            <Upload className="w-4 h-4" />
          </div>
          <div className="text-xs font-semibold text-slate-700">
            Click to upload your own human photo or drag and drop
          </div>
          <div className="text-[11px] text-slate-400">
            Supports JPEG, PNG, WEBP (front or side view with body visible)
          </div>
        </div>
      </div>

      {/* Upload Error Banner */}
      {uploadError && (
        <div className="mt-2.5 p-2 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
          <span>{uploadError}</span>
        </div>
      )}
    </div>
  );
};
