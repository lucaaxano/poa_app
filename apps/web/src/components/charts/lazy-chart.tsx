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
 * LazyChart - Defers chart rendering until visible in viewport AND container has valid dimensions
 *
 * PERFORMANCE FIX: This component uses Intersection Observer to lazy-load charts.
 * Charts and their data fetching hooks will only execute when the chart becomes visible,
 * reducing the initial API request storm when loading the dashboard.
 *
 * DIMENSION FIX: Waits for container to have valid dimensions (> 0) before rendering
 * to prevent Recharts errors: "width(-1) and height(-1) should be greater than 0"
 */
export function LazyChart({
  children,
  fallbackTitle = 'Laden...',
  fallbackHeight = 'h-[300px]',
  className,
}: LazyChartProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasValidDimensions, setHasValidDimensions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer - detect when chart enters viewport
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

  // ResizeObserver - wait for valid dimensions before rendering chart
  useEffect(() => {
    if (!isVisible) return;

    const container = containerRef.current;
    if (!container) return;

    // Check dimensions immediately
    const checkDimensions = () => {
      const { width, height } = container.getBoundingClientRect();
      if (width > 0 && height > 0) {
        setHasValidDimensions(true);
        return true;
      }
      return false;
    };

    // If already has valid dimensions, render immediately
    if (checkDimensions()) return;

    // Otherwise, use ResizeObserver to wait for valid dimensions
    if ('ResizeObserver' in window) {
      const resizeObserver = new ResizeObserver(() => {
        if (checkDimensions()) {
          resizeObserver.disconnect();
        }
      });
      resizeObserver.observe(container);

      return () => resizeObserver.disconnect();
    } else {
      // Fallback: use requestAnimationFrame for browsers without ResizeObserver
      let frameId: number;
      const waitForDimensions = () => {
        if (!checkDimensions()) {
          frameId = requestAnimationFrame(waitForDimensions);
        }
      };
      frameId = requestAnimationFrame(waitForDimensions);

      return () => cancelAnimationFrame(frameId);
    }
  }, [isVisible]);

  // Show skeleton placeholder until visible AND has valid dimensions
  if (!isVisible || !hasValidDimensions) {
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

  return <div ref={containerRef} className={className}>{children}</div>;
}
