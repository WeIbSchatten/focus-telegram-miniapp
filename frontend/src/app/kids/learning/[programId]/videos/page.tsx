'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { kidsClient } from '@/lib/api/kids-client';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { PageHeader, PAGE_ACTION_BUTTON_CLASS } from '@/components/layout/PageHeader';
import { Loader } from '@/components/common/Loader';
import { Modal } from '@/components/common/Modal';
import { useToast } from '@/hooks/useToast';
import { ROUTES } from '@/lib/constants';
import { useNavigateAfterSuccess } from '@/lib/utils/navigation';
import { useKidsStore } from '@/store/kidsStore';
import type { Program, Lecture } from '@/types/kids';

const VIDEO_SOURCE_LABEL: Record<string, string> = {
  youtube: 'YouTube',
  vk: 'VK Video',
  rutube: 'RuTube',
};

export default function ProgramVideosPage() {
  const params = useParams();
  const router = useRouter();
  const programId = Number(params.programId);
  const { user } = useAuth();
  const { role } = useKidsStore();
  const { show: toast } = useToast();
  const navigateAfterSuccess = useNavigateAfterSuccess(router);
  const [program, setProgram] = useState<Program | null>(null);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const canEdit = role === 'teacher' || user?.roles?.includes('admin') || user?.roles?.includes('moderator');

  useEffect(() => {
    if (!programId || Number.isNaN(programId)) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    Promise.all([
      kidsClient.programs.get(programId),
      kidsClient.lectures.listByProgram(programId),
    ]).then(([p, list]) => {
      if (!cancelled) {
        setProgram(p);
        setLectures(list);
      }
    }).catch(() => {
      if (!cancelled) toast('Ошибка загрузки');
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [programId, toast]);

  const openCreate = () => {
    setEditingId(null);
    setTitle('');
    setVideoUrl('');
    setModalOpen(true);
  };

  const openEdit = (l: Lecture) => {
    setEditingId(l.id);
    setTitle(l.title);
    const type = l.video_type || 'rutube';
    const id = l.video_id || l.rutube_video_id;
    setVideoUrl(
      type === 'youtube' && id
        ? `https://www.youtube.com/watch?v=${id}`
        : type === 'rutube' && id
          ? `https://rutube.ru/video/${id}/`
          : type === 'vk' && id
            ? `https://vk.com/video${id}`
            : ''
    );
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast('Укажите название видео.');
      return;
    }
    if (!videoUrl.trim()) {
      toast('Вставьте ссылку на видео (YouTube, VK Video или RuTube).');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await kidsClient.lectures.update(editingId, { title: title.trim(), video_url: videoUrl.trim() });
        toast('Видео успешно изменено.');
      } else {
        await kidsClient.lectures.create({
          program_id: programId,
          title: title.trim(),
          video_url: videoUrl.trim(),
          order: lectures.length,
        });
        toast('Видео успешно добавлено.');
      }
      setModalOpen(false);
      setEditingId(null);
      setTitle('');
      setVideoUrl('');
      setSaving(false);
      navigateAfterSuccess(ROUTES.kids.learningProgram(programId));
      return;
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { detail?: string | string[] } } }).response?.data?.detail
        : 'Ошибка сохранения';
      toast(Array.isArray(msg) ? msg[0] : String(msg));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить это видео из программы?')) return;
    try {
      await kidsClient.lectures.delete(id);
      toast('Видео удалено.');
      setLectures((prev) => prev.filter((l) => l.id !== id));
    } catch {
      toast('Ошибка удаления');
    }
  };

  if (loading) return <Loader className="min-h-[40vh]" />;
  if (!program) return <p className="text-red-600">Программа не найдена.</p>;

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Видео по программе: ${program.name}`}
        description="Добавляйте ссылки на видео с YouTube, VK Video или RuTube. Ученики увидят их в разделе «Обучение» при открытии программы."
        actions={
          canEdit ? (
            <Button variant="outline" className={PAGE_ACTION_BUTTON_CLASS} onClick={openCreate}>
              Добавить видео
            </Button>
          ) : undefined
        }
      />

      {lectures.length === 0 ? (
        <Card>
          <p className="text-gray-700">
            {canEdit ? 'Пока нет видео. Нажмите «Добавить видео» и вставьте ссылку.' : 'Пока нет видео по этой программе.'}
          </p>
        </Card>
      ) : (
        <ul className="space-y-2">
          {lectures.map((l) => (
            <li key={l.id}>
              <Card className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <Link href={ROUTES.kids.lecture(l.id)} className="font-medium text-primary hover:underline">
                    {l.title}
                  </Link>
                  {l.video_type && (
                    <span className="ml-2 text-sm text-gray-600">
                      ({VIDEO_SOURCE_LABEL[l.video_type] || l.video_type})
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Link href={ROUTES.kids.lecture(l.id)}>
                    <Button variant="ghost" className="text-sm">Смотреть</Button>
                  </Link>
                  {canEdit && (
                    <>
                      <Button variant="outline" className="text-sm" onClick={() => openEdit(l)}>
                        Изменить
                      </Button>
                      <Button variant="ghost" className="text-sm text-red-600 hover:bg-red-50" onClick={() => handleDelete(l.id)}>
                        Удалить
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Link href={ROUTES.kids.learningProgram(programId)} className="inline-block text-primary font-medium hover:underline">
        ← К программе
      </Link>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Изменить видео' : 'Добавить видео'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Название видео"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Например: Урок 1. Глагол to be"
            required
          />
          <Input
            label="Ссылка на видео"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="YouTube, VK Video или RuTube — вставьте полную ссылку"
            required
          />
          <p className="text-xs text-gray-600">
            Поддерживаются ссылки: youtube.com/watch?v=..., youtu.be/..., vk.com/video..., rutube.ru/video/...
          </p>
          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Отмена
            </Button>
            <Button type="submit" variant="kids" loading={saving}>
              {editingId ? 'Сохранить' : 'Добавить'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
