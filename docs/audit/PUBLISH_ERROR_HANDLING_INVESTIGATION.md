# Untersuchungsauftrag: Publish-Fehler werden im UI offenbar nicht erkennbar dargestellt

Stand: 22. September 2026. Kein Feature-Ticket, sondern ein Bug-Verdacht,
gefunden beim gemeinsamen Testen von F-107 (siehe
`metamw/audit/EDITOR_LETTER_STALENESS_TICKET.md`) gegen Brief
`fmb-1821-01-31-01` (Backend-`letter_id` 5832). Backend-seitig verifiziert,
frontend-seitig noch nicht — das ist der eigentliche Auftrag an euch.

## Beobachtung

Während des Testens wurde mehrfach der Eindruck geäußert, ein Publish-
Vorgang sei erfolgreich gewesen bzw. der Brief sei aktualisiert worden. Der
Abgleich mit dem Backend-Log (`log/development.log`,
`Jwt::Editor::PinnedLettersController#publish`) zeigt aber: für diesen
Brief gibt es **keinen einzigen** tatsächlich erfolgreichen Publish-Request.
Alle protokollierten Versuche sind mit einem Fehlerstatus abgeschlossen:

```
09:09:30  POST /jwt/editor/pinned_letters/5832/publish/  → 409 Conflict
          { "error": "letter_changed_since_pinned", "message": "..." }

09:09:57  POST /jwt/editor/pinned_letters/5832/publish/  → 422 Unprocessable Entity
          { "error": "PinnedLetters publish: doc mgr error: No teiHeader found for Letter" }

09:10:47  POST /jwt/editor/pinned_letters/5832/publish/  → 422 Unprocessable Entity
          { "error": "PinnedLetters publish: doc mgr error: No teiHeader found for Letter" }
```

Nach 09:10:47 existiert kein weiterer `/publish/`-Request für diesen Brief
im Log. Der zugrunde liegende Brief (`letters.content` bzw. die Datei auf
der Platte) ist bis heute unverändert gegenüber dem Stand vor diesen
Versuchen — es wurde also tatsächlich nichts geschrieben, was mit „hat
funktioniert" konsistent ist.

## Was zu prüfen ist

Der Eindruck „hat funktioniert" muss irgendwo im Frontend entstehen, obwohl
das Backend in allen drei Fällen einen Fehlerstatus (`409`/`422`) mit
strukturiertem Error-Body zurückgegeben hat. Mögliche Ursachen, die ihr
näher am Code/im Browser prüfen könnt (wir haben nur die Backend-Seite
verifiziert, nicht das tatsächliche Frontend-Verhalten):

1. **`backendService.publishLetter`**
   (`src/utils/editor/backendService.ts:461`) — wirft bei jedem
   Non-2xx-Status eine `Error`, soweit aus dem Code ersichtlich. Prüfen:
   Kommt der Fehler bei einem `409`/`422` tatsächlich im `catch`-Block an,
   oder gibt es einen Axios-Interceptor (`initApi`/`apiRequest.service.ts`)
   davor, der bestimmte Statuscodes abfängt/umschreibt/verschluckt, bevor
   er den Aufrufer erreicht?
2. **`PublishLetterDialog.tsx`** — der `try`/`catch` um `publishLetter()`
   sieht im Code korrekt aus (Erfolgspfad nur nach erfolgreichem `await`,
   Fehlerpfad im `catch`). Trotzdem im Browser mit den Backend-
   Fehlerantworten oben reproduzieren und beobachten, ob tatsächlich der
   Fehler-Snackbar erscheint oder fälschlich der Erfolgs-Snackbar.
3. **Timing/Race:** wurde eventuell eine andere Aktion (z. B. das
   erfolgreiche Speichern der Änderung selbst über `set_content`, das für
   sich genommen korrekt `200` liefert) mit dem Publish-Ergebnis verwechselt?
   Prüft, ob im UI nach einem Publish-Klick eindeutig erkennbar ist, welche
   Rückmeldung zu welcher Aktion gehört.
4. **F-107-spezifisch:** der `409`-Fall (`letter_changed_since_pinned`) ist
   in `tei_editor/docs/audit/LETTER_STALENESS_REQUIREMENT.md` Abschnitt 2 als neu zu
   implementierender, vom generischen `422`-Fehler getrennter Fall
   spezifiziert. Falls diese Unterscheidung im aktuellen Code noch fehlt,
   landet ein `409` möglicherweise im generischen Fehlerpfad oder wird
   anders behandelt als erwartet — das allein würde aber immer noch einen
   Fehler-Snackbar erzeugen, keinen Erfolg. Trotzdem als möglichen
   Teilaspekt mit prüfen.

## Warum das wichtig ist

Falls ein fehlgeschlagener Publish im UI wie ein Erfolg aussieht, ist das
unabhängig von F-107 ein eigenständiges, potenziell schwerwiegendes
Problem: Nutzer könnten glauben, ihre Änderungen seien veröffentlicht,
obwohl sie es nicht sind, und arbeiten auf dieser falschen Annahme weiter.
Das sollte vorrangig geklärt werden, bevor die F-107-Frontend-Anforderung
umgesetzt wird — die neue 409-Konfliktbehandlung dort baut darauf auf, dass
Fehlerantworten zuverlässig als solche erkannt werden.

## Nicht Teil dieses Dokuments

Ein separat vermuteter Rebase-Befund (F-108 im Backend-Ticket) wurde nach
Prüfung zurückgezogen: `POST .../rebase/` übernimmt `letter.content`
tatsächlich ungeprüft, aber das ist kein Fehlverhalten — dieselbe
ungeprüfte Übernahme passiert an anderer Stelle im Backend bereits beim
erstmaligen Pinnen, und die Publish-Pipeline validiert die strukturelle
Korrektheit ohnehin wirksam (der „No teiHeader found"-Fehler oben **ist**
diese Prüfung, kein Zeichen dafür, dass sie fehlt). Kein Backend-
Handlungsbedarf, keine Frontend-Relevanz für diesen Teilaspekt.
