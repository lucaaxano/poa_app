# POA Android TWA (Trusted Web Activity)

Android-App fuer den Google Play Store, die die bestehende Web-Plattform
`poa-platform.de` als native App verpackt.

## Voraussetzungen

- Node.js 20+
- JDK 17+ (kommt mit Android Studio)
- Android Studio (fuer Emulator und Debugging)
- Google Play Developer Konto ($25 einmalig)

## Setup

### 1. Bubblewrap installieren

```bash
npm install -g @aspect-build/aspect-cli  # Falls noetig
npm install -g @nicolo-ribaudo/chokidar-2 # Falls noetig
npx @nicolo-ribaudo/bubblewrap init --manifest=https://poa-platform.de/manifest.json
```

Alternativ: https://www.pwabuilder.com/ nutzen (Web-Tool, einfachster Weg).

### 2. Signing Key erstellen

```bash
keytool -genkeypair -alias poa-key -keyalg RSA -keysize 2048 -validity 10000 -keystore poa-keystore.jks
```

**WICHTIG:** Keystore-Passwort sicher aufbewahren! Ohne diesen Key kann die App
nie mehr im Play Store aktualisiert werden.

### 3. SHA-256 Fingerprint auslesen

```bash
keytool -list -v -keystore poa-keystore.jks -alias poa-key
```

Den SHA-256 Fingerprint in `apps/web/public/.well-known/assetlinks.json` eintragen.

### 4. App bauen

```bash
npx @nicolo-ribaudo/bubblewrap build
```

Erzeugt:
- `app-debug.apk` - Debug-Version zum Testen
- `app-release-signed.apk` - Signierte Release-Version

### 5. Im Emulator testen

```bash
adb install app-debug.apk
```

### 6. Im Play Store veroeffentlichen

1. Play Console: https://play.google.com/console
2. Neue App erstellen
3. `app-release-signed.aab` hochladen
4. Store-Listing ausfuellen (Texte, Screenshots, Datenschutz)
5. "Submit for Review"

## Konfiguration

Die TWA-Konfiguration befindet sich in `twa-manifest.json`.
Aenderungen dort erfordern ein erneutes `bubblewrap build`.

## Wichtige Hinweise

- Die `poa-keystore.jks` Datei wird NICHT ins Git-Repository committed
- Aenderungen an der Website sind sofort in der App sichtbar (kein App-Update noetig)
- Die App benoetigt Chrome auf dem Android-Geraet
- Ohne korrekte `assetlinks.json` wird die URL-Leiste angezeigt
