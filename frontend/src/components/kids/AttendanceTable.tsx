'use client';

import { Card } from '@/components/common/Card';
import { formatDate } from '@/lib/utils/date';

interface AttendanceRecord {
  id: number;
  student_id: number;
  group_id: number;
  lesson_date: string;
  present: boolean;
}

interface AttendanceTableProps {
  records: AttendanceRecord[];
  title?: string;
}

export function AttendanceTable({ records, title = 'Посещаемость' }: AttendanceTableProps) {
  if (records.length === 0) {
    return (
      <Card>
        <h3 className="font-semibold text-primary">{title}</h3>
        <p className="mt-2 text-gray-600">Нет записей</p>
      </Card>
    );
  }

  const presentCount = records.filter((r) => r.present).length;
  const rate = Math.round((presentCount / records.length) * 100);

  return (
    <Card>
      <h3 className="font-semibold text-primary">{title}</h3>
      <p className="mt-1 text-sm text-gray-700">
        Посещено: {presentCount} из {records.length} ({rate}%)
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-primary/20 text-left text-gray-700">
              <th className="py-2 pr-4">Дата</th>
              <th className="py-2">Присутствие</th>
            </tr>
          </thead>
          <tbody>
            {records
              .slice()
              .sort((a, b) => new Date(b.lesson_date).getTime() - new Date(a.lesson_date).getTime())
              .map((r) => (
                <tr key={r.id} className="border-b border-gray-100 text-gray-800">
                  <td className="py-2 pr-4">{formatDate(r.lesson_date)}</td>
                  <td className="py-2">{r.present ? '✓' : '—'}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
