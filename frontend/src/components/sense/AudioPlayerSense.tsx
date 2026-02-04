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

export function AudioPlayerSense({ audioPath, title, className = '' }: AudioPlayerSenseProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
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
  }, [src]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = value;
      setCurrentTime(value);
    }
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
      className={`flex w-full max-w-sm flex-col gap-2.5 rounded-xl border border-sense/20 bg-white px-4 py-3 shadow-[0 2px 12px rgba(61,90,115,0.1)] ${className}`}
      onContextMenu={handleWrapperContextMenu}
    >
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        controlsList="nodownload noplaybackrate"
        className="hidden"
      />

      {/* Верхняя строка: кнопка + название */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={togglePlay}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sense text-white transition hover:bg-sense-dark focus:outline-none focus:ring-2 focus:ring-sense focus:ring-offset-2 active:scale-95"
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
        <p className="min-w-0 flex-1 truncate text-sm font-medium text-sense-dark">{title}</p>
      </div>

      {/* Прогресс и время в одну строку */}
      <div className="flex items-center gap-3">
        <span className="w-8 shrink-0 text-right text-xs tabular-nums text-sense/80">
          {formatTime(currentTime)}
        </span>
        <div className="relative h-1.5 min-w-0 flex-1 rounded-full bg-sense/15">
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-sense transition-[width] duration-75"
            style={{ width: `${progress}%` }}
          />
          <input
            type="range"
            min={0}
            max={duration || 0.01}
            value={currentTime}
            onChange={handleSeek}
            className="range-sense range-sense-slim absolute inset-0 h-full w-full cursor-pointer bg-transparent"
          />
        </div>
        <span className="w-8 shrink-0 text-xs tabular-nums text-sense/80">{formatTime(duration)}</span>
      </div>
    </div>
  );
}
