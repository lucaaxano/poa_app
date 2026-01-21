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
  const { seenOnboardings, markOnboardingSeen, helpEnabled } = useHelpStore();
  const userRole = useAuthStore((state) => state.user?.role);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [isOpen, setIsOpen] = React.useState(false);

  const content = getOnboardingContent(pageKey);
  const hasPermanentlyDismissed = seenOnboardings[pageKey] === true;
  const isSuperAdmin = userRole === 'SUPERADMIN';

  // Show dialog on mount or when navigating to a new page if:
  // - User is authenticated (auth state is loaded)
  // - Not permanently dismissed by user
  // - Help is enabled
  // - Content exists
  // - User is NOT a SUPERADMIN
  React.useEffect(() => {
    // Reset isOpen when pageKey changes (navigation between pages)
    setIsOpen(false);

    // Wait for auth to be ready
    if (!isAuthenticated) {
      return;
    }

    if (!hasPermanentlyDismissed && helpEnabled && content && !isSuperAdmin) {
      // Small delay to allow page to render first
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [pageKey, isAuthenticated, hasPermanentlyDismissed, helpEnabled, content, isSuperAdmin]);

  // Don't render anything for SUPERADMIN or if no content
  if (!content || isSuperAdmin) {
    return null;
  }

  // "Verstanden" - User understood, just close (will appear again on next visit)
  const handleUnderstood = () => {
    setIsOpen(false);
  };

  // "Spaeter erinnern" - Remind later, just close (will appear again on next visit)
  const handleRemindLater = () => {
    setIsOpen(false);
  };

  // "Nicht mehr erinnern" - Never show again for this page
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
