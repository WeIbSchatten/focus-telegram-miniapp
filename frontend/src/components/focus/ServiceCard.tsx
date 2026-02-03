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
  sense?: boolean;
}

export function ServiceCard({ title, description, href, cta, kids, sense }: ServiceCardProps) {
  const variant = sense ? 'sense' : kids ? 'kids' : 'default';
  const buttonVariant = sense ? 'sense' : kids ? 'kids' : 'primary';
  const titleColor = sense ? 'text-sense' : kids ? 'text-primary' : 'text-primary';
  return (
    <Card variant={variant} className="flex flex-col">
      <h3 className={`text-heading ${titleColor}`}>{title}</h3>
      <p className="mt-2 flex-1 text-gray-700">{description}</p>
      <Link href={href} className="mt-4 inline-block no-underline hover:no-underline">
        <Button variant={buttonVariant}>{cta}</Button>
      </Link>
    </Card>
  );
}
