import type { UserRole } from '@poa/shared';

// Page keys for onboarding dialogs
export type PageKey = 'dashboard' | 'claims' | 'vehicles' | 'reports' | 'settings';

// Help topic keys for inline help popovers
export type HelpTopicKey =
  | 'dashboard-stats'
  | 'dashboard-quickactions'
  | 'claims-list'
  | 'claims-status'
  | 'claims-filters'
  | 'vehicles-list'
  | 'vehicles-add'
  | 'reports-charts'
  | 'reports-export'
  | 'settings-profile'
  | 'settings-company'
  | 'settings-users';

// Onboarding content for each page
interface OnboardingContent {
  title: string;
  description: string;
  tips: string[];
}

// Help topic content
interface HelpTopicContent {
  title: string;
  description: string;
  roleSpecific?: Partial<Record<UserRole, string>>;
}

// Onboarding content per page
export const onboardingContent: Record<PageKey, OnboardingContent> = {
  dashboard: {
    title: 'Willkommen bei POA',
    description:
      'Dies ist Ihre zentrale Uebersicht. Hier sehen Sie alle wichtigen Kennzahlen und koennen schnell auf haeufig genutzte Funktionen zugreifen.',
    tips: [
      'Die Statistikkarten zeigen Ihnen aktuelle Zahlen auf einen Blick',
      'Nutzen Sie den Schnellzugriff fuer haeufige Aktionen',
      'Aktuelle Schaeden werden in der Liste rechts angezeigt',
    ],
  },
  claims: {
    title: 'Schadenverwaltung',
    description:
      'Hier koennen Sie alle Schadenfaelle Ihrer Flotte erfassen, verfolgen und verwalten. Jeder Schaden durchlaeuft einen definierten Workflow.',
    tips: [
      'Nutzen Sie die Filter, um Schaeden schnell zu finden',
      'Klicken Sie auf einen Schaden, um Details zu sehen',
      'Der Status zeigt den aktuellen Bearbeitungsstand',
    ],
  },
  vehicles: {
    title: 'Fuhrparkverwaltung',
    description:
      'Verwalten Sie hier alle Fahrzeuge Ihrer Firma. Sie koennen neue Fahrzeuge hinzufuegen, bestehende bearbeiten oder deaktivieren.',
    tips: [
      'Fahrzeuge mit vielen Schaeden werden hervorgehoben',
      'Sie koennen Fahrzeuge nach Kennzeichen suchen',
      'Klicken Sie auf ein Fahrzeug fuer Details und Historie',
    ],
  },
  reports: {
    title: 'Analysen & Reports',
    description:
      'Analysieren Sie Ihre Schadendaten mit detaillierten Statistiken und Diagrammen. Exportieren Sie Berichte fuer Ihre Unterlagen.',
    tips: [
      'Waehlen Sie den Zeitraum fuer Ihre Analyse',
      'Diagramme zeigen Trends und Verteilungen',
      'Exportieren Sie Daten als CSV oder Excel',
    ],
  },
  settings: {
    title: 'Einstellungen',
    description:
      'Passen Sie die Plattform an Ihre Beduerfnisse an. Verwalten Sie Ihr Profil, Benachrichtigungen und weitere Optionen.',
    tips: [
      'Aktivieren Sie 2FA fuer mehr Sicherheit',
      'Stellen Sie Ihre bevorzugte Sprache ein',
      'Verwalten Sie Benutzer und Berechtigungen',
    ],
  },
};

// Help topic content for inline help
export const helpTopicContent: Record<HelpTopicKey, HelpTopicContent> = {
  'dashboard-stats': {
    title: 'Statistik-Karten',
    description:
      'Diese Karten zeigen Ihnen die wichtigsten Kennzahlen auf einen Blick. Die Zahlen werden automatisch aktualisiert.',
    roleSpecific: {
      EMPLOYEE: 'Sie sehen hier Ihre persoenlichen Schaeden und deren Status.',
      COMPANY_ADMIN: 'Als Administrator sehen Sie die Statistiken fuer die gesamte Firma.',
      BROKER: 'Als Makler sehen Sie aggregierte Daten aller betreuten Firmen.',
    },
  },
  'dashboard-quickactions': {
    title: 'Schnellzugriff',
    description: 'Hier finden Sie Verknuepfungen zu haeufig genutzten Funktionen.',
  },
  'claims-list': {
    title: 'Schadenliste',
    description:
      'Alle Schaeden werden hier aufgelistet. Sortieren und filtern Sie nach verschiedenen Kriterien.',
    roleSpecific: {
      EMPLOYEE: 'Sie sehen hier alle Schaeden, die Sie gemeldet haben.',
      COMPANY_ADMIN: 'Sie sehen alle Schaeden Ihrer Firma und koennen diese freigeben.',
      BROKER: 'Sie haben Zugriff auf Schaeden aller betreuten Firmen.',
    },
  },
  'claims-status': {
    title: 'Schadenstatus',
    description:
      'Jeder Schaden durchlaeuft verschiedene Phasen: Entwurf > Eingereicht > Freigegeben > Gesendet > Bestaetigt > Abgeschlossen.',
  },
  'claims-filters': {
    title: 'Filter & Suche',
    description:
      'Nutzen Sie die Filter, um Schaeden nach Status, Zeitraum, Fahrzeug oder Kategorie einzugrenzen.',
  },
  'vehicles-list': {
    title: 'Fahrzeugliste',
    description: 'Alle Fahrzeuge Ihrer Flotte werden hier angezeigt. Klicken Sie auf ein Fahrzeug fuer Details.',
    roleSpecific: {
      COMPANY_ADMIN: 'Sie koennen Fahrzeuge hinzufuegen, bearbeiten und deaktivieren.',
      BROKER: 'Sie haben Leserechte fuer Fahrzeuge der betreuten Firmen.',
    },
  },
  'vehicles-add': {
    title: 'Fahrzeug hinzufuegen',
    description:
      'Fuegen Sie neue Fahrzeuge zu Ihrer Flotte hinzu. Geben Sie Kennzeichen, Marke, Modell und weitere Details an.',
  },
  'reports-charts': {
    title: 'Diagramme',
    description:
      'Die Diagramme visualisieren Ihre Schadendaten. Fahren Sie mit der Maus ueber Elemente fuer Details.',
  },
  'reports-export': {
    title: 'Datenexport',
    description:
      'Exportieren Sie Ihre Daten als CSV fuer Excel oder andere Programme. Waehlen Sie den gewuenschten Zeitraum.',
  },
  'settings-profile': {
    title: 'Profil',
    description: 'Bearbeiten Sie Ihre persoenlichen Daten wie Name, E-Mail und Passwort.',
  },
  'settings-company': {
    title: 'Firmeneinstellungen',
    description: 'Verwalten Sie die Firmendaten und Konfigurationen.',
    roleSpecific: {
      COMPANY_ADMIN: 'Als Administrator koennen Sie Firmendaten und Einstellungen aendern.',
    },
  },
  'settings-users': {
    title: 'Benutzerverwaltung',
    description: 'Verwalten Sie Benutzerkonten und deren Berechtigungen.',
    roleSpecific: {
      COMPANY_ADMIN: 'Laden Sie neue Mitarbeiter ein oder deaktivieren Sie bestehende Konten.',
    },
  },
};

// Helper function to get role-specific description
export function getHelpTopicDescription(
  topicKey: HelpTopicKey,
  userRole?: UserRole
): string {
  const topic = helpTopicContent[topicKey];
  if (!topic) return '';

  // Check for role-specific content first
  if (userRole && topic.roleSpecific?.[userRole]) {
    return topic.roleSpecific[userRole]!;
  }

  return topic.description;
}

// Helper function to get onboarding content
export function getOnboardingContent(pageKey: PageKey): OnboardingContent | undefined {
  return onboardingContent[pageKey];
}
