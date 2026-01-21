'use client';

import * as React from 'react';
import { Lightbulb, CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useHelpStore } from '@/stores/help-store';
import { getOnboardingContent, type PageKey } from './help-content';
import { cn } from '@/lib/utils';

interface OnboardingDialogProps {
  pageKey: PageKey;
  className?: string;
}

export function OnboardingDialog({ pageKey, className }: OnboardingDialogProps) {
  const { seenOnboardings, markOnboardingSeen, helpEnabled } = useHelpStore();
  const [isOpen, setIsOpen] = React.useState(false);

  const content = getOnboardingContent(pageKey);
  const hasSeen = seenOnboardings[pageKey] === true;

  // Show dialog on mount if not seen before and help is enabled
  React.useEffect(() => {
    if (!hasSeen && helpEnabled && content) {
      // Small delay to allow page to render first
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [hasSeen, helpEnabled, content]);

  if (!content) {
    return null;
  }

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleDontShowAgain = () => {
    markOnboardingSeen(pageKey);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen} modal={false}>
      <DialogContent className={cn('sm:max-w-md sm:rounded-2xl', className)}>
        <DialogHeader className="space-y-4">
          {/* Icon Container */}
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
            <Lightbulb className="h-7 w-7 text-primary" />
          </div>

          <div className="space-y-2 text-center">
            <DialogTitle className="text-xl font-semibold">
              {content.title}
            </DialogTitle>
            <DialogDescription className="text-base leading-relaxed">
              {content.description}
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Tips Section */}
        {content.tips && content.tips.length > 0 && (
          <div className="my-4 space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Tipps:</h4>
            <ul className="space-y-2">
              {content.tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-3 text-sm">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                  <span className="text-muted-foreground">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            onClick={handleClose}
            className="w-full rounded-xl"
          >
            Verstanden
          </Button>
          <Button
            variant="outline"
            onClick={handleDontShowAgain}
            className="w-full rounded-xl"
          >
            Nicht mehr anzeigen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Component to manually trigger onboarding dialog (e.g., from settings)
interface OnboardingResetButtonProps {
  pageKey: PageKey;
  className?: string;
}

export function OnboardingResetButton({ pageKey, className }: OnboardingResetButtonProps) {
  const { resetOnboarding, seenOnboardings } = useHelpStore();
  const hasSeen = seenOnboardings[pageKey] === true;

  if (!hasSeen) {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => resetOnboarding(pageKey)}
      className={cn('rounded-xl', className)}
    >
      Hilfe erneut anzeigen
    </Button>
  );
}
