'use client';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStatsByCategory } from '@/hooks/use-company-stats';
import { Skeleton } from '@/components/ui/skeleton';
import type { DamageCategory } from '@poa/shared';

interface CategoryPieChartProps {
  title?: string;
  className?: string;
}

const CATEGORY_LABELS: Record<DamageCategory, string> = {
  LIABILITY: 'Haftpflicht',
  COMPREHENSIVE: 'Kasko',
  GLASS: 'Glas',
  WILDLIFE: 'Wild',
  PARKING: 'Parkschaden',
  THEFT: 'Diebstahl',
  VANDALISM: 'Vandalismus',
  OTHER: 'Sonstiges',
};

const CATEGORY_COLORS: Record<DamageCategory, string> = {
  LIABILITY: '#4F46E5',     // Indigo
  COMPREHENSIVE: '#0EA5E9', // Sky
  GLASS: '#06B6D4',         // Cyan
  WILDLIFE: '#10B981',      // Emerald
  PARKING: '#F59E0B',       // Amber
  THEFT: '#EF4444',         // Red
  VANDALISM: '#8B5CF6',     // Violet
  OTHER: '#6B7280',         // Gray
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function CategoryPieChart({
  title = 'Schäden nach Kategorie',
  className,
}: CategoryPieChartProps) {
  const { data, isLoading, error } = useStatsByCategory();

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[280px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data || data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[280px] items-center justify-center text-muted-foreground">
            {error ? 'Fehler beim Laden der Daten' : 'Keine Daten vorhanden'}
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((item) => ({
    name: CATEGORY_LABELS[item.category] || item.category,
    value: item.claimCount,
    percentage: item.percentage,
    totalCost: item.totalCost,
    color: CATEGORY_COLORS[item.category] || '#6B7280',
  }));

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
                label={({ payload }) => `${payload?.percentage || 0}%`}
                labelLine={false}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value, name, props) => {
                  const item = props?.payload;
                  const numValue = Number(value) || 0;
                  return [
                    `${numValue} Schäden (${item?.percentage || 0}%) - ${formatCurrency(item?.totalCost || 0)}`,
                    name,
                  ];
                }}
              />
              <Legend
                layout="horizontal"
                verticalAlign="bottom"
                align="center"
                wrapperStyle={{ paddingTop: '20px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
