# POA - Point of Accident

KFZ-Schadenmanagement-System fuer Firmenflotten.

## Projektstruktur

```
poa-app/
├── apps/
│   ├── web/                 # Next.js 14 Frontend
│   └── api/                 # NestJS Backend
├── packages/
│   ├── shared/              # @poa/shared - Typen, Schemas, Konstanten
│   └── database/            # @poa/database - Prisma Schema & Client
├── docker/
│   ├── web.Dockerfile       # Frontend Docker Image
│   ├── api.Dockerfile       # Backend Docker Image
│   └── init-db.sql          # DB Initialisierung
├── docs/
│   ├── PRD.md               # Product Requirements Document
│   ├── PROJEKTPLAN.md       # Detaillierter Projektplan
│   └── DATABASE_SCHEMA.prisma
├── docker-compose.dev.yml   # Docker Development Setup
├── turbo.json               # Turborepo Konfiguration
├── pnpm-workspace.yaml      # pnpm Workspace Konfiguration
└── package.json
```

## Voraussetzungen

- **Docker Desktop** (fuer die vollstaendige Entwicklungsumgebung)
- **Node.js 20+** (fuer lokale Entwicklung ohne Docker)
- **pnpm** (Package Manager)
- **Git**

## Quick Start

### 1. pnpm installieren (falls nicht vorhanden)

```bash
npm install -g pnpm
```

### 2. Dependencies installieren

```bash
cd ~/Desktop/POA-App
pnpm install
```

### 3. Prisma Client generieren

```bash
pnpm db:generate
```

### 4. Entwicklungsumgebung starten

#### Option A: Mit Docker (empfohlen)

```bash
# Alle Services starten (DB, API, Web, MinIO, MailDev)
pnpm docker:dev

# Oder mit Rebuild
pnpm docker:dev:build

# Services stoppen
pnpm docker:down
```

#### Option B: Lokal (ohne Docker fuer Web/API)

```bash
# Zuerst nur die Infrastruktur starten (DB, MinIO, MailDev)
docker compose -f docker-compose.dev.yml up db storage maildev -d

# Dann in separaten Terminals:
pnpm --filter @poa/api dev    # Backend auf Port 4000
pnpm --filter @poa/web dev    # Frontend auf Port 3000
```

### 5. Datenbank Setup

```bash
# Migration ausfuehren (erstellt Tabellen)
pnpm db:migrate

# Seed-Daten laden (Demo-Daten)
pnpm db:seed

# Prisma Studio (DB Browser)
pnpm db:studio
```

## Services nach dem Start

| Service | URL | Beschreibung |
|---------|-----|--------------|
| **Frontend** | http://localhost:3000 | Next.js Web App |
| **Backend API** | http://localhost:4000/api | NestJS REST API |
| **API Health** | http://localhost:4000/api/health | Health Check |
| **PostgreSQL** | localhost:5432 | Datenbank |
| **MinIO Console** | http://localhost:9001 | File Storage UI |
| **MinIO API** | http://localhost:9000 | S3-kompatible API |
| **MailDev** | http://localhost:1080 | E-Mail Testing UI |
| **Adminer** | http://localhost:8080 | DB Admin (optional) |

## Demo-Accounts (nach Seed)

| Rolle | E-Mail | Passwort |
|-------|--------|----------|
| Admin | admin@demo-transport.de | Admin123! |
| Fahrer 1 | fahrer1@demo-transport.de | Fahrer123! |
| Fahrer 2 | fahrer2@demo-transport.de | Fahrer123! |
| Fahrer 3 | fahrer3@demo-transport.de | Fahrer123! |
| Broker | broker@versicherungsmakler.de | Broker123! |
| Superadmin | superadmin@poa-app.de | SuperAdmin123! |

## Entwicklung

### Scripts

```bash
# Entwicklungsserver (alle Apps)
pnpm dev

# Build (alle Apps)
pnpm build

# Linting
pnpm lint

# Type Check
pnpm type-check

# Prisma Befehle
pnpm db:generate    # Client generieren
pnpm db:migrate     # Migration ausfuehren
pnpm db:push        # Schema pushen (ohne Migration)
pnpm db:seed        # Seed-Daten laden
pnpm db:studio      # Prisma Studio starten

# Docker
pnpm docker:dev     # Starten
pnpm docker:down    # Stoppen
```

### Einzelne Apps starten

```bash
# Nur Frontend
pnpm --filter @poa/web dev

# Nur Backend
pnpm --filter @poa/api dev

# Nur ein Package
pnpm --filter @poa/shared type-check
```

## Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- TailwindCSS
- shadcn/ui
- React Query
- Zustand

**Backend:**
- NestJS
- TypeScript
- Prisma ORM
- Passport JWT

**Infrastruktur:**
- PostgreSQL 15
- MinIO (S3-kompatibel)
- Docker Compose

## Dokumentation

- [Product Requirements Document (PRD)](./docs/PRD.md)
- [Detaillierter Projektplan](./docs/PROJEKTPLAN.md)
- [Datenbank Schema](./docs/DATABASE_SCHEMA.prisma)

## Naechste Schritte

Phase 0 ist abgeschlossen. Naechste Schritte:

1. **Phase 1**: Authentifizierung komplett implementieren
2. **Phase 2**: Admin Dashboard und Fahrzeugverwaltung
3. **Phase 3**: Schadenmanagement (Kern-Feature)

Siehe [PROJEKTPLAN.md](./docs/PROJEKTPLAN.md) fuer Details.

## Lizenz

Proprietary - All rights reserved.
