'use client';

import * as React from 'react';
import { HelpCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuthStore } from '@/stores/auth-store';
import { useHelpStore } from '@/stores/help-store';
import {
  helpTopicContent,
  getHelpTopicDescription,
  type HelpTopicKey,
} from './help-content';
import { cn } from '@/lib/utils';

interface HelpPopoverProps {
  topicKey: HelpTopicKey;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  className?: string;
  iconClassName?: string;
}

export function HelpPopover({
  topicKey,
  side = 'top',
  align = 'center',
  className,
  iconClassName,
}: HelpPopoverProps) {
  const { user } = useAuthStore();
  const { helpEnabled } = useHelpStore();

  // Don't render if help is disabled
  if (!helpEnabled) {
    return null;
  }

  const topic = helpTopicContent[topicKey];
  if (!topic) {
    return null;
  }

  const description = getHelpTopicDescription(topicKey, user?.role);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex items-center justify-center rounded-full p-1 transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            className
          )}
          aria-label={`Hilfe zu ${topic.title}`}
        >
          <HelpCircle
            className={cn(
              'h-4 w-4 text-muted-foreground hover:text-primary transition-colors',
              iconClassName
            )}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side={side}
        align={align}
        className="w-80 rounded-xl shadow-lg"
      >
        <div className="space-y-2">
          <h4 className="font-medium text-sm">{topic.title}</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Simple inline help icon for use in headers
interface InlineHelpProps {
  topicKey: HelpTopicKey;
  className?: string;
}

export function InlineHelp({ topicKey, className }: InlineHelpProps) {
  return (
    <HelpPopover
      topicKey={topicKey}
      className={cn('ml-2', className)}
      side="top"
    />
  );
}
