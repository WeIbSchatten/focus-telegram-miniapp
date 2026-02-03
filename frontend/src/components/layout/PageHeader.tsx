'use client';

import { ReactNode } from 'react';

/** Единый блок заголовка страницы: на мобильных — заголовок сверху, кнопки снизу; на sm+ — в одну строку. */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-heading text-primary">{title}</h1>
          {description && <div className="mt-1 text-gray-700">{description}</div>}
        </div>
        {actions && (
          <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </section>
  );
}

/** Класс для кнопок в шапке страницы: одинаковые размеры по всему приложению */
export const PAGE_ACTION_BUTTON_CLASS = 'min-h-[2.75rem] min-w-[10rem] sm:min-w-[8rem]';
