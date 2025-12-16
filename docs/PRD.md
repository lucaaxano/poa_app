# Product Requirements Document (PRD)
# Point-of-Accident (POA) - KFZ-Schadenmanagement-System

**Version:** 1.0
**Erstellt:** 15. Dezember 2025
**Status:** Draft

---

## 1. Executive Summary

### 1.1 Produktvision
Point-of-Accident (POA) ist ein umfassendes SaaS-System zur Verwaltung und Meldung von KFZ-Schäden für Unternehmen mit Fahrzeugflotten. Das System ermöglicht eine schnelle, strukturierte Schadenerfassung durch Mitarbeiter und eine effiziente Weiterleitung an Versicherungen durch Administratoren.

### 1.2 Kernproblem
- Lange Meldezeiten bei KFZ-Schäden führen zu höheren Schadenkosten
- Geschädigte können sich bei Verzögerungen besser vorbereiten/informieren
- Fehlende Übersicht über Schadenquoten und Flottenauslastung
- Manuelle, fehleranfällige Prozesse bei der Schadenmeldung
- Keine zentrale Datenbasis für Auswertungen und Optimierungen

### 1.3 Lösung
Eine Web-Applikation (später ergänzt durch Mobile Apps) mit:
- Schneller Schadenerfassung durch Mitarbeiter (optional KI-gestützt)
- Human-in-the-Loop Freigabeprozess durch Administratoren
- Automatisierter E-Mail-Versand an Versicherungen
- Umfassenden Auswertungen und Quota-Tracking
- Multi-Tenant Architektur für verschiedene Firmen

---

## 2. Benutzerrollen & Berechtigungen

### 2.1 Mitarbeiter (EMPLOYEE)
**Beschreibung:** Fahrer/Mitarbeiter der Firma, die Schäden melden

**Berechtigungen:**
- Eigene Schäden erfassen (Form oder KI-Chat)
- Fotos/Dokumente hochladen
- Eigene Schadenhistorie einsehen
- Eigenes Profil verwalten

**Einschränkungen:**
- Keine Einsicht in Schäden anderer Mitarbeiter
- Keine Einsicht in Kostendetails oder Quotas
- Kann Schäden nicht direkt an Versicherung senden

### 2.2 Firmen-Administrator (COMPANY_ADMIN)
**Beschreibung:** Fuhrparkleiter, Geschäftsführer oder zuständige Person

**Berechtigungen:**
- Alle Schäden der Firma einsehen und bearbeiten
- Schäden freigeben und an Versicherung senden
- Mitarbeiter einladen und verwalten
- Fahrzeuge verwalten (CRUD)
- Versicherungsverträge (Policies) pflegen
- Broker einladen
- Auswertungen und Quotas einsehen
- Firmeneinstellungen verwalten
- Selbst Schäden erfassen

**Besondere Features:**
- Dashboard mit Übersicht (neue Schäden, Quotas, Statistiken)
- Benachrichtigungen bei neuen Schäden (In-App + E-Mail)
- Export-Funktionen

### 2.3 Versicherungsmakler/Broker (BROKER)
**Beschreibung:** Externer Versicherungsmakler, der mehrere Firmen betreut

**Berechtigungen:**
- Schäden aller zugeordneten Firmen einsehen
- Schäden kommentieren
- Schadendetails ergänzen (z.B. Versicherer-Claim-Nummer)
- Schäden an Versicherung senden (falls berechtigt)
- Auswertungen über alle betreuten Firmen
- Export-Funktionen

**Einschränkungen:**
- Kann keine Mitarbeiter oder Fahrzeuge verwalten
- Kann keine Firmeneinstellungen ändern

### 2.4 System-Administrator (SUPERADMIN)
**Beschreibung:** Internes Team von POA

**Berechtigungen:**
- Alle Firmen, User, Broker einsehen
- Support-Zugriff auf alle Daten
- Systemweite Einstellungen
- Versicherer-Datenbank pflegen
- Billing/Subscription Management
- System-Monitoring und Logs

---

## 3. Funktionale Anforderungen

### 3.1 Authentifizierung & Registrierung

#### 3.1.1 Firmen-Registrierung
**User Story:** Als Interessent möchte ich meine Firma registrieren können, um das System zu nutzen.

**Anforderungen:**
- Landing Page mit Login/Registrierung
- Registrierungsformular:
  - Firmenname (required)
  - Anzahl Fahrzeuge (optional, für Onboarding)
  - Anzahl PKW / LKW (optional)
  - Admin-Vorname, Nachname (required)
  - E-Mail (required, wird Admin-Login)
  - Passwort (required, min. 8 Zeichen, Komplexitätsregeln)
- E-Mail-Verifizierung erforderlich
- Nach Verifizierung: Zugang zum Dashboard
- Demo-Daten werden automatisch angelegt (optional, konfigurierbar)

#### 3.1.2 Login
**Anforderungen:**
- E-Mail + Passwort Login
- "Passwort vergessen" Funktion
- Session Management (JWT oder Session Tokens)
- Optional: "Angemeldet bleiben" Checkbox

#### 3.1.3 Einladungssystem
**User Story:** Als Admin möchte ich Mitarbeiter und Broker einladen können.

**Anforderungen:**
- Einladung per E-Mail mit einmaligem Token
- Token-Gültigkeit: 7 Tage
- Einladungsformular: E-Mail, Rolle (EMPLOYEE oder BROKER)
- Eingeladener setzt nur noch Passwort und Profildaten
- Ausstehende Einladungen einsehbar und widerrufbar

### 3.2 Schadenerfassung (Core Feature)

#### 3.2.1 Schadenformular
**User Story:** Als Mitarbeiter möchte ich einen Schaden schnell und vollständig erfassen können.

**Pflichtfelder:**
- Fahrzeug (Auswahl aus Firmenfuhrpark)
- Unfalldatum und -uhrzeit
- Unfallort (Freitext + optional GPS)
- Schadenart (Kategorien siehe 3.2.3)
- Kurzbeschreibung

**Optionale Felder:**
- Fahrer (falls abweichend vom eingeloggten User)
- Gegnerisches Fahrzeug (Kennzeichen, Halter, Versicherung)
- Personenschaden (ja/nein, Details)
- Polizei involviert (ja/nein)
- Polizei-Aktenzeichen
- Zeugen
- Detaillierte Beschreibung (Freitext)
- Fotos/Videos (Upload)
- Dokumente (Unfallskizze, etc.)

#### 3.2.2 KI-Chatbot für Schadenerfassung (Phase 2)
**User Story:** Als Mitarbeiter möchte ich einen Schaden im Gespräch mit einem KI-Bot erfassen können.

**Anforderungen:**
- Chat-Interface in der App
- KI stellt geführte Fragen
- Extrahiert strukturierte Daten aus Konversation
- Zeigt Zusammenfassung zur Bestätigung
- Speichert strukturierte Daten in DB

#### 3.2.3 Schadenkategorien
**Hauptkategorien:**
- Haftpflichtschaden (Schaden an Dritten)
- Kaskoschaden (Eigenschaden)
- Glasschaden
- Wildschaden
- Parkschaden
- Diebstahl/Teildiebstahl
- Vandalismus
- Sonstiges

**Unterkategorien (je nach Hauptkategorie):**
- Karosserieschaden
- Mechanischer Schaden
- Elektronikschaden
- etc. (erweiterbar)

#### 3.2.4 Schadenanhänge
**Anforderungen:**
- Foto-Upload (JPEG, PNG, HEIC)
- Video-Upload (MP4, MOV, max. 100MB)
- Dokument-Upload (PDF, max. 20MB)
- Vorschau in der App
- Komprimierung vor Upload (clientseitig)

### 3.3 Schadenverwaltung (Admin/Broker)

#### 3.3.1 Schadenübersicht
**User Story:** Als Admin möchte ich alle Schäden meiner Firma auf einen Blick sehen.

**Anforderungen:**
- Listenansicht mit Filteroptionen:
  - Status
  - Zeitraum
  - Fahrzeug
  - Fahrer
  - Schadenart
- Sortierung (Datum, Status, Kosten)
- Suchfunktion
- Pagination
- Schnellaktionen (Status ändern, Details öffnen)

#### 3.3.2 Schadendetailansicht
**Anforderungen:**
- Alle erfassten Daten
- Anhänge mit Viewer
- Status-Historie (Claim Events)
- Kommentarfunktion (interner Chat zwischen Admin/Broker)
- Bearbeitungsmöglichkeit für:
  - Kostenfelder (geschätzt, final)
  - Status
  - Versicherer-Claim-Nummer
  - Interne Notizen
- Aktionen:
  - "An Versicherung senden"
  - "Schaden abschließen"
  - "Schaden ablehnen"

#### 3.3.3 Human-in-the-Loop Workflow
**Status-Flow:**
```
DRAFT → SUBMITTED → APPROVED → SENT → ACKNOWLEDGED → CLOSED
                  ↘ REJECTED
```

**DRAFT:** Während Erfassung (bei Abbruch)
**SUBMITTED:** Mitarbeiter hat abgeschickt, wartet auf Admin
**APPROVED:** Admin hat freigegeben
**SENT:** E-Mail an Versicherung gesendet
**ACKNOWLEDGED:** Versicherer hat Schadennummer mitgeteilt
**CLOSED:** Schaden abgewickelt
**REJECTED:** Admin hat abgelehnt (mit Begründung)

### 3.4 Versicherungskommunikation

#### 3.4.1 Automatische E-Mail-Generierung
**User Story:** Als Admin möchte ich mit einem Klick eine professionelle Schadenmeldung an die Versicherung senden.

**Anforderungen:**
- Generierung einer strukturierten E-Mail
- Betreff: "[Vertragsnummer] - Schadenmeldung [Datum] - [Kennzeichen]"
- Body: Alle relevanten Schadendetails
- Anhänge: Fotos, Dokumente als Attachment
- Optional: PDF-Zusammenfassung generieren
- Versand an hinterlegte Claims-E-Mail des Versicherers
- Protokollierung (Zeitstempel, Message-ID)

#### 3.4.2 Versichererkonfiguration
**Anforderungen:**
- Globale Versicherer-Datenbank (gepflegt durch Superadmin)
  - Name
  - Claims-E-Mail
  - Kontakttelefon
- Pro Firma: Vertragszuordnung (Policies)
  - Versicherer
  - Vertragsnummer
  - Deckungsart
  - Gültigkeitszeitraum

### 3.5 Benachrichtigungen

#### 3.5.1 In-App Benachrichtigungen
**Anforderungen:**
- Notification-Bell mit Badge (Anzahl ungelesener)
- Notification-Center mit Liste
- Klick führt zum relevanten Objekt

**Trigger:**
- Neuer Schaden eingegangen (für Admin)
- Schaden freigegeben/abgelehnt (für Mitarbeiter)
- Neuer Kommentar
- Status-Änderung

#### 3.5.2 E-Mail Benachrichtigungen
**Anforderungen:**
- Konfigurierbar pro User
- Sofort oder als Daily Digest
- Unsubscribe-Link

### 3.6 Reporting & Auswertungen

#### 3.6.1 Admin-Dashboard
**KPIs:**
- Anzahl Schäden (gesamt, pro Zeitraum)
- Schadensumme (geschätzt, reguliert)
- Durchschnittliche Bearbeitungszeit
- Schäden pro Fahrzeug
- Schäden pro Fahrer
- Trend-Visualisierung (Charts)

#### 3.6.2 Quota-/Auslastungsanzeige
**Anforderungen:**
- Visualisierung der Auslastung für Hochstufungsberechnung
- Formel (je nach Modell):
  - Summe Schäden / Beitragssumme
- Warnung bei Überschreitung von Schwellenwerten
- Historischer Verlauf

#### 3.6.3 Export
**Anforderungen:**
- CSV Export der Schadenliste
- Excel Export mit Formatierung
- PDF-Report (optional)

### 3.7 Fahrzeugverwaltung

**User Story:** Als Admin möchte ich meinen Fuhrpark im System pflegen.

**Anforderungen:**
- CRUD für Fahrzeuge
- Felder:
  - Kennzeichen (required)
  - Marke, Modell, Baujahr
  - Interner Name/Nummer
  - FIN (optional)
  - HSN/TSN (optional)
  - Status (aktiv/inaktiv)
- Import via CSV (optional)
- Fahrzeuge können nicht gelöscht werden, wenn Schäden zugeordnet sind (nur deaktivieren)

### 3.8 Benutzerverwaltung

**User Story:** Als Admin möchte ich meine Mitarbeiter verwalten.

**Anforderungen:**
- Liste aller User der Firma
- Einladen neuer User
- Deaktivieren/Reaktivieren
- Rolle ändern (Employee ↔ Admin)
- Letzter Login einsehbar

### 3.9 Firmenprofil & Einstellungen

**Anforderungen:**
- Firmendaten bearbeiten (Name, Adresse, etc.)
- Versicherungsverträge verwalten
- E-Mail-Einstellungen (Absendername, etc.)
- Benachrichtigungseinstellungen

---

## 4. Nicht-funktionale Anforderungen

### 4.1 Performance
- Seitenladezeit < 2 Sekunden
- API Response Time < 500ms (P95)
- Unterstützung für 100+ gleichzeitige User pro Firma
- Bild-Upload < 30 Sekunden für 10MB

### 4.2 Sicherheit
- HTTPS everywhere
- Passwort-Hashing (bcrypt, Argon2)
- JWT mit kurzer Laufzeit + Refresh Tokens
- Row Level Security in Datenbank
- Input Validation (Server + Client)
- CSRF Protection
- Rate Limiting
- Audit Logging für sensible Aktionen

### 4.3 Datenschutz (DSGVO)
- Datenverarbeitungsvertrag (AVV) Template
- Recht auf Auskunft (Datenexport)
- Recht auf Löschung (mit Aufbewahrungsfristen)
- Einwilligungsverwaltung
- Datensparsamkeit
- Hosting in EU

### 4.4 Verfügbarkeit
- 99.5% Uptime
- Automatische Backups (täglich)
- Disaster Recovery Plan

### 4.5 Skalierbarkeit
- Horizontal skalierbare Architektur
- Multi-Tenant mit Mandantentrennung
- Vorbereitung für 1000+ Firmen

### 4.6 Wartbarkeit
- Clean Code Principles
- Dokumentation (API, Code)
- Automatisierte Tests (Unit, Integration)
- CI/CD Pipeline

---

## 5. Technische Architektur

### 5.1 Übersicht
```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  ┌─────────────────┐          ┌─────────────────────────┐  │
│  │   Web App       │          │   Mobile App (Phase 2)  │  │
│  │   (Next.js)     │          │   (React Native/Expo)   │  │
│  └────────┬────────┘          └───────────┬─────────────┘  │
└───────────┼───────────────────────────────┼─────────────────┘
            │                               │
            └───────────────┬───────────────┘
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Node.js)                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              REST API (Express/NestJS)                │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌────────────┐ │  │
│  │  │  Auth   │ │ Claims  │ │ Users   │ │ Vehicles   │ │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └────────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
│                            │                                 │
│  ┌─────────────┐  ┌────────┴───────┐  ┌─────────────────┐  │
│  │ Email Svc   │  │   Supabase     │  │  OpenAI API     │  │
│  │ (Resend)    │  │   Client       │  │  (KI Chat)      │  │
│  └─────────────┘  └────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Supabase                                │
│  ┌─────────────────┐  ┌────────────┐  ┌─────────────────┐  │
│  │   PostgreSQL    │  │   Auth     │  │    Storage      │  │
│  │   (Database)    │  │            │  │   (S3-like)     │  │
│  └─────────────────┘  └────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Tech Stack

**Frontend (Web):**
- Next.js 14+ (React, App Router)
- TypeScript
- TailwindCSS
- shadcn/ui (Component Library)
- React Query (Server State)
- Zustand (Client State)
- React Hook Form + Zod (Forms & Validation)

**Backend:**
- Node.js 20+
- TypeScript
- NestJS oder Express
- Prisma (ORM)
- Zod (Validation)

**Datenbank & Services:**
- Supabase (PostgreSQL, Auth, Storage)
- Resend oder SendGrid (E-Mail)
- OpenAI API (KI-Features)

**DevOps:**
- Docker & Docker Compose
- GitHub Actions (CI/CD)
- Vercel (Frontend Hosting) oder Docker
- Railway/Render/Fly.io (Backend Hosting) oder Docker

**Development:**
- Cursor IDE
- ESLint + Prettier
- Husky (Git Hooks)
- Jest/Vitest (Testing)

### 5.3 Docker Development Setup
```yaml
# docker-compose.yml Struktur
services:
  web:        # Next.js Frontend
  api:        # Node.js Backend
  db:         # PostgreSQL (lokal)
  storage:    # MinIO (S3-kompatibel, lokal)
  maildev:    # E-Mail Testing
```

---

## 6. Datenmodell

### 6.1 Entity Relationship Diagram (vereinfacht)
```
companies ─────────┬──────────────── users
    │              │                   │
    │              │                   │
    ├── vehicles   │                   │
    │      │       │                   │
    │      │       │                   │
    ├── policies ──┤                   │
    │      │       │                   │
    │      │       │                   │
    └── claims ────┴───────────────────┘
           │
           ├── claim_attachments
           │
           └── claim_events

insurers (global)
broker_company_links (Broker ↔ Company)
invitations
notifications
```

### 6.2 Tabellenstruktur

#### companies
| Feld | Typ | Beschreibung |
|------|-----|--------------|
| id | UUID | Primary Key |
| name | VARCHAR(255) | Firmenname |
| address | TEXT | Adresse |
| num_employees | INT | Anzahl Mitarbeiter |
| num_vehicles | INT | Anzahl Fahrzeuge |
| settings | JSONB | Firmeneinstellungen |
| created_at | TIMESTAMP | Erstellungsdatum |
| updated_at | TIMESTAMP | Änderungsdatum |

#### users
| Feld | Typ | Beschreibung |
|------|-----|--------------|
| id | UUID | Primary Key |
| company_id | UUID | FK → companies (nullable für Broker) |
| email | VARCHAR(255) | E-Mail (unique) |
| password_hash | VARCHAR(255) | Gehashtes Passwort |
| role | ENUM | EMPLOYEE, COMPANY_ADMIN, BROKER, SUPERADMIN |
| first_name | VARCHAR(100) | Vorname |
| last_name | VARCHAR(100) | Nachname |
| phone | VARCHAR(50) | Telefon |
| position | VARCHAR(100) | Position in Firma |
| is_active | BOOLEAN | Aktiv-Status |
| email_verified_at | TIMESTAMP | Verifizierungszeitpunkt |
| last_login_at | TIMESTAMP | Letzter Login |
| notification_settings | JSONB | Benachrichtigungseinstellungen |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

#### vehicles
| Feld | Typ | Beschreibung |
|------|-----|--------------|
| id | UUID | Primary Key |
| company_id | UUID | FK → companies |
| license_plate | VARCHAR(20) | Kennzeichen |
| brand | VARCHAR(100) | Marke |
| model | VARCHAR(100) | Modell |
| year | INT | Baujahr |
| vin | VARCHAR(17) | FIN (optional) |
| hsn | VARCHAR(10) | HSN (optional) |
| tsn | VARCHAR(10) | TSN (optional) |
| internal_name | VARCHAR(100) | Interner Name |
| vehicle_type | ENUM | PKW, LKW, TRANSPORTER, etc. |
| is_active | BOOLEAN | Aktiv-Status |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

#### insurers
| Feld | Typ | Beschreibung |
|------|-----|--------------|
| id | UUID | Primary Key |
| name | VARCHAR(255) | Versicherername |
| claims_email | VARCHAR(255) | E-Mail Schadenabteilung |
| contact_phone | VARCHAR(50) | Telefon |
| is_active | BOOLEAN | Aktiv |
| created_at | TIMESTAMP | |

#### policies
| Feld | Typ | Beschreibung |
|------|-----|--------------|
| id | UUID | Primary Key |
| company_id | UUID | FK → companies |
| insurer_id | UUID | FK → insurers |
| policy_number | VARCHAR(100) | Vertragsnummer |
| coverage_type | ENUM | FLEET, SINGLE, etc. |
| pricing_model | ENUM | QUOTA, PER_PIECE, etc. |
| annual_premium | DECIMAL | Jahresbeitrag |
| deductible | DECIMAL | Selbstbeteiligung |
| valid_from | DATE | Gültig ab |
| valid_to | DATE | Gültig bis |
| is_active | BOOLEAN | Aktiv |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

#### claims
| Feld | Typ | Beschreibung |
|------|-----|--------------|
| id | UUID | Primary Key |
| company_id | UUID | FK → companies |
| vehicle_id | UUID | FK → vehicles |
| policy_id | UUID | FK → policies (optional) |
| reporter_user_id | UUID | FK → users (wer hat gemeldet) |
| driver_user_id | UUID | FK → users (wer fuhr, optional) |
| status | ENUM | DRAFT, SUBMITTED, APPROVED, SENT, ACKNOWLEDGED, CLOSED, REJECTED |
| claim_number | VARCHAR(50) | Interne Schadennummer |
| insurer_claim_number | VARCHAR(100) | Schadennummer Versicherer |
| accident_date | DATE | Unfalldatum |
| accident_time | TIME | Unfallzeit |
| accident_location | TEXT | Unfallort (Freitext) |
| gps_lat | DECIMAL | GPS Latitude |
| gps_lng | DECIMAL | GPS Longitude |
| damage_category | ENUM | Hauptkategorie |
| damage_subcategory | VARCHAR(100) | Unterkategorie |
| description | TEXT | Beschreibung |
| police_involved | BOOLEAN | Polizei involviert |
| police_file_number | VARCHAR(100) | Polizei-Aktenzeichen |
| has_injuries | BOOLEAN | Personenschaden |
| third_party_info | JSONB | Gegner-Infos (Kennzeichen, etc.) |
| witness_info | JSONB | Zeugen-Infos |
| estimated_cost | DECIMAL | Geschätzte Kosten |
| final_cost | DECIMAL | Finale Kosten |
| claim_data | JSONB | Zusätzliche strukturierte Daten |
| rejection_reason | TEXT | Ablehnungsgrund |
| sent_at | TIMESTAMP | Zeitpunkt E-Mail-Versand |
| acknowledged_at | TIMESTAMP | Zeitpunkt Bestätigung |
| closed_at | TIMESTAMP | Zeitpunkt Abschluss |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

#### claim_attachments
| Feld | Typ | Beschreibung |
|------|-----|--------------|
| id | UUID | Primary Key |
| claim_id | UUID | FK → claims |
| file_url | TEXT | Storage URL |
| file_name | VARCHAR(255) | Originaler Dateiname |
| file_type | ENUM | IMAGE, VIDEO, PDF, OTHER |
| file_size | INT | Dateigröße in Bytes |
| mime_type | VARCHAR(100) | MIME Type |
| created_at | TIMESTAMP | |

#### claim_events
| Feld | Typ | Beschreibung |
|------|-----|--------------|
| id | UUID | Primary Key |
| claim_id | UUID | FK → claims |
| user_id | UUID | FK → users |
| event_type | ENUM | CREATED, STATUS_CHANGED, EMAIL_SENT, COMMENT_ADDED, etc. |
| old_value | JSONB | Vorheriger Wert |
| new_value | JSONB | Neuer Wert |
| meta | JSONB | Zusätzliche Infos (Email-ID, etc.) |
| created_at | TIMESTAMP | |

#### claim_comments
| Feld | Typ | Beschreibung |
|------|-----|--------------|
| id | UUID | Primary Key |
| claim_id | UUID | FK → claims |
| user_id | UUID | FK → users |
| content | TEXT | Kommentartext |
| created_at | TIMESTAMP | |

#### broker_company_links
| Feld | Typ | Beschreibung |
|------|-----|--------------|
| id | UUID | Primary Key |
| broker_user_id | UUID | FK → users (role=BROKER) |
| company_id | UUID | FK → companies |
| created_at | TIMESTAMP | |

#### invitations
| Feld | Typ | Beschreibung |
|------|-----|--------------|
| id | UUID | Primary Key |
| company_id | UUID | FK → companies |
| email | VARCHAR(255) | Eingeladene E-Mail |
| role | ENUM | EMPLOYEE, BROKER |
| token_hash | VARCHAR(255) | Gehashter Token |
| invited_by_user_id | UUID | FK → users |
| expires_at | TIMESTAMP | Ablaufzeitpunkt |
| accepted_at | TIMESTAMP | Annahmezeitpunkt |
| created_at | TIMESTAMP | |

#### notifications
| Feld | Typ | Beschreibung |
|------|-----|--------------|
| id | UUID | Primary Key |
| user_id | UUID | FK → users |
| type | VARCHAR(100) | Notification Type |
| title | VARCHAR(255) | Titel |
| message | TEXT | Nachricht |
| data | JSONB | Zusätzliche Daten (Link, etc.) |
| read_at | TIMESTAMP | Gelesen am |
| created_at | TIMESTAMP | |

---

## 7. API Endpoints (Übersicht)

### Authentication
- POST /auth/register
- POST /auth/login
- POST /auth/logout
- POST /auth/forgot-password
- POST /auth/reset-password
- POST /auth/verify-email
- GET /auth/me

### Companies
- GET /companies/:id
- PATCH /companies/:id
- GET /companies/:id/stats

### Users
- GET /users
- POST /users/invite
- GET /users/:id
- PATCH /users/:id
- DELETE /users/:id (deactivate)
- GET /invitations
- DELETE /invitations/:id

### Vehicles
- GET /vehicles
- POST /vehicles
- GET /vehicles/:id
- PATCH /vehicles/:id
- DELETE /vehicles/:id (deactivate)

### Policies
- GET /policies
- POST /policies
- GET /policies/:id
- PATCH /policies/:id
- DELETE /policies/:id

### Insurers
- GET /insurers (public list)

### Claims
- GET /claims
- POST /claims
- GET /claims/:id
- PATCH /claims/:id
- POST /claims/:id/submit
- POST /claims/:id/approve
- POST /claims/:id/reject
- POST /claims/:id/send
- GET /claims/:id/events
- POST /claims/:id/comments
- GET /claims/:id/comments

### Attachments
- POST /claims/:id/attachments
- DELETE /attachments/:id

### Notifications
- GET /notifications
- PATCH /notifications/:id/read
- POST /notifications/read-all

---

## 8. User Interface Struktur

### 8.1 Allgemeine Struktur
```
Landing Page (öffentlich)
├── Home
├── Features
├── Pricing
├── Login
└── Registrierung

App (authentifiziert)
├── Dashboard
├── Schäden
│   ├── Übersicht (Liste)
│   ├── Neuer Schaden
│   └── Schadendetails
├── Fahrzeuge
│   ├── Übersicht
│   └── Fahrzeug hinzufügen/bearbeiten
├── Auswertungen
├── Einstellungen
│   ├── Firmenprofil
│   ├── Benutzer verwalten
│   ├── Versicherungen/Policies
│   └── Benachrichtigungen
└── Profil
```

### 8.2 Rollen-spezifische Ansichten

**Employee:**
- Dashboard (vereinfacht)
- Meine Schäden
- Neuer Schaden
- Profil

**Company Admin:**
- Volles Dashboard
- Alle Schäden + Verwaltung
- Fahrzeuge
- Auswertungen
- Alle Einstellungen

**Broker:**
- Dashboard (firmenübergreifend)
- Schäden (alle betreuten Firmen)
- Auswertungen (aggregiert)
- Eingeschränkte Einstellungen

**Superadmin:**
- System-Dashboard
- Alle Firmen
- Alle User
- Versicherer verwalten
- System-Einstellungen

---

## 9. Erfolgskriterien

### 9.1 MVP Launch (Phase 1-3)
- [ ] Firmen können sich registrieren
- [ ] Admins können Mitarbeiter einladen
- [ ] Mitarbeiter können Schäden erfassen (Formular)
- [ ] Fotos können hochgeladen werden
- [ ] Admin sieht alle Schäden
- [ ] Admin kann Schaden an Versicherung senden
- [ ] E-Mail wird korrekt generiert und versendet
- [ ] Basis-Auswertungen funktionieren

### 9.2 Feature-Complete (Phase 4-5)
- [ ] KI-Chatbot für Schadenerfassung
- [ ] Broker-Zugang funktioniert
- [ ] Benachrichtigungssystem vollständig
- [ ] Export-Funktionen
- [ ] Mobile App (Mitarbeiter)

### 9.3 KPIs
- Registrierungsrate
- Aktivierungsrate (erste Schadenmeldung)
- Durchschnittliche Zeit bis zur Meldung
- User Retention
- NPS Score

---

## 10. Risiken & Mitigationen

| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|--------|-------------------|--------|------------|
| E-Mail-Zustellung scheitert | Mittel | Hoch | Retry-Logik, Bounce-Handling, Monitoring |
| Versicherer ändern E-Mail-Anforderungen | Mittel | Mittel | Konfigurierbares E-Mail-Template pro Versicherer |
| DSGVO-Verstoß | Niedrig | Hoch | Rechtliche Prüfung, AVV, Dokumentation |
| Performance bei vielen Claims | Niedrig | Mittel | Indexierung, Pagination, Caching |
| KI-Halluzinationen bei Chatbot | Mittel | Mittel | Strukturierte Prompts, User-Bestätigung |

---

## 11. Out of Scope (explizit nicht im MVP)

- Versicherer-Account (direkter Login für Versicherungen)
- Vollautomatische Rechnungsstellung
- Native Desktop App
- Integrationen mit Telematik-Systemen
- Automatische Schadenfotos aus Dashcam
- Multi-Language Support (initial nur Deutsch)

---

## 12. Glossar

| Begriff | Definition |
|---------|------------|
| Flotte | Gesamtheit aller Fahrzeuge einer Firma |
| Flottenvertrag | Versicherungsvertrag für mehrere Fahrzeuge |
| Quote/Quota | Verhältnis von Schäden zu Beiträgen |
| Policy | Versicherungsvertrag/Police |
| Claim | Schaden/Schadenmeldung |
| Broker | Versicherungsmakler |
| HSN/TSN | Herstellerschlüsselnummer/Typschlüsselnummer |
| FIN/VIN | Fahrzeug-Identifizierungsnummer |

---

*Dokument wird fortlaufend aktualisiert.*
