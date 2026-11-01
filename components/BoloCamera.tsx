'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBoloStore } from '@/store/useBoloStore';
import { groundObject } from '@/lib/fireworks';
import { tokens } from '@/lib/design';
import { Camera, RefreshCw, Sparkles, Volume2 } from 'lucide-react';

export const BoloCamera: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);

  const {
    status,
    bbox,
    tapPoint,
    objectName,
    cameraFacing,
    handleTap,
    startGrounding,
    groundingSuccess,
    groundingFailed,
    toggleCameraFacing,
    isTalking,
  } = useBoloStore();

  // Try initializing camera if supported, else stay in high-fidelity mock scene
  const startCamera = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: cameraFacing },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch {
      // Permission denied or not available; fallback scene works seamlessly
      setCameraActive(false);
    }
  }, [cameraFacing]);

  useEffect(() => {
    if (cameraActive) {
      startCamera();
    }
  }, [cameraFacing, cameraActive, startCamera]);

  // Handle tap on the viewport
  const onSurfaceClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    handleTap({ x, y });
  };

  // State machine runner: When status is TAP, auto-trigger GROUNDING
  useEffect(() => {
    if (status === 'TAP' && tapPoint) {
      const groundingTimer = setTimeout(() => {
        startGrounding();
      }, 250);

      return () => clearTimeout(groundingTimer);
    }
  }, [status, tapPoint, startGrounding]);

  // When status becomes GROUNDING, call decoupled groundObject service
  useEffect(() => {
    if (status === 'GROUNDING' && tapPoint) {
      let isMounted = true;

      groundObject('', tapPoint.x, tapPoint.y)
        .then((res) => {
          if (!isMounted) return;
          if (res.success) {
            groundingSuccess({
              bbox: res.bbox,
              objectName: res.objectName,
              hindiTranscript: `नमस्ते! मैं ${res.objectNameHindi || res.objectName} हूँ। आपका स्वागत है!`,
              englishTranscript: `Hello! I am your ${res.objectName}. Great to meet you!`,
            });
          } else {
            groundingFailed('Could not pinpoint object clearly');
          }
        })
        .catch(() => {
          if (isMounted) groundingFailed('Network or inference issue');
        });

      return () => {
        isMounted = false;
      };
    }
  }, [status, tapPoint, groundingSuccess, groundingFailed]);

  return (
    <div
      ref={containerRef}
      onClick={onSurfaceClick}
      className="relative w-full h-full overflow-hidden bg-black flex items-center justify-center cursor-crosshair select-none"
    >
      {/* Video Stream or Simulated Interactive Physical Scene */}
      {cameraActive ? (
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-neutral-900 via-neutral-950 to-black flex items-center justify-center">
          {/* Simulated Physical Workspace Surface with Rich Interactive Target Zones */}
          <div className="relative w-full h-full max-w-md mx-auto overflow-hidden opacity-90">
            {/* Ambient desk lighting */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(0,132,255,0.15),transparent_70%)]" />

            {/* Simulated Coffee Mug object area */}
            <div className="absolute top-[28%] left-[24%] w-32 h-36 rounded-3xl border border-white/5 bg-gradient-to-b from-white/10 to-transparent flex flex-col items-center justify-center text-center p-2 backdrop-blur-sm shadow-xl">
              <span className="text-3xl mb-1">☕</span>
              <span className="text-white/80 text-xs font-medium">Coffee Mug</span>
              <span className="text-white/40 text-[10px]">कॉफी मग</span>
            </div>

            {/* Simulated Smart Watch object area */}
            <div className="absolute top-[32%] right-[16%] w-28 h-28 rounded-3xl border border-white/5 bg-gradient-to-b from-white/10 to-transparent flex flex-col items-center justify-center text-center p-2 backdrop-blur-sm shadow-xl">
              <span className="text-2xl mb-1">⌚</span>
              <span className="text-white/80 text-xs font-medium">Smart Watch</span>
              <span className="text-white/40 text-[10px]">स्मार्ट वॉच</span>
            </div>

            {/* Simulated Green Plant object area */}
            <div className="absolute top-[12%] right-[22%] w-24 h-28 rounded-3xl border border-white/5 bg-gradient-to-b from-white/10 to-transparent flex flex-col items-center justify-center text-center p-2 backdrop-blur-sm">
              <span className="text-2xl mb-1">🪴</span>
              <span className="text-white/80 text-xs font-medium">Plant</span>
              <span className="text-white/40 text-[10px]">पौधा</span>
            </div>

            {/* Simulated Notebook object area */}
            <div className="absolute bottom-[28%] left-[28%] w-48 h-28 rounded-3xl border border-white/5 bg-gradient-to-b from-white/10 to-transparent flex flex-col items-center justify-center text-center p-2 backdrop-blur-sm shadow-xl">
              <span className="text-2xl mb-1">📖</span>
              <span className="text-white/80 text-xs font-medium">Notebook</span>
              <span className="text-white/40 text-[10px]">नोटबुक</span>
            </div>
          </div>
        </div>
      )}

      {/* Viewfinder corner guides */}
      <div className="absolute inset-8 pointer-events-none border border-white/10 rounded-3xl">
        <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-[#0084FF] rounded-tl-lg" />
        <div className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-[#0084FF] rounded-tr-lg" />
        <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2 border-[#0084FF] rounded-bl-lg" />
        <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-[#0084FF] rounded-br-lg" />
      </div>

      {/* Tap Point Reticle (Status: TAP) */}
      <AnimatePresence>
        {(status === 'TAP' || status === 'GROUNDING') && tapPoint && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={tokens.motion.snappySpring}
            style={{
              left: `${tapPoint.x}%`,
              top: `${tapPoint.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
            className="absolute pointer-events-none z-30"
          >
            {/* Ripple ring */}
            <motion.div
              animate={{
                scale: [1, 2.2, 1],
                opacity: [0.8, 0.2, 0.8],
              }}
              transition={{ repeat: Infinity, duration: 1.2 }}
              className="w-16 h-16 -ml-8 -mt-8 rounded-full border-2 border-[#0084FF]"
            />
            {/* Center target dot */}
            <div className="w-4 h-4 -ml-2 -mt-2 rounded-full bg-gradient-to-r from-[#0084FF] to-[#8B5CF6] shadow-[0_0_16px_#0084FF] border border-white" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grounding Scanning Halo (Status: GROUNDING) */}
      <AnimatePresence>
        {status === 'GROUNDING' && tapPoint && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={tokens.motion.spring}
            style={{
              left: `${tapPoint.x}%`,
              top: `${tapPoint.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
            className="absolute z-20 pointer-events-none flex flex-col items-center justify-center"
          >
            <div className="w-36 h-36 rounded-halo border border-[#0084FF]/60 bg-[#0084FF]/10 backdrop-blur-[2px] shadow-halo animate-pulse flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-[#0084FF] animate-spin" />
            </div>
            <span className="mt-3 px-3 py-1 rounded-full text-xs font-medium text-white bg-black/60 backdrop-blur-md border border-white/10 tracking-wide">
              Grounding object...
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grounded Bounding Box (Status: TALKING or REPAIR) */}
      <AnimatePresence>
        {(status === 'TALKING' || status === 'REPAIR') && bbox && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={tokens.motion.spring}
            style={{
              transform: `translate3d(${bbox.x}%, ${bbox.y}%, 0)`,
              top: 0,
              left: 0,
              width: `${bbox.w}%`,
              height: `${bbox.h}%`,
            }}
            className="absolute z-20 pointer-events-none rounded-halo border-2 border-[#8B5CF6] bg-[#8B5CF6]/15 shadow-halo-purple backdrop-blur-[1px] transition-all"
          >
            {/* Object tag badge */}
            <motion.div
              initial={{ y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="absolute -top-9 left-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0A0A0A]/90 text-white text-xs font-semibold shadow-lg border border-white/15"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>{objectName}</span>
              {isTalking && <Volume2 className="w-3.5 h-3.5 text-[#0084FF] ml-1 animate-pulse" />}
            </motion.div>

            {/* Glowing corner anchors */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-white rounded-tl" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-white rounded-tr" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-white rounded-bl" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-white rounded-br" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Camera Controls Bar (Top Floating) */}
      <div className="absolute top-4 left-4 right-4 z-40 flex items-center justify-between pointer-events-auto">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setCameraActive((prev) => !prev);
          }}
          className="p-2.5 rounded-full bg-black/40 backdrop-blur-md text-white/90 border border-white/10 hover:bg-black/60 transition shadow-lg flex items-center gap-2 text-xs"
          title="Toggle camera feed"
        >
          <Camera className="w-4 h-4" />
          <span className="hidden sm:inline">{cameraActive ? 'Camera ON' : 'Mock Scene'}</span>
        </button>

        {cameraActive && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleCameraFacing();
            }}
            className="p-2.5 rounded-full bg-black/40 backdrop-blur-md text-white/90 border border-white/10 hover:bg-black/60 transition shadow-lg"
            title="Flip camera"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
