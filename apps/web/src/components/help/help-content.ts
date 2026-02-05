import type { UserRole } from '@poa/shared';

// Page keys for onboarding dialogs
export type PageKey = 'dashboard' | 'claims' | 'vehicles' | 'reports' | 'settings'
  | 'users' | 'company' | 'policies' | 'broker' | 'broker-requests' | 'broker-settings';

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
      'Dies ist Ihre zentrale Übersicht. Hier sehen Sie alle wichtigen Kennzahlen und können schnell auf häufig genutzte Funktionen zugreifen.',
    tips: [
      'Die Statistikkarten zeigen Ihnen aktuelle Zahlen auf einen Blick',
      'Nutzen Sie den Schnellzugriff für häufige Aktionen',
      'Aktuelle Schäden werden in der Liste rechts angezeigt',
    ],
  },
  claims: {
    title: 'Schadenverwaltung',
    description:
      'Hier können Sie alle Schadenfälle Ihrer Flotte erfassen, verfolgen und verwalten. Jeder Schaden durchläuft einen definierten Workflow.',
    tips: [
      'Nutzen Sie die Filter, um Schäden schnell zu finden',
      'Klicken Sie auf einen Schaden, um Details zu sehen',
      'Der Status zeigt den aktuellen Bearbeitungsstand',
    ],
  },
  vehicles: {
    title: 'Fuhrparkverwaltung',
    description:
      'Verwalten Sie hier alle Fahrzeuge Ihrer Firma. Sie können neue Fahrzeuge hinzufügen, bestehende bearbeiten oder deaktivieren.',
    tips: [
      'Fahrzeuge mit vielen Schäden werden hervorgehoben',
      'Sie können Fahrzeuge nach Kennzeichen suchen',
      'Klicken Sie auf ein Fahrzeug für Details und Historie',
    ],
  },
  reports: {
    title: 'Analysen & Reports',
    description:
      'Analysieren Sie Ihre Schadendaten mit detaillierten Statistiken und Diagrammen. Exportieren Sie Berichte für Ihre Unterlagen.',
    tips: [
      'Wählen Sie den Zeitraum für Ihre Analyse',
      'Diagramme zeigen Trends und Verteilungen',
      'Exportieren Sie Daten als CSV oder Excel',
    ],
  },
  settings: {
    title: 'Einstellungen',
    description:
      'Passen Sie die Plattform an Ihre Bedürfnisse an. Verwalten Sie Ihr Profil, Benachrichtigungen und weitere Optionen.',
    tips: [
      'Aktivieren Sie 2FA für mehr Sicherheit',
      'Stellen Sie Ihre bevorzugte Sprache ein',
      'Verwalten Sie Benutzer und Berechtigungen',
    ],
  },
  users: {
    title: 'Benutzerverwaltung',
    description: 'Verwalten Sie hier alle Benutzer Ihrer Organisation. Laden Sie neue Mitarbeiter ein oder ändern Sie Berechtigungen.',
    tips: [
      'Laden Sie neue Mitarbeiter per E-Mail ein',
      'Ändern Sie Rollen zwischen Mitarbeiter und Administrator',
      'Deaktivieren Sie Benutzer, die nicht mehr aktiv sind',
    ],
  },
  company: {
    title: 'Firmeneinstellungen',
    description: 'Bearbeiten Sie hier die Stammdaten Ihrer Firma wie Name, Adresse und Kontaktdaten.',
    tips: [
      'Laden Sie Ihr Firmenlogo hoch (max. 2MB)',
      'Halten Sie Ihre Kontaktdaten aktuell',
      'Die Firmendaten erscheinen auf Dokumenten',
    ],
  },
  policies: {
    title: 'Versicherungspolicen',
    description: 'Verwalten Sie hier Ihre Versicherungspolicen. Erfassen Sie neue Policen und behalten Sie den Überblick.',
    tips: [
      'Erfassen Sie alle aktiven Versicherungspolicen',
      'Wählen Sie das passende Preismodell aus',
      'Beachten Sie die Gültigkeitsdaten',
    ],
  },
  broker: {
    title: 'Betreute Firmen',
    description: 'Hier sehen Sie alle Firmen, die Sie als Broker betreuen. Wechseln Sie zwischen den Firmen.',
    tips: [
      'Klicken Sie auf eine Firma, um deren Dashboard zu öffnen',
      'Die Statistiken zeigen aggregierte Daten aller Firmen',
      'Offene Schäden werden rot markiert',
    ],
  },
  'broker-requests': {
    title: 'Broker-Anfragen',
    description: 'Hier sehen Sie Anfragen von Firmen, die Sie als Broker hinzufügen möchten.',
    tips: [
      'Prüfen Sie neue Anfragen regelmäßig',
      'Akzeptieren Sie Anfragen, um Zugriff auf die Firma zu erhalten',
      'Abgelehnte Anfragen können nicht rückgängig gemacht werden',
    ],
  },
  'broker-settings': {
    title: 'Broker-Verwaltung',
    description:
      'Hier verwalten Sie die Broker, die Zugriff auf Ihre Firmendaten haben. Sie können neue Broker einladen oder bestehende Verbindungen entfernen.',
    tips: [
      'Laden Sie Broker per E-Mail-Adresse ein',
      'Broker können Ihre Schadenfälle einsehen und bearbeiten',
      'Entfernen Sie Broker, wenn die Zusammenarbeit beendet ist',
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
      EMPLOYEE: 'Sie sehen hier Ihre persönlichen Schäden und deren Status.',
      COMPANY_ADMIN: 'Als Administrator sehen Sie die Statistiken für die gesamte Firma.',
      BROKER: 'Als Makler sehen Sie aggregierte Daten aller betreuten Firmen.',
    },
  },
  'dashboard-quickactions': {
    title: 'Schnellzugriff',
    description: 'Hier finden Sie Verknüpfungen zu häufig genutzten Funktionen.',
  },
  'claims-list': {
    title: 'Schadenliste',
    description:
      'Alle Schäden werden hier aufgelistet. Sortieren und filtern Sie nach verschiedenen Kriterien.',
    roleSpecific: {
      EMPLOYEE: 'Sie sehen hier alle Schäden, die Sie gemeldet haben.',
      COMPANY_ADMIN: 'Sie sehen alle Schäden Ihrer Firma und können diese freigeben.',
      BROKER: 'Sie haben Zugriff auf Schäden aller betreuten Firmen.',
    },
  },
  'claims-status': {
    title: 'Schadenstatus',
    description:
      'Jeder Schaden durchläuft verschiedene Phasen: Entwurf > Eingereicht > Freigegeben > Gesendet > Bestätigt > Abgeschlossen.',
  },
  'claims-filters': {
    title: 'Filter & Suche',
    description:
      'Nutzen Sie die Filter, um Schäden nach Status, Zeitraum, Fahrzeug oder Kategorie einzugrenzen.',
  },
  'vehicles-list': {
    title: 'Fahrzeugliste',
    description: 'Alle Fahrzeuge Ihrer Flotte werden hier angezeigt. Klicken Sie auf ein Fahrzeug für Details.',
    roleSpecific: {
      COMPANY_ADMIN: 'Sie können Fahrzeuge hinzufügen, bearbeiten und deaktivieren.',
      BROKER: 'Sie haben Leserechte für Fahrzeuge der betreuten Firmen.',
    },
  },
  'vehicles-add': {
    title: 'Fahrzeug hinzufügen',
    description:
      'Fügen Sie neue Fahrzeuge zu Ihrer Flotte hinzu. Geben Sie Kennzeichen, Marke, Modell und weitere Details an.',
  },
  'reports-charts': {
    title: 'Diagramme',
    description:
      'Die Diagramme visualisieren Ihre Schadendaten. Fahren Sie mit der Maus über Elemente für Details.',
  },
  'reports-export': {
    title: 'Datenexport',
    description:
      'Exportieren Sie Ihre Daten als CSV für Excel oder andere Programme. Wählen Sie den gewünschten Zeitraum.',
  },
  'settings-profile': {
    title: 'Profil',
    description: 'Bearbeiten Sie Ihre persönlichen Daten wie Name, E-Mail und Passwort.',
  },
  'settings-company': {
    title: 'Firmeneinstellungen',
    description: 'Verwalten Sie die Firmendaten und Konfigurationen.',
    roleSpecific: {
      COMPANY_ADMIN: 'Als Administrator können Sie Firmendaten und Einstellungen ändern.',
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
