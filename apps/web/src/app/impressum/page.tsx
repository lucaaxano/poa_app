import Link from 'next/link';
import Image from 'next/image';
import type { Route } from 'next';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Impressum - POA',
  description: 'Impressum der POA-Plattform für KFZ-Schadenmanagement',
};

export default function ImpressumPage() {
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
            <Link
              href="/login"
              className="rounded-xl px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Anmelden
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <div className="container max-w-4xl py-12 md:py-20">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Impressum
          </h1>
          <p className="mt-4 text-muted-foreground">
            Angaben gemäß § 5 TMG
          </p>

          <div className="prose prose-gray mt-10 max-w-none [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-medium [&_p]:mb-4 [&_p]:leading-relaxed [&_p]:text-muted-foreground [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:text-muted-foreground [&_li]:mb-1">

            <h2>Diensteanbieter</h2>
            <p>
              Axano GmbH<br />
              Stettener Hauptstraße 62<br />
              70771 Leinfelden-Echterdingen<br />
              Deutschland
            </p>

            <h2>Vertretungsberechtigte</h2>
            <p>
              Vertreten durch die Geschäftsführer:<br />
              Luca Montalti, Fynn Gehrung
            </p>

            <h2>Kontakt</h2>
            <p>
              Telefon: +49 711 96939999<br />
              E-Mail: team@axano.com<br />
              Website: <a href="https://www.axano.com" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">www.axano.com</a>
            </p>

            <h2>Registereintrag</h2>
            <p>
              Eintragung im Handelsregister.<br />
              Registergericht: Amtsgericht Stuttgart<br />
              Registernummer: HRB 800700
            </p>

            <h2>Umsatzsteuer-ID</h2>
            <p>
              Umsatzsteuer-Identifikationsnummer gemäß § 27a Umsatzsteuergesetz:<br />
              DE456905267
            </p>

            <h2>Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
            <p>
              Axano GmbH<br />
              Stettener Hauptstraße 62<br />
              70771 Leinfelden-Echterdingen
            </p>

            <h2>Haftungsausschluss</h2>

            <h3>Haftung für Inhalte</h3>
            <p>
              Als Diensteanbieter sind wir gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen
              Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir
              als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde
              Informationen zu überwachen oder nach Umständen zu forschen, die auf eine
              rechtswidrige Tätigkeit hinweisen.
            </p>
            <p>
              Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach
              den allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist
              jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich.
              Bei Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese Inhalte
              umgehend entfernen.
            </p>

            <h3>Haftung für Links</h3>
            <p>
              Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir
              keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine
              Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige
              Anbieter oder Betreiber der Seiten verantwortlich. Die verlinkten Seiten wurden
              zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft.
              Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar.
            </p>
            <p>
              Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne
              konkrete Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden
              von Rechtsverletzungen werden wir derartige Links umgehend entfernen.
            </p>

            <h3>Urheberrecht</h3>
            <p>
              Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten
              unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung,
              Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes
              bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
              Downloads und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen
              Gebrauch gestattet.
            </p>
            <p>
              Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt wurden, werden
              die Urheberrechte Dritter beachtet. Insbesondere werden Inhalte Dritter als solche
              gekennzeichnet. Sollten Sie trotzdem auf eine Urheberrechtsverletzung aufmerksam
              werden, bitten wir um einen entsprechenden Hinweis. Bei Bekanntwerden von
              Rechtsverletzungen werden wir derartige Inhalte umgehend entfernen.
            </p>

            <h2>Streitschlichtung</h2>
            <p>
              Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS)
              bereit: <a href="https://ec.europa.eu/consumers/odr/" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">https://ec.europa.eu/consumers/odr/</a>
            </p>
            <p>
              Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
              Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </div>
        </div>
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
              <Link href={'/impressum' as Route} className="hover:text-foreground transition-colors font-medium text-foreground">
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
