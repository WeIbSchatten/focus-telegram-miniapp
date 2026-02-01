'use client';

import { useEffect, useState } from 'react';
import { kidsClient } from '@/lib/api/kids-client';
import { Card } from '@/components/common/Card';
import { Loader } from '@/components/common/Loader';
import { Button } from '@/components/common/Button';

interface LecturePlayerProps {
  lectureId: number;
  title: string;
  description?: string | null;
}

interface EmbedData {
  embed_url: string | null;
  embed_html: string | null;
  video_id: string | null;
  video_type?: string;
  watch_url: string | null;
}

export function LecturePlayer({ lectureId, title, description }: LecturePlayerProps) {
  const [embed, setEmbed] = useState<EmbedData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    kidsClient.lectures.getEmbed(lectureId).then((data) => {
      if (!cancelled) setEmbed(data as EmbedData);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [lectureId]);

  if (loading) return <Loader />;
  if (!embed) return null;

  const hasEmbed = (embed.video_id && embed.embed_html) || embed.embed_url;
  const watchUrl = embed.watch_url;

  const videoWrapperClass = 'mt-4 relative w-full overflow-hidden rounded-lg bg-black [&_iframe]:absolute [&_iframe]:inset-0 [&_iframe]:h-full [&_iframe]:w-full';

  return (
    <Card className="overflow-hidden">
      <h2 className="text-xl font-bold text-primary">{title}</h2>
      {description && <p className="mt-2 text-gray-700">{description}</p>}
      {embed.video_id && embed.embed_html ? (
        <div
          className={`${videoWrapperClass} aspect-video`}
          dangerouslySetInnerHTML={{ __html: embed.embed_html }}
        />
      ) : embed.embed_url ? (
        <div className={`${videoWrapperClass} aspect-video`}>
          <iframe
            src={embed.embed_url}
            title={title}
            allowFullScreen
            allow="fullscreen"
            className="absolute inset-0 h-full w-full border-0"
          />
        </div>
      ) : watchUrl ? (
        <div className="mt-4">
          <p className="mb-2 text-gray-600">Видео доступно по ссылке:</p>
          <a href={watchUrl} target="_blank" rel="noopener noreferrer" className="inline-block">
            <Button variant="kids">Открыть видео</Button>
          </a>
        </div>
      ) : (
        <p className="mt-4 text-gray-600">Видео не прикреплено.</p>
      )}
      {hasEmbed && watchUrl && (
        <p className="mt-2">
          <a href={watchUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
            Открыть в новой вкладке
          </a>
        </p>
      )}
    </Card>
  );
}
