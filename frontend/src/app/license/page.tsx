'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { focusClient } from '@/lib/api/focus-client';
import { Card } from '@/components/common/Card';
import { Loader } from '@/components/common/Loader';
import { ROUTES } from '@/lib/constants';

export default function LicensePage() {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    focusClient.content
      .getLicense()
      .then((r) => setContent(r.content))
      .catch(() => setContent(''))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader className="min-h-[40vh]" />;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      <h1 className="text-heading text-primary">Лицензионное соглашение</h1>
      <Card className="mt-6">
        {content ? (
          <div className="prose prose-primary max-w-none whitespace-pre-wrap text-gray-800">
            {content}
          </div>
        ) : (
          <p className="text-gray-600">Текст лицензионного соглашения пока не добавлен.</p>
        )}
      </Card>
      <Link href={ROUTES.home} className="mt-6 inline-block text-primary font-medium hover:underline">
        ← На главную
      </Link>
    </div>
  );
}
