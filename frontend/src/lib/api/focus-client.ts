import { focusApi } from './axios';
import type { FocusUser } from '@/types/user';
import type { LoginPayload, RegisterPayload, AuthResponse } from '@/types/api';

export const focusClient = {
  auth: {
    login: (data: LoginPayload) =>
      focusApi.post<AuthResponse>('/auth/login', data).then((r) => r.data),
    register: (data: RegisterPayload) =>
      focusApi.post<FocusUser>('/auth/register', data).then((r) => r.data),
    telegram: (initData: string) =>
      focusApi.post<AuthResponse>('/auth/telegram', { initData }).then((r) => r.data),
    telegramWidget: (params: {
      id: string;
      first_name: string;
      last_name?: string;
      username?: string;
      photo_url?: string;
      auth_date: string;
      hash: string;
    }) =>
      focusApi.post<AuthResponse>('/auth/telegram-widget', params).then((r) => r.data),
    me: () =>
      focusApi.get<Pick<FocusUser, 'id' | 'email' | 'fullName' | 'role' | 'status' | 'hasKidsAccess' | 'hasSenseAccess' | 'telegramUserId'>>('/auth/me').then((r) => r.data),
    linkTelegram: (initData: string) =>
      focusApi.patch<{ telegramUserId: string }>('/auth/me/link-telegram', { initData }).then((r) => r.data),
    unlinkTelegram: () =>
      focusApi
        .patch<Pick<FocusUser, 'id' | 'email' | 'fullName' | 'role' | 'status' | 'hasKidsAccess' | 'hasSenseAccess' | 'telegramUserId'>>('/auth/me/unlink-telegram')
        .then((r) => r.data),
    updateProfile: (data: { fullName?: string; email?: string }) =>
      focusApi
        .patch<Pick<FocusUser, 'id' | 'email' | 'fullName' | 'role' | 'status' | 'hasKidsAccess' | 'hasSenseAccess' | 'telegramUserId'>>('/auth/me', data)
        .then((r) => r.data),
    changePassword: (data: { oldPassword: string; newPassword: string; confirmNewPassword: string }) =>
      focusApi.patch<{ message: string }>('/auth/me/password', data).then((r) => r.data),
  },
  users: {
    list: () =>
      focusApi.get<(FocusUser & { createdAt?: string })[]>('/users').then((r) => r.data),
    getById: (id: string) =>
      focusApi.get<FocusUser>(`/users/${id}`).then((r) => r.data),
    setRole: (id: string, role: string) =>
      focusApi.patch<{ id: string; role: string }>(`/users/${id}/role`, { role }).then((r) => r.data),
    delete: (id: string) =>
      focusApi.delete<{ message: string }>(`/users/${id}`).then((r) => r.data),
  },
  moderation: {
    approveUser: (userId: string, status: string) =>
      focusApi.patch(`/moderation/users/${userId}/approve`, { status }).then((r) => r.data),
    setKidsAccess: (userId: string, hasAccess: boolean) =>
      focusApi.patch<{ hasAccess: boolean }>(`/moderation/users/${userId}/kids-access`, { hasAccess }).then((r) => r.data),
    setSenseAccess: (userId: string, hasAccess: boolean) =>
      focusApi.patch<{ hasAccess: boolean }>(`/moderation/users/${userId}/sense-access`, { hasAccess }).then((r) => r.data),
  },
  content: {
    getLicense: () => focusApi.get<{ content: string }>('/content/license').then((r) => r.data),
    updateLicense: (content: string) =>
      focusApi.patch<{ content: string }>('/content/license', { content }).then((r) => r.data),
  },
};
