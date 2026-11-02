'use client';

import React, { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCamera } from '@/hooks/useCamera';
import { useBoloStore } from '@/store/useBoloStore';
import { primeSpeechSynthesis } from '@/lib/speech';
import {
  Camera,
  RefreshCw,
  Crop,
  Sparkles,
  RotateCcw,
  Check,
} from 'lucide-react';

export interface CameraViewProps {
  onTap?: (point: { x: number; y: number }, imageBase64?: string) => void;
  onBoxSelect?: (
    bbox: { x: number; y: number; w: number; h: number },
    fullImageBase64?: string,
    croppedImageBase64?: string
  ) => void;
  children?: React.ReactNode;
}

interface Ripple {
  id: number;
  pixelX: number;
  pixelY: number;
}

interface DragSelection {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  isDragging: boolean;
}

export const CameraView: React.FC<CameraViewProps> = ({
  onTap,
  onBoxSelect,
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { videoRef, isActive, startCamera, toggleFacingMode } = useCamera();
  const { setTapPoint, setStatus } = useBoloStore();

  // Tap ripple effect state
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const lastTapTimeRef = useRef<number>(0);

  // Photo Snapshot / Screenshot Freeze state
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);
  const [isFlashActive, setIsFlashActive] = useState<boolean>(false);

  // Drag-to-select rectangular box state
  const [dragState, setDragState] = useState<DragSelection | null>(null);
  const pointerStartRef = useRef<{ clientX: number; clientY: number } | null>(null);

  // Helper: Generate workspace mock JPEG when camera permission is pending
  const generateMockFrame = useCallback(
    (cropPct?: { x: number; y: number; w: number; h: number }): { fullImage: string; croppedImage: string } => {
      if (typeof window === 'undefined') return { fullImage: '', croppedImage: '' };
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 800;
      const ctx = canvas.getContext('2d');
      if (!ctx) return { fullImage: '', croppedImage: '' };

      // Background gradient
      const grad = ctx.createLinearGradient(0, 0, 600, 800);
      grad.addColorStop(0, '#10131B');
      grad.addColorStop(0.5, '#0C0E14');
      grad.addColorStop(1, '#050608');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 600, 800);

      // Saffron tricolor ambient radial
      const radial = ctx.createRadialGradient(300, 360, 20, 300, 360, 350);
      radial.addColorStop(0, 'rgba(255, 103, 31, 0.18)');
      radial.addColorStop(1, 'transparent');
      ctx.fillStyle = radial;
      ctx.fillRect(0, 0, 600, 800);

      // Card 1: Coffee Mug
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 2;
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(100, 210, 160, 180, 24);
      } else {
        ctx.rect(100, 210, 160, 180);
      }
      ctx.fill();
      ctx.stroke();
      ctx.font = '48px sans-serif';
      ctx.fillText('☕', 155, 295);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText('Coffee Mug', 135, 345);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '13px sans-serif';
      ctx.fillText('कॉफी मग', 150, 368);

      // Card 2: Smart Watch
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(340, 260, 160, 160, 24);
      } else {
        ctx.rect(340, 260, 160, 160);
      }
      ctx.fill();
      ctx.stroke();
      ctx.font = '48px sans-serif';
      ctx.fillText('⌚', 395, 340);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText('Smart Watch', 370, 385);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '13px sans-serif';
      ctx.fillText('स्मार्ट वॉच', 388, 406);

      // Card 3: Plant
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(350, 70, 140, 150, 24);
      } else {
        ctx.rect(350, 70, 140, 150);
      }
      ctx.fill();
      ctx.stroke();
      ctx.font = '42px sans-serif';
      ctx.fillText('🪴', 398, 145);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText('Desk Plant', 380, 185);

      // Card 4: Notebook
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(100, 480, 260, 150, 24);
      } else {
        ctx.rect(100, 480, 260, 150);
      }
      ctx.fill();
      ctx.stroke();
      ctx.font = '42px sans-serif';
      ctx.fillText('📖', 205, 550);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText('Notebook & Pen', 170, 595);

      const fullImage = canvas.toDataURL('image/jpeg', 0.85);

      let croppedImage = fullImage;
      if (cropPct) {
        const sx = Math.max(0, Math.floor((cropPct.x / 100) * 600));
        const sy = Math.max(0, Math.floor((cropPct.y / 100) * 800));
        const sw = Math.max(30, Math.min(600 - sx, Math.floor((cropPct.w / 100) * 600)));
        const sh = Math.max(30, Math.min(800 - sy, Math.floor((cropPct.h / 100) * 800)));

        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = Math.min(512, sw);
        cropCanvas.height = Math.min(512, sh);
        const cCtx = cropCanvas.getContext('2d');
        if (cCtx) {
          cCtx.drawImage(canvas, sx, sy, sw, sh, 0, 0, cropCanvas.width, cropCanvas.height);
          croppedImage = cropCanvas.toDataURL('image/jpeg', 0.85);
        }
      }

      return { fullImage, croppedImage };
    },
    []
  );

  // Helper: Capture full frame & sub-rectangle crop from active video, frozen snapshot, or mock
  const captureFrameAndCrop = useCallback(
    (pixelBox?: { pixelX: number; pixelY: number; pixelW: number; pixelH: number }): {
      fullImage: string;
      croppedImage: string;
    } => {
      if (!containerRef.current) return { fullImage: '', croppedImage: '' };
      const rect = containerRef.current.getBoundingClientRect();
      const cWidth = rect.width;
      const cHeight = rect.height;

      // 1. If we have a frozen snapshot image, crop from it
      if (snapshotUrl) {
        // Snapshot is already captured
        const fullImage = snapshotUrl;
        if (!pixelBox || pixelBox.pixelW <= 0 || pixelBox.pixelH <= 0) {
          return { fullImage, croppedImage: fullImage };
        }
        // Crop from snapshot using percentage
        const cropPct = {
          x: (pixelBox.pixelX / cWidth) * 100,
          y: (pixelBox.pixelY / cHeight) * 100,
          w: (pixelBox.pixelW / cWidth) * 100,
          h: (pixelBox.pixelH / cHeight) * 100,
        };
        const mock = generateMockFrame(cropPct);
        return { fullImage, croppedImage: mock.croppedImage || fullImage };
      }

      // 2. If live video is active, crop directly from HTMLVideoElement
      const video = videoRef.current;
      if (video && isActive && video.videoWidth > 0) {
        try {
          const vW = video.videoWidth;
          const vH = video.videoHeight;
          const scale = Math.max(cWidth / vW, cHeight / vH);
          const renderedW = vW * scale;
          const renderedH = vH * scale;
          const offsetX = (renderedW - cWidth) / 2;
          const offsetY = (renderedH - cHeight) / 2;

          // Full frame
          const fullCanvas = document.createElement('canvas');
          fullCanvas.width = Math.min(800, vW);
          fullCanvas.height = Math.min(800, vH);
          const fullCtx = fullCanvas.getContext('2d');
          if (fullCtx) {
            fullCtx.drawImage(video, 0, 0, fullCanvas.width, fullCanvas.height);
          }
          const fullImage = fullCanvas.toDataURL('image/jpeg', 0.85);

          let croppedImage = fullImage;
          if (pixelBox && pixelBox.pixelW > 10 && pixelBox.pixelH > 10) {
            const vCropX = Math.max(0, (pixelBox.pixelX + offsetX) / scale);
            const vCropY = Math.max(0, (pixelBox.pixelY + offsetY) / scale);
            const vCropW = Math.min(vW - vCropX, pixelBox.pixelW / scale);
            const vCropH = Math.min(vH - vCropY, pixelBox.pixelH / scale);

            const cropCanvas = document.createElement('canvas');
            cropCanvas.width = Math.min(512, Math.max(32, Math.floor(vCropW)));
            cropCanvas.height = Math.min(512, Math.max(32, Math.floor(vCropH)));
            const cropCtx = cropCanvas.getContext('2d');
            if (cropCtx) {
              cropCtx.drawImage(
                video,
                vCropX,
                vCropY,
                vCropW,
                vCropH,
                0,
                0,
                cropCanvas.width,
                cropCanvas.height
              );
              croppedImage = cropCanvas.toDataURL('image/jpeg', 0.85);
            }
          }

          return { fullImage, croppedImage };
        } catch (captureErr) {
          console.warn('[Camera Capture Warning]', captureErr);
        }
      }

      // 3. Fallback: Mock workspace surface crop
      const cropPct = pixelBox
        ? {
            x: (pixelBox.pixelX / cWidth) * 100,
            y: (pixelBox.pixelY / cHeight) * 100,
            w: (pixelBox.pixelW / cWidth) * 100,
            h: (pixelBox.pixelH / cHeight) * 100,
          }
        : undefined;

      return generateMockFrame(cropPct);
    },
    [isActive, videoRef, snapshotUrl, generateMockFrame]
  );

  // Shutter action: Click photo / Freeze frame snapshot
  const handleShutterClick = useCallback(() => {
    primeSpeechSynthesis();

    // Trigger visual camera flash
    setIsFlashActive(true);
    setTimeout(() => setIsFlashActive(false), 240);

    const { fullImage } = captureFrameAndCrop();
    if (fullImage) {
      setSnapshotUrl(fullImage);
    }
  }, [captureFrameAndCrop]);

  // Retake / Unfreeze: return to live camera feed
  const handleRetake = useCallback(() => {
    setSnapshotUrl(null);
  }, []);

  // Analyze entire frozen snapshot
  const handleAnalyzeSnapshot = useCallback(() => {
    if (!snapshotUrl) return;
    setStatus('GROUNDING');
    primeSpeechSynthesis();
    if (onTap) {
      onTap({ x: 50, y: 50 }, snapshotUrl);
    }
  }, [snapshotUrl, onTap, setStatus]);

  // Single-tap interaction handler
  const handleSingleTap = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return;

      const now = Date.now();
      if (now - lastTapTimeRef.current < 250) return;
      lastTapTimeRef.current = now;

      const rect = containerRef.current.getBoundingClientRect();
      const pixelX = Math.max(0, Math.min(rect.width, clientX - rect.left));
      const pixelY = Math.max(0, Math.min(rect.height, clientY - rect.top));

      const viewportPctX = Math.round((pixelX / rect.width) * 100);
      const viewportPctY = Math.round((pixelY / rect.height) * 100);

      setTapPoint({ x: viewportPctX, y: viewportPctY });
      setStatus('GROUNDING');
      primeSpeechSynthesis();

      // Add visual ripple
      setRipples((prev) => [...prev.slice(-3), { id: now, pixelX, pixelY }]);

      // Capture frame & notify parent
      const { fullImage } = captureFrameAndCrop();
      if (onTap) {
        onTap({ x: viewportPctX, y: viewportPctY }, fullImage);
      }
    },
    [setTapPoint, setStatus, onTap, captureFrameAndCrop]
  );

  // Box drag completion handler
  const handleBoxComplete = useCallback(
    (box: { left: number; top: number; width: number; height: number }) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();

      // Percentage bounding box (0 - 100)
      const pctBbox = {
        x: Math.round((box.left / rect.width) * 100),
        y: Math.round((box.top / rect.height) * 100),
        w: Math.round((box.width / rect.width) * 100),
        h: Math.round((box.height / rect.height) * 100),
      };

      // Set store tap point to center of box
      setTapPoint({
        x: Math.round(pctBbox.x + pctBbox.w / 2),
        y: Math.round(pctBbox.y + pctBbox.h / 2),
      });
      setStatus('GROUNDING');
      primeSpeechSynthesis();

      // Crop image from box coordinates
      const { fullImage, croppedImage } = captureFrameAndCrop({
        pixelX: box.left,
        pixelY: box.top,
        pixelW: box.width,
        pixelH: box.height,
      });

      // Pass directly to box handler or tap handler
      if (onBoxSelect) {
        onBoxSelect(pctBbox, fullImage, croppedImage);
      } else if (onTap) {
        onTap({ x: pctBbox.x + pctBbox.w / 2, y: pctBbox.y + pctBbox.h / 2 }, fullImage);
      }
    },
    [setTapPoint, setStatus, onBoxSelect, onTap, captureFrameAndCrop]
  );

  // Pointer Down: Start tracking drag vs tap
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.isPrimary) return;
    if (!containerRef.current) return;

    pointerStartRef.current = { clientX: e.clientX, clientY: e.clientY };

    const rect = containerRef.current.getBoundingClientRect();
    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;

    setDragState({
      startX,
      startY,
      currentX: startX,
      currentY: startY,
      isDragging: false,
    });

    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
  };

  // Pointer Move: Update box dimensions if dragging
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerStartRef.current || !dragState || !containerRef.current) return;

    const dx = Math.abs(e.clientX - pointerStartRef.current.clientX);
    const dy = Math.abs(e.clientY - pointerStartRef.current.clientY);

    const rect = containerRef.current.getBoundingClientRect();
    const currentX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const currentY = Math.max(0, Math.min(rect.height, e.clientY - rect.top));

    // If moved > 12px, activate dragging box mode
    const isDragging = dragState.isDragging || dx > 12 || dy > 12;

    setDragState((prev) =>
      prev
        ? {
            ...prev,
            currentX,
            currentY,
            isDragging,
          }
        : null
    );
  };

  // Pointer Up: Decide between rectangular selection or single tap
  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState || !containerRef.current) {
      pointerStartRef.current = null;
      setDragState(null);
      return;
    }

    const { startX, startY, currentX, currentY, isDragging } = dragState;
    const boxLeft = Math.min(startX, currentX);
    const boxTop = Math.min(startY, currentY);
    const boxWidth = Math.abs(currentX - startX);
    const boxHeight = Math.abs(currentY - startY);

    pointerStartRef.current = null;
    setDragState(null);

    // If dragged a deliberate rectangular box (at least 22px in both dimensions)
    if (isDragging && boxWidth >= 22 && boxHeight >= 22) {
      handleBoxComplete({
        left: boxLeft,
        top: boxTop,
        width: boxWidth,
        height: boxHeight,
      });
    } else {
      // Single tap
      handleSingleTap(e.clientX, e.clientY);
    }
  };

  const handlePointerCancel = () => {
    pointerStartRef.current = null;
    setDragState(null);
  };

  // Computed live box dimensions for rendering
  const activeBox =
    dragState && dragState.isDragging
      ? {
          left: Math.min(dragState.startX, dragState.currentX),
          top: Math.min(dragState.startY, dragState.currentY),
          width: Math.abs(dragState.currentX - dragState.startX),
          height: Math.abs(dragState.currentY - dragState.startY),
        }
      : null;

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      className="relative w-full h-full rounded-none md:rounded-[36px] overflow-hidden bg-black flex items-center justify-center select-none cursor-crosshair shadow-2xl md:border md:border-white/10 touch-none"
    >
      {/* 1. Permanent Video Feed element */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className={`absolute inset-0 w-full h-full object-cover rounded-none md:rounded-[36px] transition-opacity duration-300 z-10 pointer-events-none ${
          isActive && !snapshotUrl ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* 2. Frozen Snapshot / Screenshot View (Active when user clicks Shutter button) */}
      {snapshotUrl && (
        <div className="absolute inset-0 w-full h-full z-15 pointer-events-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={snapshotUrl}
            alt="Captured Snapshot"
            className="w-full h-full object-cover rounded-none md:rounded-[36px]"
          />
        </div>
      )}

      {/* 3. Interactive Mock Surface (Active when live camera is loading & no snapshot) */}
      {!isActive && !snapshotUrl && (
        <div className="absolute inset-0 w-full h-full object-cover bg-gradient-to-br from-[#0E1017] via-[#090A0E] to-black flex items-center justify-center rounded-none md:rounded-[36px] z-0">
          <div className="relative w-full h-full max-w-sm mx-auto overflow-hidden pointer-events-none opacity-85">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(255,103,31,0.14),transparent_70%)]" />

            {/* Coffee Mug Zone */}
            <div className="absolute top-[26%] left-[16%] w-28 sm:w-32 h-32 sm:h-36 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm flex flex-col items-center justify-center shadow-lg">
              <span className="text-3xl mb-1">☕</span>
              <span className="text-white text-xs font-semibold">Coffee Mug</span>
              <span className="text-white/40 text-[10px]">कॉफी मग</span>
            </div>

            {/* Smart Watch Zone */}
            <div className="absolute top-[32%] right-[14%] w-24 sm:w-28 h-24 sm:h-28 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm flex flex-col items-center justify-center shadow-lg">
              <span className="text-2xl mb-1">⌚</span>
              <span className="text-white text-xs font-semibold">Smart Watch</span>
              <span className="text-white/40 text-[10px]">स्मार्ट वॉच</span>
            </div>

            {/* Plant Zone */}
            <div className="absolute top-[10%] right-[20%] w-20 sm:w-24 h-24 sm:h-28 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm flex flex-col items-center justify-center shadow-lg">
              <span className="text-2xl mb-1">🪴</span>
              <span className="text-white text-xs font-semibold">Plant</span>
              <span className="text-white/40 text-[10px]">पौधा</span>
            </div>

            {/* Notebook Zone */}
            <div className="absolute bottom-[24%] left-[18%] w-44 sm:w-48 h-24 sm:h-28 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm flex flex-col items-center justify-center shadow-lg">
              <span className="text-2xl mb-1">📖</span>
              <span className="text-white text-xs font-semibold">Notebook</span>
              <span className="text-white/40 text-[10px]">नोटबुक</span>
            </div>
          </div>

          {/* Enable Live Camera Button */}
          <div className="absolute top-20 inset-x-4 z-20 flex justify-center pointer-events-auto">
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                startCamera();
              }}
              className="px-4 py-2.5 rounded-full bg-gradient-to-r from-[#FF671F] via-[#FF8833] to-[#046A38] text-white text-xs font-semibold shadow-lg shadow-orange-500/25 flex items-center gap-2 hover:opacity-95 active:scale-95 transition cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>कैमरा चालू करें (Enable Live Camera)</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. Shutter Camera Flash Animation */}
      <AnimatePresence>
        {isFlashActive && (
          <motion.div
            initial={{ opacity: 0.95 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
            className="absolute inset-0 bg-white pointer-events-none z-50"
          />
        )}
      </AnimatePresence>

      {/* 5. Live Drag-to-Select Rectangular Marquee Box Overlay */}
      {activeBox && (
        <div
          style={{
            position: 'absolute',
            left: `${activeBox.left}px`,
            top: `${activeBox.top}px`,
            width: `${activeBox.width}px`,
            height: `${activeBox.height}px`,
            willChange: 'transform, width, height',
            pointerEvents: 'none',
            zIndex: 35,
          }}
          className="border-2 border-dashed border-[#FF8833] bg-gradient-to-tr from-[#FF671F]/15 via-white/10 to-[#046A38]/15 backdrop-blur-[1px] rounded-xl shadow-[0_0_24px_rgba(255,103,31,0.55)]"
        >
          {/* 4 L-shaped Corner Targeting Brackets */}
          <div className="absolute -top-1 -left-1 w-3.5 h-3.5 border-t-2 border-l-2 border-[#FF671F] rounded-tl-sm shadow-sm" />
          <div className="absolute -top-1 -right-1 w-3.5 h-3.5 border-t-2 border-r-2 border-[#FF671F] rounded-tr-sm shadow-sm" />
          <div className="absolute -bottom-1 -left-1 w-3.5 h-3.5 border-b-2 border-l-2 border-[#046A38] rounded-bl-sm shadow-sm" />
          <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 border-b-2 border-r-2 border-[#046A38] rounded-br-sm shadow-sm" />

          {/* Floating Dimension & Label Badge */}
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-black/90 backdrop-blur-md border border-white/20 text-white text-[10px] font-semibold flex items-center gap-1.5 whitespace-nowrap shadow-xl">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF671F] animate-ping" />
            <span>📐 चयनित क्षेत्र ({Math.round(activeBox.width)}×{Math.round(activeBox.height)})</span>
          </div>
        </div>
      )}

      {/* 6. Single Tap Ripple Animation */}
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.div
            key={ripple.id}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 2.2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.45,
              ease: 'easeOut',
            }}
            style={{
              transform: `translate3d(${ripple.pixelX}px, ${ripple.pixelY}px, 0)`,
              willChange: 'transform, opacity',
            }}
            className="absolute top-0 left-0 -ml-7 -mt-7 w-14 h-14 rounded-full border-2 border-[#FF671F] bg-gradient-to-tr from-[#FF671F]/30 via-white/20 to-[#046A38]/30 shadow-[0_0_20px_rgba(255,103,31,0.5)] pointer-events-none z-30"
          />
        ))}
      </AnimatePresence>

      {/* 7. Top Instruction & Feature Hint Badge */}
      <div className="absolute top-16 inset-x-4 z-25 flex justify-center pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-3 py-1.5 rounded-full bg-black/65 backdrop-blur-md border border-white/15 text-white/90 text-[11px] font-medium shadow-lg flex items-center gap-2"
        >
          {snapshotUrl ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>फ़ोटो तैयार • बॉक्स खींचकर वस्तु चुनें या पूरा स्कैन करें</span>
            </>
          ) : (
            <>
              <Crop className="w-3.5 h-3.5 text-[#FF9933]" />
              <span>फ़ोटो खींचें या 📐 बॉक्स खींचकर वस्तु चुनें</span>
            </>
          )}
        </motion.div>
      </div>

      {/* 8. Top Right Camera Controls (Flip Camera) */}
      {isActive && !snapshotUrl && (
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            toggleFacingMode();
          }}
          className="absolute top-20 right-3.5 z-30 p-2.5 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/80 border border-white/15 transition shadow-lg pointer-events-auto active:scale-90 cursor-pointer"
          title="Flip camera"
          aria-label="Flip camera between front and back"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      )}

      {/* 9. Floating Bottom Action Bar with Photo Shutter Button & Snapshot Options */}
      <div className="absolute bottom-24 inset-x-4 z-35 flex items-center justify-center gap-3 pointer-events-auto">
        {snapshotUrl ? (
          // Snapshot Controls: Retake vs Analyze Full Photo
          <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-black/80 backdrop-blur-xl border border-white/20 shadow-2xl">
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                handleRetake();
              }}
              className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-neutral-300" />
              <span>लाइव कैमरा (Retake)</span>
            </button>

            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                handleAnalyzeSnapshot();
              }}
              className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#FF671F] to-[#046A38] text-white text-xs font-bold flex items-center gap-1.5 shadow-md hover:opacity-95 transition active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span>पूरी फ़ोटो जांचें (Analyze)</span>
            </button>
          </div>
        ) : (
          // Live Camera Shutter Button: Click image / Take screenshot
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              handleShutterClick();
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/75 backdrop-blur-md border border-white/25 text-white shadow-2xl hover:bg-black/90 active:scale-95 transition cursor-pointer"
            title="फ़ोटो खींचें (Capture Snapshot)"
          >
            {/* Camera Shutter Ring */}
            <div className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center bg-white/10">
              <div className="w-4 h-4 rounded-full bg-[#FF671F]" />
            </div>
            <span className="text-xs font-bold tracking-tight">फ़ोटो खींचें • Snap</span>
          </motion.button>
        )}
      </div>

      {/* 10. Delicate Corner Focus Markers */}
      <div className="absolute inset-4 sm:inset-5 pointer-events-none border border-white/5 rounded-2xl md:rounded-[28px] z-20">
        <div className="absolute -top-0.5 -left-0.5 w-4 h-4 border-t border-l border-white/70 rounded-tl-sm" />
        <div className="absolute -top-0.5 -right-0.5 w-4 h-4 border-t border-r border-white/70 rounded-tr-sm" />
        <div className="absolute -bottom-0.5 -left-0.5 w-4 h-4 border-b border-l border-white/70 rounded-bl-sm" />
        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 border-b border-r border-white/70 rounded-br-sm" />
      </div>

      {/* Child layers (Halo, etc.) */}
      {children}
    </div>
  );
};

