'use client';

import { useEffect, useRef, useState, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface LazyChartProps {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackHeight?: string;
  className?: string;
}

/**
 * LazyChart - Defers chart rendering until visible in viewport
 *
 * PERFORMANCE FIX: This component uses Intersection Observer to lazy-load charts.
 * Charts and their data fetching hooks will only execute when the chart becomes visible,
 * reducing the initial API request storm when loading the dashboard.
 */
export function LazyChart({
  children,
  fallbackTitle = 'Laden...',
  fallbackHeight = 'h-[300px]',
  className,
}: LazyChartProps) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check if Intersection Observer is available
    if (!('IntersectionObserver' in window)) {
      // Fallback: render immediately if IO is not supported
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            // Once visible, stop observing
            observer.unobserve(entry.target);
          }
        });
      },
      {
        // Start loading when chart is 100px away from viewport
        rootMargin: '100px',
        threshold: 0,
      }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Show skeleton placeholder until visible
  if (!isVisible) {
    return (
      <div ref={containerRef} className={className}>
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-muted-foreground">{fallbackTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className={`w-full ${fallbackHeight}`} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return <div ref={containerRef}>{children}</div>;
}
