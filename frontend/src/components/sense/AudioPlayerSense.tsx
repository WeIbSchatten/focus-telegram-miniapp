'use client';

import { useEffect, useState, useRef } from 'react';
import { senseApi } from '@/lib/api/axios';

interface AudioPlayerSenseProps {
  /** Путь к аудио, например /meditations/1/audio или /affirmations/2/audio */
  audioPath: string;
  title: string;
  className?: string;
}

export function AudioPlayerSense({ audioPath, title, className = '' }: AudioPlayerSenseProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  if (loading) {
    return (
      <div className={`rounded-xl border-2 border-sense/20 bg-sense/5 p-4 ${className}`}>
        <p className="text-sm font-medium text-sense">{title}</p>
        <p className="mt-1 text-sm text-gray-500">Загрузка…</p>
      </div>
    );
  }
  if (error || !src) {
    return (
      <div className={`rounded-xl border-2 border-amber-200 bg-amber-50 p-4 ${className}`}>
        <p className="text-sm font-medium text-amber-800">{title}</p>
        <p className="mt-1 text-sm text-amber-700">{error ?? 'Аудио недоступно'}</p>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border-2 border-sense/30 bg-white p-4 shadow-[var(--shadow-sense)] ${className}`}>
      <p className="mb-2 text-sm font-medium text-sense">{title}</p>
      <audio controls className="w-full max-w-md rounded-lg" src={src} preload="metadata">
        Ваш браузер не поддерживает аудио.
      </audio>
    </div>
  );
}
