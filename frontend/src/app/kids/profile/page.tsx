'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useKidsStore } from '@/store/kidsStore';
import { useToast } from '@/hooks/useToast';
import { useTelegram } from '@/hooks/useTelegram';
import { kidsClient } from '@/lib/api/kids-client';
import { focusClient } from '@/lib/api/focus-client';
import { useAuthStore } from '@/store/authStore';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Loader } from '@/components/common/Loader';
import { PageHeader } from '@/components/layout/PageHeader';
import type { TeacherStatistics } from '@/types/kids';

export default function KidsProfilePage() {
  const { user, linkTelegram, unlinkTelegram, refreshMe } = useAuth();
  const { setUser } = useAuthStore();
  const { role, studentId, teacherId } = useKidsStore();
  const { show: showToast } = useToast();
  const { inside: inTelegram, initData } = useTelegram();
  const [teacherStats, setTeacherStats] = useState<TeacherStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [linkTgLoading, setLinkTgLoading] = useState(false);
  const [unlinkTgLoading, setUnlinkTgLoading] = useState(false);

  const [profileEdit, setProfileEdit] = useState({ fullName: '', email: '' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmNewPassword: '' });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const telegramLinked = Boolean(user?.telegramUserId);

  useEffect(() => {
    if (!teacherId || role !== 'teacher') {
      setLoading(false);
      return;
    }
    let cancelled = false;
    kidsClient.statistics.teacher(teacherId).then((s) => { if (!cancelled) setTeacherStats(s); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [role, teacherId]);

  useEffect(() => {
    if (user) {
      setProfileEdit({ fullName: user.fullName ?? '', email: user.email ?? '' });
    }
  }, [user?.id, user?.fullName, user?.email]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setProfileSaving(true);
    try {
      const updated = await focusClient.auth.updateProfile({
        fullName: profileEdit.fullName.trim() || undefined,
        email: profileEdit.email.trim() || undefined,
      });
      setUser(updated);
      showToast('Профиль сохранён');
    } catch (err: unknown) {
      const data = err && typeof err === 'object' && 'response' in err ? (err as { response?: { data?: { message?: string | string[] } } }).response?.data : undefined;
      const raw = data?.message;
      const msg = typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] ?? 'Не удалось сохранить профиль' : 'Не удалось сохранить профиль';
      showToast(msg);
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      setPasswordError('Новый пароль и подтверждение не совпадают');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError('Новый пароль не менее 6 символов');
      return;
    }
    setPasswordSaving(true);
    try {
      await focusClient.auth.changePassword({
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
        confirmNewPassword: passwordForm.confirmNewPassword,
      });
      setPasswordForm({ oldPassword: '', newPassword: '', confirmNewPassword: '' });
      showToast('Пароль успешно изменён');
    } catch (err: unknown) {
      const data = err && typeof err === 'object' && 'response' in err ? (err as { response?: { data?: { message?: string | string[] } } }).response?.data : undefined;
      const raw = data?.message;
      const msg = typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] ?? 'Не удалось сменить пароль' : 'Не удалось сменить пароль';
      setPasswordError(msg);
      showToast(msg);
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading && role === 'teacher' && teacherId) return <Loader className="min-h-[40vh]" />;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Личный кабинет"
        description={
          <>
            <p className="text-gray-700">{user?.fullName}</p>
            <p className="text-sm text-gray-600">
              Роль: {user?.role === 'admin' ? 'Администратор' : user?.role === 'moderator' ? 'Модератор' : role === 'student' ? 'Ученик' : role === 'teacher' ? 'Учитель' : '—'}
            </p>
          </>
        }
      />

      <Card variant="kids">
        <h2 className="mb-4 text-xl font-bold text-primary">Telegram</h2>
        <p className="mb-2 text-gray-700">
          {telegramLinked ? 'Telegram привязан к аккаунту — можно входить через бота.' : 'Telegram не привязан.'}
        </p>
        {inTelegram && initData && !telegramLinked && (
          <Button
            type="button"
            variant="kids"
            disabled={linkTgLoading}
            onClick={async () => {
              setLinkTgLoading(true);
              try {
                await linkTelegram();
                const me = await refreshMe?.();
                if (me) setUser(me);
                showToast('Telegram привязан. Дальше можно входить через «Войти через Telegram».');
              } catch (e) {
                const msg = e && typeof e === 'object' && 'response' in e
                  ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
                  : 'Не удалось привязать';
                showToast(Array.isArray(msg) ? msg[0] : String(msg));
              } finally {
                setLinkTgLoading(false);
              }
            }}
          >
            {linkTgLoading ? 'Привязка…' : 'Привязать Telegram'}
          </Button>
        )}
        {telegramLinked && (
          <Button
            type="button"
            variant="outline"
            className="mt-2"
            disabled={unlinkTgLoading}
            onClick={async () => {
              if (!confirm('Отвязать Telegram от аккаунта? Вход через бота станет недоступен до повторной привязки.')) return;
              setUnlinkTgLoading(true);
              try {
                await unlinkTelegram();
                showToast('Telegram отвязан от аккаунта.');
              } catch (e) {
                const msg = e && typeof e === 'object' && 'response' in e
                  ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
                  : 'Не удалось отвязать';
                showToast(Array.isArray(msg) ? msg[0] : String(msg));
              } finally {
                setUnlinkTgLoading(false);
              }
            }}
          >
            {unlinkTgLoading ? 'Отвязка…' : 'Отвязать Telegram'}
          </Button>
        )}
        {!inTelegram && !telegramLinked && (
          <p className="text-sm text-gray-600">
            Откройте приложение из Telegram-бота и нажмите «Привязать Telegram» здесь или войдите через сайт и привяжите в чате с ботом.
          </p>
        )}
      </Card>

      <Card variant="kids">
        <h2 className="mb-4 text-xl font-bold text-primary">Редактировать профиль</h2>
        <form onSubmit={handleSaveProfile} className="space-y-4 max-w-md">
          <Input
            label="Имя"
            value={profileEdit.fullName}
            onChange={(e) => setProfileEdit((p) => ({ ...p, fullName: e.target.value }))}
            placeholder="ФИО"
          />
          <Input
            type="email"
            label="Email"
            value={profileEdit.email}
            onChange={(e) => setProfileEdit((p) => ({ ...p, email: e.target.value }))}
            placeholder="email@example.com"
          />
          <Button type="submit" variant="kids" disabled={profileSaving}>
            {profileSaving ? 'Сохранение…' : 'Сохранить'}
          </Button>
        </form>
      </Card>

      <Card variant="kids">
        <h2 className="mb-4 text-xl font-bold text-primary">Сменить пароль</h2>
        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <Input
            type="password"
            label="Текущий пароль"
            value={passwordForm.oldPassword}
            onChange={(e) => { setPasswordError(''); setPasswordForm((p) => ({ ...p, oldPassword: e.target.value })); }}
            placeholder="Введите текущий пароль"
            autoComplete="current-password"
          />
          <Input
            type="password"
            label="Новый пароль"
            value={passwordForm.newPassword}
            onChange={(e) => { setPasswordError(''); setPasswordForm((p) => ({ ...p, newPassword: e.target.value })); }}
            placeholder="Не менее 6 символов"
            autoComplete="new-password"
          />
          <Input
            type="password"
            label="Подтвердите новый пароль"
            value={passwordForm.confirmNewPassword}
            onChange={(e) => { setPasswordError(''); setPasswordForm((p) => ({ ...p, confirmNewPassword: e.target.value })); }}
            placeholder="Повторите новый пароль"
            autoComplete="new-password"
            error={passwordError}
          />
          <Button type="submit" variant="outline" disabled={passwordSaving}>
            {passwordSaving ? 'Сохранение…' : 'Сменить пароль'}
          </Button>
        </form>
      </Card>

      {role === 'teacher' && teacherStats && (
        <section>
          <h2 className="mb-4 text-xl font-bold text-primary">Мои группы</h2>
          <p className="mb-4 text-gray-700">
            Групп: {teacherStats.total_groups}, учеников: {teacherStats.total_students}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {teacherStats.groups.map((g) => (
              <Card key={g.group_id}>
                <h3 className="font-semibold text-primary">{g.group_name}</h3>
                <p className="mt-1 text-sm text-gray-700">Учеников: {g.total_students}</p>
                <p className="text-sm text-gray-700">Посещаемость: {g.average_attendance_rate}%</p>
                <p className="text-sm text-gray-700">Средняя оценка: {g.average_grade ?? '—'}</p>
              </Card>
            ))}
          </div>
        </section>
      )}

      {(!role || (role === 'student' && !studentId) || (role === 'teacher' && teacherId != null && !teacherStats && !loading)) && (
        <Card>
          <p className="text-gray-700">
            Вы ещё не привязаны к ученику или учителю в Focus Kids. Обратитесь к администратору.
          </p>
        </Card>
      )}
    </div>
  );
}
