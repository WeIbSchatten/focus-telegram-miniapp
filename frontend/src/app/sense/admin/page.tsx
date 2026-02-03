'use client';

import { useEffect, useState, useRef } from 'react';
import { senseClient } from '@/lib/api/sense-client';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Loader } from '@/components/common/Loader';
import { RecordAudioSense } from '@/components/sense/RecordAudioSense';
import { useToast } from '@/hooks/useToast';
import type { Meditation, Affirmation, WeeklyIntention, DailyQuestion } from '@/types/sense';

type AddMode = 'upload' | 'record';

type SenseAdminTab = 'meditations' | 'affirmations' | 'weekly' | 'daily';

export default function SenseAdminPage() {
  const { show: toast } = useToast();
  const [activeTab, setActiveTab] = useState<SenseAdminTab>('meditations');
  const [meditations, setMeditations] = useState<Meditation[]>([]);
  const [affirmations, setAffirmations] = useState<Affirmation[]>([]);
  const [weeklyIntentions, setWeeklyIntentions] = useState<WeeklyIntention[]>([]);
  const [dailyQuestions, setDailyQuestions] = useState<DailyQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [weeklyText, setWeeklyText] = useState('');
  const [dailyText, setDailyText] = useState('');
  const [meditationAddMode, setMeditationAddMode] = useState<AddMode>('upload');
  const [affirmationAddMode, setAffirmationAddMode] = useState<AddMode>('upload');
  const [editingMeditationId, setEditingMeditationId] = useState<number | null>(null);
  const [editingMeditationTitle, setEditingMeditationTitle] = useState('');
  const [editingAffirmationId, setEditingAffirmationId] = useState<number | null>(null);
  const [editingAffirmationTitle, setEditingAffirmationTitle] = useState('');
  const meditationTitleRef = useRef<HTMLInputElement>(null);
  const meditationFileRef = useRef<HTMLInputElement>(null);
  const affirmationTitleRef = useRef<HTMLInputElement>(null);
  const affirmationFileRef = useRef<HTMLInputElement>(null);

  const load = () => {
    setLoading(true);
    Promise.all([
      senseClient.meditations.list(),
      senseClient.affirmations.list(),
      senseClient.content.listWeeklyIntentions(),
      senseClient.content.listDailyQuestions(),
    ])
      .then(([m, a, w, d]) => {
        setMeditations(m);
        setAffirmations(a);
        setWeeklyIntentions(w);
        setDailyQuestions(d);
        setWeeklyText(w.map((x) => x.text).join(', '));
        setDailyText(d.map((x) => x.text).join(', '));
      })
      .catch((e) => toast(e?.response?.data?.detail || 'Ошибка загрузки'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleUploadMeditation = async () => {
    const title = meditationTitleRef.current?.value?.trim() || 'Медитация';
    const file = meditationFileRef.current?.files?.[0];
    if (!file) {
      toast('Выберите файл (mp3 или m4a, до 5 МБ)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast('Размер файла не должен превышать 5 МБ');
      return;
    }
    setSaving(true);
    const form = new FormData();
    form.append('title', title);
    form.append('file', file);
    senseClient.meditations
      .create(form)
      .then(() => {
        toast('Медитация добавлена');
        meditationTitleRef.current && (meditationTitleRef.current.value = '');
        meditationFileRef.current && (meditationFileRef.current.value = '');
        load();
      })
      .catch((e) => toast(e?.response?.data?.detail || 'Ошибка загрузки'))
      .finally(() => setSaving(false));
  };

  const handleUploadAffirmation = async () => {
    const title = affirmationTitleRef.current?.value?.trim() || 'Аффирмация';
    const file = affirmationFileRef.current?.files?.[0];
    if (!file) {
      toast('Выберите файл (mp3 или m4a, до 5 МБ)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast('Размер файла не должен превышать 5 МБ');
      return;
    }
    setSaving(true);
    const form = new FormData();
    form.append('title', title);
    form.append('file', file);
    senseClient.affirmations
      .create(form)
      .then(() => {
        toast('Аффирмация добавлена');
        affirmationTitleRef.current && (affirmationTitleRef.current.value = '');
        affirmationFileRef.current && (affirmationFileRef.current.value = '');
        load();
      })
      .catch((e) => toast(e?.response?.data?.detail || 'Ошибка загрузки'))
      .finally(() => setSaving(false));
  };

  const handleRecordedMeditation = (blob: Blob, suggestedName: string) => {
    const title = meditationTitleRef.current?.value?.trim() || 'Медитация';
    if (blob.size > 5 * 1024 * 1024) {
      toast('Размер записи не должен превышать 5 МБ');
      return;
    }
    setSaving(true);
    const file = new File([blob], suggestedName, { type: blob.type });
    const form = new FormData();
    form.append('title', title);
    form.append('file', file);
    senseClient.meditations
      .create(form)
      .then(() => {
        toast('Медитация добавлена');
        meditationTitleRef.current && (meditationTitleRef.current.value = '');
        setMeditationAddMode('upload');
        load();
      })
      .catch((e) => toast(e?.response?.data?.detail || 'Ошибка загрузки'))
      .finally(() => setSaving(false));
  };

  const handleRecordedAffirmation = (blob: Blob, suggestedName: string) => {
    const title = affirmationTitleRef.current?.value?.trim() || 'Аффирмация';
    if (blob.size > 5 * 1024 * 1024) {
      toast('Размер записи не должен превышать 5 МБ');
      return;
    }
    setSaving(true);
    const file = new File([blob], suggestedName, { type: blob.type });
    const form = new FormData();
    form.append('title', title);
    form.append('file', file);
    senseClient.affirmations
      .create(form)
      .then(() => {
        toast('Аффирмация добавлена');
        affirmationTitleRef.current && (affirmationTitleRef.current.value = '');
        setAffirmationAddMode('upload');
        load();
      })
      .catch((e) => toast(e?.response?.data?.detail || 'Ошибка загрузки'))
      .finally(() => setSaving(false));
  };

  const handleDeleteMeditation = (id: number) => {
    if (!confirm('Удалить медитацию?')) return;
    senseClient.meditations
      .delete(id)
      .then(() => {
        toast('Медитация удалена');
        load();
      })
      .catch((e) => toast(e?.response?.data?.detail || 'Ошибка'));
  };

  const handleDeleteAffirmation = (id: number) => {
    if (!confirm('Удалить аффирмацию?')) return;
    senseClient.affirmations
      .delete(id)
      .then(() => {
        toast('Аффирмация удалена');
        load();
      })
      .catch((e) => toast(e?.response?.data?.detail || 'Ошибка'));
  };

  const handleStartEditMeditation = (m: Meditation) => {
    setEditingMeditationId(m.id);
    setEditingMeditationTitle(m.title);
  };
  const handleSaveEditMeditation = () => {
    if (editingMeditationId == null) return;
    const title = editingMeditationTitle.trim() || 'Медитация';
    setSaving(true);
    senseClient.meditations
      .update(editingMeditationId, { title })
      .then(() => {
        toast('Название сохранено');
        setEditingMeditationId(null);
        setEditingMeditationTitle('');
        load();
      })
      .catch((e) => toast(e?.response?.data?.detail || 'Ошибка'))
      .finally(() => setSaving(false));
  };
  const handleCancelEditMeditation = () => {
    setEditingMeditationId(null);
    setEditingMeditationTitle('');
  };

  const handleStartEditAffirmation = (a: Affirmation) => {
    setEditingAffirmationId(a.id);
    setEditingAffirmationTitle(a.title);
  };
  const handleSaveEditAffirmation = () => {
    if (editingAffirmationId == null) return;
    const title = editingAffirmationTitle.trim() || 'Аффирмация';
    setSaving(true);
    senseClient.affirmations
      .update(editingAffirmationId, { title })
      .then(() => {
        toast('Название сохранено');
        setEditingAffirmationId(null);
        setEditingAffirmationTitle('');
        load();
      })
      .catch((e) => toast(e?.response?.data?.detail || 'Ошибка'))
      .finally(() => setSaving(false));
  };
  const handleCancelEditAffirmation = () => {
    setEditingAffirmationId(null);
    setEditingAffirmationTitle('');
  };

  const handleSaveWeekly = () => {
    const items = weeklyText.split(',').map((s) => s.trim()).filter(Boolean);
    setSaving(true);
    senseClient.content
      .replaceWeeklyIntentions(items)
      .then((list) => {
        setWeeklyIntentions(list);
        setWeeklyText(list.map((x) => x.text).join(', '));
        toast('Установки на неделю сохранены');
      })
      .catch((e) => toast(e?.response?.data?.detail || 'Ошибка'))
      .finally(() => setSaving(false));
  };

  const handleSaveDaily = () => {
    const items = dailyText.split(',').map((s) => s.trim()).filter(Boolean);
    setSaving(true);
    senseClient.content
      .replaceDailyQuestions(items)
      .then((list) => {
        setDailyQuestions(list);
        setDailyText(list.map((x) => x.text).join(', '));
        toast('Вопросы дня сохранены');
      })
      .catch((e) => toast(e?.response?.data?.detail || 'Ошибка'))
      .finally(() => setSaving(false));
  };

  if (loading) return <Loader className="min-h-[40vh]" />;

  const tabList: { id: SenseAdminTab; label: string }[] = [
    { id: 'meditations', label: 'Медитации' },
    { id: 'affirmations', label: 'Аффирмации' },
    { id: 'weekly', label: 'Установка на неделю' },
    { id: 'daily', label: 'Вопрос дня' },
  ];

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-heading text-sense">Управление контентом Sense</h1>
        <p className="mt-2 text-gray-700">
          Загрузка медитаций и аффирмаций (mp3/m4a, до 5 МБ). Установки и вопросы — через запятую.
        </p>
      </section>

      <div className="flex flex-wrap gap-2 border-b border-sense/20 pb-3">
        {tabList.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`min-w-0 rounded-lg px-4 py-2.5 font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sense focus-visible:ring-offset-2 ${
              activeTab === id ? 'bg-sense text-white' : 'bg-sense/10 text-sense hover:bg-sense/20'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'meditations' && (
        <Card variant="sense">
          <h2 className="text-lg font-bold text-sense">Добавить медитацию</h2>
          <p className="mt-1 text-sm text-gray-600">Загрузите файл (mp3/m4a до 5 МБ) или запишите с микрофона.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setMeditationAddMode('upload')}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sense focus-visible:ring-offset-1 ${meditationAddMode === 'upload' ? 'bg-sense text-white' : 'bg-sense/10 text-sense hover:bg-sense/20'}`}
            >
              Загрузить файл
            </button>
            <button
              type="button"
              onClick={() => setMeditationAddMode('record')}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sense focus-visible:ring-offset-1 ${meditationAddMode === 'record' ? 'bg-sense text-white' : 'bg-sense/10 text-sense hover:bg-sense/20'}`}
            >
              Записать с микрофона
            </button>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">Название</label>
            <Input
              ref={meditationTitleRef}
              type="text"
              placeholder="Название медитации"
              className="mt-1 w-64"
            />
          </div>
          {meditationAddMode === 'upload' ? (
            <div className="mt-4 flex flex-wrap items-end gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Файл</label>
                <input
                  ref={meditationFileRef}
                  type="file"
                  accept=".mp3,.m4a,.webm,.ogg,.wav"
                  className="mt-1 block w-full text-sm text-gray-600 file:mr-2 file:rounded-lg file:border-0 file:bg-sense file:px-4 file:py-2 file:text-white file:hover:opacity-90"
                />
              </div>
              <Button variant="sense" onClick={handleUploadMeditation} disabled={saving}>
                {saving ? 'Загрузка…' : 'Загрузить'}
              </Button>
            </div>
          ) : (
            <div className="mt-4">
              <RecordAudioSense
                recordLabel="Записать медитацию"
                onRecorded={handleRecordedMeditation}
                onCancel={() => setMeditationAddMode('upload')}
                disabled={saving}
              />
            </div>
          )}
          <h3 className="mt-6 text-sm font-semibold text-sense">Список медитаций</h3>
          <ul className="mt-3 space-y-2">
            {meditations.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-sense/5 px-4 py-2.5">
                {editingMeditationId === m.id ? (
                  <>
                    <input
                      type="text"
                      value={editingMeditationTitle}
                      onChange={(e) => setEditingMeditationTitle(e.target.value)}
                      className="min-w-[140px] flex-1 rounded-lg border-2 border-sense/30 px-3 py-2 text-gray-900 focus:border-sense focus:outline-none focus:ring-2 focus:ring-sense/30"
                      placeholder="Название"
                    />
                    <Button variant="sense" className="shrink-0" onClick={handleSaveEditMeditation} disabled={saving}>
                      {saving ? '…' : 'Сохранить'}
                    </Button>
                    <Button variant="ghost" className="shrink-0 text-gray-700 hover:bg-gray-100" onClick={handleCancelEditMeditation}>
                      Отмена
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="min-w-0 flex-1 font-medium text-gray-800">{m.title}</span>
                    <Button variant="ghost" className="shrink-0 text-sense hover:bg-sense/10" onClick={() => handleStartEditMeditation(m)}>
                      Изменить
                    </Button>
                    <Button variant="ghost" className="shrink-0 text-red-600 hover:bg-red-50" onClick={() => handleDeleteMeditation(m.id)}>
                      Удалить
                    </Button>
                  </>
                )}
              </li>
            ))}
            {meditations.length === 0 && <li className="rounded-xl bg-sense/5 py-4 text-center text-sm text-gray-500">Пока нет медитаций</li>}
          </ul>
        </Card>
      )}

      {activeTab === 'affirmations' && (
        <Card variant="sense">
          <h2 className="text-lg font-bold text-sense">Добавить аффирмацию</h2>
          <p className="mt-1 text-sm text-gray-600">Загрузите файл (mp3/m4a до 5 МБ) или запишите с микрофона.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setAffirmationAddMode('upload')}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sense focus-visible:ring-offset-1 ${affirmationAddMode === 'upload' ? 'bg-sense text-white' : 'bg-sense/10 text-sense hover:bg-sense/20'}`}
            >
              Загрузить файл
            </button>
            <button
              type="button"
              onClick={() => setAffirmationAddMode('record')}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sense focus-visible:ring-offset-1 ${affirmationAddMode === 'record' ? 'bg-sense text-white' : 'bg-sense/10 text-sense hover:bg-sense/20'}`}
            >
              Записать с микрофона
            </button>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">Название</label>
            <Input
              ref={affirmationTitleRef}
              type="text"
              placeholder="Название аффирмации"
              className="mt-1 w-64"
            />
          </div>
          {affirmationAddMode === 'upload' ? (
            <div className="mt-4 flex flex-wrap items-end gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Файл</label>
                <input
                  ref={affirmationFileRef}
                  type="file"
                  accept=".mp3,.m4a,.webm,.ogg,.wav"
                  className="mt-1 block w-full text-sm text-gray-600 file:mr-2 file:rounded-lg file:border-0 file:bg-sense file:px-4 file:py-2 file:text-white file:hover:opacity-90"
                />
              </div>
              <Button variant="sense" onClick={handleUploadAffirmation} disabled={saving}>
                {saving ? 'Загрузка…' : 'Загрузить'}
              </Button>
            </div>
          ) : (
            <div className="mt-4">
              <RecordAudioSense
                recordLabel="Записать аффирмацию"
                onRecorded={handleRecordedAffirmation}
                onCancel={() => setAffirmationAddMode('upload')}
                disabled={saving}
              />
            </div>
          )}
          <h3 className="mt-6 text-sm font-semibold text-sense">Список аффирмаций</h3>
          <ul className="mt-3 space-y-2">
            {affirmations.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-sense/5 px-4 py-2.5">
                {editingAffirmationId === a.id ? (
                  <>
                    <input
                      type="text"
                      value={editingAffirmationTitle}
                      onChange={(e) => setEditingAffirmationTitle(e.target.value)}
                      className="min-w-[140px] flex-1 rounded-lg border-2 border-sense/30 px-3 py-2 text-gray-900 focus:border-sense focus:outline-none focus:ring-2 focus:ring-sense/30"
                      placeholder="Название"
                    />
                    <Button variant="sense" className="shrink-0" onClick={handleSaveEditAffirmation} disabled={saving}>
                      {saving ? '…' : 'Сохранить'}
                    </Button>
                    <Button variant="ghost" className="shrink-0 text-gray-700 hover:bg-gray-100" onClick={handleCancelEditAffirmation}>
                      Отмена
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="min-w-0 flex-1 font-medium text-gray-800">{a.title}</span>
                    <Button variant="ghost" className="shrink-0 text-sense hover:bg-sense/10" onClick={() => handleStartEditAffirmation(a)}>
                      Изменить
                    </Button>
                    <Button variant="ghost" className="shrink-0 text-red-600 hover:bg-red-50" onClick={() => handleDeleteAffirmation(a.id)}>
                      Удалить
                    </Button>
                  </>
                )}
              </li>
            ))}
            {affirmations.length === 0 && <li className="rounded-xl bg-sense/5 py-4 text-center text-sm text-gray-500">Пока нет аффирмаций</li>}
          </ul>
        </Card>
      )}

      {activeTab === 'weekly' && (
        <Card variant="sense">
          <h2 className="text-lg font-bold text-sense">Установка на неделю</h2>
          <p className="mt-1 text-sm text-gray-600">
            Введите установки через запятую. Пользователю показывается одна случайная установка на главной, обновляется в понедельник в 00:00.
          </p>
          <textarea
            value={weeklyText}
            onChange={(e) => setWeeklyText(e.target.value)}
            rows={6}
            placeholder="Установка 1, Установка 2, Установка 3"
            className="mt-4 w-full rounded-xl border-2 border-sense/30 px-3 py-2 text-gray-900 focus:border-sense focus:outline-none focus:ring-2 focus:ring-sense/40 focus:ring-offset-0"
          />
          <Button variant="sense" className="mt-4" onClick={handleSaveWeekly} disabled={saving}>
            {saving ? 'Сохранение…' : 'Сохранить'}
          </Button>
        </Card>
      )}

      {activeTab === 'daily' && (
        <Card variant="sense">
          <h2 className="text-lg font-bold text-sense">Вопрос дня</h2>
          <p className="mt-1 text-sm text-gray-600">
            Введите вопросы через запятую. Пользователю показывается один случайный вопрос на главной, обновляется каждый день в 00:00.
          </p>
          <textarea
            value={dailyText}
            onChange={(e) => setDailyText(e.target.value)}
            rows={6}
            placeholder="Вопрос 1, Вопрос 2, Вопрос 3"
            className="mt-4 w-full rounded-xl border-2 border-sense/30 px-3 py-2 text-gray-900 focus:border-sense focus:outline-none focus:ring-2 focus:ring-sense/40 focus:ring-offset-0"
          />
          <Button variant="sense" className="mt-4" onClick={handleSaveDaily} disabled={saving}>
            {saving ? 'Сохранение…' : 'Сохранить'}
          </Button>
        </Card>
      )}
    </div>
  );
}
