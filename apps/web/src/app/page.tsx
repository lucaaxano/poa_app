import Link from 'next/link';
import Image from 'next/image';
import type { Route } from 'next';
import { Button } from '@/components/ui/button';
import { Car, Shield, BarChart3, Zap, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-white/80 backdrop-blur-lg">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image
              src="/logo-full.png"
              alt="POA - Point of Accident"
              width={160}
              height={40}
            />
          </Link>
          <nav className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                Anmelden
              </Button>
            </Link>
            <Link href="/register">
              <Button className="rounded-xl px-6">
                Kostenlos starten
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="container py-20 md:py-32">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/5 px-4 py-2 text-sm text-primary">
              <Zap className="h-4 w-4" />
              Schadenmanagement neu gedacht
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              KFZ-Schadenmanagement
              <br />
              <span className="text-primary">fuer Ihre Flotte</span>
            </h1>
            <p className="mx-auto mt-8 max-w-2xl text-lg text-muted-foreground md:text-xl">
              Melden Sie Schaeden schnell und einfach. Behalten Sie den Ueberblick
              ueber alle Schaeden Ihrer Flotte und optimieren Sie Ihre Versicherungskosten.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/register">
                <Button size="lg" className="h-14 rounded-xl px-8 text-base">
                  Kostenlos starten
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href={'#features' as Route}>
                <Button size="lg" variant="outline" className="h-14 rounded-xl px-8 text-base">
                  Mehr erfahren
                </Button>
              </Link>
            </div>
            <div className="mt-12 flex items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Kostenlos testen
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Keine Kreditkarte
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                DSGVO-konform
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="border-t bg-muted/30 py-20 md:py-32">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Warum POA?
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Alles was Sie brauchen, um Ihre Flottenschaeden effizient zu verwalten.
              </p>
            </div>
            <div className="mx-auto mt-16 grid max-w-5xl gap-8 md:grid-cols-3">
              <FeatureCard
                icon={<Zap className="h-6 w-6" />}
                title="Schnelle Schadenmeldung"
                description="Erfassen Sie Schaeden in Minuten statt Stunden. Direkt vom Unfallort aus mit Fotos und allen Details."
              />
              <FeatureCard
                icon={<Shield className="h-6 w-6" />}
                title="Automatische Weiterleitung"
                description="Schaeden werden automatisch an Ihre Versicherung gesendet. Kein manueller Aufwand mehr."
              />
              <FeatureCard
                icon={<BarChart3 className="h-6 w-6" />}
                title="Volle Uebersicht"
                description="Dashboard mit allen Schaeden, Kosten und Auswertungen auf einen Blick."
              />
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="border-t py-20 md:py-32">
          <div className="container">
            <div className="mx-auto grid max-w-4xl gap-8 text-center md:grid-cols-3">
              <div>
                <div className="text-4xl font-bold text-primary md:text-5xl">75%</div>
                <p className="mt-2 text-muted-foreground">Schnellere Bearbeitung</p>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary md:text-5xl">24/7</div>
                <p className="mt-2 text-muted-foreground">Erreichbarkeit</p>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary md:text-5xl">100%</div>
                <p className="mt-2 text-muted-foreground">Digital & papierlos</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t bg-primary py-20 md:py-32">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Bereit, Ihr Schadenmanagement zu optimieren?
              </h2>
              <p className="mt-4 text-lg text-white/80">
                Starten Sie noch heute kostenlos und erleben Sie, wie einfach Schadenmanagement sein kann.
              </p>
              <div className="mt-10">
                <Link href="/register">
                  <Button size="lg" variant="secondary" className="h-14 rounded-xl px-8 text-base">
                    Jetzt kostenlos starten
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-3">
              <Image
                src="/logo-icon.png"
                alt="POA Logo"
                width={32}
                height={32}
              />
              <span className="text-sm text-muted-foreground">
                &copy; {new Date().getFullYear()} POA - Point of Accident. Alle Rechte vorbehalten.
              </span>
            </div>
            <nav className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href={'/impressum' as Route} className="hover:text-foreground transition-colors">
                Impressum
              </Link>
              <Link href={'/datenschutz' as Route} className="hover:text-foreground transition-colors">
                Datenschutz
              </Link>
              <Link href={'/agb' as Route} className="hover:text-foreground transition-colors">
                AGB
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="group rounded-2xl border bg-white p-8 shadow-soft transition-all hover:shadow-soft-lg">
      <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-white">
        {icon}
      </div>
      <h3 className="mb-3 text-xl font-semibold">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
