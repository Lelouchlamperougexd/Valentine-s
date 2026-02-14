"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface Track {
  id: number;
  title: string;
  artist: string;
  file: string;
  cover: string;
}

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const tracks: Track[] = [
  {
    id: 1,
    title: "Magnetic",
    artist: "ILLIT",
    file: `${basePath}/music/ILLIT (아일릿) Magnetic Official MV.mp3`,
    cover: "/music/covers/magnetic.jpg",
  },
  {
    id: 2,
    title: "John Wayne",
    artist: "Cigarettes After Sex",
    file: `${basePath}/music/John Wayne - Cigarettes After Sex.mp3`,
    cover: "/music/covers/john.jpg",
  },
  {
    id: 3,
    title: "Love Shot",
    artist: "EXO",
    file: `${basePath}/music/Love Shot.mp3`,
    cover: "/music/covers/loveshot.jpg",
  },
  {
    id: 4,
    title: "Please, Please, Please Let Me Get What I Want",
    artist: "The Smiths",
    file: `${basePath}/music/The Smiths - Please, Please, Please Let Me Get What I Want (Official Lyric Video).mp3`,
    cover: "/music/covers/please.jpg",
  },
  {
    id: 5,
    title: "Lovers Rock",
    artist: "TV Girl",
    file: `${basePath}/music/TV Girl - Lovers Rock.mp3`,
    cover: "/music/covers/lovers-rock.jpg",
  },
  {
    id: 6,
    title: "ULTRA",
    artist: "Changbin (Stray Kids)",
    file: `${basePath}/music/Changbin ULTRA  [Stray Kids _ SKZ-PLAYER].mp3`,
    cover: "/music/covers/ultra.jpg",
  },
];

export default function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentTrack = tracks[currentTrackIndex];

  useEffect(() => {
    const file = currentTrack.file;
    audioRef.current = new Audio(file);
    audioRef.current.volume = volume;

    const handleTimeUpdate = () => {
      if (audioRef.current) {
        const prog = (audioRef.current.currentTime / audioRef.current.duration) * 100;
        setProgress(isNaN(prog) ? 0 : prog);
      }
    };

    const handleEnded = () => {
      // Auto-play next track
      setCurrentTrackIndex((prev) => (prev + 1) % tracks.length);
    };

    audioRef.current.addEventListener("timeupdate", handleTimeUpdate);
    audioRef.current.addEventListener("ended", handleEnded);

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener("timeupdate", handleTimeUpdate);
        audioRef.current.removeEventListener("ended", handleEnded);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrackIndex]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrackIndex]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const changeTrack = (index: number) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setCurrentTrackIndex(index);
    setIsPlaying(true);
  };

  const nextTrack = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setCurrentTrackIndex((prev) => (prev + 1) % tracks.length);
    if (isPlaying) {
      setTimeout(() => {
        audioRef.current?.play().catch(() => {});
      }, 100);
    }
  };

  const prevTrack = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setCurrentTrackIndex((prev) => (prev - 1 + tracks.length) % tracks.length);
    if (isPlaying) {
      setTimeout(() => {
        audioRef.current?.play().catch(() => {});
      }, 100);
    }
  };

  const [showPlaylist, setShowPlaylist] = useState(false);
  const [showVolume, setShowVolume] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Update volume when changed
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      audioRef.current.currentTime = percent * audioRef.current.duration;
    }
  };

  return (
    <>
      {/* Main Player Bar */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-4 right-4 z-50 w-[320px] bg-black rounded-[28px] p-4 shadow-2xl"
      >
        {/* Album Cover & Track Info */}
        {expanded ? (
          <div className="mb-3">
            <div 
              className="relative w-full aspect-square rounded-xl overflow-hidden bg-gray-800 cursor-pointer mb-3"
              onClick={() => setExpanded(false)}
            >
              <Image
                src={currentTrack.cover}
                alt={currentTrack.title}
                fill
                className="object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
            <div className="text-center">
              <p className="text-white font-medium text-base">{currentTrack.title}</p>
              <p className="text-gray-400 text-sm">{currentTrack.artist}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 mb-3">
            <div 
              className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0 cursor-pointer hover:scale-105 transition-transform"
              onClick={() => setExpanded(true)}
            >
              <Image
                src={currentTrack.cover}
                alt={currentTrack.title}
                fill
                className="object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate text-sm">{currentTrack.title}</p>
              <p className="text-gray-400 text-xs truncate">{currentTrack.artist}</p>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        <div 
          className="relative h-1 bg-gray-700 rounded-full mb-4 cursor-pointer group"
          onClick={handleSeek}
        >
          <div
            className="h-full bg-white rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
          {/* Progress Knob */}
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md transition-opacity"
            style={{ left: `calc(${progress}% - 6px)` }}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          {/* Menu/Playlist Button */}
          <button
            onClick={() => setShowPlaylist(!showPlaylist)}
            className="text-white hover:text-gray-300 transition-colors p-2"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z"/>
            </svg>
          </button>

          {/* Previous Track */}
          <button
            onClick={prevTrack}
            className="text-white hover:text-gray-300 transition-colors p-2"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 6h2v12H6V6zm3.5 6l8.5 6V6l-8.5 6z"/>
            </svg>
          </button>

          {/* Play/Pause Button */}
          <button
            onClick={togglePlay}
            className="w-14 h-14 rounded-full bg-white flex items-center justify-center hover:scale-105 transition-transform"
          >
            {isPlaying ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="black">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="black">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </button>

          {/* Next Track */}
          <button
            onClick={nextTrack}
            className="text-white hover:text-gray-300 transition-colors p-2"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 18l8.5-6L6 6v12zm10-12h2v12h-2V6z"/>
            </svg>
          </button>

          {/* Volume Button */}
          <button
            onClick={() => setShowVolume(!showVolume)}
            className="text-white hover:text-gray-300 transition-colors p-2"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              {volume === 0 ? (
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
              ) : volume < 0.5 ? (
                <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/>
              ) : (
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              )}
            </svg>
          </button>
        </div>

        {/* Volume Slider */}
        {showVolume && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-800">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white" className="flex-shrink-0">
              <path d="M5 9v6h4l5 5V4L9 9H5z"/>
            </svg>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-white"
            />
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white" className="flex-shrink-0">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
          </div>
        )}
      </motion.div>

      {/* Playlist Panel */}
      <AnimatePresence>
        {showPlaylist && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-28 right-4 z-50 w-[320px] bg-black/95 backdrop-blur-lg rounded-2xl p-4 shadow-2xl max-h-80 overflow-y-auto"
          >
            {/* Current Track Info */}
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-800">
              <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
                <Image
                  src={currentTrack.cover}
                  alt={currentTrack.title}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate text-sm">{currentTrack.title}</p>
                <p className="text-gray-400 text-xs truncate">{currentTrack.artist}</p>
              </div>
            </div>

            {/* Track List */}
            <div className="space-y-1">
              {tracks.map((track, index) => (
                <button
                  key={track.id}
                  onClick={() => changeTrack(index)}
                  className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                    index === currentTrackIndex
                      ? "bg-white/10"
                      : "hover:bg-white/5"
                  }`}
                >
                  <div className="relative w-10 h-10 rounded overflow-hidden bg-gray-800 flex-shrink-0">
                    <Image
                      src={track.cover}
                      alt={track.title}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-white text-sm truncate">{track.title}</p>
                    <p className="text-gray-500 text-xs truncate">{track.artist}</p>
                  </div>
                  {index === currentTrackIndex && isPlaying && (
                    <div className="flex gap-0.5">
                      <span className="w-0.5 h-3 bg-white rounded-full animate-pulse" />
                      <span className="w-0.5 h-3 bg-white rounded-full animate-pulse delay-75" />
                      <span className="w-0.5 h-3 bg-white rounded-full animate-pulse delay-150" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
