"use client";

import React, { useState, useRef, useEffect } from 'react';
import { FaCog, FaSun, FaSync } from 'react-icons/fa';

const MAX_WIDTH = 1024;

const ImageResizer: React.FC = () => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0, width: 200, height: 200 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const [resizeMode, setResizeMode] = useState<string | null>(null);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [quality, setQuality] = useState<number>(1);
  const [showQualityDropdown, setShowQualityDropdown] = useState(false);
  const qualityDropdownRef = useRef<HTMLDivElement>(null);
  const [brightness, setBrightness] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const img = new Image();
      img.onload = () => {
        let newWidth = img.width;
        let newHeight = img.height;

        if (newWidth > MAX_WIDTH) {
          newHeight = (MAX_WIDTH / newWidth) * newHeight;
          newWidth = MAX_WIDTH;
        }

        setImage(img);
        setCrop({ x: 0, y: 0, width: newWidth / 2, height: newHeight / 2 });
      };
      img.src = URL.createObjectURL(file);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (qualityDropdownRef.current && !qualityDropdownRef.current.contains(event.target as Node)) {
        setShowQualityDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleQualityDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowQualityDropdown(!showQualityDropdown);
  };

  useEffect(() => {
    if (image && canvasRef.current && overlayCanvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const overlayCanvas = overlayCanvasRef.current;
      const overlayCtx = overlayCanvas.getContext('2d');
      
      // Set canvas size based on the scaled image
      const scaleFactor = Math.min(MAX_WIDTH / image.width, 1);
      canvas.width = image.width * scaleFactor;
      canvas.height = image.height * scaleFactor;
      overlayCanvas.width = canvas.width;
      overlayCanvas.height = canvas.height;
      
      if (ctx) {
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
        
        // Apply brightness adjustment
        ctx.filter = `brightness(${brightness}%)`;
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        ctx.filter = 'none';
        
        ctx.restore();
      }

      drawOverlay(overlayCtx);
    }
  }, [image, crop, brightness, rotation]);

  const handleBrightnessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBrightness(Number(e.target.value));
  };

  const handleRotationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRotation(Number(e.target.value));
  };

  const drawOverlay = (ctx: CanvasRenderingContext2D | null) => {
    if (ctx) {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      
      // Draw semi-transparent overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      
      // Clear the crop area
      ctx.clearRect(crop.x, crop.y, crop.width, crop.height);
      
      // Draw crop border
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.strokeRect(crop.x, crop.y, crop.width, crop.height);

      // Draw resize handles
      const handleSize = 10;
      ctx.fillStyle = 'white';
      ctx.fillRect(crop.x - handleSize / 2, crop.y - handleSize / 2, handleSize, handleSize);
      ctx.fillRect(crop.x + crop.width - handleSize / 2, crop.y - handleSize / 2, handleSize, handleSize);
      ctx.fillRect(crop.x - handleSize / 2, crop.y + crop.height - handleSize / 2, handleSize, handleSize);
      ctx.fillRect(crop.x + crop.width - handleSize / 2, crop.y + crop.height - handleSize / 2, handleSize, handleSize);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setStartPos({ x, y });

      const handleSize = 10;
      if (Math.abs(x - crop.x) <= handleSize && Math.abs(y - crop.y) <= handleSize) {
        setResizeMode('topLeft');
      } else if (Math.abs(x - (crop.x + crop.width)) <= handleSize && Math.abs(y - crop.y) <= handleSize) {
        setResizeMode('topRight');
      } else if (Math.abs(x - crop.x) <= handleSize && Math.abs(y - (crop.y + crop.height)) <= handleSize) {
        setResizeMode('bottomLeft');
      } else if (Math.abs(x - (crop.x + crop.width)) <= handleSize && Math.abs(y - (crop.y + crop.height)) <= handleSize) {
        setResizeMode('bottomRight');
      } else if (x >= crop.x && x <= crop.x + crop.width && y >= crop.y && y <= crop.y + crop.height) {
        setResizeMode('move');
      } else {
        setResizeMode(null);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (resizeMode && canvasRef.current) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      let newCrop = { ...crop };

      switch (resizeMode) {
        case 'topLeft':
          newCrop.width += newCrop.x - x;
          newCrop.height += newCrop.y - y;
          newCrop.x = x;
          newCrop.y = y;
          break;
        case 'topRight':
          newCrop.width = x - newCrop.x;
          newCrop.height += newCrop.y - y;
          newCrop.y = y;
          break;
        case 'bottomLeft':
          newCrop.width += newCrop.x - x;
          newCrop.height = y - newCrop.y;
          newCrop.x = x;
          break;
        case 'bottomRight':
          newCrop.width = x - newCrop.x;
          newCrop.height = y - newCrop.y;
          break;
        case 'move':
          newCrop.x += x - startPos.x;
          newCrop.y += y - startPos.y;
          setStartPos({ x, y });
          break;
      }

      // Ensure crop box stays within image bounds
      newCrop.x = Math.max(0, Math.min(newCrop.x, canvas.width - newCrop.width));
      newCrop.y = Math.max(0, Math.min(newCrop.y, canvas.height - newCrop.height));
      newCrop.width = Math.max(10, Math.min(newCrop.width, canvas.width - newCrop.x));
      newCrop.height = Math.max(10, Math.min(newCrop.height, canvas.height - newCrop.y));

      setCrop(newCrop);
    }
  };

  const handleMouseUp = () => {
    setResizeMode(null);
  };

  const handleQualityChange = (newQuality: number) => {
    setQuality(newQuality);
    setShowQualityDropdown(false);
  };

  const handleDownload = () => {
    if (canvasRef.current && image) {
      const sourceCanvas = canvasRef.current;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        canvas.width = crop.width * quality;
        canvas.height = crop.height * quality;
        
        // Draw the cropped portion of the source canvas
        ctx.drawImage(
          sourceCanvas,
          crop.x,
          crop.y,
          crop.width,
          crop.height,
          0,
          0,
          canvas.width,
          canvas.height
        );
        
        // Create download link
        const link = document.createElement('a');
        link.download = `cropped-image-${quality}x.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
    }
  };

  return (
    <div className="space-y-4">
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />
      {image && (
        <div className="space-y-4">
          <div className="max-w-full overflow-hidden relative inline-block">
            <canvas
              ref={canvasRef}
              className="border"
            />
            <canvas
              ref={overlayCanvasRef}
              className="absolute top-0 left-0 cursor-move"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
            <div className="absolute top-2 left-2 bg-white bg-opacity-80 rounded-md shadow-md z-10" ref={qualityDropdownRef}>
              <button
                className="p-2 hover:bg-gray-200 rounded-md"
                onClick={toggleQualityDropdown}
                title="Image Quality"
              >
                <FaCog />
              </button>
              {showQualityDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-white rounded-md shadow-md z-20 overflow-hidden">
                  {[1, 2, 3].map((q) => (
                    <button
                      key={q}
                      className={`block w-full text-left px-4 py-2 hover:bg-gray-100 ${quality === q ? 'bg-blue-100' : ''}`}
                      onClick={() => handleQualityChange(q)}
                    >
                      {q}x
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="absolute top-2 left-0 right-0 mx-auto w-fit bg-white bg-opacity-80 rounded-md shadow-md p-2 flex items-center z-10">
              <FaSun className="mr-2 text-yellow-500" />
              <input
                type="range"
                min="0"
                max="200"
                value={brightness}
                onChange={handleBrightnessChange}
                className="w-24 sm:w-32"
              />
            </div>
            <div className="absolute bottom-2 left-0 right-0 mx-auto w-fit bg-white bg-opacity-80 rounded-md shadow-md p-2 flex items-center z-10">
              <FaSync className="mr-2 text-blue-500" />
              <input
                type="range"
                min="-45"
                max="45"
                value={rotation}
                onChange={handleRotationChange}
                className="w-24 sm:w-32"
              />
            </div>
          </div>
          <div className="flex justify-start">
            <button
              onClick={handleDownload}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Download Cropped Image ({quality}x)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageResizer;