# Hyperdetaillierter Projektplan
# Point-of-Accident (POA) - KFZ-Schadenmanagement-System

**Version:** 1.0
**Erstellt:** 15. Dezember 2025

---

## Projektübersicht

### Entwicklungsansatz
1. **Web-First:** Komplette Web-Applikation mit allen Rollen (Admin, Mitarbeiter, Broker)
2. **Docker-basiert:** Lokale Entwicklung über Docker Desktop
3. **Mobile später:** React Native App für Mitarbeiter nach Web-Fertigstellung

### Phasenübersicht
```
Phase 0: Projekt-Setup & Infrastruktur
Phase 1: Authentifizierung & Grundgerüst
Phase 2: Firmen-Admin Core Features
Phase 3: Schadenmanagement (Kern)
Phase 4: E-Mail Integration & Kommunikation
Phase 5: Mitarbeiter-Portal
Phase 6: Broker-Portal
Phase 7: Reporting & Auswertungen
Phase 8: Benachrichtigungen & Polish
Phase 9: KI-Integration (Chatbot)
Phase 10: Mobile App
Phase 11: Billing & Go-Live
```

---

## Phase 0: Projekt-Setup & Infrastruktur

### 0.1 Repository & Projektstruktur erstellen

#### 0.1.1 Monorepo-Struktur anlegen
```
poa-app/
├── apps/
│   ├── web/                 # Next.js Frontend
│   └── api/                 # Node.js Backend
├── packages/
│   ├── shared/              # Shared Types, Utils
│   ├── database/            # Prisma Schema, Migrations
│   └── ui/                  # Shared UI Components (optional)
├── docker/
│   ├── docker-compose.yml
│   ├── docker-compose.dev.yml
│   └── Dockerfile.*
├── docs/
│   ├── PRD.md
│   └── PROJEKTPLAN.md
├── .github/
│   └── workflows/
├── package.json
├── turbo.json              # Turborepo config
└── README.md
```

**Tasks:**
- [ ] Git Repository initialisieren
- [ ] Monorepo mit Turborepo oder npm workspaces aufsetzen
- [ ] Basis package.json mit Scripts erstellen
- [ ] .gitignore konfigurieren
- [ ] README.md mit Setup-Anleitung erstellen

#### 0.1.2 Next.js Frontend (apps/web) initialisieren
```bash
npx create-next-app@latest apps/web --typescript --tailwind --eslint --app --src-dir
```

**Tasks:**
- [ ] Next.js 14+ mit App Router erstellen
- [ ] TypeScript konfigurieren (strict mode)
- [ ] TailwindCSS Setup verifizieren
- [ ] shadcn/ui initialisieren (`npx shadcn-ui@latest init`)
- [ ] Basis-Komponenten installieren (Button, Input, Card, etc.)
- [ ] ESLint + Prettier konfigurieren
- [ ] Path aliases einrichten (@/components, etc.)

#### 0.1.3 Node.js Backend (apps/api) initialisieren
**Option A: Express (schneller Start)**
```bash
mkdir -p apps/api/src
cd apps/api
npm init -y
npm install express cors helmet dotenv
npm install -D typescript @types/node @types/express ts-node nodemon
```

**Option B: NestJS (strukturierter)**
```bash
npx @nestjs/cli new apps/api --package-manager npm
```

**Tasks:**
- [ ] Backend-Projekt erstellen (Express oder NestJS)
- [ ] TypeScript konfigurieren
- [ ] Projektstruktur anlegen:
  ```
  src/
  ├── controllers/
  ├── services/
  ├── middleware/
  ├── routes/
  ├── utils/
  ├── types/
  └── index.ts
  ```
- [ ] Basis-Server mit Health-Endpoint erstellen
- [ ] Environment Variables Setup (.env.example)
- [ ] Error Handling Middleware
- [ ] Request Logging (Morgan oder Winston)

### 0.2 Docker Development Environment

#### 0.2.1 Docker Compose Setup
**Tasks:**
- [ ] docker-compose.dev.yml erstellen:
  ```yaml
  version: '3.8'
  services:
    web:
      build:
        context: ./apps/web
        dockerfile: Dockerfile.dev
      ports:
        - "3000:3000"
      volumes:
        - ./apps/web:/app
        - /app/node_modules
      environment:
        - NEXT_PUBLIC_API_URL=http://localhost:4000
      depends_on:
        - api

    api:
      build:
        context: ./apps/api
        dockerfile: Dockerfile.dev
      ports:
        - "4000:4000"
      volumes:
        - ./apps/api:/app
        - /app/node_modules
      environment:
        - DATABASE_URL=postgresql://postgres:postgres@db:5432/poa
        - JWT_SECRET=dev-secret-change-in-production
      depends_on:
        - db

    db:
      image: postgres:15-alpine
      ports:
        - "5432:5432"
      environment:
        - POSTGRES_USER=postgres
        - POSTGRES_PASSWORD=postgres
        - POSTGRES_DB=poa
      volumes:
        - postgres_data:/var/lib/postgresql/data

    storage:
      image: minio/minio
      ports:
        - "9000:9000"
        - "9001:9001"
      environment:
        - MINIO_ROOT_USER=minioadmin
        - MINIO_ROOT_PASSWORD=minioadmin
      command: server /data --console-address ":9001"
      volumes:
        - minio_data:/data

    maildev:
      image: maildev/maildev
      ports:
        - "1080:1080"
        - "1025:1025"

  volumes:
    postgres_data:
    minio_data:
  ```

- [ ] Dockerfile.dev für Web erstellen
- [ ] Dockerfile.dev für API erstellen
- [ ] docker-compose up testen
- [ ] Hot-Reload verifizieren

### 0.3 Datenbank Setup

#### 0.3.1 Prisma initialisieren
```bash
cd packages/database
npm init -y
npm install prisma @prisma/client
npx prisma init
```

**Tasks:**
- [ ] Prisma Schema erstellen (packages/database/prisma/schema.prisma)
- [ ] Alle Tabellen definieren (siehe PRD Datenmodell)
- [ ] Enums definieren:
  ```prisma
  enum UserRole {
    EMPLOYEE
    COMPANY_ADMIN
    BROKER
    SUPERADMIN
  }

  enum ClaimStatus {
    DRAFT
    SUBMITTED
    APPROVED
    SENT
    ACKNOWLEDGED
    CLOSED
    REJECTED
  }

  enum DamageCategory {
    LIABILITY
    COMPREHENSIVE
    GLASS
    WILDLIFE
    PARKING
    THEFT
    VANDALISM
    OTHER
  }

  enum VehicleType {
    CAR
    TRUCK
    VAN
    MOTORCYCLE
    OTHER
  }

  enum FileType {
    IMAGE
    VIDEO
    PDF
    OTHER
  }
  ```
- [ ] Relations definieren
- [ ] Indexes für Performance erstellen
- [ ] Erste Migration erstellen: `npx prisma migrate dev --name init`
- [ ] Prisma Client generieren

#### 0.3.2 Seed-Daten erstellen
**Tasks:**
- [ ] Seed-Script erstellen (prisma/seed.ts)
- [ ] Demo-Versicherer anlegen (Allianz, HUK, etc.)
- [ ] Demo-Firma mit Admin, Mitarbeitern, Fahrzeugen
- [ ] Demo-Schäden in verschiedenen Status
- [ ] Seed-Command in package.json

### 0.4 Shared Package

#### 0.4.1 Types & Validation
**Tasks:**
- [ ] packages/shared erstellen
- [ ] Shared TypeScript Types:
  ```typescript
  // types/user.ts
  export interface User {
    id: string;
    email: string;
    role: UserRole;
    // ...
  }

  // types/claim.ts
  export interface Claim {
    id: string;
    status: ClaimStatus;
    // ...
  }
  ```
- [ ] Zod Schemas für Validation (shared zwischen Frontend & Backend)
- [ ] API Response Types
- [ ] Error Types

### 0.5 Development Tooling

**Tasks:**
- [ ] Husky für Git Hooks installieren
- [ ] lint-staged konfigurieren
- [ ] Commit Message Convention (Conventional Commits)
- [ ] VSCode/Cursor Settings für Team (.vscode/settings.json)
- [ ] VSCode Extensions empfehlen (.vscode/extensions.json)

---

## Phase 1: Authentifizierung & Grundgerüst

### 1.1 Backend Auth System

#### 1.1.1 Auth Service implementieren
**Tasks:**
- [ ] Password Hashing mit bcrypt oder argon2
- [ ] JWT Token Generation (Access + Refresh)
- [ ] Token Verification Middleware
- [ ] Session/Token Storage Strategie definieren

#### 1.1.2 Auth Endpoints implementieren
**POST /auth/register**
- [ ] Request Validation (Zod)
- [ ] Company erstellen
- [ ] Admin User erstellen
- [ ] E-Mail Verifizierung Token generieren
- [ ] Verification E-Mail senden (queue für später)
- [ ] Response mit User (ohne sensible Daten)

**POST /auth/login**
- [ ] E-Mail/Password validieren
- [ ] Check: User aktiv?
- [ ] Check: E-Mail verifiziert?
- [ ] Access Token + Refresh Token generieren
- [ ] Last Login updaten
- [ ] Response mit Tokens + User

**POST /auth/logout**
- [ ] Token invalidieren (Blacklist oder einfach Client-seitig löschen)

**POST /auth/forgot-password**
- [ ] E-Mail validieren
- [ ] Reset Token generieren (mit Expiry)
- [ ] Reset E-Mail senden
- [ ] Keine Info ob E-Mail existiert (Security)

**POST /auth/reset-password**
- [ ] Token validieren
- [ ] Neues Passwort hashen
- [ ] Passwort updaten
- [ ] Alle Sessions invalidieren

**GET /auth/me**
- [ ] Aktuellen User aus Token extrahieren
- [ ] User + Company Daten zurückgeben

**POST /auth/verify-email**
- [ ] Token validieren
- [ ] email_verified_at setzen

#### 1.1.3 Authorization Middleware
**Tasks:**
- [ ] requireAuth Middleware (Token prüfen)
- [ ] requireRole Middleware (Rolle prüfen)
- [ ] requireCompanyAccess Middleware (Mandant prüfen)
- [ ] Broker-Zugriff auf mehrere Companies handlen

### 1.2 Frontend Auth

#### 1.2.1 Auth Context & State
**Tasks:**
- [ ] AuthContext erstellen
- [ ] useAuth Hook
- [ ] Token Storage (httpOnly Cookie empfohlen, oder localStorage)
- [ ] Auto-Refresh Logic
- [ ] Logout Handler

#### 1.2.2 Auth Pages
**Landing Page (/)**
- [ ] Hero Section
- [ ] Feature Übersicht
- [ ] Pricing Preview (Platzhalter)
- [ ] CTA → Login/Register

**Login Page (/login)**
- [ ] Login Form (E-Mail, Passwort)
- [ ] Validation
- [ ] Error Handling (falsche Credentials, etc.)
- [ ] "Passwort vergessen" Link
- [ ] Redirect nach Login (Dashboard)

**Register Page (/register)**
- [ ] Multi-Step Form:
  1. Firmendaten (Name, Anzahl Fahrzeuge)
  2. Admin-Daten (Name, E-Mail)
  3. Passwort setzen
- [ ] Form Validation
- [ ] Submit & Feedback
- [ ] E-Mail Verification Hinweis

**Forgot Password Page (/forgot-password)**
- [ ] E-Mail Input
- [ ] Submit
- [ ] Success Message

**Reset Password Page (/reset-password)**
- [ ] Token aus URL
- [ ] Neues Passwort + Bestätigung
- [ ] Submit
- [ ] Redirect zu Login

**Verify Email Page (/verify-email)**
- [ ] Token aus URL
- [ ] Automatische Verifizierung
- [ ] Success/Error Feedback
- [ ] Link zu Login

#### 1.2.3 Protected Routes
**Tasks:**
- [ ] Middleware für geschützte Routes
- [ ] Redirect zu Login wenn nicht authentifiziert
- [ ] Role-based Route Guards
- [ ] Layout für authentifizierte Bereiche (Sidebar, Header)

### 1.3 App Layout

#### 1.3.1 Authenticated Layout
**Tasks:**
- [ ] Sidebar mit Navigation
- [ ] Header mit User-Menu
- [ ] Notification Bell (Platzhalter)
- [ ] Mobile-responsive (Hamburger Menu)
- [ ] Breadcrumbs

#### 1.3.2 Role-based Navigation
**Tasks:**
- [ ] Navigation Items pro Rolle definieren
- [ ] Dynamische Sidebar basierend auf Rolle
- [ ] Permission Checks für Navigation Items

---

## Phase 2: Firmen-Admin Core Features

### 2.1 Dashboard

#### 2.1.1 Admin Dashboard Page (/dashboard)
**Tasks:**
- [ ] Dashboard Layout mit Grid
- [ ] Stats Cards:
  - Anzahl Schäden (gesamt)
  - Neue Schäden (heute/Woche)
  - Offene Schäden
  - Summe (optional)
- [ ] Quick Actions (Neuer Schaden, etc.)
- [ ] Letzte Schäden (Mini-Liste)
- [ ] Placeholder für Charts

#### 2.1.2 Backend Endpoints
**GET /companies/:id/stats**
- [ ] Anzahl Claims pro Status
- [ ] Summe estimated_cost, final_cost
- [ ] Trend letzte 30 Tage

### 2.2 Fahrzeugverwaltung

#### 2.2.1 Backend Endpoints
**GET /vehicles**
- [ ] Liste aller Fahrzeuge der Company
- [ ] Pagination
- [ ] Filter (aktiv/inaktiv, Typ)
- [ ] Sortierung

**POST /vehicles**
- [ ] Validation
- [ ] Fahrzeug erstellen
- [ ] company_id aus Auth Context

**GET /vehicles/:id**
- [ ] Einzelnes Fahrzeug
- [ ] Company Check

**PATCH /vehicles/:id**
- [ ] Update Felder
- [ ] Validation

**DELETE /vehicles/:id**
- [ ] Nicht löschen wenn Claims existieren
- [ ] Stattdessen: is_active = false

#### 2.2.2 Frontend Pages
**Fahrzeuge Übersicht (/vehicles)**
- [ ] DataTable mit Pagination
- [ ] Filter (Aktiv/Inaktiv, Typ)
- [ ] Suche (Kennzeichen, Marke)
- [ ] Sortierung
- [ ] "Neues Fahrzeug" Button
- [ ] Row Actions (Edit, Deactivate)

**Fahrzeug erstellen/bearbeiten (/vehicles/new, /vehicles/:id/edit)**
- [ ] Form mit allen Feldern
- [ ] Validation
- [ ] Success/Error Feedback
- [ ] Zurück zur Liste

**Fahrzeug Detail (/vehicles/:id)**
- [ ] Alle Fahrzeugdaten
- [ ] Liste zugehöriger Schäden
- [ ] Edit Button

### 2.3 Benutzerverwaltung

#### 2.3.1 Backend Endpoints
**GET /users**
- [ ] Liste aller User der Company
- [ ] Pagination
- [ ] Filter (Rolle, Aktiv)

**POST /users/invite**
- [ ] Invitation erstellen
- [ ] E-Mail senden
- [ ] Token generieren

**GET /invitations**
- [ ] Ausstehende Einladungen

**DELETE /invitations/:id**
- [ ] Einladung widerrufen

**PATCH /users/:id**
- [ ] User updaten (Rolle, aktiv, etc.)

**DELETE /users/:id**
- [ ] User deaktivieren (nicht löschen)

**POST /auth/accept-invitation**
- [ ] Token validieren
- [ ] User erstellen oder Company hinzufügen
- [ ] Invitation accepted_at setzen

#### 2.3.2 Frontend Pages
**Benutzer Übersicht (/settings/users)**
- [ ] DataTable mit Usern
- [ ] Filter (Rolle, Status)
- [ ] "Einladen" Button
- [ ] Row Actions (Edit Role, Deactivate)

**Einladen Modal**
- [ ] E-Mail Input
- [ ] Rolle auswählen (Employee, Broker)
- [ ] Submit
- [ ] Pending Invitations Liste

**Accept Invitation Page (/accept-invitation)**
- [ ] Token validieren
- [ ] Name, Passwort Form
- [ ] Submit
- [ ] Auto-Login & Redirect

### 2.4 Versicherungen & Policies

#### 2.4.1 Backend Endpoints
**GET /insurers**
- [ ] Liste aller Versicherer (global)
- [ ] Öffentlich oder Auth required?

**GET /policies**
- [ ] Policies der Company

**POST /policies**
- [ ] Policy erstellen

**PATCH /policies/:id**
- [ ] Policy updaten

**DELETE /policies/:id**
- [ ] Policy deaktivieren

#### 2.4.2 Frontend Pages
**Versicherungen (/settings/policies)**
- [ ] Liste aller Policies
- [ ] Versicherer anzeigen
- [ ] "Neue Policy" Button
- [ ] Edit/Delete Actions

**Policy erstellen/bearbeiten**
- [ ] Versicherer auswählen (Dropdown)
- [ ] Vertragsnummer
- [ ] Deckungsart
- [ ] Preismodell
- [ ] Gültigkeit
- [ ] Submit

### 2.5 Firmenprofil

#### 2.5.1 Backend Endpoints
**GET /companies/:id**
- [ ] Company Details

**PATCH /companies/:id**
- [ ] Company updaten

#### 2.5.2 Frontend Page
**Firmenprofil (/settings/company)**
- [ ] Firmenname
- [ ] Adresse
- [ ] Anzahl Mitarbeiter/Fahrzeuge (read-only, berechnet)
- [ ] Save Button

---

## Phase 3: Schadenmanagement (Kern)

### 3.1 Schaden erstellen

#### 3.1.1 Backend Endpoints
**POST /claims**
- [ ] Validation (Fahrzeug existiert, Policy optional)
- [ ] claim_number generieren (z.B. "CLM-2024-00001")
- [ ] Status: SUBMITTED (wenn Mitarbeiter) oder DRAFT
- [ ] reporter_user_id setzen
- [ ] Claim Event erstellen (CREATED)

**POST /claims/:id/attachments**
- [ ] File Upload zu Storage (MinIO/S3)
- [ ] Attachment Record erstellen
- [ ] File Type Detection

#### 3.1.2 Frontend Page
**Neuer Schaden (/claims/new)**
- [ ] Multi-Step Form oder Single Page
- [ ] Step 1: Fahrzeug & Datum
  - Fahrzeug Dropdown (aus Firmenfuhrpark)
  - Unfalldatum (Date Picker)
  - Unfallzeit (Time Input)
  - Fahrer (optional, Dropdown oder "ich selbst")
- [ ] Step 2: Ort & Umstände
  - Unfallort (Freitext)
  - GPS-Button (Browser Geolocation)
  - Schadenart (Kategorie Dropdown)
  - Unterkategorie (dynamisch)
  - Polizei involviert (Checkbox)
  - Aktenzeichen (wenn ja)
- [ ] Step 3: Beschreibung
  - Textarea für Beschreibung
  - Personenschaden (Checkbox + Details)
  - Gegner-Infos (optional, aufklappbar)
  - Zeugen (optional)
- [ ] Step 4: Fotos
  - Drag & Drop Upload
  - Kamera-Button (Mobile)
  - Preview der Uploads
  - Löschen Button
- [ ] Step 5: Zusammenfassung
  - Alle Daten anzeigen
  - Edit Links zu vorherigen Steps
  - "Schaden melden" Button

### 3.2 Schäden auflisten

#### 3.2.1 Backend Endpoint
**GET /claims**
- [ ] Pagination
- [ ] Filter:
  - status (multi-select)
  - vehicle_id
  - driver_user_id
  - date_from, date_to
  - damage_category
- [ ] Sortierung (created_at, accident_date)
- [ ] Suche (claim_number, license_plate)
- [ ] Include: vehicle, reporter, driver (relations)

#### 3.2.2 Frontend Page
**Schäden Übersicht (/claims)**
- [ ] DataTable mit Columns:
  - Schadennummer
  - Datum
  - Fahrzeug (Kennzeichen)
  - Kategorie
  - Status (Badge)
  - Kosten (wenn vorhanden)
  - Actions
- [ ] Filter Panel:
  - Status Multi-Select
  - Zeitraum (Date Range Picker)
  - Fahrzeug Dropdown
  - Kategorie Dropdown
- [ ] Tabs oder Quick-Filter für Status
- [ ] "Neuer Schaden" Button
- [ ] Bulk Actions (optional)

### 3.3 Schaden Detailansicht

#### 3.3.1 Backend Endpoints
**GET /claims/:id**
- [ ] Claim mit allen Relations
- [ ] Attachments
- [ ] Events (History)
- [ ] Comments

**PATCH /claims/:id**
- [ ] Update erlaubter Felder
- [ ] Status Change validieren
- [ ] Event erstellen bei Änderung

**POST /claims/:id/submit**
- [ ] Status → SUBMITTED
- [ ] Event erstellen
- [ ] Notification an Admin

**POST /claims/:id/approve**
- [ ] Status → APPROVED
- [ ] Event erstellen

**POST /claims/:id/reject**
- [ ] Status → REJECTED
- [ ] rejection_reason erforderlich
- [ ] Event erstellen
- [ ] Notification an Reporter

**POST /claims/:id/send**
- [ ] (Phase 4 - E-Mail senden)
- [ ] Status → SENT

#### 3.3.2 Frontend Page
**Schaden Detail (/claims/:id)**
- [ ] Header mit Status Badge und Schadennummer
- [ ] Actions Bar:
  - "Freigeben" (wenn SUBMITTED)
  - "Ablehnen" (wenn SUBMITTED)
  - "An Versicherung senden" (wenn APPROVED)
  - "Bearbeiten"
  - "Status ändern"
- [ ] Tabs:
  1. **Details**
     - Alle Schadeninfos in Sections
     - Inline-Edit für bestimmte Felder
  2. **Anhänge**
     - Galerie der Bilder
     - Download-Links für Dokumente
     - Upload weitere Anhänge
  3. **Verlauf**
     - Timeline der Events
     - Wer hat wann was gemacht
  4. **Kommentare**
     - Kommentar-Thread
     - Neuer Kommentar Input
- [ ] Sidebar:
  - Quick Info (Fahrzeug, Fahrer)
  - Kosten bearbeiten
  - Versicherer-Schadennummer eintragen

### 3.4 Kommentare

#### 3.4.1 Backend Endpoints
**GET /claims/:id/comments**
- [ ] Kommentare zum Claim
- [ ] Include: user (author)

**POST /claims/:id/comments**
- [ ] Kommentar erstellen
- [ ] Event erstellen (COMMENT_ADDED)
- [ ] Notification an beteiligte User

#### 3.4.2 Frontend
**Kommentar-Section in Detail**
- [ ] Kommentar-Liste
- [ ] User Avatar + Name + Zeit
- [ ] Kommentar Text
- [ ] "Neuer Kommentar" Input
- [ ] Submit Button

---

## Phase 4: E-Mail Integration & Kommunikation

### 4.1 E-Mail Service Setup

#### 4.1.1 E-Mail Provider Integration
**Tasks:**
- [ ] Resend oder SendGrid Account erstellen
- [ ] API Key konfigurieren
- [ ] E-Mail Service/Module erstellen
- [ ] Templates für verschiedene E-Mail-Typen:
  - Registrierung (Verification)
  - Passwort Reset
  - Einladung
  - Schadenmeldung an Versicherer
  - Benachrichtigungen

#### 4.1.2 E-Mail Templates
**Schadenmeldung Template**
```
Betreff: [{{policy_number}}] Schadenmeldung vom {{accident_date}} - {{license_plate}}

Sehr geehrte Damen und Herren,

hiermit melden wir folgenden Schaden:

VERTRAGSDATEN
Vertragsnummer: {{policy_number}}
Versicherungsnehmer: {{company_name}}

FAHRZEUGDATEN
Kennzeichen: {{license_plate}}
Marke/Modell: {{brand}} {{model}}
FIN: {{vin}}

SCHADENDATEN
Datum/Uhrzeit: {{accident_date}} um {{accident_time}} Uhr
Ort: {{accident_location}}
Schadenart: {{damage_category}}

HERGANG
{{description}}

WEITERE ANGABEN
Polizei involviert: {{police_involved}}
{{#if police_file_number}}Aktenzeichen: {{police_file_number}}{{/if}}
Personenschaden: {{has_injuries}}

Im Anhang finden Sie Fotos vom Schaden.

Mit freundlichen Grüßen
{{reporter_name}}
{{company_name}}

---
Diese Meldung wurde automatisch über POA (Point-of-Accident) erstellt.
```

**Tasks:**
- [ ] Handlebars oder ähnliche Template Engine
- [ ] E-Mail Template Storage (Code oder DB)
- [ ] Template Rendering Service
- [ ] PDF Generation (optional)

### 4.2 Versand an Versicherung

#### 4.2.1 Backend Implementation
**POST /claims/:id/send**
- [ ] Claim laden mit allen Relations
- [ ] Policy → Insurer → claims_email
- [ ] E-Mail generieren:
  - Template rendern
  - Attachments anhängen
  - From-Adresse konfigurieren
- [ ] E-Mail senden
- [ ] Bei Erfolg:
  - Status → SENT
  - sent_at setzen
  - Event erstellen (EMAIL_SENT mit Message-ID)
- [ ] Bei Fehler:
  - Error loggen
  - Retry Queue (optional)
  - User informieren

#### 4.2.2 E-Mail Protokollierung
**Tasks:**
- [ ] Email Logs Tabelle (optional, oder in claim_events)
- [ ] Speichern:
  - Recipient
  - Subject
  - Message-ID
  - Status (sent, bounced, etc.)
  - Timestamp

### 4.3 Transaktionale E-Mails

#### 4.3.1 Registration & Auth E-Mails
**Tasks:**
- [ ] Verification E-Mail nach Registrierung
- [ ] Password Reset E-Mail
- [ ] Invitation E-Mail

#### 4.3.2 Notification E-Mails
**Tasks:**
- [ ] Neuer Schaden eingegangen (an Admin)
- [ ] Schaden freigegeben/abgelehnt (an Reporter)
- [ ] Neuer Kommentar (an beteiligte)

---

## Phase 5: Mitarbeiter-Portal

### 5.1 Employee Dashboard

#### 5.1.1 Vereinfachtes Dashboard
**Tasks:**
- [ ] Employee-specific Layout
- [ ] Stats: Nur eigene Schäden
- [ ] Quick Action: "Neuer Schaden"
- [ ] Liste der eigenen Schäden

### 5.2 Eigene Schäden

#### 5.2.1 Backend Anpassungen
**Tasks:**
- [ ] GET /claims: Für EMPLOYEE nur eigene (reporter_user_id ODER driver_user_id)
- [ ] Permission Check: Employee kann nur eigene sehen

#### 5.2.2 Frontend
**Meine Schäden (/claims)**
- [ ] Gefilterte Liste (nur eigene)
- [ ] Kein Filter nach Fahrer
- [ ] Detailansicht (read-mostly, kann kommentieren)

### 5.3 Profil

#### 5.3.1 Backend
**GET /auth/me**
- [ ] Bereits implementiert

**PATCH /users/:id**
- [ ] User kann eigenes Profil bearbeiten

#### 5.3.2 Frontend
**Profil (/profile)**
- [ ] Name, E-Mail anzeigen
- [ ] Telefon bearbeiten
- [ ] Passwort ändern
- [ ] Benachrichtigungseinstellungen

---

## Phase 6: Broker-Portal

### 6.1 Broker Dashboard

#### 6.1.1 Multi-Company Dashboard
**Tasks:**
- [ ] Stats über alle betreuten Firmen
- [ ] Firma-Auswahl (Dropdown oder Tabs)
- [ ] Aggregierte Ansichten

### 6.2 Backend Anpassungen

#### 6.2.1 Broker-Zugriff
**Tasks:**
- [ ] broker_company_links Logik
- [ ] GET /broker/companies: Alle Firmen des Brokers
- [ ] Alle Endpoints prüfen auf Broker-Berechtigung
- [ ] Filter nach company_id für Broker ermöglichen

### 6.3 Frontend Anpassungen

#### 6.3.1 Broker-spezifische UI
**Tasks:**
- [ ] Company Switcher in Header/Sidebar
- [ ] Firmen-Übersicht Page
- [ ] Schäden-Liste mit Company-Spalte
- [ ] Aggregiertes Reporting

### 6.4 Broker Einladung

#### 6.4.1 Backend
**Tasks:**
- [ ] Invitation mit role=BROKER
- [ ] broker_company_link bei Annahme erstellen
- [ ] Broker kann von mehreren Firmen eingeladen werden

---

## Phase 7: Reporting & Auswertungen

### 7.1 Dashboard Charts

#### 7.1.1 Backend Endpoints
**GET /companies/:id/stats/timeline**
- [ ] Schäden pro Monat/Woche
- [ ] Kosten pro Monat

**GET /companies/:id/stats/by-vehicle**
- [ ] Schäden pro Fahrzeug

**GET /companies/:id/stats/by-driver**
- [ ] Schäden pro Fahrer (anonymisiert oder nicht)

**GET /companies/:id/stats/by-category**
- [ ] Schäden pro Kategorie

#### 7.1.2 Frontend Charts
**Tasks:**
- [ ] Chart Library integrieren (Recharts, Chart.js, etc.)
- [ ] Line Chart: Schäden über Zeit
- [ ] Bar Chart: Schäden pro Fahrzeug
- [ ] Pie Chart: Schäden nach Kategorie
- [ ] Trend-Indikatoren (vs. Vormonat)

### 7.2 Quota/Auslastung

#### 7.2.1 Backend Berechnung
**Tasks:**
- [ ] Quota-Berechnung je nach Pricing Model
- [ ] Formel: Summe Schäden / Jahresbeitrag
- [ ] Historische Werte speichern (Snapshots)

#### 7.2.2 Frontend Visualisierung
**Tasks:**
- [ ] Quota-Anzeige auf Dashboard
- [ ] Progress Bar oder Gauge Chart
- [ ] Warnung bei Schwellenwert-Überschreitung
- [ ] Historischer Verlauf

### 7.3 Export Funktionen

#### 7.3.1 Backend Endpoints
**GET /claims/export**
- [ ] Query Parameter: format (csv, xlsx)
- [ ] Filter wie bei GET /claims
- [ ] File generieren und zurückgeben

#### 7.3.2 Frontend
**Tasks:**
- [ ] Export Button in Schäden-Liste
- [ ] Format-Auswahl (CSV, Excel)
- [ ] Download triggern

---

## Phase 8: Benachrichtigungen & Polish

### 8.1 In-App Notifications

#### 8.1.1 Backend
**Notifications Service**
- [ ] Notification erstellen bei Events
- [ ] GET /notifications
- [ ] PATCH /notifications/:id/read
- [ ] POST /notifications/read-all
- [ ] WebSocket für Real-time (optional, später)

#### 8.1.2 Frontend
**Notification Bell**
- [ ] Badge mit Anzahl ungelesener
- [ ] Dropdown mit Liste
- [ ] Click → zum Objekt navigieren
- [ ] "Alle gelesen" Button

### 8.2 E-Mail Preferences

#### 8.2.1 Backend
**Tasks:**
- [ ] notification_settings in User
- [ ] Prüfen vor E-Mail-Versand

#### 8.2.2 Frontend
**Tasks:**
- [ ] Settings Page für Notifications
- [ ] Toggle pro Notification Type
- [ ] Instant vs. Daily Digest

### 8.3 UI/UX Polish

#### 8.3.1 Loading States
**Tasks:**
- [ ] Skeleton Loaders für Listen
- [ ] Button Loading States
- [ ] Page Transitions

#### 8.3.2 Error Handling
**Tasks:**
- [ ] Toast Notifications für Errors
- [ ] Error Boundaries
- [ ] Retry Buttons
- [ ] Offline Handling (basic)

#### 8.3.3 Empty States
**Tasks:**
- [ ] Leere Listen (keine Schäden, etc.)
- [ ] Hilfreiche Messages
- [ ] CTAs (z.B. "Ersten Schaden melden")

#### 8.3.4 Accessibility
**Tasks:**
- [ ] Keyboard Navigation
- [ ] Focus States
- [ ] Screen Reader Labels
- [ ] Color Contrast Check

---

## Phase 9: KI-Integration (Chatbot)

### 9.1 Backend AI Service

#### 9.1.1 OpenAI Integration
**Tasks:**
- [ ] OpenAI API Key konfigurieren
- [ ] AI Service erstellen
- [ ] Rate Limiting
- [ ] Error Handling

#### 9.1.2 Chat Endpoint
**POST /claims/chat**
- [ ] Conversation History empfangen
- [ ] System Prompt für Schadenerfassung
- [ ] Structured Output anfordern
- [ ] Response zurückgeben

**POST /claims/chat/complete**
- [ ] Finale Daten extrahieren
- [ ] Claim erstellen
- [ ] Validation

#### 9.1.3 Prompt Engineering
**System Prompt Struktur:**
```
Du bist ein Assistent für die Erfassung von KFZ-Schäden.

Deine Aufgabe:
1. Frage den Nutzer nach allen relevanten Informationen
2. Stelle klärende Rückfragen wenn nötig
3. Fasse am Ende alle Informationen zusammen

Benötigte Informationen:
- Fahrzeug (aus Liste: {{vehicles}})
- Datum und Uhrzeit
- Unfallort
- Schadenart
- Beschreibung
- Polizei involviert?
- Personenschaden?

Antworte immer auf Deutsch und freundlich.
```

### 9.2 Frontend Chat UI

#### 9.2.1 Chat Interface
**Tasks:**
- [ ] Chat Page (/claims/new/chat)
- [ ] Message List (User & Bot)
- [ ] Input Field
- [ ] Send Button
- [ ] Typing Indicator
- [ ] Auto-Scroll

#### 9.2.2 Chat Flow
**Tasks:**
- [ ] Conversation State Management
- [ ] API Calls für Nachrichten
- [ ] Structured Data Extraction
- [ ] Zusammenfassung anzeigen
- [ ] Bestätigung & Submit
- [ ] Foto-Upload im Chat (optional)

---

## Phase 10: Mobile App

### 10.1 React Native Setup

#### 10.1.1 Projekt erstellen
```bash
npx create-expo-app apps/mobile --template
```

**Tasks:**
- [ ] Expo Projekt erstellen
- [ ] TypeScript konfigurieren
- [ ] Navigation (React Navigation)
- [ ] Shared Types importieren

### 10.2 Auth Screens

**Tasks:**
- [ ] Login Screen
- [ ] Token Storage (SecureStore)
- [ ] Auto-Login
- [ ] Logout

### 10.3 Claim Screens

**Tasks:**
- [ ] Dashboard (vereinfacht)
- [ ] Meine Schäden Liste
- [ ] Schaden Detail
- [ ] Neuer Schaden (Form)
- [ ] Kamera Integration
- [ ] Photo Upload

### 10.4 Push Notifications

**Tasks:**
- [ ] Expo Notifications Setup
- [ ] Push Token an Backend senden
- [ ] Backend: Push Service
- [ ] Notifications bei neuen Events

### 10.5 App Store Vorbereitung

**Tasks:**
- [ ] App Icons
- [ ] Splash Screen
- [ ] App Store Screenshots
- [ ] Privacy Policy
- [ ] EAS Build konfigurieren

---

## Phase 11: Billing & Go-Live

### 11.1 Stripe Integration

#### 11.1.1 Backend
**Tasks:**
- [ ] Stripe Account & API Keys
- [ ] Products/Prices in Stripe erstellen
- [ ] Customer erstellen bei Registration
- [ ] Checkout Session erstellen
- [ ] Webhook Handler:
  - checkout.session.completed
  - invoice.paid
  - invoice.payment_failed
  - customer.subscription.updated
  - customer.subscription.deleted
- [ ] Subscription Status in DB speichern

#### 11.1.2 Frontend
**Tasks:**
- [ ] Pricing Page
- [ ] Subscription Management (/settings/billing)
- [ ] Plan anzeigen
- [ ] Upgrade/Downgrade
- [ ] Invoices

### 11.2 Feature Gating

**Tasks:**
- [ ] Subscription Check Middleware
- [ ] Free Tier Limits (z.B. 3 Fahrzeuge)
- [ ] Upgrade Prompts
- [ ] Grace Period bei Zahlungsausfall

### 11.3 Production Setup

#### 11.3.1 Infrastructure
**Tasks:**
- [ ] Production Projekt
- [ ] Production Backend Hosting (Render/Railway)
- [ ] Production Frontend (Vercel)
- [ ] Custom Domain
- [ ] SSL Zertifikate
- [ ] CDN für Assets

#### 11.3.2 Monitoring & Logging
**Tasks:**
- [ ] Error Tracking (Sentry)
- [ ] Application Monitoring
- [ ] Uptime Monitoring
- [ ] Log Aggregation

#### 11.3.3 Security Audit
**Tasks:**
- [ ] Dependency Vulnerabilities Check
- [ ] OWASP Top 10 Review
- [ ] Penetration Test (optional)
- [ ] DSGVO Compliance Check

### 11.4 Launch Checklist

- [ ] Alle Features getestet
- [ ] Performance optimiert
- [ ] SEO Basics (Meta Tags, Sitemap)
- [ ] Analytics eingerichtet
- [ ] Legal Pages (Impressum, Datenschutz, AGB)
- [ ] Support-Kanal eingerichtet
- [ ] Onboarding Flow getestet
- [ ] E-Mails getestet (Deliverability)
- [ ] Backup & Recovery getestet
- [ ] Mobile Apps im Store

---

## Anhang A: API Endpoint Referenz

### Auth
| Method | Endpoint | Beschreibung |
|--------|----------|--------------|
| POST | /auth/register | Firma + Admin registrieren |
| POST | /auth/login | Login |
| POST | /auth/logout | Logout |
| POST | /auth/forgot-password | Passwort vergessen |
| POST | /auth/reset-password | Passwort zurücksetzen |
| POST | /auth/verify-email | E-Mail verifizieren |
| GET | /auth/me | Aktueller User |
| POST | /auth/accept-invitation | Einladung annehmen |

### Companies
| Method | Endpoint | Beschreibung |
|--------|----------|--------------|
| GET | /companies/:id | Company Details |
| PATCH | /companies/:id | Company updaten |
| GET | /companies/:id/stats | Company Statistiken |

### Users
| Method | Endpoint | Beschreibung |
|--------|----------|--------------|
| GET | /users | User der Company |
| POST | /users/invite | User einladen |
| GET | /users/:id | User Details |
| PATCH | /users/:id | User updaten |
| DELETE | /users/:id | User deaktivieren |
| GET | /invitations | Ausstehende Einladungen |
| DELETE | /invitations/:id | Einladung widerrufen |

### Vehicles
| Method | Endpoint | Beschreibung |
|--------|----------|--------------|
| GET | /vehicles | Fahrzeuge der Company |
| POST | /vehicles | Fahrzeug erstellen |
| GET | /vehicles/:id | Fahrzeug Details |
| PATCH | /vehicles/:id | Fahrzeug updaten |
| DELETE | /vehicles/:id | Fahrzeug deaktivieren |

### Policies
| Method | Endpoint | Beschreibung |
|--------|----------|--------------|
| GET | /policies | Policies der Company |
| POST | /policies | Policy erstellen |
| GET | /policies/:id | Policy Details |
| PATCH | /policies/:id | Policy updaten |
| DELETE | /policies/:id | Policy deaktivieren |

### Insurers
| Method | Endpoint | Beschreibung |
|--------|----------|--------------|
| GET | /insurers | Alle Versicherer |

### Claims
| Method | Endpoint | Beschreibung |
|--------|----------|--------------|
| GET | /claims | Schäden (gefiltert) |
| POST | /claims | Schaden erstellen |
| GET | /claims/:id | Schaden Details |
| PATCH | /claims/:id | Schaden updaten |
| POST | /claims/:id/submit | Schaden einreichen |
| POST | /claims/:id/approve | Schaden freigeben |
| POST | /claims/:id/reject | Schaden ablehnen |
| POST | /claims/:id/send | An Versicherung senden |
| POST | /claims/:id/attachments | Anhang hochladen |
| GET | /claims/:id/events | Claim History |
| GET | /claims/:id/comments | Kommentare |
| POST | /claims/:id/comments | Kommentar hinzufügen |
| DELETE | /attachments/:id | Anhang löschen |
| GET | /claims/export | Export (CSV/Excel) |

### Notifications
| Method | Endpoint | Beschreibung |
|--------|----------|--------------|
| GET | /notifications | Notifications |
| PATCH | /notifications/:id/read | Als gelesen markieren |
| POST | /notifications/read-all | Alle gelesen |

### AI Chat
| Method | Endpoint | Beschreibung |
|--------|----------|--------------|
| POST | /claims/chat | Chat Nachricht senden |
| POST | /claims/chat/complete | Chat abschließen |

---

## Anhang B: Environment Variables

### Backend (.env)
```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# Auth
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Supabase (wenn genutzt)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=xxx

# Storage
STORAGE_ENDPOINT=http://localhost:9000
STORAGE_ACCESS_KEY=minioadmin
STORAGE_SECRET_KEY=minioadmin
STORAGE_BUCKET=poa-uploads

# Email
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_xxx
EMAIL_FROM=noreply@poa-app.de

# OpenAI
OPENAI_API_KEY=sk-xxx

# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# App
APP_URL=http://localhost:3000
API_URL=http://localhost:4000
NODE_ENV=development
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

---

## Anhang C: Git Workflow

### Branch Strategie
```
main (production)
└── develop (staging)
    ├── feature/xxx
    ├── bugfix/xxx
    └── hotfix/xxx
```

### Commit Convention
```
type(scope): description

feat(claims): add photo upload functionality
fix(auth): resolve token refresh issue
docs(readme): update setup instructions
style(ui): improve button hover states
refactor(api): extract claim service
test(claims): add unit tests for claim creation
chore(deps): update dependencies
```

---

*Dieser Projektplan wird fortlaufend aktualisiert.*
