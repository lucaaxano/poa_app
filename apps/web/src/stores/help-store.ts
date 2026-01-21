import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface HelpState {
  // Track which onboarding dialogs have been seen
  seenOnboardings: Record<string, boolean>;

  // Global toggle for help features
  helpEnabled: boolean;

  // Actions
  markOnboardingSeen: (pageKey: string) => void;
  hasSeenOnboarding: (pageKey: string) => boolean;
  resetOnboarding: (pageKey: string) => void;
  resetAllOnboardings: () => void;
  setHelpEnabled: (enabled: boolean) => void;
}

export const useHelpStore = create<HelpState>()(
  persist(
    (set, get) => ({
      seenOnboardings: {},
      helpEnabled: true,

      markOnboardingSeen: (pageKey: string) => {
        set((state) => ({
          seenOnboardings: {
            ...state.seenOnboardings,
            [pageKey]: true,
          },
        }));
      },

      hasSeenOnboarding: (pageKey: string) => {
        return get().seenOnboardings[pageKey] === true;
      },

      resetOnboarding: (pageKey: string) => {
        set((state) => {
          const { [pageKey]: _, ...rest } = state.seenOnboardings;
          return { seenOnboardings: rest };
        });
      },

      resetAllOnboardings: () => {
        set({ seenOnboardings: {} });
      },

      setHelpEnabled: (enabled: boolean) => {
        set({ helpEnabled: enabled });
      },
    }),
    {
      name: 'poa-help-storage',
      partialize: (state) => ({
        seenOnboardings: state.seenOnboardings,
        helpEnabled: state.helpEnabled,
      }),
    }
  )
);
