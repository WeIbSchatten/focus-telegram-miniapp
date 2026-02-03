'use client';

import { useEffect, useState } from 'react';
import { senseClient } from '@/lib/api/sense-client';
import { Card } from '@/components/common/Card';
import { AudioPlayerSense } from '@/components/sense/AudioPlayerSense';
import { Loader } from '@/components/common/Loader';
import type { Affirmation } from '@/types/sense';

export default function SenseAffirmationsPage() {
  const [items, setItems] = useState<Affirmation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    senseClient.affirmations
      .list()
      .then((list) => {
        if (!cancelled) setItems(list);
      })
      .catch((e) => {
        if (!cancelled) setError(e?.response?.data?.detail || 'Ошибка загрузки');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <Loader className="min-h-[40vh]" />;

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-amber-800">
          {error}
        </div>
      )}
      <section>
        <h1 className="text-heading text-sense">Аффирмации на ходу</h1>
        <p className="mt-2 text-gray-700">
          Короткие аудиоаффирмации для прослушивания в течение дня.
        </p>
      </section>

      {items.length === 0 ? (
        <Card variant="sense">
          <p className="text-gray-600">Пока нет аффирмаций. Они появятся после загрузки модератором.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((a) => (
            <AudioPlayerSense
              key={a.id}
              audioPath={`affirmations/${a.id}/audio`}
              title={a.title}
            />
          ))}
        </div>
      )}
    </div>
  );
}
