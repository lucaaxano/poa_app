import Link from 'next/link';
import Image from 'next/image';
import type { Route } from 'next';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AGB - POA',
  description: 'Allgemeine Geschäftsbedingungen der POA-Plattform für KFZ-Schadenmanagement',
};

export default function AGBPage() {
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
            Allgemeine Geschäftsbedingungen
          </h1>
          <p className="mt-4 text-muted-foreground">
            Stand: Februar 2026
          </p>

          <div className="prose prose-gray mt-10 max-w-none [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-medium [&_p]:mb-4 [&_p]:leading-relaxed [&_p]:text-muted-foreground [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:text-muted-foreground [&_li]:mb-1 [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:text-muted-foreground">

            <h2>§ 1 Geltungsbereich</h2>
            <p>
              (1) Diese Allgemeinen Geschäftsbedingungen (nachfolgend &quot;AGB&quot;) gelten für die
              Nutzung der webbasierten SaaS-Plattform &quot;POA - Point of Accident&quot; (nachfolgend
              &quot;Plattform&quot;), betrieben von der Axano GmbH, Stettener Hauptstraße 62,
              70771 Leinfelden-Echterdingen (nachfolgend &quot;Anbieter&quot;).
            </p>
            <p>
              (2) Die Plattform richtet sich ausschließlich an Unternehmer im Sinne des § 14 BGB
              (nachfolgend &quot;Kunde&quot;). Die Nutzung durch Verbraucher im Sinne des § 13 BGB ist
              nicht vorgesehen.
            </p>
            <p>
              (3) Abweichende, entgegenstehende oder ergänzende AGB des Kunden werden nur dann
              Vertragsbestandteil, wenn der Anbieter ihrer Geltung ausdrücklich schriftlich
              zugestimmt hat.
            </p>

            <h2>§ 2 Vertragsgegenstand</h2>
            <p>
              (1) Der Anbieter stellt dem Kunden eine cloudbasierte Plattform zur Verwaltung von
              KFZ-Schadensmeldungen zur Verfügung. Die Plattform umfasst insbesondere:
            </p>
            <ul>
              <li>Erfassung und Verwaltung von KFZ-Schadensmeldungen</li>
              <li>Upload und Speicherung von Schadensdokumentationen (Fotos, Dokumente)</li>
              <li>Verwaltung von Fahrzeugflotten</li>
              <li>Benutzerverwaltung mit Rollenkonzept</li>
              <li>Weiterleitung von Schadensmeldungen an Versicherungen und Makler</li>
              <li>Statistische Auswertungen und Dashboards</li>
              <li>Zugang über Webbrowser sowie mobile Apps (iOS und Android)</li>
            </ul>
            <p>
              (2) Der genaue Funktionsumfang ergibt sich aus der jeweils aktuellen
              Leistungsbeschreibung auf der Plattform. Der Anbieter behält sich vor, den
              Funktionsumfang weiterzuentwickeln und zu verbessern, solange die wesentlichen
              Kernfunktionen erhalten bleiben.
            </p>

            <h2>§ 3 Vertragsschluss und Registrierung</h2>
            <p>
              (1) Der Vertrag kommt durch die Registrierung des Kunden auf der Plattform und
              die Bestätigung der E-Mail-Adresse zustande.
            </p>
            <p>
              (2) Der Kunde ist verpflichtet, bei der Registrierung wahrheitsgemäße und
              vollständige Angaben zu machen und diese aktuell zu halten.
            </p>
            <p>
              (3) Der Kunde ist für die Geheimhaltung seiner Zugangsdaten verantwortlich und
              haftet für jede Nutzung, die unter seinen Zugangsdaten erfolgt, sofern er den
              Missbrauch nicht zu vertreten hat.
            </p>

            <h2>§ 4 Nutzungsrechte</h2>
            <p>
              (1) Der Anbieter räumt dem Kunden für die Dauer des Vertrages ein nicht
              ausschließliches, nicht übertragbares Recht ein, die Plattform im Rahmen dieser
              AGB zu nutzen.
            </p>
            <p>
              (2) Der Kunde darf die Plattform nur für eigene geschäftliche Zwecke nutzen. Eine
              Unterlizenzierung oder Weitergabe des Zugangs an Dritte ist ohne vorherige
              schriftliche Zustimmung des Anbieters nicht gestattet, es sei denn, es handelt sich
              um vom Kunden eingeladene Benutzer (Mitarbeiter, Makler) im Rahmen der
              Plattformfunktionen.
            </p>
            <p>
              (3) Der Kunde darf die Plattform nicht missbräuchlich nutzen, insbesondere nicht:
            </p>
            <ul>
              <li>die Plattform überlasten oder deren Betrieb stören</li>
              <li>Sicherheitsmechanismen umgehen oder testen</li>
              <li>rechtswidrige Inhalte über die Plattform verbreiten</li>
              <li>die Plattform für Zwecke nutzen, die gegen geltendes Recht verstoßen</li>
            </ul>

            <h2>§ 5 Verfügbarkeit und Support</h2>
            <p>
              (1) Der Anbieter bemüht sich um eine Verfügbarkeit der Plattform von 99 % im
              Jahresmittel. Hiervon ausgenommen sind Zeiten geplanter Wartungsarbeiten,
              höherer Gewalt sowie Störungen außerhalb des Einflussbereichs des Anbieters
              (z. B. Internetausfälle, Störungen bei Drittanbietern).
            </p>
            <p>
              (2) Geplante Wartungsarbeiten werden nach Möglichkeit außerhalb der
              Geschäftszeiten durchgeführt und dem Kunden rechtzeitig angekündigt.
            </p>
            <p>
              (3) Support erfolgt per E-Mail an team@axano.com während der Geschäftszeiten
              (Montag bis Freitag, 9:00 - 17:00 Uhr MEZ, ausgenommen gesetzliche Feiertage
              in Baden-Württemberg).
            </p>

            <h2>§ 6 Preise und Zahlung</h2>
            <p>
              (1) Die Nutzung der Plattform ist kostenpflichtig. Die aktuellen Preise ergeben sich
              aus der Preisübersicht auf der Plattform. Alle Preise verstehen sich zuzüglich der
              gesetzlichen Umsatzsteuer.
            </p>
            <p>
              (2) Die Abrechnung erfolgt monatlich auf Basis der aktiven Fahrzeuganzahl im
              Fuhrpark des Kunden. Es gilt ein Mindestpreis von 49,00 EUR netto pro Monat.
              Der Preis pro Fahrzeug beträgt 4,99 EUR netto pro Monat.
            </p>
            <p>
              (3) Die Zahlung erfolgt per Kreditkarte oder einem anderen auf der Plattform
              angebotenen Zahlungsmittel. Die Zahlungsabwicklung erfolgt über den
              Zahlungsdienstleister Stripe (Stripe Payments Europe, Ltd.).
            </p>
            <p>
              (4) Der Anbieter behält sich vor, die Preise mit einer Ankündigungsfrist von
              mindestens 4 Wochen zum nächsten Abrechnungszeitraum anzupassen. Der Kunde hat
              in diesem Fall ein Sonderkündigungsrecht zum Zeitpunkt des Inkrafttretens der
              Preisanpassung.
            </p>

            <h2>§ 7 Vertragslaufzeit und Kündigung</h2>
            <p>
              (1) Der Vertrag wird auf unbestimmte Zeit geschlossen und kann von beiden
              Seiten mit einer Frist von 30 Tagen zum Ende eines Abrechnungszeitraums
              (Kalendermonat) gekündigt werden.
            </p>
            <p>
              (2) Das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt
              unberührt. Ein wichtiger Grund liegt für den Anbieter insbesondere vor, wenn:
            </p>
            <ul>
              <li>der Kunde gegen wesentliche Bestimmungen dieser AGB verstößt</li>
              <li>der Kunde mit der Zahlung trotz Mahnung länger als 30 Tage in Verzug ist</li>
              <li>der Kunde die Plattform missbräuchlich nutzt</li>
            </ul>
            <p>
              (3) Die Kündigung kann über die Plattform (Abonnement-Verwaltung) oder
              schriftlich per E-Mail an team@axano.com erfolgen.
            </p>
            <p>
              (4) Nach Beendigung des Vertrages wird der Zugang des Kunden zur Plattform
              gesperrt. Der Kunde hat ab Vertragsende 30 Tage Zeit, seine Daten zu exportieren.
              Danach werden die Daten unwiderruflich gelöscht, sofern keine gesetzlichen
              Aufbewahrungspflichten entgegenstehen.
            </p>

            <h2>§ 8 Daten und Datenschutz</h2>
            <p>
              (1) Der Kunde bleibt Eigentümer aller von ihm in die Plattform eingegebenen Daten.
              Der Anbieter verarbeitet diese Daten ausschließlich im Auftrag und nach Weisung
              des Kunden im Rahmen der Vertragserfüllung.
            </p>
            <p>
              (2) Die Verarbeitung personenbezogener Daten erfolgt gemäß der
              Datenschutzerklärung des Anbieters, die unter{' '}
              <Link href={'/datenschutz' as Route} className="text-primary hover:underline">
                poa-platform.de/datenschutz
              </Link>{' '}
              abrufbar ist.
            </p>
            <p>
              (3) Soweit der Anbieter im Rahmen der Leistungserbringung als
              Auftragsverarbeiter im Sinne des Art. 28 DSGVO tätig wird, schließen die
              Parteien einen gesonderten Auftragsverarbeitungsvertrag.
            </p>
            <p>
              (4) Der Anbieter sichert zu, angemessene technische und organisatorische Maßnahmen
              zum Schutz der Kundendaten zu treffen. Dazu gehören insbesondere verschlüsselte
              Datenübertragung (TLS), verschlüsselte Passwortspeicherung und regelmäßige
              Sicherheitsupdates.
            </p>

            <h2>§ 9 Haftung</h2>
            <p>
              (1) Der Anbieter haftet unbeschränkt für Schäden aus der Verletzung des Lebens,
              des Körpers oder der Gesundheit sowie für Vorsatz und grobe Fahrlässigkeit.
            </p>
            <p>
              (2) Bei leichter Fahrlässigkeit haftet der Anbieter nur bei Verletzung wesentlicher
              Vertragspflichten (Kardinalpflichten). Die Haftung ist in diesem Fall auf den
              vorhersehbaren, vertragstypischen Schaden begrenzt, maximal jedoch auf die vom
              Kunden in den letzten 12 Monaten gezahlten Vergütungen.
            </p>
            <p>
              (3) Die Haftung für Datenverlust ist auf den typischen
              Wiederherstellungsaufwand beschränkt, der bei regelmäßiger und
              gefahrentsprechender Anfertigung von Sicherungskopien eingetreten wäre.
            </p>
            <p>
              (4) Die vorstehenden Haftungsbeschränkungen gelten auch zugunsten der
              gesetzlichen Vertreter, Erfüllungs- und Verrichtungsgehilfen des Anbieters.
            </p>

            <h2>§ 10 Gewährleistung</h2>
            <p>
              (1) Der Anbieter gewährleistet, dass die Plattform im Wesentlichen der
              Leistungsbeschreibung entspricht. Unerhebliche Abweichungen stellen keinen Mangel
              dar.
            </p>
            <p>
              (2) Der Kunde hat Mängel unverzüglich nach Entdeckung schriftlich anzuzeigen.
              Der Anbieter wird angezeigte Mängel in angemessener Frist beheben.
            </p>
            <p>
              (3) Gewährleistungsansprüche bestehen nicht, wenn Mängel auf eine
              vertragswidrige Nutzung, Eingriffe des Kunden oder Dritter oder auf höhere
              Gewalt zurückzuführen sind.
            </p>

            <h2>§ 11 Geheimhaltung</h2>
            <p>
              Beide Parteien verpflichten sich, vertrauliche Informationen der jeweils anderen
              Partei, die im Rahmen der Vertragsbeziehung bekannt werden, geheim zu halten und
              nicht an Dritte weiterzugeben. Diese Pflicht besteht über die Beendigung des
              Vertrages hinaus fort.
            </p>

            <h2>§ 12 Änderungen der AGB</h2>
            <p>
              (1) Der Anbieter behält sich vor, diese AGB mit angemessener Ankündigungsfrist
              von mindestens 4 Wochen zu ändern. Die Änderungen werden dem Kunden per E-Mail
              oder über die Plattform mitgeteilt.
            </p>
            <p>
              (2) Widerspricht der Kunde den Änderungen nicht innerhalb von 4 Wochen nach
              Zugang der Mitteilung, gelten die geänderten AGB als angenommen. Der Anbieter
              wird den Kunden in der Änderungsmitteilung auf die Widerspruchsmöglichkeit und
              die Rechtsfolgen hinweisen.
            </p>
            <p>
              (3) Im Falle eines Widerspruchs steht beiden Parteien ein Sonderkündigungsrecht
              zum Zeitpunkt des Inkrafttretens der Änderungen zu.
            </p>

            <h2>§ 13 Schlussbestimmungen</h2>
            <p>
              (1) Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des
              UN-Kaufrechts.
            </p>
            <p>
              (2) Gerichtsstand für alle Streitigkeiten aus und im Zusammenhang mit diesem
              Vertrag ist Stuttgart, sofern der Kunde Kaufmann, juristische Person des
              öffentlichen Rechts oder öffentlich-rechtliches Sondervermögen ist.
            </p>
            <p>
              (3) Sollten einzelne Bestimmungen dieser AGB unwirksam oder undurchführbar sein
              oder werden, so bleibt die Wirksamkeit der übrigen Bestimmungen unberührt. An
              die Stelle der unwirksamen oder undurchführbaren Bestimmung tritt eine wirksame
              Regelung, die dem wirtschaftlichen Zweck der unwirksamen Bestimmung am nächsten
              kommt.
            </p>
            <p>
              (4) Mündliche Nebenabreden bestehen nicht. Änderungen und Ergänzungen dieses
              Vertrages bedürfen der Schriftform. Dies gilt auch für die Aufhebung dieser
              Schriftformklausel.
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
              <Link href={'/impressum' as Route} className="hover:text-foreground transition-colors">
                Impressum
              </Link>
              <Link href={'/datenschutz' as Route} className="hover:text-foreground transition-colors">
                Datenschutz
              </Link>
              <Link href={'/agb' as Route} className="hover:text-foreground transition-colors font-medium text-foreground">
                AGB
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
