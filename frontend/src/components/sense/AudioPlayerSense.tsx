'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { senseApi } from '@/lib/api/axios';

interface AudioPlayerSenseProps {
  /** Путь к аудио, например /meditations/1/audio или /affirmations/2/audio */
  audioPath: string;
  title: string;
  className?: string;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Иконка громкости: полная / средняя / выключена */
function VolumeIcon({ volume }: { volume: number }) {
  if (volume === 0) {
    return (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
      </svg>
    );
  }
  if (volume < 0.5) {
    return (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path d="M7 9v6h4l5 5V4l-5 5H7z" />
      </svg>
    );
  }
  return (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
    </svg>
  );
}

export function AudioPlayerSense({ audioPath, title, className = '' }: AudioPlayerSenseProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    senseApi
      .get(audioPath, { responseType: 'blob' })
      .then((res) => {
        if (cancelled) return;
        const blob = res.data as Blob;
        const url = URL.createObjectURL(blob);
        objectUrlRef.current = url;
        setSrc(url);
      })
      .catch((e) => {
        if (!cancelled) setError(e?.response?.data?.detail || 'Не удалось загрузить аудио');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      setSrc(null);
    };
  }, [audioPath]);

  const audio = audioRef.current;

  const togglePlay = useCallback(() => {
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  }, [audio, isPlaying]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el || !src) return;

    el.volume = volume;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = () => setCurrentTime(el.currentTime);
    const onLoadedMetadata = () => setDuration(el.duration);
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    el.addEventListener('timeupdate', onTimeUpdate);
    el.addEventListener('loadedmetadata', onLoadedMetadata);
    el.addEventListener('ended', onEnded);
    return () => {
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('timeupdate', onTimeUpdate);
      el.removeEventListener('loadedmetadata', onLoadedMetadata);
      el.removeEventListener('ended', onEnded);
    };
  }, [src, volume]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = value;
      setCurrentTime(value);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  };

  const handleWrapperContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  if (loading) {
    return (
      <div className={`flex w-full max-w-sm items-center gap-3 rounded-xl border border-sense/20 bg-white/80 px-4 py-3 shadow-sm ${className}`}>
        <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-sense/20" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="truncate text-sm font-medium text-sense">{title}</p>
          <div className="h-1.5 w-full animate-pulse rounded-full bg-sense/15" />
        </div>
      </div>
    );
  }

  if (error || !src) {
    return (
      <div className={`w-full max-w-sm rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 ${className}`}>
        <p className="truncate text-sm font-medium text-amber-800">{title}</p>
        <p className="mt-0.5 text-xs text-amber-700">{error ?? 'Аудио недоступно'}</p>
      </div>
    );
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className={`group relative w-full max-w-sm overflow-hidden rounded-2xl border border-sense/25 bg-gradient-to-br from-white via-sense/[0.06] to-sense/10 shadow-[0 4px 20px rgba(61,90,115,0.12), 0 1px 3px rgba(0,0,0,0.06)] ${className}`}
      onContextMenu={handleWrapperContextMenu}
    >
      {/* Акцентная полоска слева в стиле Spotify */}
      <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-sense via-sense-light to-sense-dark" />

      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        controlsList="nodownload noplaybackrate"
        className="hidden"
      />

      <div className="flex gap-4 pl-4 pr-4 py-4">
        {/* Обложка (как в Spotify) */}
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-sense-dark to-sense shadow-inner">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex gap-0.5 items-end justify-center h-6">
              {[0.4, 0.7, 1, 0.6, 0.9].map((h, i) => (
                <div
                  key={i}
                  className="w-0.5 rounded-full bg-white/90 transition-all duration-300"
                  style={{
                    height: `${h * 100}%`,
                    animation: isPlaying ? `sense-wave 0.8s ease-in-out ${i * 0.1}s infinite alternate` : 'none',
                  }}
                />
              ))}
            </div>
          </div>
          <div className="absolute inset-0 bg-black/10" />
        </div>

        <div className="min-w-0 flex-1 flex flex-col gap-3">
          {/* Верхняя строка: кнопка Play + название */}
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={togglePlay}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sense text-white shadow-md transition hover:scale-105 hover:bg-sense-dark hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-sense focus:ring-offset-2 active:scale-95"
              aria-label={isPlaying ? 'Пауза' : 'Воспроизвести'}
            >
              {isPlaying ? (
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <rect x="6" y="5" width="3" height="14" rx="1" />
                  <rect x="15" y="5" width="3" height="14" rx="1" />
                </svg>
              ) : (
                <svg className="ml-0.5 h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M8 5v14l11-7L8 5z" />
                </svg>
              )}
            </button>
            <p className="min-w-0 flex-1 truncate text-sm font-semibold text-sense-dark">{title}</p>
          </div>

          {/* Прогресс и время: ползунок привязан к progress%, без обводки */}
          <div className="flex items-center gap-2">
            <span className="w-7 shrink-0 text-right text-[11px] font-medium tabular-nums text-sense/70">
              {formatTime(currentTime)}
            </span>
            <div className="relative h-1.5 min-w-0 flex-1 rounded-full bg-sense/20">
              <div
                className="absolute left-0 top-0 h-full rounded-full bg-sense transition-[width] duration-75"
                style={{ width: `${progress}%` }}
              />
              {/* Кастомный ползунок по progress — всегда совпадает с заливкой */}
              <div
                className="pointer-events-none absolute left-0 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sense shadow-[0_1px_3px_rgba(61,90,115,0.4)] transition-[left] duration-75"
                style={{ left: `${progress}%` }}
              />
              <input
                type="range"
                min={0}
                max={duration || 0.01}
                value={currentTime}
                onChange={handleSeek}
                className="range-sense range-sense-slim range-sense-hide-thumb absolute inset-0 h-full w-full cursor-pointer bg-transparent border-0 outline-none"
              />
            </div>
            <span className="w-7 shrink-0 text-[11px] font-medium tabular-nums text-sense/70">{formatTime(duration)}</span>
          </div>

          {/* Громкость: короткая полоска */}
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center text-sense/80" aria-hidden>
              <VolumeIcon volume={volume} />
            </span>
            <div className="relative h-1 w-20 shrink-0 rounded-full bg-sense/15">
              <div
                className="absolute left-0 top-0 h-full rounded-full bg-sense/60 transition-[width] duration-75"
                style={{ width: `${volume * 100}%` }}
              />
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={handleVolumeChange}
                className="range-sense range-sense-slim range-sense-hide-thumb absolute inset-0 h-full w-full cursor-pointer bg-transparent border-0 outline-none"
                aria-label="Громкость"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
