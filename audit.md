# Repository-Audit

Ursprünglicher Stand: 2026-08-12. Aktualisiert: 2026-08-12 (nach Abarbeitung aller P0- und der meisten P1-Punkte, siehe Commit-Verweise unten). Geprüft wurden Konfiguration, Build, TypeScript, ESLint, Tests sowie stichprobenartig Auth-, API- und XML/HTML-Pfade. Es wurde kein externer Dependency-/CVE-Scan ausgefuehrt.

## Kurzfazit (Update)

Alle P0-Befunde sowie die HTTP-/Auth-Konsolidierung, der TypeScript-Gate und die ESLint-Fehler (nicht Warnungen) aus dem ursprünglichen Audit sind behoben. `yarn tsc --noEmit`, `yarn eslint src tests --max-warnings=0` (0 Fehler) und `yarn build` (korrekter Produktionsmodus) laufen sauber; die volle Testsuite (11 Suiten / 86 Tests) ist grün. Offen bleiben: ~2100→38 reduzierte ESLint-Warnungen (davon 32 `react-hooks/exhaustive-deps` bewusst nicht blind gefixt, siehe unten), zwei dabei neu entdeckte vermutlich unfertige Features, sowie die P2-Punkte (Bundle-Größe, Doku/Altlasten, CI-Einrichtung).

## Erledigte Arbeitspakete

### P0 – Production-Build korrigieren ✅
**Commit:** `fix production build: correct mode detection, allowlist exposed env vars`
`isProd` wird jetzt aus `argv.mode` abgeleitet (vorher `env.mode`, dadurch immer `false`). Verifiziert: `vendors.js` 12 MiB unminifiziert → 3.63 MiB minifiziert mit Content-Hashes, kein `NODE_ENV`-Konflikt mehr. Bundle-Analyzer läuft nur noch hinter `--env analyze=true`, öffnet nicht mehr automatisch. Doppelte Bild-Regel entfernt, `file-loader`-Dependency dadurch obsolet und entfernt.

### P0 – Client-seitige XSS-Pfade schliessen ✅
**Commits:** `fix XSS: render search-result highlighting as React nodes, not HTML`, `fix XSS: sanitize note-passage previews, remove dead unsafe component`, `fix XSS: allowlist tags/attributes in XMLDisplayParser`

- 12 Autocomplete-Stellen (`stringHandling.highlightText` + `dangerouslySetInnerHTML`) durch neue `HighlightedText`-Komponente ersetzt, die sichere React-Nodes statt HTML-Strings rendert.
- `AddNoteDialog`/`EditNoteDialog`: neue `SanitizedHtml`-Komponente (Allowlist-basiertes DOM-zu-React-Mapping) statt `dangerouslySetInnerHTML` für den markierten Textausschnitt.
- `src/components/support/XmlDisplay.tsx` war toter Code (nirgends importiert) — entfernt.
- **Zusätzlich gefunden (nicht im ursprünglichen Audit):** `XMLDisplayParser.tsx` — die tatsächlich überall verwendete Komponente zur Briefanzeige (Hauptansicht, Leseansicht, Auto-Anno-Vorschau) — spreadete alle XML-Attribute ungefiltert auf echte JSX-Host-Tags. Da React kleingeschriebene Attributnamen wie `onerror` nicht als Event-Handler erkennt, sondern per `setAttribute` durchreicht, führte das zu XSS ohne jemals `dangerouslySetInnerHTML` zu benutzen. Jetzt Tag-/Attribut-Allowlist, verifiziert gegen jeden `setAttribute`-Aufruf in `markupGeneration.ts`.

Alle drei Fixes mit Regressionstests (`<img onerror>`, `<svg onload>`, `javascript:`-URLs, `<script>`-Inhalte, Groß-/Kleinschreibungs-Varianten).

### P0 – Umgebungsvariablen nicht pauschal exponieren ✅
Siehe Production-Build-Commit oben. `PUBLIC_ENV_ALLOWLIST` (`REACT_APP_API_URL`, `REACT_DEBUG_MODE`) statt pauschalem `DefinePlugin(alle .env-Keys)`. Verifiziert per Test: beliebige Secret-Variable landet nicht im Bundle, fehlende Pflichtvariable lässt den Build kontrolliert fehlschlagen.

### P1 – TypeScript wieder zum verbindlichen Gate machen ✅
**Commit:** `fix all 24 tsc errors: remove dead code, fix real bugs`
`yarn tsc --noEmit` läuft fehlerfrei. Details: unwirksamer Lexical-Demo-Code (`components/App/`) entfernt; komplette tote Legacy-Auth-Kette (`authActions.ts`, `services/user.service.ts`, `utils/auth.ts`, `constants/authenticated.ts` — localStorage-Token-Ansatz von vor der Cookie-Auth-Umstellung) entfernt; `userHandling.ts` gefixt — dabei einen echten, bis dahin stillen Laufzeitbug gefunden (las `snake_case`-Felder von einem `camelCase`-Redux-State, Kommentar-Initialen waren vermutlich immer leer); `ToolbarButton.tsx` (`active={title}`-Verwechslung, doppelter `border`-Key, `title`-Prop wurde nie angezeigt).

### P1 – Test-Erkennung reparieren ✅
`jest.config.mjs`: `testMatch` um `.test.tsx`/`.spec.tsx` erweitert; `lodash-es` (ESM-only) wird jetzt transformiert. `tests/components/editor/left/OnlyReadableEditorPanelTest.tsx` (falscher Name, nie ausgeführt, kaputte Typen) repariert und nach `tests/components/editor/letter/Left/OnlyReadEditorPanel.test.tsx` verschoben — läuft jetzt mit 11 Tests in der Suite mit.

### P1 – HTTP-/Auth-Infrastruktur konsolidieren ✅
**Commit:** `consolidate HTTP infrastructure: single axios instance, real refresh, safe error path`
`initApi()` cacht jetzt eine einzige Axios-Instanz (Singleton) statt bei jedem der ~51 Aufrufe eine neue mit eigener Refresh-Sperre zu erzeugen. **Zusätzlich gefunden:** Der 401-Handler rief `AuthService.refresh(false)` auf — `refresh(isAuthenticated)` bricht bei falsy sofort mit `null` ab, der automatische Refresh hatte also nie tatsächlich den Refresh-Endpunkt erreicht. Jetzt `refresh(true)`. Fehlender `error.config`-Schutz ergänzt. 11 neue Tests, u. a. der Kern-Fall: parallele 401er lösen genau einen Refresh aus, alle wartenden Requests werden danach gemeinsam wiederholt bzw. gemeinsam abgelehnt.

### P1 – Lint-Baseline (teilweise) ✅
**Commits:** `fix all 22 remaining ESLint errors`, `apply eslint --fix (prettier) repo-wide`, `reduce ESLint warnings from 114 to 38`
- 22 Fehler → 0.
- Reine Formatierung separat committet (89 Dateien, keine Logikänderung), wie im ursprünglichen Audit gefordert.
- Warnungen 2104 → 38. `no-console` jetzt `['warn', {allow: ['error']}]` (Fehlerdiagnose-Logging ist etabliertes Muster, 2 echte Debug-`console.log`-Reste entfernt). `no-unused-vars` 66 → 6, dabei mehrere echte Funde (nicht nur Kosmetik): totes `Auth.tsx`, `SpecialDialogContainer.tsx`, `hooks/useReactiveVar.ts` entfernt; versehentlicher `import { start } from 'node:repl'` in Browser-Code entfernt; `AutoAnnoList.tsx`s Error-State wurde nie angezeigt (Fehler gingen lautlos verloren) — durch `enqueueSnackbar` ersetzt.

**Bewusst nicht angefasst (Fertig-wenn-Kriterium für spätere Session):**
- **32 `react-hooks/exhaustive-deps`-Warnungen**: nicht blind mit fehlenden Dependencies aufgefüllt, da das reale Endlosschleifen oder Verhaltensänderungen auslösen kann. Jede braucht Einzelfallprüfung.
- **6 verbliebene `no-unused-vars`-Warnungen** in `AutoAnnoLettersResizable.tsx` und `snippet_form/ShowButtons.tsx` — beim Nachschauen stellte sich heraus, dass es sich um **echte unfertige/kaputte Features** handelt, nicht um simple Lint-Kosmetik:
  - `AutoAnnoLettersResizable.tsx`: `selectedComponentList`-State wird gesetzt, aber nie gelesen — die JSX rendert `AutoAnnoSnippetList`/`SnippetFormContainer` fest verdrahtet statt dynamisch über `componentMappingList`. Dadurch scheint `SnippetReferencesList` (Teil von `componentMappingList.REFERENCE_LIST`) aktuell in der UI unerreichbar zu sein. Ebenso: `refInfoDialogOpen`/`refInfoDialogKey`/`handleInfoDialogClose` werden gesetzt, aber es existiert kein Dialog in der Datei, der sie liest.
  - `snippet_form/ShowButtons.tsx`: `handleOpenDialog` ist die einzige Stelle, die `setDialogOpen(true)` aufruft, wird selbst aber nirgends aufgerufen — der Bestätigungsdialog kann aktuell nie geöffnet werden.
  
  Beide Fälle brauchen fachliches Verständnis der beabsichtigten UX, nicht nur einen Lint-Fix — daher unverändert gelassen und hier dokumentiert statt geraten.
- **Kein CI-Setup**: `lint`/`typecheck`/`test:ci`-Scripts und Pipeline-Einbindung stehen noch aus (ursprüngliches Fertig-Kriterium).

## Verifizierte Befehle (Stand nach heutiger Session)

- `yarn tsc --noEmit`: ✅ 0 Fehler.
- `yarn eslint src tests --max-warnings=0`: ✅ 0 Fehler, 38 Warnungen (s. o.).
- `yarn test --runInBand`: ✅ 11 Suiten, 86 Tests, alle grün.
- `yarn build`: ✅ Exit 0, minifiziertes Production-Bundle mit Content-Hashes, kein `NODE_ENV`-Konflikt, Secret-Variablen nachweislich nicht im Output.

## Offene Arbeitspakete (unverändert oder P2)

### P1 (Rest) – Lint-Baseline vollständig auf null, CI herstellen
**Aufgabe:** Die 32 `exhaustive-deps`-Warnungen einzeln durchgehen (echtes Verhalten verstehen, nicht blind Dependencies ergänzen). Die zwei oben dokumentierten unfertigen Features (`AutoAnnoLettersResizable.tsx`, `ShowButtons.tsx`) fachlich klären: Feature fertigstellen oder toten Code entfernen. `lint`/`typecheck`/`test:ci`-Scripts anlegen und in einer CI-Pipeline als Required Checks verankern.

### P2 – Bundle und Assets verschlanken
Unverändert offen. Nach dem Production-Build-Fix jetzt ein Bundle-Report auswertbar (`yarn build --env analyze=true`). TTF/WOFF2 parallel, `favicon.ico` ca. 422 KiB, `vendors.js` weiterhin 3.63 MiB (Monaco/Lexical/MUI-lastig) — Budgets und automatisierte Prüfung stehen noch aus.

### P2 – Dokumentation und Altlasten bereinigen
`README.md` beschreibt weiterhin Create React App und `build/`, tatsächlich Webpack und `dist/`. Mehrere tote Dateien wurden im Rahmen der TS-/Lint-Fixes bereits entfernt (`components/App/`, Legacy-Auth-Kette, `Auth.tsx`, `SpecialDialogContainer.tsx`, `hooks/useReactiveVar.ts`); ein gezielter README-Abgleich mit dem tatsächlichen Yarn-/Webpack-Ablauf steht noch aus, ebenso die Bereinigung der doppelten ESLint-Konfigurationen (`.eslintrc.js`/`.eslintrc.json`/`eslint.config.mjs`).
