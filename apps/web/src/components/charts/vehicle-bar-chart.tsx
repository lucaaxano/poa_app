'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStatsByVehicle } from '@/hooks/use-company-stats';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

interface VehicleBarChartProps {
  limit?: number;
  title?: string;
  className?: string;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function VehicleBarChart({
  limit = 10,
  title = 'Top Fahrzeuge nach Schäden',
  className,
}: VehicleBarChartProps) {
  const { data, isLoading, error } = useStatsByVehicle(limit);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
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
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            {error ? 'Fehler beim Laden der Daten' : 'Keine Daten vorhanden'}
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((item) => ({
    ...item,
    name: item.licensePlate,
    displayName: `${item.licensePlate}${item.brand ? ` (${item.brand})` : ''}`,
  }));

  // Color gradient from primary to muted
  const getBarColor = (index: number, total: number) => {
    const intensity = 1 - (index / total) * 0.5;
    return `hsl(var(--primary) / ${intensity})`;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
              <XAxis
                type="number"
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis
                type="category"
                dataKey="name"
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                width={70}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value, _name, props) => {
                  const item = props?.payload;
                  const numValue = Number(value) || 0;
                  return [
                    `${item?.displayName || ''}: ${numValue} Schäden (${formatCurrency(item?.totalCost || 0)})`,
                    '',
                  ];
                }}
                labelFormatter={() => ''}
              />
              <Bar dataKey="claimCount" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getBarColor(index, chartData.length)}
                    className="cursor-pointer hover:opacity-80"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        {data.length > 0 && (
          <div className="mt-4 text-center">
            <Link
              href="/vehicles"
              prefetch={false}
              className="text-sm text-muted-foreground hover:text-primary"
            >
              Alle Fahrzeuge anzeigen →
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
