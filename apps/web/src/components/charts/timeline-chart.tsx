'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStatsTimeline } from '@/hooks/use-company-stats';
import { Skeleton } from '@/components/ui/skeleton';

interface TimelineChartProps {
  period?: 'week' | 'month';
  range?: number;
  showCosts?: boolean;
  title?: string;
  className?: string;
}

const MONTH_NAMES: Record<string, string> = {
  '01': 'Jan',
  '02': 'Feb',
  '03': 'Mär',
  '04': 'Apr',
  '05': 'Mai',
  '06': 'Jun',
  '07': 'Jul',
  '08': 'Aug',
  '09': 'Sep',
  '10': 'Okt',
  '11': 'Nov',
  '12': 'Dez',
};

function formatPeriod(period: string): string {
  if (period.includes('-W')) {
    // Week format: 2024-W01
    const [year, week] = period.split('-W');
    return `KW ${week}`;
  }
  // Month format: 2024-01
  const [year, month] = period.split('-');
  return `${MONTH_NAMES[month] || month} ${year.slice(2)}`;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function TimelineChart({
  period = 'month',
  range = 12,
  showCosts = false,
  title = 'Schadenentwicklung',
  className,
}: TimelineChartProps) {
  const { data, isLoading, error } = useStatsTimeline(period, range);

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

  if (error || !data) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            Fehler beim Laden der Daten
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.data.map((item) => ({
    ...item,
    name: formatPeriod(item.period),
  }));

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="name"
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis
                yAxisId="left"
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              {showCosts && (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
              )}
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value, name) => {
                  const numValue = Number(value) || 0;
                  if (name === 'claimCount') return [numValue, 'Schäden'];
                  return [formatCurrency(numValue), name === 'totalFinalCost' ? 'Finale Kosten' : 'Geschätzte Kosten'];
                }}
              />
              <Legend
                formatter={(value) => {
                  if (value === 'claimCount') return 'Anzahl Schäden';
                  if (value === 'totalFinalCost') return 'Finale Kosten';
                  if (value === 'totalEstimatedCost') return 'Geschätzte Kosten';
                  return value;
                }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="claimCount"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              {showCosts && (
                <>
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="totalFinalCost"
                    stroke="hsl(142, 76%, 36%)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="totalEstimatedCost"
                    stroke="hsl(45, 93%, 47%)"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ r: 3 }}
                  />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
