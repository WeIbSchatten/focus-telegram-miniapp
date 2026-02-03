'use client';

import { ServiceCard } from './ServiceCard';
import { ROUTES } from '@/lib/constants';
import { useAuth } from '@/hooks/useAuth';

const services = [
  {
    title: 'Focus Kids',
    description: 'Онлайн-школа английского языка для детей. Группы, лекции, домашние задания и тесты.',
    href: ROUTES.kids.root,
    cta: 'Перейти в Focus Kids',
    kids: true,
    sense: false,
  },
  {
    title: 'Focus Sense',
    description: 'Медитация и личностный рост. Аудиомедитации, аффирмации, установка на неделю и вопрос дня.',
    href: ROUTES.sense.root,
    cta: 'Перейти в Focus Sense',
    kids: false,
    sense: true,
  },
];

export function ServicesList() {
  const { isAuthenticated, hasKidsAccess } = useAuth();

  return (
    <section className="py-12 md:py-16">
      <h2 className="mb-8 text-heading text-primary">Наши сервисы</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s) => (
          <ServiceCard
            key={s.href}
            title={s.title}
            description={s.description}
            href={s.href}
            cta={s.cta}
            kids={s.kids}
            sense={s.sense}
          />
        ))}
      </div>
      {!isAuthenticated && (
        <p className="mt-6 text-center text-gray-700">
          Войдите или зарегистрируйтесь, чтобы получить доступ к сервисам после одобрения модератора.
        </p>
      )}
      {isAuthenticated && !hasKidsAccess && (
        <p className="mt-6 rounded-lg bg-primary/10 p-4 text-center font-medium text-primary">
          Доступ к Focus Kids откроется после одобрения заявки модератором.
        </p>
      )}
    </section>
  );
}
