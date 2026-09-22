# Anforderung: Hinweis auf veränderten Brief + Konfliktbehandlung beim Publish

Stand: 22. September 2026 (Version 3 — Version 2 war intern widersprüchlich:
Kopf sagte „Teil A/B/C implementiert", die Abschnitte selbst sagten noch
„wartet auf Backend-Teil B/C"; siehe „Änderungen gegenüber Version 2" am
Ende, davor „Änderungen gegenüber Version 1"). Gehört
fachlich zu `metamw/audit/EDITOR_LETTER_STALENESS_TICKET.md` (F-107) im
Backend-Repository — dort steht die Ursachenanalyse und der Backend-Plan in
drei Teilen (A: Publish-Schutz, B: Polling-Endpoint, C: Rebase-Endpunkt).
Dieses Dokument beschreibt, was das Frontend (`tei_editor`) konkret umsetzen
muss, inklusive des vollständigen JWT-Vertrags.

**Backend-Stand zum Zeitpunkt dieses Dokuments:** Teil A, B und C sind alle
implementiert (Commits `b18a881`, `bb56a84`, `957cafe`, Branch
`feature/20260922_editor_letter_staleness`, gepusht, noch **nicht**
gemerged — vor Beginn der Frontend-Umsetzung prüfen, ob eine MR dafür
existiert/gemerged wurde, per `git log`/`git branch -r` im Backend-Repo).
Der Rollout-Vorbehalt in Abschnitt 1 (Polling erst zusammen mit Teil B) und
die Abhängigkeit in Abschnitt 3 (Rebase-Endpunkt für Teil C) gelten also nur
noch bis der Branch in `master` gemerged ist — danach entfällt Fallback (b)
in Abschnitt 1 und die Frontend-Umsetzung kann alle drei Abschnitte in
beliebiger Reihenfolge angehen.

## Problem

Wenn ein Nutzer einen Brief im Editor pinnt (öffnet) und bearbeitet, kann
sich der zugrunde liegende Brief in der Zwischenzeit ändern — durch einen
anderen Nutzer, der denselben Brief bearbeitet und zuerst publiziert, oder
durch einen Wartungsvorgang im Backend. Der Editor bekommt davon während der
Bearbeitung nichts mit; seit Backend-Teil A verhindert zumindest der
Publish-Endpunkt das stille Überschreiben (409-Antwort), aber ohne
Frontend-Behandlung sieht der Nutzer dabei nur einen unbehandelten Fehler.

## 1. Polling-Endpoint (Benachrichtigung während der Bearbeitung) — implementiert, noch nicht in `master`

```
GET /jwt/editor/pinned_letters/:id/staleness
```

- `:id` ist die `letter_id` (dieselbe Semantik wie bei den bestehenden
  `pinned_letters`-Routen, nicht die interne `Editor::Letter`-ID).
- Antwort (200): `{ "stale": boolean, "letter_updated_at": string | null }`.
  `letter_updated_at` ist `null`, solange `stale: false` ist.
- Kein gepinnter Brief mit dieser `id` für den aktuellen Nutzer → **404**.
  Das ist im Normalbetrieb erwartbar (Brief wurde in der Zwischenzeit
  unpinnt) und kein Fehlerzustand, den der Nutzer sehen muss.

**Rollout-Abhängigkeit (Befund aus der Review von Version 1, inzwischen vom
Backend erledigt):** dieser Endpunkt ist implementiert
(`app/controllers/jwt/editor/pinned_letters_controller.rb#staleness`,
Commit `957cafe`), aber nur auf `feature/20260922_editor_letter_staleness`,
noch nicht in `master` gemerged. Solange das so ist, gilt weiterhin:
- **(a) Bevorzugt:** Frontend-Rollout dieses Abschnitts erst, wenn der
  Backend-Branch gemerged ist (`git log`/`git branch -r` im Backend-Repo
  vor dem eigenen Merge prüfen).
- **(b) Falls (a) zeitlich nicht möglich ist:** der Hook muss so gebaut sein,
  dass er robust mit einem dauerhaft 404-antwortenden Endpunkt umgehen kann
  (siehe Fehlerverhalten unten) — das macht das Polling in der
  Zwischenzeit wirkungslos, aber nicht störend. Nach dem Backend-Merge
  entfällt dieser Vorbehalt vollständig.

**Polling-Umfang:** nur der aktuell sichtbaren/aktiven Brief-Tab wird
gepollt, **nicht** alle gepinnten Briefe parallel (der Editor unterstützt
mehrere gepinnte Tabs, siehe `state.editorLetter.pinnedLetters`). Beim
Wechsel des aktiven Tabs: laufende Anfrage für die alte ID abbrechen, sofort
einmal für die neue ID pollen, danach normales Intervall.

**Erwartetes Frontend-Verhalten (Details):**

- Intervall 20–30 Sekunden, solange ein Brief aktiv im Editor offen ist.
- Nicht pollen, wenn `document.visibilityState !== 'visible'`; beim Wechsel
  zurück zu `visible` sofort einmal pollen (nicht auf das nächste
  Intervall warten).
- Sofortiger erster Request beim Öffnen eines Briefs (nicht erst nach dem
  ersten Intervall warten).
- Höchstens **ein** persistenter Hinweis (`notistack`, bereits Abhängigkeit)
  pro Brief gleichzeitig — kein neuer Snackbar alle 20–30s, solange
  `stale: true` unverändert bleibt. Der Hinweis selbst trägt eine
  explizite **„Neu laden"-Aktion**, die denselben Rebase-Ablauf startet wie
  in Abschnitt 3 beschrieben (nicht nur ein Textinfo ohne Handlung). Hinweis
  schließt sich automatisch nach erfolgreichem Reload (Abschnitt 3) oder
  beim Wechsel/Schließen des Brief-Tabs.
- Keine überlappenden Requests (nächster Poll wartet auf den vorherigen,
  oder wird bei noch laufendem vorherigem Request übersprungen).
- Gegen verspätete Antworten absichern (`AbortController` beim
  Tab-/Letter-Wechsel und beim Unmount, oder eine Request-Generation-Zählung,
  die eine veraltete Antwort verwirft, falls sich `id` inzwischen geändert
  hat).
- Bei **404**: Polling für diese Sitzung/diesen Tab beenden (kein Retry-Loop
  gegen einen dauerhaft fehlenden Endpunkt oder einen zwischenzeitlich
  unpinnten Brief). Bei **temporären Netzwerkfehlern** (kein HTTP-Response,
  Timeout): Intervall unverändert fortsetzen, kein Hinweis an den Nutzer,
  nur `console.error`-Logging — ein einzelner Netzwerk-Hänger soll nicht als
  „Brief geändert" missverstanden werden.
- Polling stoppen, sobald der Editor für diesen Brief geschlossen/unpinnt
  wird — `useEffect`-Cleanup, kein Interval-Leak.

## 2. Publish liefert einen typisierten Konflikt-Status

```
POST /jwt/editor/pinned_letters/:id/publish/
```

Bereits implementiert (Backend-Teil A). Bisheriges Verhalten bei jedem
anderen Fehler unverändert: `422 Unprocessable Entity`,
`{ "error": string }`. **Neu:** bei Konflikt antwortet der Endpunkt mit
**`409 Conflict`**:

```json
{
  "error": "letter_changed_since_pinned",
  "message": "..."
}
```

**Erwartetes Frontend-Verhalten:**

- `backendService.publishLetter` (`src/utils/editor/backendService.ts:461`)
  muss den `409`-Fall vom generischen `422`-Fehlerpfad trennen. Response-Body
  bei `409` mit **Zod** validieren (Projekt nutzt bereits `zod`, siehe
  `package.json`) — ein Schema mit
  `error: z.literal('letter_changed_since_pinned')` und `message: z.string()`.
  Nur bei erfolgreicher Validierung eine eigene, typisierte Domain-Exception
  werfen, z. B. `LetterChangedSincePinnedError extends Error`. Jede andere
  `409`- oder `422`-Antwort bleibt der bestehende generische Publish-Fehler
  (keine Annahme, dass jede 409 dieser Konflikt ist).
- **Kein zusätzlicher, separater Dialog nötig.** Der bestehende
  `PublishLetterDialog.tsx` (`src/components/editor/letter/Dialog/Components/PublishLetterDialog.tsx`)
  hat bereits einen `try`/`catch` um `publishLetter()` und einen
  `errorMessage`-State. Diesen um einen dritten Zustand erweitern (neben
  „Bestätigung ausstehend" und „genereller Fehler"): bei gefangenem
  `LetterChangedSincePinnedError` in einen Konfliktzustand wechseln, der
  statt der generischen Fehlermeldung zwei Aktionen anbietet — „Neu laden"
  (siehe Abschnitt 3) und „Abbrechen" (schließt den Dialog, Brief bleibt wie
  er ist, keine Datenverluste).
- **Wichtig:** dieser Fall kann auch auftreten, ohne dass vorher ein
  Polling-Hinweis (Abschnitt 1) sichtbar war (Race zwischen Polling-Intervall
  und Publish-Klick, Tab im Hintergrund, oder Abschnitt 1 ist gemäß Fallback
  (b) noch nicht ausgerollt). Die Publish-Fehlerbehandlung muss deshalb
  unabhängig von Abschnitt 1 funktionieren.

## 3. „Neu laden" — über den neuen Rebase-Endpunkt, **nicht** über `reset_letter`

**Befund aus der Review von Version 1 (Blocker):** diese Anforderung ging
ursprünglich davon aus, dass
`DELETE /jwt/editor/pinned_letters/:id/reset_letter/`
(`backendService.resetLetter`) für „Neu laden" ausreicht. Das ist falsch:
`Editor::EditorResetLetterService#reset_letter_content`
(`app/services/editor/editor_reset_letter_service.rb:54`) setzt
`xml_content_current` auf die **eigene alte Pin-Baseline**
(`editor_letter.xml_content`) zurück — nicht auf den aktuellen kanonischen
Briefinhalt. Dieser Endpunkt ist korrekt für den bereits existierenden
`ResetLetterDialog.tsx` („alle bisherigen Anpassungen verwerfen", also die
eigene Arbeitskopie auf die eigene Baseline zurücksetzen), aber ungeeignet,
um auf einen externen, zwischenzeitlich veränderten Briefstand aufzusetzen.
Nach `reset_letter` allein sieht der Nutzer weiterhin den veralteten Stand.

**Implementiert:** neuer Backend-Endpunkt
`POST /jwt/editor/pinned_letters/:id/rebase/` (F-107 Teil C, Commit
`957cafe`, `EditorRebaseLetterService`, `app/services/editor/editor_rebase_letter_service.rb`),
auf `feature/20260922_editor_letter_staleness`, noch nicht in `master`
gemerged (siehe Backend-Stand oben). Setzt `xml_content` **und**
`xml_content_current` auf den frisch eingelesenen `letter.content` und
setzt die Change-Historie auf einen einzelnen neuen Baseline-Eintrag zurück
(verwirft lokale Änderungen bewusst — kein Merge, siehe
„Nicht Teil dieser Anforderung" unten).

**Vertrag** (verifiziert gegen
`app/controllers/jwt/editor/pinned_letters_controller.rb#rebase` und
`spec/controllers/jwt/editor/pinned_letters_rebase_controller_spec.rb`):

Erfolg, `200`:

```json
{
  "success": true,
  "message": "letter rebased successfully",
  "xml_content": "..."
}
```

`xml_content` ist bereits durch `XmlUtil::AttributeConverter.convert_key_to_data_key`
fürs Frontend aufbereitet (wie bei `show`) — direkt übernehmen, nicht noch
einmal transformieren.

Fehler (z. B. kein gepinnter Brief für diese `id`), `422`:

```json
{ "error": "PinnedLetters rebase: ..." }
```

Kein eigener, maschinenlesbarer Fehlercode wie bei Abschnitt 2 — dieser
Fehlerfall ist im Rebase-Ablauf nicht erwartbar (der Nutzer löst „Neu laden"
nur aus einem bereits gepinnten Kontext aus) und kann als genereller Fehler
behandelt werden (Snackbar mit `error.message`).

**Erwartetes Frontend-Verhalten:**

- Neue Funktion `backendService.rebaseLetter(letterId)` analog zu
  `resetLetter`/`publishLetter` in `backendService.ts`, gibt den neuen
  `xml_content` zurück.
- Bei ungesicherten lokalen Änderungen (`contentChanged: true` — siehe
  Quelle unten) vor dem Rebase explizit bestätigen lassen, mit demselben
  Warntext-Muster wie `ResetLetterDialog.tsx` ergänzt um den Hinweis, dass
  auch die Grundlage sich geändert hat.
- Nach erfolgreichem Rebase **zwei** Dispatches, nicht nur einen:
  1. `dispatch(setReloadLetterContent({ reloadLetterContent: true }))` —
     dieser Mechanismus ist korrekt (er ruft in `LetterViewContainer.tsx`
     erneut `GET /jwt/editor/pinned_letters/:id` ab und übernimmt
     `xml_content`), das ursprüngliche Problem lag ausschließlich am
     Backend-Wert, auf den zurückgesetzt wurde.
  2. **Zusätzlich** (Befund aus der Review von Version 2):
     `dispatch(setEditorPinnedLetterContentChanged({ id: stateEditorLetter.id, contentChanged: false }))`
     — wie in `ResetLetterDialog.tsx:55-57` bereits vorgemacht.
     `setReloadLetterContent` aktualisiert `state.editorLetter.pinnedLetters[].contentChanged`
     **nicht**; ohne diesen zweiten Dispatch zeigt der Tab nach einem
     erfolgreichen Rebase weiterhin ungesicherte Änderungen an und kann
     beim Schließen erneut fälschlich warnen.
- **Korrekte Quelle für `content_changed` (Befund aus der Review von
  Version 1):** **nicht** aus der Antwort von `GET /jwt/editor/pinned_letters/:id`
  (`show`, `Jwt::Editor::PinnedLettersController#show`) — diese Antwort
  enthält aktuell kein `content_changed`-Feld. Die korrekte Quelle ist
  `GET /jwt/editor/pinned_letters` (`index`,
  `Jwt::Editor::PinnedLetters::IndexSerializer`, Feld `content_changed`), im
  Frontend bereits verfügbar unter `state.editorLetter.pinnedLetters[]`
  (Typ `PinnedLetter`, Feld `contentChanged`,
  `src/redux/slices/editor.letter.slice.ts`). Den aktiven Eintrag anhand von
  `letter.id === stateEditorLetter.id` suchen (Muster siehe
  `LetterViewContainer.tsx:91-93`), nicht über die `show`-Antwort.

## Nicht Teil dieser Anforderung

- Kein Merge/Diff-View zwischen lokaler Arbeitskopie und neuem Fremdstand —
  nur „verwerfen und neu laden" (Rebase, Abschnitt 3). Ein Merge-Mechanismus
  existiert im Backend nicht und müsste, falls gewünscht, ein eigenes,
  separat zu spezifizierendes Feature sein.
- Kein Echtzeit-Push (WebSocket/ActionCable) — bewusst Polling, siehe
  Begründung in F-107.

## Akzeptanzkriterien

- [ ] Polling-Hook/-Service für `GET .../staleness`, nur für den aktiven
      Brief-Tab, pausiert bei unsichtbarem Tab (sofortiger Poll bei
      Rückkehr zu `visible`), sauberes Cleanup und Request-Abbruch beim
      Tab-Wechsel/Verlassen des Editors.
- [ ] Höchstens ein persistenter Hinweis pro Brief, mit expliziter „Neu
      laden"-Aktion, die den Rebase-Ablauf (Abschnitt 3) startet; Hinweis
      schließt sich automatisch nach erfolgreichem Reload oder Briefwechsel;
      keine überlappenden Requests; verspätete Antworten nach Briefwechsel
      werden verworfen (Test dafür erforderlich).
- [ ] 404 vom Polling-Endpoint beendet das Polling für diesen Brief
      dauerhaft (Test dafür erforderlich); temporäre Netzwerkfehler
      unterbrechen das Intervall nicht und erzeugen keinen Nutzer-Hinweis.
- [ ] `publishLetter` unterscheidet `409`/`letter_changed_since_pinned`
      (Zod-validiert) von jeder anderen `409`/`422`-Antwort und wirft dafür
      eine eigene, typisierte Exception.
- [ ] `PublishLetterDialog.tsx` behandelt diese Exception in einem eigenen
      Zustand mit „Neu laden"/„Abbrechen" — kein zusätzlicher Dialog.
- [ ] „Neu laden" ruft den Rebase-Endpunkt auf, fragt bei
      `contentChanged: true` (Quelle: `state.editorLetter.pinnedLetters[]`,
      **nicht** die `show`-Antwort) vorher explizit nach Bestätigung, und
      dispatcht danach **sowohl** `setReloadLetterContent` **als auch**
      `setEditorPinnedLetterContentChanged({ contentChanged: false })` für
      den betroffenen Brief.
- [ ] Test: erfolgreicher Rebase-Ablauf inkl. Bestätigungsdialog anhand des
      korrekten `pinnedLetters`-Eintrags.
- [ ] Kein neuer `any`/unvalidiertes API-Ergebnis (Antwortformen an der
      Systemgrenze typisieren/validieren, per `AGENTS.md`).
- [ ] Neue sichtbare Texte über `src/i18n/` (bestehende Struktur, siehe
      `AGENTS.md`).

## Abhängigkeit vom Backend

Alle drei Backend-Teile (A, B, C) sind implementiert und verifiziert
(`metamw/audit/EDITOR_LETTER_STALENESS_TICKET.md`, Commits `b18a881`,
`bb56a84`, `957cafe`). Einzige verbleibende Abhängigkeit: der Branch
`feature/20260922_editor_letter_staleness` ist gepusht, aber noch nicht in
`master` gemerged. Vor Beginn der Frontend-Umsetzung von Abschnitt 1 (Polling)
und Abschnitt 3 (Rebase) per `git log`/`git branch -r` im Backend-Repo
prüfen, ob der Merge inzwischen erfolgt ist; falls nicht, gilt für Abschnitt 1
weiterhin der Rollout-Vorbehalt (a)/(b) dort. Abschnitt 2 (Publish-Konflikt)
ist unabhängig davon bereits umsetzbar.

## Änderungen gegenüber Version 1

Nach einer Code-Review der ersten Fassung wurden folgende Korrekturen
vorgenommen (Review-Befunde vollständig anhand des Codes verifiziert):

1. **Blocker behoben:** „Neu laden" beschrieb fälschlich `reset_letter` als
   ausreichend. Jetzt: neuer Backend-Endpunkt (Teil C) vorausgesetzt,
   `reset_letter` bleibt für seinen ursprünglichen Zweck (eigene Baseline
   wiederherstellen) unangetastet.
2. Explizite Rollout-Reihenfolge/Fallback für Abschnitt 1 ergänzt (Backend-
   Teil B existiert noch nicht).
3. `content_changed`-Quelle korrigiert: `state.editorLetter.pinnedLetters[]`
   statt der `show`-Antwort.
4. Polling-Umfang präzisiert: nur aktiver Tab, mit Abbruch/Sofort-Poll beim
   Tab-Wechsel.
5. Dedup-, Abort- und Fehlerverhalten (404 vs. Netzwerkfehler) ergänzt.
6. Konflikt-UI in den bestehenden `PublishLetterDialog.tsx` integriert statt
   eines neuen Dialogs; typisierte, Zod-validierte Exception statt
   String-Vergleich.
7. Akzeptanzkriterien um die zusätzlichen Testfälle erweitert.

## Änderungen gegenüber Version 2

Backend-Teile A, B und C wurden zwischen Version 2 und dieser Fassung
implementiert (Commits `b18a881`, `bb56a84`, `957cafe`). Version 2 wurde
dabei nur im Kopf aktualisiert, nicht in den Abschnitten selbst — Befund aus
einer erneuten Prüfung durch das Frontend-Team, gegen den tatsächlich
implementierten Code verifiziert:

1. Abschnitt 1 und 3 sagten weiterhin „wartet auf Backend-Teil B" bzw.
   „noch nicht implementiert" — korrigiert auf „implementiert, noch nicht
   in `master`".
2. Vollständiger Rebase-Antwortvertrag ergänzt (`200`/`success`/`message`/
   `xml_content`, `422`/`error` bei fehlendem Pin), gegen
   `pinned_letters_controller.rb#rebase` und dessen Spec verifiziert.
3. Zweiter Dispatch nach Rebase ergänzt:
   `setEditorPinnedLetterContentChanged({ contentChanged: false })` — ohne
   ihn bleibt der Tab fälschlich auf „ungesicherte Änderungen" stehen, weil
   `setReloadLetterContent` dieses Feld nicht anfasst.
4. Polling-Hinweis: explizite „Neu laden"-Aktion am Snackbar selbst ergänzt
   (Verhalten und Akzeptanzkriterien), nicht nur implizit über Abschnitt 3.
5. Backend-Ticket-Kopf (`EDITOR_LETTER_STALENESS_TICKET.md`) ebenfalls
   korrigiert — sagte noch „offen, nur dokumentiert" trotz vollständiger
   Umsetzung am Dateiende.
