'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, SkipForward, Plus, Film } from 'lucide-react';

export interface BackgroundVideoProps {
  /** List of video URLs (public paths or blob URLs) */
  initialVideos?: string[];
  /** Dark overlay opacity (0 to 1) */
  overlayOpacity?: number;
  /** Whether to show subtle developer controls in bottom corner */
  showControls?: boolean;
}

const DEFAULT_VIDEOS = [
  '/videos/bg-1.mp4',
  '/videos/bg-2.mp4',
  '/videos/bg-3.mp4',
];

export const BackgroundVideo: React.FC<BackgroundVideoProps> = ({
  initialVideos = DEFAULT_VIDEOS,
  overlayOpacity = 0.55,
  showControls = true,
}) => {
  const [playlist, setPlaylist] = useState<string[]>(initialVideos);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [activeSlot, setActiveSlot] = useState<'A' | 'B'>('A');

  // Dual video refs for seamless zero-flicker crossfade
  const videoRefA = useRef<HTMLVideoElement>(null);
  const videoRefB = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [srcA, setSrcA] = useState<string>(playlist[0] || '');
  const [srcB, setSrcB] = useState<string>(playlist[1] || playlist[0] || '');

  // Next track handler with smooth crossfade
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
      // Single video seamless restart
      const currentVideo = activeSlot === 'A' ? videoRefA.current : videoRefB.current;
      if (currentVideo) {
        currentVideo.currentTime = 0;
        currentVideo.play().catch(() => {});
      }
    }
  }, [playlist.length, goToNextVideo, activeSlot]);

  // Initial playback & unlock on user interaction
  useEffect(() => {
    const playCurrent = () => {
      const activeVideo = activeSlot === 'A' ? videoRefA.current : videoRefB.current;
      if (activeVideo) {
        activeVideo.play().catch((err) => {
          console.warn('Background video autoplay note:', err);
        });
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

  // Pause / Resume toggle
  const togglePlayPause = () => {
    const currentVideo = activeSlot === 'A' ? videoRefA.current : videoRefB.current;
    if (!currentVideo) return;

    if (isPlaying) {
      videoRefA.current?.pause();
      videoRefB.current?.pause();
      setIsPlaying(false);
    } else {
      currentVideo.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  // Allow user to upload/provide their own video file directly
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newUrls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('video/')) {
        const url = URL.createObjectURL(file);
        newUrls.push(url);
      }
    }

    if (newUrls.length > 0) {
      setPlaylist((prev) => [...newUrls, ...prev]);
      setCurrentIndex(0);
      setSrcA(newUrls[0]);
      setActiveSlot('A');
      setHasError(false);
      setIsPlaying(true);
      setTimeout(() => {
        if (videoRefA.current) {
          videoRefA.current.currentTime = 0;
          videoRefA.current.play().catch(() => {});
        }
      }, 100);
    }
  };

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none z-0 bg-[#0A0A0A]">
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
          else setHasError(true);
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
          else setHasError(true);
        }}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
          activeSlot === 'B' ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Fallback ambient canvas if video fails or loading */}
      {hasError && (
        <div className="absolute inset-0 bg-gradient-to-br from-[#0c0d12] via-[#07080a] to-black" />
      )}

      {/* Cinematic Dark Glass Vignette Overlay: Enhances contrast and gives state-of-the-art depth */}
      <div
        style={{ opacity: overlayOpacity }}
        className="absolute inset-0 bg-black pointer-events-none transition-opacity duration-300"
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.7)_85%)] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-[#0A0A0A]/70 pointer-events-none" />

      {/* Subtle Developer Video Status Pill & Controls */}
      {showControls && (
        <div className="absolute bottom-5 right-5 z-20 pointer-events-auto flex items-center gap-2">
          {/* Hidden File Input for User Custom Videos */}
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/ogg,video/quicktime"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white/80 shadow-lg text-[11px]"
          >
            {/* Loop indicator */}
            <div className="flex items-center gap-1 mr-1">
              <Film className="w-3.5 h-3.5 text-[#FF671F]" />
              <span className="font-medium text-white/90">
                {currentIndex + 1}/{playlist.length}
              </span>
            </div>

            {/* Play/Pause Button */}
            <button
              onClick={togglePlayPause}
              className="p-1 rounded-full hover:bg-white/10 active:scale-95 transition"
              title={isPlaying ? 'Pause background video' : 'Play background video'}
            >
              {isPlaying ? (
                <Pause className="w-3 h-3 text-white/80" />
              ) : (
                <Play className="w-3 h-3 text-white/80" />
              )}
            </button>

            {/* Next Track Button (if > 1 video) */}
            {playlist.length > 1 && (
              <button
                onClick={goToNextVideo}
                className="p-1 rounded-full hover:bg-white/10 active:scale-95 transition"
                title="Next video"
              >
                <SkipForward className="w-3 h-3 text-white/80" />
              </button>
            )}

            {/* Upload Video Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1 pl-1.5 flex items-center gap-1 text-[10px] text-white/70 hover:text-white hover:bg-white/10 rounded-full transition"
              title="Add your custom video files"
            >
              <Plus className="w-3 h-3 text-white/90" />
              <span className="hidden sm:inline">Add Video</span>
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};
