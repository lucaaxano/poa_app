import Link from 'next/link';
import type { Route } from 'next';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold">POA</span>
            <span className="text-sm text-muted-foreground">Point of Accident</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Anmelden</Button>
            </Link>
            <Link href="/register">
              <Button>Registrieren</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="container flex flex-col items-center justify-center gap-6 py-24 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            KFZ-Schadenmanagement
            <br />
            <span className="text-primary">fuer Ihre Flotte</span>
          </h1>
          <p className="max-w-[600px] text-lg text-muted-foreground">
            Melden Sie Schaeden schnell und einfach. Behalten Sie den Ueberblick
            ueber alle Schaeden Ihrer Flotte und optimieren Sie Ihre Versicherungskosten.
          </p>
          <div className="flex gap-4">
            <Link href="/register">
              <Button size="lg">Kostenlos starten</Button>
            </Link>
            <Link href={'#features' as Route}>
              <Button size="lg" variant="outline">Mehr erfahren</Button>
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section className="border-t bg-muted/50 py-24">
          <div className="container">
            <h2 className="mb-12 text-center text-3xl font-bold">
              Warum POA?
            </h2>
            <div className="grid gap-8 md:grid-cols-3">
              <FeatureCard
                title="Schnelle Schadenmeldung"
                description="Erfassen Sie Schaeden in Minuten statt Stunden. Direkt vom Unfallort aus."
              />
              <FeatureCard
                title="Automatische Weiterleitung"
                description="Schaeden werden automatisch an Ihre Versicherung gesendet. Kein manueller Aufwand."
              />
              <FeatureCard
                title="Volle Uebersicht"
                description="Dashboard mit allen Schaeden, Kosten und Auswertungen auf einen Blick."
              />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} POA - Point of Accident. Alle Rechte vorbehalten.
          </p>
          <nav className="flex gap-4 text-sm text-muted-foreground">
            <Link href={'/impressum' as Route} className="hover:underline">Impressum</Link>
            <Link href={'/datenschutz' as Route} className="hover:underline">Datenschutz</Link>
            <Link href={'/agb' as Route} className="hover:underline">AGB</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
      <h3 className="mb-2 text-xl font-semibold">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
