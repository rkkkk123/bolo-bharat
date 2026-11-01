'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

export interface BackgroundVideoProps {
  /** List of video URLs (public paths or blob URLs) */
  initialVideos?: string[];
  /** Optional subtle overlay opacity (default 0 for maximum brightness and clarity) */
  overlayOpacity?: number;
}

const DEFAULT_VIDEOS = [
  '/videos/bg-1.mp4',
  '/videos/bg-2.mp4',
  '/videos/bg-3.mp4',
];

export const BackgroundVideo: React.FC<BackgroundVideoProps> = ({
  initialVideos = DEFAULT_VIDEOS,
  overlayOpacity = 0,
}) => {
  const [playlist] = useState<string[]>(initialVideos);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeSlot, setActiveSlot] = useState<'A' | 'B'>('A');

  // Dual video refs for seamless crossfade with zero flicker
  const videoRefA = useRef<HTMLVideoElement>(null);
  const videoRefB = useRef<HTMLVideoElement>(null);

  const [srcA, setSrcA] = useState<string>(playlist[0] || '');
  const [srcB, setSrcB] = useState<string>(playlist[1] || playlist[0] || '');

  // Next video handler
  const goToNextVideo = useCallback(() => {
    if (playlist.length === 0) return;
    const nextIdx = (currentIndex + 1) % playlist.length;
    setCurrentIndex(nextIdx);

    if (activeSlot === 'A') {
      setSrcB(playlist[nextIdx]);
      if (videoRefB.current) {
        videoRefB.current.currentTime = 0;
        videoRefB.current.play().catch(() => {});
      }
      setActiveSlot('B');
    } else {
      setSrcA(playlist[nextIdx]);
      if (videoRefA.current) {
        videoRefA.current.currentTime = 0;
        videoRefA.current.play().catch(() => {});
      }
      setActiveSlot('A');
    }
  }, [currentIndex, playlist, activeSlot]);

  // Handle video end
  const handleVideoEnded = useCallback(() => {
    if (playlist.length > 1) {
      goToNextVideo();
    } else {
      const currentVideo = activeSlot === 'A' ? videoRefA.current : videoRefB.current;
      if (currentVideo) {
        currentVideo.currentTime = 0;
        currentVideo.play().catch(() => {});
      }
    }
  }, [playlist.length, goToNextVideo, activeSlot]);

  // Initial playback & unlock on user touch/click for mobile browsers
  useEffect(() => {
    const playCurrent = () => {
      const activeVideo = activeSlot === 'A' ? videoRefA.current : videoRefB.current;
      if (activeVideo) {
        activeVideo.play().catch(() => {});
      }
    };

    playCurrent();

    const handleUserGesture = () => {
      playCurrent();
      window.removeEventListener('pointerdown', handleUserGesture);
      window.removeEventListener('touchstart', handleUserGesture);
    };

    window.addEventListener('pointerdown', handleUserGesture, { once: true });
    window.addEventListener('touchstart', handleUserGesture, { once: true });

    return () => {
      window.removeEventListener('pointerdown', handleUserGesture);
      window.removeEventListener('touchstart', handleUserGesture);
    };
  }, [activeSlot]);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none z-0 bg-gradient-to-br from-[#FFF8F0] via-[#FAF5EE] to-[#EEF8F1]">
      {/* Video Layer A */}
      <video
        ref={videoRefA}
        src={srcA}
        autoPlay
        muted
        playsInline
        loop={playlist.length <= 1}
        onEnded={handleVideoEnded}
        onError={() => {
          if (playlist.length > 1) goToNextVideo();
        }}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
          activeSlot === 'A' ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Video Layer B (Crossfade partner) */}
      <video
        ref={videoRefB}
        src={srcB}
        autoPlay
        muted
        playsInline
        loop={playlist.length <= 1}
        onEnded={handleVideoEnded}
        onError={() => {
          if (playlist.length > 1) goToNextVideo();
        }}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
          activeSlot === 'B' ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Zero Black: Optional ultra-subtle crystalline glass overlay if requested */}
      {overlayOpacity > 0 && (
        <div
          style={{ opacity: overlayOpacity }}
          className="absolute inset-0 bg-white/20 pointer-events-none backdrop-blur-[0.5px] transition-opacity duration-300"
        />
      )}
    </div>
  );
};
