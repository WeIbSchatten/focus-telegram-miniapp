'use client';

import Link from 'next/link';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';

interface ServiceCardProps {
  title: string;
  description: string;
  href: string;
  cta: string;
  kids?: boolean;
}

export function ServiceCard({ title, description, href, cta, kids }: ServiceCardProps) {
  return (
    <Card variant={kids ? 'kids' : 'default'} className="flex flex-col">
      <h3 className="text-heading text-primary">{title}</h3>
      <p className="mt-2 flex-1 text-gray-700">{description}</p>
      <Link href={href} className="mt-4 inline-block">
        <Button variant={kids ? 'kids' : 'primary'}>{cta}</Button>
      </Link>
    </Card>
  );
}
