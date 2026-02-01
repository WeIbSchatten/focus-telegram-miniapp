/** Пустая строка = использовать прокси Next.js (rewrites в next.config.js) */
export const FOCUS_API_URL = process.env.NEXT_PUBLIC_FOCUS_API_URL || '';
export const KIDS_API_URL = process.env.NEXT_PUBLIC_KIDS_API_URL || '';
export const TELEGRAM_BOT_NAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME || '';

export const ROUTES = {
  home: '/',
  auth: {
    login: '/auth/login',
    register: '/auth/register',
  },
  license: '/license',
  kids: {
    root: '/kids',
    profile: '/kids/profile',
    learning: '/kids/learning',
    addVideo: '/kids/learning/add-video',
    learningProgram: (id: number) => `/kids/learning/${id}`,
    learningProgramVideos: (programId: number) => `/kids/learning/${programId}/videos`,
    createProgram: '/kids/learning/programs/create',
    editProgram: (id: number) => `/kids/learning/programs/${id}/edit`,
    lecture: (id: number) => `/kids/learning/lecture/${id}`,
    homework: (id: number) => `/kids/learning/homework/${id}`,
    test: (id: number) => `/kids/learning/test/${id}`,
    createTest: '/kids/learning/tests/create',
    editTest: (id: number) => `/kids/learning/tests/${id}/edit`,
    attendance: '/kids/attendance',
    lessons: '/kids/lessons',
    statistics: '/kids/statistics',
    admin: {
      root: '/kids/admin',
      license: '/kids/admin/license',
      users: '/kids/admin/users',
      students: '/kids/admin/students',
      teachers: '/kids/admin/teachers',
      groups: '/kids/admin/groups',
      groupEdit: (groupId: number) => `/kids/admin/groups/${groupId}`,
      register: '/kids/admin/register',
    },
  },
} as const;

export const STORAGE_KEYS = {
  accessToken: 'focus_access_token',
  user: 'focus_user',
} as const;
