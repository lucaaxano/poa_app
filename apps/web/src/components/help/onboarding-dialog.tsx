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
import { useAuthStore } from '@/stores/auth-store';
import { getOnboardingContent, type PageKey } from './help-content';
import { cn } from '@/lib/utils';

interface OnboardingDialogProps {
  pageKey: PageKey;
  className?: string;
}

export function OnboardingDialog({ pageKey, className }: OnboardingDialogProps) {
  const seenOnboardings = useHelpStore((state) => state.seenOnboardings);
  const markOnboardingSeen = useHelpStore((state) => state.markOnboardingSeen);
  const userRole = useAuthStore((state) => state.user?.role);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [isOpen, setIsOpen] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);

  const content = getOnboardingContent(pageKey);
  const hasPermanentlyDismissed = seenOnboardings[pageKey] === true;
  const isSuperAdmin = userRole === 'SUPERADMIN';

  // Wait for client-side mount (hydration complete)
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Show dialog when all conditions are met
  React.useEffect(() => {
    // Wait for component to be mounted (client-side)
    if (!isMounted) {
      return;
    }

    // Wait for authentication to be ready
    if (!isAuthenticated) {
      return;
    }

    // Don't show for SUPERADMIN
    if (isSuperAdmin) {
      return;
    }

    // Don't show if no content for this page
    if (!content) {
      return;
    }

    // Don't show if user has permanently dismissed this popup
    if (hasPermanentlyDismissed) {
      return;
    }

    // Show the popup after a small delay to allow page to render
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 800);

    return () => clearTimeout(timer);
  }, [isMounted, isAuthenticated, isSuperAdmin, content, hasPermanentlyDismissed, pageKey]);

  // Reset when navigating to a new page
  React.useEffect(() => {
    setIsOpen(false);
  }, [pageKey]);

  // Don't render anything server-side or for SUPERADMIN
  if (!isMounted || !content || isSuperAdmin) {
    return null;
  }

  // "Verstanden" - User understood, just close (will appear again on next page visit)
  const handleUnderstood = () => {
    setIsOpen(false);
  };

  // "Spaeter erinnern" - Same as understood, just close
  const handleRemindLater = () => {
    setIsOpen(false);
  };

  // "Nicht mehr erinnern" - Permanently disable this popup
  const handleNeverShowAgain = () => {
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
          {/* Primary action: User understood */}
          <Button
            onClick={handleUnderstood}
            className="w-full rounded-xl"
          >
            Verstanden
          </Button>
          {/* Secondary action: Remind later */}
          <Button
            variant="outline"
            onClick={handleRemindLater}
            className="w-full rounded-xl"
          >
            Spaeter erinnern
          </Button>
          {/* Tertiary action: Never show again */}
          <Button
            variant="ghost"
            onClick={handleNeverShowAgain}
            className="w-full rounded-xl text-muted-foreground hover:text-foreground"
          >
            Nicht mehr erinnern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Component to manually trigger onboarding dialog reset (e.g., from settings)
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
