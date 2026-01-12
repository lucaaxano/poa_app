'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'unpaid' | 'paused' | null;

interface BillingStatusBadgeProps {
  status: SubscriptionStatus | string | null;
  className?: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  active: {
    label: 'Aktiv',
    className: 'bg-green-100 text-green-800 border-green-200',
  },
  trialing: {
    label: 'Testphase',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  past_due: {
    label: 'Zahlung ausstehend',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  canceled: {
    label: 'Gekuendigt',
    className: 'bg-red-100 text-red-800 border-red-200',
  },
  incomplete: {
    label: 'Unvollstaendig',
    className: 'bg-orange-100 text-orange-800 border-orange-200',
  },
  incomplete_expired: {
    label: 'Abgelaufen',
    className: 'bg-red-100 text-red-800 border-red-200',
  },
  unpaid: {
    label: 'Unbezahlt',
    className: 'bg-red-100 text-red-800 border-red-200',
  },
  paused: {
    label: 'Pausiert',
    className: 'bg-gray-100 text-gray-800 border-gray-200',
  },
};

const defaultConfig = {
  label: 'Kein Abo',
  className: 'bg-gray-100 text-gray-600 border-gray-200',
};

export function BillingStatusBadge({ status, className }: BillingStatusBadgeProps) {
  const config = status ? statusConfig[status] || defaultConfig : defaultConfig;

  return (
    <Badge
      variant="outline"
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  );
}
