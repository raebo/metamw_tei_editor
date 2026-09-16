# Repository-Audit

Ursprünglicher Stand: 2026-08-12. Aktualisiert: 2026-08-12 (nach Abarbeitung aller P0- und der meisten P1-Punkte, siehe Commit-Verweise unten). Geprüft wurden Konfiguration, Build, TypeScript, ESLint, Tests sowie stichprobenartig Auth-, API- und XML/HTML-Pfade. Es wurde kein externer Dependency-/CVE-Scan ausgefuehrt.

Ergänzt: 2026-09-16 (gezielte Durchsicht des Auto-Anno-Bereichs, d. h. `src/components/auto_anno`, `src/services/auto_anno`, `src/utils/auto_anno`, `src/redux/{slices,thunks}/auto*`; siehe neue Punkte unten unter "Offene Arbeitspakete").

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

### P1 – Auto-Anno: Brief-Sperre (`locking_user`) wird nicht zuverlässig freigegeben
**Gefunden:** 2026-09-16.

Beim Öffnen eines Briefs setzt `AutoAnnoLetters.tsx` (`checkAndLockLetter`, Zeilen 94–122) per `patchAutoAnnoLetterLockingUser(id, user.id)` eine serverseitige Sperre. Freigegeben wird sie ausschließlich in `AutoAnnoLetterHandle.tsx` (`saveAndLeaveLetterView`, Zeilen 140–142) durch den expliziten Klick auf "Stand Speichern". Es gibt weder ein `useEffect`-Cleanup (Unmount/Routenwechsel) noch einen `beforeunload`-Handler. Browser-Zurück, Tab schließen, direkte URL-Navigation weg von der Seite oder ein Absturz lassen den Brief serverseitig dauerhaft gesperrt ("Der Brief wird von einem anderen Benutzer bearbeitet") — andere Bearbeiter:innen sind bis zu einer manuellen Freigabe blockiert.

**Vorschlag:** Freigabe zusätzlich in einem `useEffect`-Cleanup sowie nach Möglichkeit per `beforeunload`/`visibilitychange` auslösen; serverseitig zusätzlich ein Lock-Timeout einführen, da Client-Events (z. B. Tab-Crash) nie zu 100 % zuverlässig feuern.

### P1 – Auto-Anno: Keine Laufzeitvalidierung der API-Antworten
Alle Funktionen in `src/services/auto_anno/apiAutoAnno.service.ts` (u. a. `fetchAutoAnnoJobs`, `fetchAutoAnnoJobLetters`, `fetchAutoAnnoLetter`, `fetchAutoAnnoLetterSnippets`, `fetchAutoAnnoSnippetEntityData`) geben `response.data` ungeprüft als `AutoAnnoJob[]`, `AutoAnnoJobLetter`, `AutoAnnoSnippet[]` bzw. `SnippetEntity` zurück (siehe `src/services/mappings/autoAnnoMappings.ts`) — dafür existiert kein Zod-Schema in `src/schemas/`, entgegen der in `CLAUDE.md` festgelegten Regel, API-Antworten an der Systemgrenze zu validieren. Die ungeprüften Felder landen anschließend in DOM-manipulierendem Code (`src/utils/auto_anno/domHandling.ts`, `setAttribute`/`textContent`-Aufrufe mit z. B. `snippetEntity.entityKey`), der bei fehlenden/veränderten Feldern (etwa nach einer Backend-Änderung) `undefined`-Werte still in echte TEI-Attribute schreibt statt früh sichtbar zu scheitern.

**Vorschlag:** Zod-Schemas für die Auto-Anno-Antworttypen ergänzen (analog zu bestehenden Schemas in `src/schemas/`) und an den `fetch*`-Stellen parsen statt nur casten.

### P2 – Auto-Anno: Unsichere String-Interpolation in CSS-Selektoren und Such-URL
- `src/utils/auto_anno/domHandling.ts` baut an vier Stellen (`markSpanAndScrollToId`, `autoAnnoReplaceDomNodeContent`, `referenceTypeForXmlId`, `removeSnippetEntityFromDom`) CSS-Attributselektoren per Stringkonkatenation aus `xmlId`-Werten, die aus nicht vertrauenswürdigem Backend-XML stammen (`document.querySelector('[xml\\:id="' + xmlId + '"]')`). Enthält ein `xml:id` ein `"`, wirft `querySelector` eine `DOMException`; ohne `CSS.escape()` ist das nicht abgesichert.
- `src/services/auto_anno/apiAutoAnno.service.ts` (`searchAutoAnnoSnippetEntities`, ca. Zeile 99) interpoliert den frei eingegebenen Suchtext direkt und unescaped als URL-Pfadsegment (`/search_entity/${searchString}/...`) statt ihn als Query-Parameter zu senden oder mit `encodeURIComponent` zu kodieren. Enthält die Eingabe z. B. `/` oder `#`, bricht die Route/Suche still.

**Vorschlag:** `CSS.escape(xmlId)` in `domHandling.ts` verwenden; Suchbegriff in `searchAutoAnnoSnippetEntities` per `encodeURIComponent` kodieren oder als Query-Parameter senden.

### P2 – Auto-Anno: TEI-Export über `innerHTML` + Regex-Fixups statt `XMLSerializer`
`transformLetterXmlForExport` (`src/utils/auto_anno/domHandling.ts:190`) bekommt an allen Aufrufstellen (`ShowButtons.tsx`, `EditButtons.tsx`, `SnippetReferencesList.tsx`) das Ergebnis von `.innerHTML` eines im echten Browser-DOM geparsten Brief-Knotens übergeben. Weil der Browser dabei HTML- statt XML-Serialisierung anwendet, werden Tag-/Attributnamen kleingeschrieben; die Funktion repariert das nachträglich per Regex (`persname`→`persName`, `placename`→`placeName`, `schemalocation`→`schemaLocation`). Das deckt nur die drei bekannten Fälle ab und widerspricht der `CLAUDE.md`-Vorgabe, TEI-Inhalte mit `DOMParser`/`XMLSerializer` statt String-/Regex-Verarbeitung zu behandeln. Neue TEI-Elemente/-Attribute mit Groß-/Kleinschreibung würden beim Export still falsch geschrieben.

**Vorschlag:** Export über `XMLSerializer` auf dem Original-XML-DOM (nicht über das HTML-geparste Anzeige-DOM) erzeugen, um die Regex-Fixup-Liste überflüssig zu machen.

### P1 (Rest) – Lint-Baseline vollständig auf null, CI herstellen
**Aufgabe:** Die 32 `exhaustive-deps`-Warnungen einzeln durchgehen (echtes Verhalten verstehen, nicht blind Dependencies ergänzen). Die zwei oben dokumentierten unfertigen Features (`AutoAnnoLettersResizable.tsx`, `ShowButtons.tsx`) fachlich klären: Feature fertigstellen oder toten Code entfernen. `lint`/`typecheck`/`test:ci`-Scripts anlegen und in einer CI-Pipeline als Required Checks verankern.

### P2 – Bundle und Assets verschlanken
Unverändert offen. Nach dem Production-Build-Fix jetzt ein Bundle-Report auswertbar (`yarn build --env analyze=true`). TTF/WOFF2 parallel, `favicon.ico` ca. 422 KiB, `vendors.js` weiterhin 3.63 MiB (Monaco/Lexical/MUI-lastig) — Budgets und automatisierte Prüfung stehen noch aus.

### P2 – Dokumentation und Altlasten bereinigen
`README.md` beschreibt weiterhin Create React App und `build/`, tatsächlich Webpack und `dist/`. Mehrere tote Dateien wurden im Rahmen der TS-/Lint-Fixes bereits entfernt (`components/App/`, Legacy-Auth-Kette, `Auth.tsx`, `SpecialDialogContainer.tsx`, `hooks/useReactiveVar.ts`); ein gezielter README-Abgleich mit dem tatsächlichen Yarn-/Webpack-Ablauf steht noch aus, ebenso die Bereinigung der doppelten ESLint-Konfigurationen (`.eslintrc.js`/`.eslintrc.json`/`eslint.config.mjs`).
