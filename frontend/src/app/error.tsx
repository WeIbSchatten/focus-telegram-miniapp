'use client';

import { useEffect } from 'react';
import { Button } from '@/components/common/Button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4">
      <h2 className="text-heading text-primary">Что-то пошло не так</h2>
      <p className="mt-2 text-gray-700">{error.message || 'Ошибка при загрузке'}</p>
      <Button onClick={reset} className="mt-6">
        Попробовать снова
      </Button>
    </div>
  );
}
