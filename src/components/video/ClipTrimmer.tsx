'use client';
import React, { useState, useEffect, useRef } from 'react';

interface ClipTrimmerProps {
  videoSrc: string; // URL of the video to be trimmed
  initialStartTime?: number; // Initial start time in seconds
  initialEndTime?: number; // Initial end time in seconds
  maxDuration: number; // Maximum duration of the video in seconds
  onTrimChange: (startTime: number, endTime: number) => void;
}

const ClipTrimmer: React.FC<ClipTrimmerProps> = ({
  videoSrc,
  initialStartTime = 0,
  initialEndTime,
  maxDuration,
  onTrimChange,
}) => {
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState(initialEndTime || maxDuration);
  const videoRef = useRef<HTMLVideoElement>(null);
  // TODO: Add timeline/slider UI and logic
  useEffect(() => {
    setStartTime(initialStartTime);
    setEndTime(initialEndTime || maxDuration);
  }, [initialStartTime, initialEndTime, maxDuration]);
  useEffect(() => {
    onTrimChange(startTime, endTime);
  }, [startTime, endTime, onTrimChange]);
  // Placeholder for the trimming UI
  return (
    <div className="p-4 border rounded-lg">
      <h4 className="text-lg font-semibold mb-2">Trim Clip</h4>
      <video ref={videoRef} src={videoSrc} controls className="w-full rounded mb-4" />
      <div className="space-y-2">
        <div>
          <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
            Start Time: {startTime.toFixed(2)}s
          </label>
          {/* Basic input for now, will be replaced by a visual slider */}
          <input
            type="range"
            id="startTime"
            min={0}
            max={maxDuration}
            step={0.1}
            value={startTime}
            onChange={(e) => setStartTime(Math.min(parseFloat(e.target.value), endTime - 0.1))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        <div>
          <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
            End Time: {endTime.toFixed(2)}s
          </label>
          {/* Basic input for now, will be replaced by a visual slider */}
          <input
            type="range"
            id="endTime"
            min={0}
            max={maxDuration}
            step={0.1}
            value={endTime}
            onChange={(e) => setEndTime(Math.max(parseFloat(e.target.value), startTime + 0.1))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-2">
        Selected duration: {(endTime - startTime).toFixed(2)}s
      </p>
    </div>
  );
};

export default ClipTrimmer; 