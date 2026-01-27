'use client';

import { useRef, useState, useEffect } from 'react';
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

// Hook to ensure container has valid dimensions before rendering chart
function useValidDimensions() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasValidDimensions, setHasValidDimensions] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const checkDimensions = () => {
      const { width, height } = container.getBoundingClientRect();
      if (width > 0 && height > 0) {
        setHasValidDimensions(true);
        return true;
      }
      return false;
    };

    if (checkDimensions()) return;

    const resizeObserver = new ResizeObserver(() => {
      if (checkDimensions()) {
        resizeObserver.disconnect();
      }
    });
    resizeObserver.observe(container);

    // Retry after one frame — layout may not be computed yet after LazyChart transition
    const frameId = requestAnimationFrame(() => {
      if (checkDimensions()) {
        resizeObserver.disconnect();
      }
    });

    // Ultimate fallback: render chart after brief delay to prevent permanent skeleton
    const timeoutId = setTimeout(() => {
      if (!hasValidDimensions) {
        setHasValidDimensions(true);
        resizeObserver.disconnect();
      }
    }, 200);

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
    };
  }, []);

  return { containerRef, hasValidDimensions };
}

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
  const { containerRef, hasValidDimensions } = useValidDimensions();

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
        <div ref={containerRef} className="h-[280px]">
          {!hasValidDimensions ? (
            <Skeleton className="h-full w-full" />
          ) : (
          <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
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
          )}
        </div>
      </CardContent>
    </Card>
  );
}
