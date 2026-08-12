# Arbeitsanweisungen fuer Claude Code in diesem Repository

Diese Datei ergaenzt `AGENTS.md` um Claude-spezifische Hinweise. Bei Widerspruechen gilt `AGENTS.md` als primaere Quelle; `audit.md` dokumentiert den bekannten Ist-Zustand samt offener Maengel. Beide Dateien vor groesseren Aenderungen lesen.

## Projektueberblick

- React-18-/TypeScript-Frontend fuer einen TEI-XML-Editor (Editionsprojekt, HU Berlin / MetaMW).
- State: Redux Toolkit; UI: Material UI (MUI 7); Editor-Komponenten: Lexical und Monaco; HTTP: Axios (cookie-basierte Auth, `withCredentials`).
- Build: Webpack 5; Tests: Jest + Testing Library; Paketmanager: Yarn 4 (`packageManager: yarn@4.9.1`).
- Quellcode in `src/`, Tests in `tests/`, statische Dateien in `public/`.
- Pfadaliase: `@src/*` und `@tests/*` (siehe `tsconfig.json`).
- Mehrsprachigkeit ueber `i18next`/`react-i18next`; Uebersetzungsdateien in `src/i18n/locales/{de,en}/...`.

### Verzeichnisstruktur (Auszug `src/`)

```
components/   UI-Komponenten, gegliedert nach Feature (editor, auto_anno, auth, header, layout, ...)
redux/        Redux-Toolkit-Slices und Thunks
services/     API-Zugriffe (u. a. services/apiRequest.service.ts, services/editor, services/auto_anno)
hooks/        Custom Hooks
schemas/      Zod-Schemas zur Validierung von API-/XML-Daten
models/       Domaenenmodelle/Typen
interfaces/   TS-Interfaces
utils/        Hilfsfunktionen (misc, editor, i18n, theme, auto_anno)
i18n/         i18next-Konfiguration und locales
```

## Lokale Befehle

```bash
yarn install
yarn start                  # Dev-Server (webpack serve --mode development)
yarn test --runInBand       # Jest-Tests
yarn tsc --noEmit           # Typecheck
yarn eslint src tests --max-warnings=0
yarn build                  # Production-Build (webpack --mode production)
```

**Wichtig:** Laut `audit.md` (Stand 2026-08-12) sind `yarn tsc --noEmit`, `yarn eslint ... --max-warnings=0` und der Production-Build (`yarn build`) aktuell **nicht gruen** bzw. fehlerhaft konfiguriert (Development-Bundle statt Production, XSS-Risiken, fehlerhafte Testerkennung fuer TSX-Dateien). Neue Aenderungen duerfen diese Zustaende nicht verschlechtern. Ob ein bestehender Fehler eine bekannte Altlast aus `audit.md` ist oder durch die eigene Aenderung neu entstanden ist, vor Abschluss pruefen und im Abschlussbericht klar benennen.

## Sprache im Projekt: Code englisch, UI/Doku deutsch

- **Alle Bezeichner im Code sind auf Englisch zu halten**: Variablen-, Funktions-, Klassen-, Komponenten-, Hook-, Typ-, Interface- und Dateinamen, Redux-Slice- und Action-Namen, Ordnernamen, Kommentare im Code.
- Bereits bestehende deutschsprachige Bezeichner beim Beruehren der jeweiligen Datei nach Moeglichkeit englisch benennen (kein grossflaechiges Rename-Refactoring ohne Auftrag, aber keine neuen deutschen Bezeichner einfuehren).
- **Ausnahme UI-Text und Fachdokumentation:** Sichtbare Oberflaechentexte bleiben deutsch (oder werden ueber `src/i18n/` gepflegt) und `AGENTS.md`/`audit.md`/`CLAUDE.md` bleiben in deutscher Sprache, da sie sich an das Projektteam richten. Diese Ausnahme betrifft **nicht** Code-Identifier.
- Neue sichtbare Texte nach Moeglichkeit ueber `src/i18n/locales/{de,en}/...` pflegen statt hartkodiert im JSX.
- Bei Unsicherheit, ob ein Bezeichner ein "Code-Identifier" oder "UI-Text" ist: Property-/Variablennamen, Funktionsnamen und Dateinamen sind Identifier (englisch); Strings, die im UI gerendert werden, sind Text (deutsch/i18n).

## Arbeitsweise

- Kleine, thematisch geschlossene Aenderungen bevorzugen.
- Vor Aenderungen die betroffenen Services, Redux-Slices und Tests gemeinsam lesen.
- Keine generierten Ordner (`dist/`, `coverage/`) committen.
- Keine `.env`-Dateien, Zertifikate, Tokens oder Zugangsdaten committen oder ins Client-Bundle einbetten (siehe `audit.md`, P0 "Umgebungsvariablen").
- Neue Umgebungsvariablen in `.env.example` dokumentieren; im Browser nur explizit freigegebene Variablen exponieren.
- Keine grossflaechige automatische Formatierung zusammen mit fachlichen Aenderungen.

## TypeScript und React

- `strict` beibehalten; kein neues `any`, `@ts-ignore` oder untypisiertes API-Ergebnis ohne Begruendung.
- API-Antworten an der Systemgrenze typisieren und bei nicht vertrauenswuerdigen Daten mit den vorhandenen Zod-Schemas (`src/schemas/`) validieren.
- Eventtypen muessen zum tatsaechlichen HTML-Element passen (bekannter Altfehler laut `audit.md`: `ToolbarButton.tsx`).
- Hook-Abhaengigkeiten vollstaendig halten; asynchrone Effects gegen Updates nach Unmount und veraltete Antworten absichern.
- Redux-State nicht ueber direkte Store-Zugriffe umgehen, sofern ein Selector/Dispatch ausreicht.

## Sicherheit und TEI/XML

- Backend-, XML- und Nutzereingaben gelten als nicht vertrauenswuerdig.
- **Kein neues `dangerouslySetInnerHTML` oder `innerHTML` fuer unbereinigte Daten.** Laut `audit.md` bestehen hier bereits P0-Risiken in `src/components/support/XmlDisplay.tsx`, `AddNoteDialog.tsx`, `EditNoteDialog.tsx` und in `src/utils/misc/stringHandling.ts` (Highlighting-HTML fuer Autocompletes). Diese nicht als Vorbild fuer neuen Code verwenden.
- Fuer Hervorhebungen (z. B. Suchtreffer) React-Nodes statt HTML-Strings erzeugen.
- Falls HTML zwingend gerendert werden muss: zentral sanitizen, erlaubte Tags/Attribute eng begrenzen und XSS-Regressionstests ergaenzen.
- TEI-Inhalte moeglichst mit `DOMParser`, DOM-Operationen und `XMLSerializer` verarbeiten; XML-Fehler explizit behandeln.
- Authentifizierung erfolgt cookie-basiert mit `withCredentials`; Tokens nicht neu in `localStorage` ablegen. Die API-Initialisierung (`src/services/apiRequest.service.ts`) ist laut `audit.md` aktuell mehrfach instanziiert (kein zentraler Refresh-Lock) — beim Anfassen dieses Bereichs die dort beschriebene Konsolidierung beruecksichtigen, aber nicht ungefragt refactorn.

## Tests und Abnahme

- Tests als `*.test.ts`, `*.test.tsx`, `*.spec.ts` oder `*.spec.tsx` benennen. **Achtung:** `jest.config.mjs` erkennt laut `audit.md` aktuell nur `*.test.ts`/`*.spec.ts` — TSX-Testdateien (z. B. `tests/components/editor/left/OnlyReadableEditorPanelTest.tsx`) werden derzeit **nicht** ausgefuehrt. Vor der Aussage "Tests laufen gruen" pruefen, ob die eigenen/betroffenen Tests tatsaechlich in den Jest-Report aufgenommen wurden.
- Fehlerbehebungen erhalten mindestens einen Regressionstest.
- Vor Abschluss mindestens gezielte Tests und `yarn tsc --noEmit` ausfuehren; bestehende Altfehler laut `audit.md` nicht mit neu eingefuehrten Fehlern verwechseln.
- Bei Build-Aenderungen zusaetzlich `yarn build` pruefen: Production-Modus, Minifizierung, Content-Hashes und keine geheimen `.env`-Werte im Output (siehe `audit.md`, P0 "Production-Build").
- Nicht ausgefuehrte oder wegen Altfehlern gescheiterte Checks im Abschlussbericht klar benennen, nicht verschweigen.

## Bekannte offene Punkte (siehe `audit.md` fuer Details)

Priorisiert nach `audit.md`, nicht automatisch im Rahmen fachfremder Tickets mitbeheben, aber bei Beruehrung der jeweiligen Datei beachten:

- **P0** Production-Build erzeugt faelschlich ein Development-Bundle (`webpack.config.js`).
- **P0** XSS-Risiken durch ungefilterte `dangerouslySetInnerHTML`-Stellen.
- **P0** `.env`-Werte werden pauschal per `DefinePlugin` ins Bundle uebernommen statt per Allowlist.
- **P1** TypeScript-Fehler im Produktivcode (u. a. `App.tsx`, `AuthUser`-Modell, `ToolbarButton.tsx`).
- **P1** Jest erkennt TSX-Testdateien nicht (siehe oben).
- **P1** Mehrfachinstanzierung der Axios-API-Instanz ohne zentralen Refresh-Lock.
- **P1** ESLint-Baseline nicht sauber (24 Fehler, >2000 Warnungen); Husky-Pre-Commit-Hook prueft nur Tests, nicht Lint/Typecheck/Build.
- **P2** Bundle-/Asset-Groesse (u. a. Favicon, doppelte Font-Formate); veraltete README-Angaben (Create React App statt Webpack).

## Bezug zu `AGENTS.md` und `audit.md`

- `AGENTS.md` bleibt die verbindliche Arbeitsanweisung fuer Repository-Konventionen; diese Datei uebernimmt deren Kerninhalte und ergaenzt sie um die Sprachregel (Code englisch) und den aktuellen Auditstand.
- `audit.md` wird bei substanziellen Fixes der dort genannten Punkte aktualisiert (Status/Erledigt-Vermerk), nicht stillschweigend geloescht.
