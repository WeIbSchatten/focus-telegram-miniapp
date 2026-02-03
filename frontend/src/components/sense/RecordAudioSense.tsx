'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/common/Button';

interface RecordAudioSenseProps {
  onRecorded: (blob: Blob, suggestedName: string) => void;
  onCancel?: () => void;
  disabled?: boolean;
  /** Подпись для кнопки записи (например "Записать медитацию") */
  recordLabel?: string;
}

export function RecordAudioSense({
  onRecorded,
  onCancel,
  disabled,
  recordLabel = 'Записать',
}: RecordAudioSenseProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [durationSec, setDurationSec] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRecording = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/mp4';
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      setRecordedBlob(null);
      setDurationSec(0);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        if (chunksRef.current.length > 0) {
          const blob = new Blob(chunksRef.current, { type: mimeType });
          setRecordedBlob(blob);
        }
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };

      recorder.start(1000);
      setIsRecording(true);
      const start = Date.now();
      timerRef.current = setInterval(() => {
        setDurationSec(Math.floor((Date.now() - start) / 1000));
      }, 1000);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const stopRecording = useCallback(() => {
    const rec = mediaRecorderRef.current;
    if (rec && rec.state !== 'inactive') {
      rec.stop();
    }
    setIsRecording(false);
  }, []);

  const handleUseRecording = useCallback(() => {
    if (recordedBlob) {
      const ext = recordedBlob.type.includes('webm') ? 'webm' : 'mp4';
      const name = `recording-${Date.now()}.${ext}`;
      onRecorded(recordedBlob, name);
    }
  }, [recordedBlob, onRecorded]);

  const handleCancel = useCallback(() => {
    setRecordedBlob(null);
    setDurationSec(0);
    onCancel?.();
  }, [onCancel]);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  useEffect(() => {
    if (recordedBlob) {
      const url = URL.createObjectURL(recordedBlob);
      setPreviewUrl(url);
      return () => {
        URL.revokeObjectURL(url);
        setPreviewUrl(null);
      };
    } else {
      setPreviewUrl(null);
    }
  }, [recordedBlob]);

  return (
    <div className="rounded-xl border-2 border-sense/30 bg-sense/5 p-4">
      {!recordedBlob ? (
        <>
          <p className="mb-3 text-sm font-medium text-sense">
            {isRecording ? `Идёт запись… ${durationSec} с` : 'Запись с микрофона'}
          </p>
          <div className="flex flex-wrap gap-2">
            {!isRecording ? (
              <Button
                variant="sense"
                onClick={startRecording}
                disabled={disabled || typeof navigator?.mediaDevices?.getUserMedia !== 'function'}
              >
                {recordLabel}
              </Button>
            ) : (
              <Button variant="outline" onClick={stopRecording} className="border-sense text-sense hover:bg-sense/10 focus-visible:ring-sense/60">
                Остановить
              </Button>
            )}
            {onCancel && (
              <Button variant="ghost" onClick={handleCancel} className="text-gray-700 hover:bg-gray-100">
                Отмена
              </Button>
            )}
          </div>
          {typeof navigator !== 'undefined' && typeof navigator?.mediaDevices?.getUserMedia !== 'function' && (
            <p className="mt-2 text-xs text-amber-600">
              Микрофон недоступен (нужен HTTPS или localhost).
            </p>
          )}
        </>
      ) : (
        <>
          <p className="mb-2 text-sm font-medium text-sense">
            Запись готова ({(recordedBlob.size / 1024).toFixed(1)} КБ)
          </p>
          {previewUrl && <audio controls className="mb-3 w-full max-w-md rounded-lg" src={previewUrl} />}
          <div className="flex flex-wrap gap-2">
            <Button variant="sense" onClick={handleUseRecording} disabled={disabled}>
              Использовать запись
            </Button>
            <Button variant="ghost" onClick={() => { setRecordedBlob(null); setDurationSec(0); }} className="text-gray-700 hover:bg-gray-100">
              Записать заново
            </Button>
            {onCancel && <Button variant="ghost" onClick={handleCancel} className="text-gray-700 hover:bg-gray-100">Отмена</Button>}
          </div>
        </>
      )}
    </div>
  );
}
