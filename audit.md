# Repository-Audit

Stand: 2026-08-12. Geprueft wurden Konfiguration, Build, TypeScript, ESLint, Tests sowie stichprobenartig Auth-, API- und XML/HTML-Pfade. Es wurde kein externer Dependency-/CVE-Scan ausgefuehrt.

## Kurzfazit

Der aktuelle Stand ist nicht release-faehig: Der Production-Build wird als Development-Bundle erzeugt, TypeScript meldet Quellcodefehler, und eine vorhandene TSX-Testsuite wird von Jest nicht gefunden. Ausserdem bestehen konkrete XSS-Risiken und eine zu breite Weitergabe von `.env`-Werten an den Browser.

## Arbeitspakete

### P0 – Production-Build korrigieren

**Befund:** `webpack.config.js:11-32` ermittelt Entwicklung aus `argv.mode`, Produktion aber aus `env.mode`. `yarn build` erzeugt deshalb ein unminifiziertes Development-Bundle mit `assets/js/vendors.js` (ca. 12 MiB), ohne Content-Hash und mit `NODE_ENV`-Konflikt.

**Aufgabe:** `isProd` aus `argv.mode` ableiten, `mode` konsistent setzen, den Bundle Analyzer nur per explizitem Flag und ohne automatisches Oeffnen aktivieren sowie die doppelte Bild-Regel (`webpack.config.js:74-88`) entfernen.

**Fertig wenn:** `yarn build` liefert minifizierte, gehashte JS/CSS-Dateien, meldet keinen `NODE_ENV`-Konflikt und startet keinen Browser. Ein automatisierter Smoke-Check sichert diese Eigenschaften.

### P0 – Client-seitige XSS-Pfade schliessen

**Befund:** Nicht vertrauenswuerdige Inhalte werden unter anderem in `src/components/support/XmlDisplay.tsx:5-16`, `AddNoteDialog.tsx:19-39` und `EditNoteDialog.tsx:33-88` ungefiltert als HTML eingesetzt. `src/utils/misc/stringHandling.ts:6-20` baut Hervorhebungs-HTML aus Backend-Text und Suchtext; mehrere Autocompletes rendern es mit `dangerouslySetInnerHTML`.

**Aufgabe:** Datenfluesse aller `dangerouslySetInnerHTML`-/`innerHTML`-Stellen inventarisieren. Hervorhebungen als React-Nodes rendern. Fuer notwendige TEI-Darstellung eine zentrale Allowlist-Sanitization bzw. sichere DOM-zu-React-Abbildung einfuehren.

**Fertig wenn:** Payloads mit `<img onerror>`, `<svg onload>`, `javascript:`-URLs und Attribut-Injektion werden nicht ausgefuehrt; Regressionstests decken Anzeige, Notizen und Autocompletes ab.

### P0 – Umgebungsvariablen nicht pauschal exponieren

**Befund:** `webpack.config.js:13-18` uebernimmt jeden Eintrag aus `.env` per `DefinePlugin` ins Browser-Bundle. Ein spaeter hinzugefuegtes Secret wuerde dadurch veroeffentlicht; auch `NODE_ENV` wird ueberschrieben.

**Aufgabe:** Nur eine explizite Allowlist oeffentlicher Variablen (z. B. `REACT_APP_API_URL`) definieren, erforderliche Werte validieren und `NODE_ENV` Webpack ueberlassen.

**Fertig wenn:** Der Build bricht bei fehlenden Pflichtwerten verstaendlich ab und ein Test beweist, dass eine beliebige Secret-Variable nicht im Bundle steht.

### P1 – TypeScript wieder zum verbindlichen Gate machen

**Befund:** `yarn tsc --noEmit` ist rot. Produktivcodefehler umfassen den fehlenden Import `src/components/App/App.tsx:2`, widerspruechliche `AuthUser`-/`getMe`-Modelle, falsche Button-Eventtypen und den doppelten `border`-Key in `ToolbarButton.tsx:9-40`. Babel baut trotzdem, da es nur Typen entfernt.

**Aufgabe:** Verwaisten Demo-Code entfernen oder vervollstaendigen, ein kanonisches Auth-User-Modell samt API-Mapping herstellen und `ToolbarButton` als echten Button korrekt typisieren. Danach `typecheck`-Script und CI-Gate ergaenzen.

**Fertig wenn:** `yarn tsc --noEmit` ohne Fehler laeuft und `yarn build` vorher oder parallel einen Typecheck ausfuehrt.

### P1 – Test-Erkennung reparieren

**Befund:** `jest.config.mjs:14` akzeptiert nur `*.test.ts`/`*.spec.ts`. Dadurch wird `tests/components/editor/left/OnlyReadableEditorPanelTest.tsx` nicht ausgefuehrt; der scheinbar gruene Lauf umfasst nur 4 Suites/29 Tests. Die ausgeschlossene Datei enthaelt zudem falsche Imports und veraltete Typannahmen.

**Aufgabe:** Einheitliche Dateinamen einfuehren oder `testMatch` um TSX und das vereinbarte Namensschema erweitern; die Komponententests reparieren. Einen CI-Check gegen unerkannte Testdateien ergaenzen.

**Fertig wenn:** Die Komponentensuite im normalen `yarn test --runInBand` sichtbar mitlaeuft und alle Tests sowie TypeScript bestehen.

### P1 – HTTP-/Auth-Infrastruktur konsolidieren

**Befund:** `initApi()` in `src/services/apiRequest.service.ts:36-117` erzeugt bei jedem Aufruf eine neue Axios-Instanz samt Interceptors und eigener Refresh-Queue. Das verhindert eine global koordinierte Refresh-Sperre. Der alternative `apiRequest()` ignoriert in Zeile 25-27 bis auf Header alle `RequestInit`-Optionen. Parallel existiert veraltete Token-Logik in `authActions.ts`/`utils/auth.ts`, obwohl Axios Cookies nutzt.

**Aufgabe:** Eine einzige API-Instanz exportieren, Refresh/Queue zentral halten, Fehlerpfad bei fehlendem `error.config` absichern und tote Fetch-/LocalStorage-Token-Pfade entfernen oder korrekt implementieren.

**Fertig wenn:** Parallel eintreffende 401-Antworten loesen genau einen Refresh aus; wartende Requests werden wiederholt oder gemeinsam abgelehnt; Tests decken GET, Mutation, Refresh-Erfolg und Refresh-Fehler ab.

### P1 – Lint-Baseline und CI herstellen

**Befund:** `yarn eslint src tests --max-warnings=0` meldet 24 Fehler und 2345 Warnungen. Der Husky-Hook `.husky/pre-commit` startet nur `npm test`; Typecheck, Lint und Production-Build sind nicht abgesichert.

**Aufgabe:** Zuerst die 24 Fehler beheben, reine Formatierungsbereinigung separat committen und danach Warnungen kontrolliert auf null reduzieren. Scripts `lint`, `typecheck` und `test:ci` anlegen und in CI ausfuehren.

**Fertig wenn:** Lint, Typecheck, Tests und Build sind reproduzierbar gruen und als Required Checks dokumentiert.

### P2 – Bundle und Assets verschlanken

**Befund:** Neben dem Build-Modusproblem werden TTF und WOFF2 parallel ausgeliefert; `public/favicon.ico` ist ca. 422 KiB. Der feste Vendor-Chunk verhindert feineres langfristiges Caching.

**Aufgabe:** Nach Behebung des Production-Modus Bundle-Report auswerten, ungenutzte Font-Formate/Icons entfernen, Favicon optimieren und Chunking/Lazy Loading fuer Monaco bzw. grosse Editor-Abhaengigkeiten pruefen.

**Fertig wenn:** Budgets fuer initiales JS, groesstes Asset und Gesamttransfer festgelegt und im Build automatisiert geprueft sind.

### P2 – Dokumentation und Altlasten bereinigen

**Befund:** `README.md` beschreibt weiterhin Create React App und `build/`, tatsaechlich werden Webpack und `dist/` verwendet. Es existieren parallele README-/ESLint-Konfigurationen sowie Dateien mit `.bak`/`.delete`; `eject` verweist auf das nicht installierte `react-scripts`.

**Aufgabe:** README an den realen Yarn-/Webpack-/HTTPS-/Deployment-Ablauf anpassen, tote Scripts und Altdateien nach Verwendungspruefung entfernen und genau eine ESLint-Konfiguration behalten.

**Fertig wenn:** Ein frischer Checkout kann allein anhand der README installiert, gestartet, getestet und gebaut werden; dokumentierte Befehle stimmen mit `package.json` ueberein.

## Verifizierte Befehle

- `yarn test --runInBand`: gruen, aber nur 4 Suites/29 Tests; TSX-Komponententest nicht erkannt.
- `yarn tsc --noEmit`: fehlgeschlagen; Fehler in Produktivcode und Tests.
- `yarn eslint src tests --max-warnings=0`: fehlgeschlagen; 24 Fehler/2345 Warnungen.
- `yarn build`: Exit 0, aber falscher Development-Output mit ca. 13 MiB Entry-Point und `NODE_ENV`-Warnung.

