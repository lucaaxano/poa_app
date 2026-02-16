import Link from 'next/link';
import Image from 'next/image';
import type { Route } from 'next';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Datenschutzerklärung - POA',
  description: 'Datenschutzerklärung der POA-Plattform für KFZ-Schadenmanagement',
};

export default function DatenschutzPage() {
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
            Datenschutzerklärung
          </h1>
          <p className="mt-4 text-muted-foreground">
            Stand: Februar 2026
          </p>

          <div className="prose prose-gray mt-10 max-w-none [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-medium [&_p]:mb-4 [&_p]:leading-relaxed [&_p]:text-muted-foreground [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:text-muted-foreground [&_li]:mb-1">

            <h2>1. Verantwortlicher</h2>
            <p>
              Verantwortlicher im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:
            </p>
            <p>
              Axano GmbH<br />
              Stettener Hauptstraße 62<br />
              70771 Leinfelden-Echterdingen<br />
              Deutschland<br />
              E-Mail: support@poa-platform.de
            </p>

            <h2>2. Überblick über die Datenverarbeitung</h2>
            <p>
              Die POA-Plattform ist eine Lösung für KFZ-Schadenmanagement. Wir verarbeiten
              personenbezogene Daten ausschließlich im Rahmen der Nutzung unserer Web-Plattform
              (poa-platform.de) und der zugehörigen mobilen Apps (iOS und Android) gemäß den
              geltenden Datenschutzgesetzen, insbesondere der DSGVO.
            </p>

            <h2>3. Erhobene Daten</h2>

            <h3>3.1 Registrierung und Benutzerkonto</h3>
            <p>Bei der Registrierung erheben wir:</p>
            <ul>
              <li>Vor- und Nachname</li>
              <li>E-Mail-Adresse</li>
              <li>Passwort (verschlüsselt gespeichert)</li>
              <li>Firmenname und -adresse</li>
              <li>Telefonnummer (optional)</li>
              <li>Position / Funktion (optional)</li>
            </ul>
            <p>
              <strong>Rechtsgrundlage:</strong> Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO)
            </p>

            <h3>3.2 Schadensmeldungen</h3>
            <p>Im Rahmen der Schadensbearbeitung verarbeiten wir:</p>
            <ul>
              <li>Fahrzeugdaten (Kennzeichen, Marke, Modell)</li>
              <li>Schadensbeschreibung und -details</li>
              <li>Fotos des Schadens (einschließlich Metadaten wie Aufnahmedatum)</li>
              <li>Datum, Uhrzeit und Ort des Schadensereignisses</li>
              <li>Informationen zu beteiligten Parteien</li>
            </ul>
            <p>
              <strong>Rechtsgrundlage:</strong> Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO)
            </p>

            <h3>3.3 Technische Daten</h3>
            <p>Beim Zugriff auf unsere Plattform werden automatisch erhoben:</p>
            <ul>
              <li>IP-Adresse</li>
              <li>Browsertyp und -version</li>
              <li>Betriebssystem</li>
              <li>Datum und Uhrzeit des Zugriffs</li>
              <li>Gerätetyp (Desktop, Mobil, Tablet)</li>
            </ul>
            <p>
              <strong>Rechtsgrundlage:</strong> Berechtigtes Interesse (Art. 6 Abs. 1 lit. f DSGVO)
              an der Sicherstellung des Betriebs und der Sicherheit der Plattform.
            </p>

            <h2>4. iOS-App und native Funktionen</h2>
            <p>
              Die POA iOS-App ist eine native Anwendung, die über den Apple App Store erhältlich
              ist und auf unsere Web-Plattform zugreift. Zusätzlich zu den oben genannten Daten
              gelten folgende Besonderheiten:
            </p>

            <h3>4.1 Biometrische Authentifizierung (Face ID / Touch ID)</h3>
            <p>
              Die App bietet optional die Möglichkeit, sich mit Face ID oder Touch ID anzumelden.
              Dabei gilt:
            </p>
            <ul>
              <li>
                <strong>Keine Speicherung biometrischer Daten durch POA:</strong> Die biometrische
                Erkennung wird ausschließlich durch das iOS-Betriebssystem von Apple durchgeführt.
                POA hat zu keinem Zeitpunkt Zugriff auf Ihre biometrischen Daten (Gesichts- oder
                Fingerabdruckdaten).
              </li>
              <li>
                <strong>Sichere Schlüsselspeicherung:</strong> Bei aktivierter biometrischer
                Anmeldung wird ein Sitzungs-Token (Refresh Token) in der Apple iOS Keychain
                gespeichert. Die Keychain ist ein vom Betriebssystem geschützter,
                verschlüsselter Speicher, der hardwarebasiert abgesichert ist (Secure Enclave).
              </li>
              <li>
                <strong>Freiwilligkeit:</strong> Die biometrische Anmeldung ist vollständig
                optional. Sie können die Funktion jederzeit deaktivieren, ohne Einschränkungen
                bei der Nutzung der App.
              </li>
              <li>
                <strong>Löschung:</strong> Bei Abmeldung (Logout) werden die in der Keychain
                gespeicherten Anmeldedaten automatisch gelöscht.
              </li>
            </ul>
            <p>
              <strong>Rechtsgrundlage:</strong> Einwilligung (Art. 6 Abs. 1 lit. a DSGVO).
              Die Aktivierung erfolgt durch eine aktive Nutzerhandlung.
            </p>

            <h3>4.2 Kamerazugriff</h3>
            <p>
              Die App kann auf die Kamera Ihres Geräts zugreifen, um Fotos von Schäden
              aufzunehmen. Der Zugriff erfolgt nur nach ausdrücklicher Genehmigung über das
              iOS-Berechtigungssystem. Fotos werden ausschließlich zum Zweck der
              Schadensdokumentation auf unseren Servern gespeichert.
            </p>

            <h3>4.3 Lokale Datenspeicherung</h3>
            <p>
              Die App speichert lokal auf Ihrem Gerät:
            </p>
            <ul>
              <li>Authentifizierungs-Tokens für die Sitzungsverwaltung (verschlüsselt in der iOS Keychain)</li>
              <li>Zwischengespeicherte Inhalte für schnellere Ladezeiten (Browser-Cache)</li>
            </ul>
            <p>
              Diese Daten werden bei Abmeldung oder Deinstallation der App gelöscht.
            </p>

            <h2>5. Zweck der Datenverarbeitung</h2>
            <p>Wir verarbeiten Ihre Daten zu folgenden Zwecken:</p>
            <ul>
              <li>Bereitstellung und Betrieb der POA-Plattform</li>
              <li>Verwaltung Ihres Benutzerkontos</li>
              <li>Erfassung, Verwaltung und Weiterleitung von Schadensmeldungen</li>
              <li>Kommunikation mit Ihnen bezüglich Ihres Kontos und Ihrer Schadensmeldungen</li>
              <li>Erstellung von Statistiken und Auswertungen für Ihr Unternehmen</li>
              <li>Sicherstellung der IT-Sicherheit und des störungsfreien Betriebs</li>
              <li>Erfüllung gesetzlicher Aufbewahrungspflichten</li>
            </ul>

            <h2>6. Datenweitergabe an Dritte</h2>
            <p>
              Eine Weitergabe Ihrer personenbezogenen Daten an Dritte erfolgt nur in
              folgenden Fällen:
            </p>
            <ul>
              <li>
                <strong>Versicherungsgesellschaften und Makler:</strong> Schadensmeldungen
                werden an die von Ihrem Unternehmen hinterlegten Versicherungspartner
                weitergeleitet, sofern dies im Rahmen der Schadensbearbeitung erforderlich ist.
              </li>
              <li>
                <strong>Auftragsverarbeiter:</strong> Wir setzen technische Dienstleister ein
                (Hosting, E-Mail-Versand), die Daten in unserem Auftrag verarbeiten. Mit
                diesen bestehen Auftragsverarbeitungsverträge nach Art. 28 DSGVO.
              </li>
              <li>
                <strong>Gesetzliche Verpflichtung:</strong> Wenn wir gesetzlich dazu
                verpflichtet sind (Art. 6 Abs. 1 lit. c DSGVO).
              </li>
            </ul>

            <h2>7. Auftragsverarbeiter und Dienste</h2>
            <p>Wir nutzen folgende Dienste:</p>
            <ul>
              <li>
                <strong>Hosting:</strong> Unsere Server befinden sich in Deutschland/EU.
                Die Datenverarbeitung erfolgt ausschließlich innerhalb der Europäischen Union.
              </li>
              <li>
                <strong>E-Mail-Versand:</strong> Für transaktionale E-Mails (Registrierung,
                Passwort-Reset, Benachrichtigungen) nutzen wir einen E-Mail-Dienstleister
                mit Sitz in der EU.
              </li>
              <li>
                <strong>Dateispeicherung:</strong> Hochgeladene Schadenfotos und Dokumente
                werden auf unseren eigenen Servern in der EU gespeichert.
              </li>
            </ul>

            <h2>8. Cookies und lokale Speicherung</h2>
            <p>
              Die POA-Plattform verwendet:
            </p>
            <ul>
              <li>
                <strong>Technisch notwendige Speicherung:</strong> Authentifizierungs-Tokens
                werden im Local Storage Ihres Browsers gespeichert, um Ihre Anmeldung
                aufrechtzuerhalten. Diese sind für den Betrieb der Plattform unbedingt
                erforderlich.
              </li>
              <li>
                <strong>Service Worker:</strong> Für schnelleres Laden und Offline-Fähigkeit
                wird ein Service Worker eingesetzt, der statische Inhalte zwischenspeichert.
              </li>
            </ul>
            <p>
              Wir verwenden <strong>keine</strong> Tracking-Cookies, Analyse-Tools von Drittanbietern
              oder Werbe-Tracker.
            </p>

            <h2>9. Datensicherheit</h2>
            <p>
              Wir setzen umfangreiche technische und organisatorische Maßnahmen ein, um
              Ihre Daten zu schützen:
            </p>
            <ul>
              <li>Verschlüsselte Datenübertragung (TLS/HTTPS)</li>
              <li>Verschlüsselte Passwortspeicherung (bcrypt)</li>
              <li>Zwei-Faktor-Authentifizierung (2FA) als optionale Sicherheitsstufe</li>
              <li>Regelmäßige Sicherheitsupdates und Zugangskontrollen</li>
              <li>Server-Standort in Deutschland/EU</li>
            </ul>

            <h2>10. Aufbewahrungsdauer</h2>
            <p>
              Wir speichern Ihre personenbezogenen Daten nur so lange, wie es für die
              jeweiligen Verarbeitungszwecke erforderlich ist:
            </p>
            <ul>
              <li>
                <strong>Kontodaten:</strong> Für die Dauer der Vertragsbeziehung und
                anschließend gemäß gesetzlicher Aufbewahrungsfristen (bis zu 10 Jahre nach
                handels- und steuerrechtlichen Vorgaben).
              </li>
              <li>
                <strong>Schadensmeldungen:</strong> Für die Dauer der Bearbeitungszeit
                sowie anschließend gemäß gesetzlicher Aufbewahrungsfristen.
              </li>
              <li>
                <strong>Technische Logs:</strong> Maximal 90 Tage.
              </li>
            </ul>
            <p>
              Nach Ablauf der Aufbewahrungsfrist werden Ihre Daten gelöscht oder
              anonymisiert.
            </p>

            <h2>11. Ihre Rechte</h2>
            <p>
              Gemäß der DSGVO stehen Ihnen folgende Rechte zu:
            </p>
            <ul>
              <li>
                <strong>Auskunftsrecht (Art. 15 DSGVO):</strong> Sie haben das Recht,
                Auskunft über die von uns verarbeiteten personenbezogenen Daten zu verlangen.
              </li>
              <li>
                <strong>Recht auf Berichtigung (Art. 16 DSGVO):</strong> Sie können die
                Berichtigung unrichtiger Daten verlangen.
              </li>
              <li>
                <strong>Recht auf Löschung (Art. 17 DSGVO):</strong> Sie können die
                Löschung Ihrer Daten verlangen, sofern keine gesetzlichen
                Aufbewahrungspflichten entgegenstehen.
              </li>
              <li>
                <strong>Recht auf Einschränkung (Art. 18 DSGVO):</strong> Sie können
                die Einschränkung der Verarbeitung Ihrer Daten verlangen.
              </li>
              <li>
                <strong>Recht auf Datenübertragbarkeit (Art. 20 DSGVO):</strong> Sie
                haben das Recht, Ihre Daten in einem gängigen Format zu erhalten.
              </li>
              <li>
                <strong>Widerspruchsrecht (Art. 21 DSGVO):</strong> Sie können der
                Verarbeitung Ihrer Daten widersprechen.
              </li>
              <li>
                <strong>Recht auf Widerruf der Einwilligung (Art. 7 Abs. 3 DSGVO):</strong> Sie
                können eine erteilte Einwilligung jederzeit widerrufen.
              </li>
            </ul>
            <p>
              Zur Ausübung Ihrer Rechte wenden Sie sich bitte an: <strong>support@poa-platform.de</strong>
            </p>

            <h2>12. Beschwerderecht</h2>
            <p>
              Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde über die
              Verarbeitung Ihrer personenbezogenen Daten zu beschweren. Zuständig ist die
              Aufsichtsbehörde des Bundeslandes, in dem Sie Ihren Wohnsitz haben, oder die
              Behörde am Sitz unseres Unternehmens.
            </p>

            <h2>13. Änderungen dieser Datenschutzerklärung</h2>
            <p>
              Wir behalten uns vor, diese Datenschutzerklärung anzupassen, um sie an
              geänderte Rechtslagen oder bei Änderungen der Plattform oder der
              Datenverarbeitung anzupassen. Die aktuelle Fassung finden Sie stets auf
              dieser Seite.
            </p>

            <h2>14. Kontakt</h2>
            <p>
              Bei Fragen zum Datenschutz erreichen Sie uns unter:
            </p>
            <p>
              E-Mail: <strong>support@poa-platform.de</strong><br />
              Website: <strong>https://poa-platform.de</strong>
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
              <Link href={'/datenschutz' as Route} className="hover:text-foreground transition-colors font-medium text-foreground">
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
