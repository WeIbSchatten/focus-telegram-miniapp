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
      <div className={`rounded-2xl border-2 border-sense/20 bg-gradient-to-br from-sense/10 to-sense/5 p-5 ${className}`}>
        <p className="text-sm font-semibold text-sense">{title}</p>
        <div className="mt-3 flex items-center gap-3">
          <div className="h-12 w-12 animate-pulse rounded-full bg-sense/20" />
          <div className="flex-1 space-y-2">
            <div className="h-2 w-full animate-pulse rounded-full bg-sense/20" />
            <p className="text-xs text-sense/70">Загрузка…</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !src) {
    return (
      <div className={`rounded-2xl border-2 border-amber-200 bg-amber-50/80 p-5 ${className}`}>
        <p className="text-sm font-semibold text-amber-800">{title}</p>
        <p className="mt-1 text-sm text-amber-700">{error ?? 'Аудио недоступно'}</p>
      </div>
    );
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-sense/25 bg-white shadow-[0 4px 24px rgba(61,90,115,0.12), 0 1px 3px rgba(61,90,115,0.08)] ${className}`}
      onContextMenu={handleWrapperContextMenu}
    >
      {/* Скрытый audio без нативного UI; скачивание отключено */}
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        controlsList="nodownload noplaybackrate"
        className="hidden"
      />

      <div className="bg-gradient-to-br from-sense/6 via-white to-sense/8 p-6">
        <p className="mb-4 text-lg font-semibold tracking-tight text-sense-dark">{title}</p>

        <div className="flex items-center gap-5">
          {/* Кнопка Play/Pause */}
          <button
            type="button"
            onClick={togglePlay}
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sense to-sense-dark text-white shadow-[0 6px 20px rgba(61,90,115,0.35)] transition hover:scale-105 hover:shadow-[0 8px 24px rgba(61,90,115,0.4)] focus:outline-none focus:ring-2 focus:ring-sense focus:ring-offset-2 active:scale-100"
            aria-label={isPlaying ? 'Пауза' : 'Воспроизвести'}
          >
            {isPlaying ? (
              <svg className="h-7 w-7" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                <rect x="6" y="4" width="4" height="16" rx="1.5" />
                <rect x="14" y="4" width="4" height="16" rx="1.5" />
              </svg>
            ) : (
              <svg className="ml-1 h-8 w-8" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path d="M8 5v14l11-7L8 5z" />
              </svg>
            )}
          </button>

          <div className="min-w-0 flex-1 space-y-2">
            {/* Прогресс-бар */}
            <div className="relative h-3 w-full rounded-full bg-sense/15">
              <div
                className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-sense to-sense-light transition-[width] duration-100 ease-out"
                style={{ width: `${progress}%` }}
              />
              <input
                type="range"
                min={0}
                max={duration || 0.01}
                value={currentTime}
                onChange={handleSeek}
                className="range-sense range-sense-thick absolute inset-0 h-full w-full cursor-pointer bg-transparent"
              />
            </div>
            <div className="flex justify-between text-sm font-medium tabular-nums text-sense/90">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
