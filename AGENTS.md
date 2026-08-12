# Arbeitsanweisungen fuer dieses Repository

## Geltungsbereich

Diese Datei gilt fuer das gesamte Repository. Untergeordnete `AGENTS.md`-Dateien duerfen fuer ihren Teilbaum speziellere Regeln festlegen.

## Projektueberblick

- React-18-/TypeScript-Frontend fuer einen TEI-XML-Editor
- State: Redux Toolkit; UI: Material UI; HTTP: Axios
- Build: Webpack 5; Tests: Jest + Testing Library; Paketmanager: Yarn 4
- Quellcode liegt in `src/`, Tests in `tests/`, statische Dateien in `public/`
- Pfadalias: `@src/*` und `@tests/*`

## Lokale Befehle

```bash
yarn install
yarn start
yarn test --runInBand
yarn tsc --noEmit
yarn eslint src tests --max-warnings=0
yarn build
```

Hinweis: Der aktuelle Ausgangsstand besteht TypeScript und ESLint noch nicht. Neue Aenderungen duerfen keine weiteren Fehler einfuehren. Relevante Altfehler sind in `audit.md` festgehalten.

## Arbeitsweise

- Kleine, thematisch geschlossene Aenderungen bevorzugen.
- Vor Aenderungen die betroffenen Services, Redux-Slices und Tests gemeinsam lesen.
- Keine generierten Ordner (`dist/`, `coverage/`) committen.
- Keine `.env`-Dateien, Zertifikate, Tokens oder Zugangsdaten committen oder ins Client-Bundle einbetten.
- Neue Umgebungsvariablen in `.env.example` dokumentieren; im Browser nur explizit freigegebene Variablen exponieren.
- Bestehende deutsche UI-Texte und i18n-Struktur respektieren; neue sichtbare Texte nach Moeglichkeit ueber `src/i18n/` pflegen.
- Keine grossflaechige automatische Formatierung zusammen mit fachlichen Aenderungen.
- Code-Bezeichner (Variablen, Funktionen, Klassen, Komponenten, Hooks, Typen, Interfaces, Dateien, Ordner) sind englisch zu benennen; **Code-Kommentare sind ebenfalls ausnahmslos auf Englisch zu verfassen**, auch inline-Kommentare und Erklaerungen zu Bugfixes. Ausnahme: sichtbare UI-Texte (deutsch/i18n) und diese Projektdokumente (`AGENTS.md`, `audit.md`) bleiben deutsch.

## TypeScript und React

- `strict` beibehalten; kein neues `any`, `@ts-ignore` oder untypisiertes API-Ergebnis ohne Begruendung.
- API-Antworten an der Systemgrenze typisieren und bei nicht vertrauenswuerdigen Daten validieren.
- Eventtypen muessen zum tatsaechlichen HTML-Element passen.
- Hook-Abhaengigkeiten vollstaendig halten; asynchrone Effects gegen Updates nach Unmount und veraltete Antworten absichern.
- Redux-State nicht ueber direkte Store-Zugriffe umgehen, sofern ein Selector/Dispatch ausreicht.

## Sicherheit und TEI/XML

- Backend-, XML- und Nutzereingaben gelten als nicht vertrauenswuerdig.
- Kein neues `dangerouslySetInnerHTML` oder `innerHTML` fuer unbereinigte Daten.
- Fuer Hervorhebungen React-Nodes statt HTML-Strings erzeugen.
- Falls HTML zwingend gerendert wird: zentral sanitizen, erlaubte Tags/Attribute eng begrenzen und XSS-Regressionstests ergaenzen.
- TEI-Inhalte moeglichst mit `DOMParser`, DOM-Operationen und `XMLSerializer` verarbeiten; XML-Fehler explizit behandeln.
- Authentifizierung erfolgt cookie-basiert mit `withCredentials`; Tokens nicht neu in `localStorage` ablegen.

## Tests und Abnahme

- Tests als `*.test.ts`, `*.test.tsx`, `*.spec.ts` oder `*.spec.tsx` benennen und sicherstellen, dass Jest sie findet.
- Fehlerbehebungen erhalten mindestens einen Regressionstest.
- Vor Abschluss mindestens gezielte Tests und `yarn tsc --noEmit` ausfuehren.
- Bei Build-Aenderungen zusaetzlich `yarn build` pruefen: Production-Modus, Minifizierung, Content-Hashes und keine geheimen `.env`-Werte im Output.
- Nicht ausgefuehrte oder wegen Altfehlern gescheiterte Checks im Abschlussbericht klar nennen.

