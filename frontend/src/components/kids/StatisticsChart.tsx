'use client';

import { Card } from '@/components/common/Card';
import type { StudentStatistics } from '@/types/kids';

interface StatisticsChartProps {
  stats: StudentStatistics;
}

export function StatisticsChart({ stats }: StatisticsChartProps) {
  const items = [
    {
      label: 'Посещаемость',
      value: `${stats.attendance_rate}%`,
      sub: `${stats.attended_lessons} из ${stats.total_lessons} занятий`,
      color: 'bg-primary',
    },
    {
      label: 'Средняя оценка',
      value: stats.average_grade != null ? String(stats.average_grade) : '—',
      sub: `Оценок: ${stats.total_grades}`,
      color: 'bg-primary-light',
    },
    {
      label: 'Домашние задания',
      value: stats.total_homeworks > 0 ? `${stats.completed_homeworks} из ${stats.total_homeworks} выполнено` : '—',
      sub: stats.total_homeworks > 0 ? 'По программам и с уроков' : 'Пока нет заданий',
      color: 'bg-kids',
    },
    {
      label: 'Тесты',
      value: `${stats.completed_tests} из ${stats.total_tests} решено`,
      sub: stats.average_test_score != null ? `Средний балл по лучшим результатам: ${stats.average_test_score}%` : (stats.total_tests > 0 ? 'Учитывается лучшая попытка по каждому тесту' : ''),
      color: 'bg-kids',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} variant="kids">
          <p className="text-sm font-medium text-primary">{item.label}</p>
          <p className="mt-2 text-2xl font-bold text-primary">{item.value}</p>
          {item.sub && <p className="mt-1 text-sm text-gray-700">{item.sub}</p>}
        </Card>
      ))}
    </div>
  );
}
