'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { focusClient } from '@/lib/api/focus-client';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Loader } from '@/components/common/Loader';
import { useToast } from '@/hooks/useToast';
import { ROUTES } from '@/lib/constants';
import { useNavigateAfterSuccess } from '@/lib/utils/navigation';

export default function AdminLicensePage() {
  const { user } = useAuth();
  const router = useRouter();
  const { show: toast } = useToast();
  const navigateAfterSuccess = useNavigateAfterSuccess(router);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.roles?.includes('admin') && !user?.roles?.includes('moderator')) {
      router.push(ROUTES.kids.root);
      return;
    }
    let cancelled = false;
    focusClient.content
      .getLicense()
      .then((r) => {
        if (!cancelled) setContent(r.content);
      })
      .catch(() => toast('Не удалось загрузить текст'))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.roles, router, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await focusClient.content.updateLicense(content);
      toast('Лицензионное соглашение сохранено.');
      navigateAfterSuccess(ROUTES.license);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Ошибка сохранения';
      toast(Array.isArray(msg) ? msg[0] : String(msg));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader className="min-h-[40vh]" />;

  return (
    <div className="space-y-6">
      <h1 className="text-heading text-primary">Редактирование лицензионного соглашения</h1>
      <p className="text-gray-700">
        Текст отображается на странице «Лицензионное соглашение», ссылка на которую есть в подвале сайта.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <label className="mb-2 block text-sm font-medium text-gray-800">Текст лицензионного соглашения</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[300px] w-full rounded-lg border-2 border-primary/30 px-3 py-2 focus:border-primary focus:outline-none"
            placeholder="Введите текст лицензионного соглашения..."
            rows={15}
          />
        </Card>
        <div className="flex flex-wrap gap-4">
          <Button type="submit" variant="kids" loading={saving}>
            Сохранить
          </Button>
          <Link href={ROUTES.license}>
            <Button type="button" variant="outline">
              Посмотреть на сайте
            </Button>
          </Link>
          <Link href={ROUTES.admin.users}>
            <Button type="button" variant="ghost">
              К управлению
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
