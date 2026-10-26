# F-113 – Neu angelegte Briefe umbenennen oder verwerfen

**Stand:** 26.10.2026

**Status:** Planung einschließlich Backend-Prüfung und Umfang der ersten Version
abgestimmt; Umsetzung nicht begonnen.

**Priorität:** P2

**Beteiligte Systeme:** Online-Editor und Rails-Backend

## Ausgangslage

Beim Anlegen eines Briefes erzeugt das Backend bereits während des
Erstellungsvorgangs:

- den kanonischen `Letter`-Datensatz;
- die XML-Datei im Briefspeicher;
- die persönliche `Editor::Letter`-Arbeitskopie;
- die Zuordnung als `Editor::UserPinnedLetter`;
- ausgewählte Briefbeziehungen und Korrespondenzdaten.

Das Schließen eines Tabs im Online-Editor entfernt dagegen nur die persönliche
Arbeitskopie und die Pin-Zuordnung. Der kanonische Brief bleibt bestehen. Deshalb
ist „Tab schließen“ weder fachlich noch technisch mit „Brief verwerfen“
gleichzusetzen.

Für einen bereits angelegten Brief bietet die JWT-API aktuell weder eine
Umbenennungs- noch eine Löschoperation. Im klassischen Backend existiert mit
`LettersController#destroy_member` bereits ein administrativer Löschpfad. Dieser
ist jedoch keine JWT-Operation und steht normalen Editorbenutzern nicht als
Editorfunktion zur Verfügung.

## Problembeispiel

Ein Benutzer legt den Brief `fmb-1801-06-06-01` an und stellt anschließend fest,
dass:

1. der Brief versehentlich angelegt wurde und vollständig verworfen werden soll;
   oder
2. die Briefkennung falsch ist und in eine noch freie, gültige Kennung geändert
   werden muss.

Der Benutzer kann derzeit lediglich den Tab schließen. Danach bleibt der Brief
unter seiner ursprünglichen Kennung vorhanden und diese Kennung ist weiterhin
belegt.

## Ziel

Autorisierte Benutzer können einen geeigneten, noch nicht veröffentlichten Brief
im Online-Editor eindeutig von einer bloßen Arbeitskopie unterscheiden und ihn:

- unter einer neuen gültigen und freien Briefkennung umbenennen; oder
- nach einer ausdrücklichen Sicherheitsabfrage vollständig verwerfen.

Beide Operationen müssen sämtliche zusammengehörenden Daten konsistent behandeln.
Direkte Änderungen einzelner Datenbankfelder oder manuelle Dateioperationen sind
kein zulässiger Lösungsweg.

## Fachliche Leitplanken

### Abgrenzung zum Schließen eines Tabs

| Aktion | Wirkung |
| --- | --- |
| Tab schließen | Persönliche Arbeitskopie und Pin-Zuordnung entfernen; kanonischer Brief bleibt erhalten |
| Änderungen zurücksetzen | Arbeitskopie auf ihren Ausgangsstand zurücksetzen; kanonischer Brief bleibt erhalten |
| Brief umbenennen | Kanonischen Brief und alle abhängigen Repräsentationen auf eine neue Kennung umstellen |
| Brief verwerfen | Kanonischen Brief und die dafür vorgesehenen abhängigen Daten dauerhaft entfernen |

Die UI-Texte müssen diese Unterschiede ausdrücklich benennen. Insbesondere darf
„Schließen“ nicht als „Löschen“ oder „Verwerfen“ bezeichnet werden.

### Zulässigkeit

Die erste Ausbaustufe ist auf Briefe zu begrenzen, die noch nicht veröffentlicht
wurden. Das Backend entscheidet verbindlich, ob die Operation zulässig ist; eine
ausgeblendete oder deaktivierte Schaltfläche im Frontend ist kein
Berechtigungsschutz.

Das Backend muss die unten bestätigte Policy sowie folgende Voraussetzungen
automatisiert prüfen:

- dauerhaft nachgewiesener Ersteller und technische Herkunft;
- noch kein erfolgreicher Publish;
- keine aktive Arbeitskopie eines anderen Benutzers;
- keine bekannte eingehende Beziehung oder XML-Referenz;
- kein laufender Schreib-, Upload-, Annotations- oder Exportvorgang;
- keine externe Registrierung, die die Operation ausschließt.

Wenn der bisherige Datenbestand die Herkunft oder den Ersteller eines Briefes
nicht belastbar erkennen lässt, muss das Backend eine entsprechende persistente
Information ergänzen. Eine bloße Ableitung aus dem aktuellen Pinning reicht nicht
aus.

## Bestätigte Policy vom 26.10.2026

- **JWT-Editor:** Nur der dauerhaft nachgewiesene Ersteller darf umbenennen und
  verwerfen, und nur **vor dem ersten erfolgreichen Publish**. Allgemeines
  Schreibrecht, aktueller Pin oder letzte Bearbeitung ersetzen den Ersteller nicht.
- **Klassisches Backend:** Jeder angemeldete Benutzer darf löschen, unabhängig
  vom Ersteller. Dies ist ein eigener administrativer Policy-Kontext und keine
  Freigabe für den JWT-Endpunkt. Referenz-, Sicherungs- und Konsistenzprüfungen
  bleiben trotzdem erforderlich; kein anonymer Löschzugriff.
- Der erste erfolgreiche Publish wird dauerhaft am kanonischen `Letter`
  vermerkt, vorzugsweise als `first_published_at`. Ein fehlgeschlagener Versuch
  setzt diesen Vermerk nicht. Spätere Rückstufung auf draft löscht ihn nicht.
- Als erster Publish gilt der erfolgreiche Backend-Publish, auch wenn
  `revision_status` danach noch draft ist; öffentliche Live-Freigabe ist ein
  anderer Zustand. Einmal erfolgreich gepublishte Briefe bleiben im JWT-Editor
  für diese beiden Aktionen gesperrt.
- Ersteller und technische Herkunft werden bei der Anlage serverseitig am
  kanonischen Brief gespeichert (Vorschlag `created_by_user_id`, `created_via`).
  Bereits vorhandene Briefe mit unbekannter Herkunft/Publikationsgeschichte
  werden nicht allein wegen leerer neuer Felder freigeschaltet.
- Die erste Rename-Version darf ausschließlich die zweistellige laufende Nummer
  ändern. Präfix und Datumsanteil bleiben unverändert. Damit verändert die Aktion
  weder Briefrolle noch fachliches Briefdatum.
- Bekannte eingehende Beziehungen oder XML-Verweise blockieren Rename und Discard
  in der ersten Version. Andere Briefe werden nicht automatisch verändert.
- Bestehende Bilddateinamen und `graphic`-URLs bleiben beim Rename unverändert.
  Neue Uploads dürfen den neuen Briefpräfix verwenden.
- Neben der Grenze „vor dem ersten erfolgreichen Publish“ gilt kein zusätzliches
  Zeitfenster.
- Eine administrative Wiederherstellung verworfener Briefe wird separat geplant
  und blockiert die erste Version nicht. Auditierung und vorhandene
  Sicherungsmechanismen bleiben verpflichtend.

## Vorgesehener Benutzerablauf

### Brief umbenennen

1. Der Benutzer öffnet im Briefmenü die Aktion „Brief umbenennen“.
2. Ein Dialog zeigt die bisherige Kennung und ein Eingabefeld für die neue Kennung.
3. Das Frontend prüft das Format und anschließend über den vorhandenen
   `by_name`-Endpunkt, ob die Kennung frei ist.
4. Der Benutzer bestätigt die Änderung ausdrücklich.
5. Das Backend prüft Format, Eindeutigkeit, Berechtigung, Briefzustand und
   konkurrierende Arbeitskopien erneut und führt die Umbenennung atomar aus.
6. Der Editor aktualisiert Tab, aktiven Brief, Arbeitsbereich und lokale Suchdaten
   anhand der Backendantwort. Der Brief bleibt geöffnet.

Die Verfügbarkeitsprüfung im Frontend ist nur eine Bedienhilfe. Sie ersetzt weder
die Eindeutigkeitsprüfung noch die Sperre im Backend.

### Brief verwerfen

1. Der Benutzer öffnet im Briefmenü die Aktion „Brief verwerfen“.
2. Ein Sicherheitsdialog erklärt, dass nicht nur der Tab, sondern der Brief selbst
   gelöscht wird.
3. Zur Bestätigung muss der Benutzer die vollständige Briefkennung eingeben.
4. Das Backend prüft Berechtigung, Briefzustand, aktive Bearbeitung und fachliche
   Abhängigkeiten.
5. Nach erfolgreicher Löschung entfernt das Frontend den Brief aus Tabs,
   Arbeitsbereich und Suchergebnissen und wechselt kontrolliert auf den nächsten
   geöffneten Tab oder den leeren Editorzustand.

Abbrechen, Escape oder Schließen eines Dialogs darf keinen Request auslösen.

## Frontend-Arbeitsbereich

### F-113-FE1 – Briefaktionen und Dialoge

- Ein eindeutig beschriftetes Briefaktionsmenü ergänzen, vorzugsweise am aktiven
  Brieftab oder in der bestehenden Briefwerkzeugleiste.
- „Brief umbenennen“ und „Brief verwerfen“ getrennt von „Tab schließen“ anbieten.
- Beide Aktionen für jeden geöffneten Brief dauerhaft sichtbar darstellen. Ist eine
  Aktion für den konkreten Brief nicht zulässig, bleibt sie sichtbar, ist aber
  deaktiviert.
- Für jede deaktivierte Aktion den vom Backend gelieferten Blockierungsgrund über
  einen verständlichen Tooltip und einen barrierefrei erreichbaren Hilfetext
  erklären, zum Beispiel „Bereits veröffentlichte Briefe können nicht umbenannt
  werden“ oder „Der Brief wird derzeit von einer anderen Person bearbeitet“.
- Berechtigungs- und Zustandsinformationen aus der Backendantwort berücksichtigen;
  der Benutzer darf die Verfügbarkeit nicht erst durch einen fehlgeschlagenen
  Request erfahren müssen.
- Deutsche Texte über die vorhandene i18n-Struktur pflegen.
- Während eines laufenden Requests beide Aktionen sperren und Doppelausführung
  verhindern.
- Bei laufendem Figure-Upload oder anderem exklusivem Schreibvorgang die Aktion
  kontrolliert verhindern.

### F-113-FE2 – Umbenennen

- Vorbelegtes Eingabefeld mit der vorhandenen Validierung für
  `FMB|GB-YYYY-MM-DD-NN` verwenden.
- Die vorhandene exakte Namensprüfung auf `GET /jwt/editor/letters/by_name/{name}`
  wiederverwenden: ausschließlich `404 letter_not_found` bedeutet „frei“.
- Den neuen Umbenennungsendpunkt typisiert aufrufen und seine Response validieren.
- Bei Erfolg mindestens `editorLetter.letter`, `pinnedLetters`, Tab-Beschriftung
  und betroffene Caches konsistent aktualisieren.
- `409` als fachlichen Konflikt darstellen, ohne den lokalen Namen vorzeitig zu
  ändern.

### F-113-FE3 – Verwerfen

- Sicherheitsdialog mit Eingabe der vollständigen aktuellen Kennung implementieren.
- Den Löschrequest erst bei exakter Übereinstimmung freigeben.
- Bei Erfolg alle lokalen Referenzen auf den Brief entfernen und den aktiven Tab
  deterministisch wechseln.
- Bei Ablehnung oder technischem Fehler den Brief geöffnet und unverändert lassen.
- Klar erläutern, warum ein Brief nicht gelöscht werden darf, sofern das Backend
  einen fachlichen Blockierungsgrund liefert.

### Frontend-Tests

- Dialoge öffnen, abbrechen und per Escape schließen;
- Format- und Verfügbarkeitsprüfung des neuen Namens;
- erfolgreiche Umbenennung einschließlich Redux- und Tab-Aktualisierung;
- erfolgreiche Löschung des aktiven und eines nicht aktiven Tabs;
- 401/403, 404, 409, 422, 500 und Netzwerkfehler;
- Doppelklick und wiederholte Requests;
- Abgrenzung: Das vorhandene Tab-Schließen löscht keinen kanonischen Brief.

## Backend-Arbeitsbereich

Der folgende Teil kann als eigenständiger Backend-Aufgabenbereich übernommen
werden.

### F-113-BE1 – Fachliche Policy und Autorisierung

**Ziel:** Das Backend entscheidet allein und nachvollziehbar, wer welchen Brief
umbenennen oder verwerfen darf.

- Berechtigungsregeln für Rename und Discard definieren und zentral prüfen.
- Zulässige Briefzustände festlegen; in der ersten Version nur nicht
  veröffentlichte Briefe zulassen.
- Herkunft und unveränderlichen Ersteller am kanonischen Brief persistieren;
  beides ist aktuell nicht zuverlässig rekonstruierbar. Die bestätigte Ersteller-
  und Erstpublish-Regel verbindlich umsetzen (F-155).
- Aktive Pins, Arbeitskopien, Check-ins, Annotationsvorgänge, Exporte und externe
  Referenzen auf Konflikte prüfen.
- Fachliche Ablehnungen als stabile Fehlercodes mit HTTP `409 Conflict` liefern;
  fehlende Berechtigung als `403 Forbidden`.

Mögliche Fehlercodes:

- `letter_not_renameable`
- `letter_not_discardable`
- `letter_name_taken`
- `letter_has_active_editors`
- `letter_has_external_references`
- `letter_already_published`

### F-113-BE2 – JWT-Endpunkt zum Umbenennen

Vorgeschlagener Vertrag:

```http
PATCH /jwt/editor/letters/{id}
Content-Type: application/json

{
  "letter": {
    "name": "fmb-1801-06-06-02"
  }
}
```

Erfolgsantwort: `200 OK` mit der aktualisierten, dokumentierten Letter-Response.

Die Implementierung erfolgt über einen eigenen Service, beispielsweise
`Editor::RenameLetterService`, und muss mindestens:

- den `Letter` mit Datenbanksperre laden;
- Format und case-insensitive Eindeutigkeit der Zielkennung prüfen;
- Quell- und Zielpfad der XML-Datei sicher bestimmen;
- die Briefkennung nur in den semantisch dafür vorgesehenen XML-Knoten ändern,
  nicht über ein blindes globales String-Replacement;
- kanonischen XML-Inhalt, vorhandene `Editor::Letter`-Baselines und aktuelle
  Arbeitskopien konsistent behandeln oder bei nicht sicher auflösbaren aktiven
  Arbeitsständen mit `409` abbrechen;
- bekannte eingehende Beziehungen oder XML-Verweise anderer Briefe erkennen und
  die Umbenennung in der ersten Version mit einem konkreten Konflikt blockieren;
- die XML-Datei vom alten an den neuen, aus der Kennung abgeleiteten Speicherpfad
  verschieben;
- bei einem Fehler Datenbank und Dateisystem auf den alten konsistenten Zustand
  zurückführen;
- Suchindex, Caches und weitere abgeleitete Daten aktualisieren beziehungsweise
  deren Aktualisierung zuverlässig einplanen;
- vorhandene Bilddateinamen und `graphic`-URLs unverändert lassen; Figure-IDs und
  ID-basierte Staging-Verzeichnisse nicht unnötig umbenennen;
- einen Audit-Eintrag mit alter Kennung, neuer Kennung und Benutzer erzeugen.

Da eine Datenbanktransaktion keine Dateisystemoperation zurückrollen kann, muss der
Service eine explizite Reihenfolge und Kompensation für Teilerfolge implementieren.
Der Zielpfad darf niemals eine bereits vorhandene Datei überschreiben.

### F-113-BE3 – JWT-Endpunkt zum Verwerfen

Vorgeschlagener Vertrag:

```http
DELETE /jwt/editor/letters/{id}
```

Erfolgsantwort: `204 No Content`.

Die Implementierung erfolgt über einen geprüften gemeinsamen Löschservice mit
explizitem JWT- beziehungsweise klassischem Backend-Policy-Kontext. Der bestehende
administrative Ablauf aus `LettersController#destroy_member` liefert einzelne
Aufräumschritte und den Auditansatz, ist aber **keine** vollständige oder direkt
übernehmbare sichere Löschimplementierung. Die unten dokumentierten Lücken und
Voraussetzungen müssen zuvor berücksichtigt werden.

Der Service muss mindestens:

- den Brief sperren und Berechtigung sowie Zulässigkeit erneut prüfen;
- `LetterCheckedIn`-Einträge und nicht über normale Assoziationen entfernbare Daten
  explizit behandeln;
- `Editor::Letter`, `Editor::UserPinnedLetter`, Änderungshistorie und
  zwischengespeicherte Figure-Dateien aller betroffenen Arbeitskopien bereinigen;
- die kanonische XML-Datei kontrolliert entfernen;
- abhängige Daten ausschließlich entsprechend der fachlich bestätigten
  Löschstrategie entfernen;
- Suchindex und Caches aktualisieren;
- den bestehenden Nachweis über `LetterDeletion` oder einen gleichwertigen
  Audit-Eintrag mit Benutzer und Kennung fortführen;
- bei einem Teilerfolg einen konsistenten Wiederanlauf oder eine Kompensation
  ermöglichen.

Eine Löschung darf nicht allein dadurch erlaubt werden, dass der aktuelle Benutzer
den Brief gepinnt hat.

### F-113-BE4 – OpenAPI und Fehlervertrag

- Beide Endpunkte in der kanonischen Datei `docs/openapi/jwt.yaml` dokumentieren.
- Request- und Response-Schemata sowie 200/204, 401, 403, 404, 409 und 422
  vollständig beschreiben.
- Bestehenden JWT-Routenabgleich erweitern.
- Keine lokale Kopie der OpenAPI im Frontend anlegen; das Frontend greift über den
  in `OPENAPI_SPEC_PATH` beschriebenen kanonischen Vertrag darauf zu.
- Die Letter-Response um explizite Capabilities für beide Aktionen ergänzen. Jede
  Capability enthält mindestens `allowed` und einen stabilen, bei erlaubter Aktion
  leeren `reason_code`, zum Beispiel:

```json
{
  "capabilities": {
    "rename": {
      "allowed": false,
      "reason_code": "letter_already_published"
    },
    "discard": {
      "allowed": true,
      "reason_code": null
    }
  }
}
```

- Dieselben Capabilities in allen Responses liefern, aus denen ein Brief geöffnet
  oder die sichtbare Briefaktion neu bewertet wird. Das Frontend übersetzt die
  stabilen Codes über i18n in Hilfetexte. Die Operation selbst muss unabhängig von
  der vorab gelieferten Capability erneut autorisieren.

### Backend-Tests

- erfolgreiche Umbenennung von Datenbank, XML-Inhalt und Speicherdatei;
- Beibehaltung der numerischen Letter-ID und aller zulässigen Beziehungen;
- Kollisionsfall für Datenbanknamen und bereits vorhandene Zieldatei;
- ungültiges Format und ungültiges Datum;
- konkurrierende aktive Arbeitskopie und parallele Rename-/Discard-Requests;
- Fehler zwischen Datei- und Datenbankänderung mit geprüfter Kompensation;
- erfolgreiche Löschung einschließlich Editor-Arbeitsständen und Figure-Staging;
- blockierte Löschung veröffentlichter oder referenzierter Briefe;
- Berechtigungsfälle 401 und 403;
- 404 für unbekannte IDs;
- Audit-Eintrag für Rename und Discard;
- OpenAPI-Routen- und Response-Vertrag.

## API- und Rolloutreihenfolge

1. Fachliche Policy aus F-113-BE1 abstimmen.
2. Backend-Services, JWT-Endpunkte, Fehlercodes und OpenAPI implementieren.
3. Backend-Vertrags- und Integrationsprüfungen erfolgreich ausführen.
4. Frontend gegen den veröffentlichten Vertrag implementieren.
5. Gemeinsame Abnahme mit einem neu angelegten Testbrief durchführen.
6. Erst danach Aktionen für reguläre Benutzer freischalten.

Das Backend muss vor oder rückwärtskompatibel gemeinsam mit dem Frontend
ausgerollt werden. Die Aktionen bleiben grundsätzlich sichtbar. Solange die neuen
Endpunkte oder verlässlichen Capabilities noch nicht verfügbar sind, sind beide
Aktionen deaktiviert und mit einem Hinweis auf die noch nicht verfügbare Funktion
versehen.

## Akzeptanzkriterien

- Ein Benutzer erkennt eindeutig den Unterschied zwischen Tab schließen, Änderungen
  zurücksetzen, Brief umbenennen und Brief verwerfen.
- „Brief umbenennen“ und „Brief verwerfen“ sind bei jedem geöffneten Brief sichtbar.
  Nicht zulässige Aktionen sind deaktiviert und erklären ihren konkreten Grund per
  Tooltip beziehungsweise barrierefreiem Hilfetext.
- Eine gültige, freie Kennung kann für einen zulässigen Brief vergeben werden; ID,
  XML-Datei, XML-Inhalt, Arbeitskopien und abhängige Daten bleiben konsistent.
- Ein ungültiger, belegter, veröffentlichter oder aktiv konkurrierend bearbeiteter
  Brief wird mit einem verständlichen fachlichen Grund abgelehnt.
- Nach erfolgreichem Verwerfen ist der Brief weder über die exakte Namenssuche noch
  in der Briefsuche oder in gepinnten Arbeitskopien auffindbar; vorgesehene
  Auditdaten bleiben erhalten.
- Abgebrochene oder fehlgeschlagene Operationen hinterlassen weder einen halben
  Rename-Zustand noch verwaiste Dateien.
- Direkte Requests ohne ausreichende Berechtigung können die UI-Sperren nicht
  umgehen.
- OpenAPI, Backend-Verhalten und typisierte Frontend-Verarbeitung stimmen überein.

## Nicht Bestandteil

- Umbenennen oder Löschen bereits veröffentlichter Briefe;
- Ändern des Briefpräfixes oder Datumsanteils; die erste Version ändert nur die
  zweistellige laufende Nummer;
- Zusammenführen zweier Briefdatensätze;
- Wiederherstellung eines absichtlich verworfenen Briefes über den Online-Editor;
- freie Änderung anderer Briefmetadaten im Rename-Dialog;
- Ersetzen des bestehenden Tab-Schließ- und Reset-Verhaltens.

## Backend-Prüfung vom 26.10.2026

### Referenzen und Grenzen

Geprüft: Backend `feature/rails-8-edge`, Commit `6ffa83f3`; Frontend
`missing-oxygen-shortcuts`, Commit `acf5d49`, plus dieses ungetrackte Ticket.
Die lokale Backend-Referenz master existiert nicht; keine Rails-5-Referenz als
Implementierungsgrundlage benutzt. Code und SQL-Schema wurden gelesen und
ausgewählte Defaults/Assoziationen/FKs zusätzlich im lokalen Entwicklungscontainer
mit `PGOPTIONS=-c default_transaction_read_only=on` geprüft. Keine Briefe
umbenannt/gelöscht, keine Nutzerdaten geändert und kein Produktivsystem abgefragt.

**Nummern unterscheiden:** Dieses Frontend-F-113 ist nicht das vorhandene
Backend-F-113 zur Docker-Entwicklungsumgebung. Die zugehörigen neuen
Backend-Tickets sind F-155 bis F-161. Verbindliche Backend-Ticketliste bleibt
`metamw_edge_version/TICKETS.md`; die Reihenfolge unten ist ein Arbeitsplan.

### 1. Welcher Datensatz entsteht und was heißt „noch nicht veröffentlicht“?

Die JWT-Anlage erzeugt sofort den kanonischen `Letter`, seine XML-Datei,
eine `Editor::Letter`-Arbeitskopie und einen `Editor::UserPinnedLetter`.
Die Kette lautet `User -> Pin -> Editor::Letter -> Letter`; der Pin ist nicht
der Brief und seine ID nicht die kanonische Brief-ID.

`Letter.state` definiert empty=0, draft=1, internal_use=2, web_publish=3.
Die Scope `published` enthält **internal_use und web_publish**. Der erfolgreiche
Editor-Publish setzt internal_use und verwendet revision_status=draft; deshalb
ist „nicht live“ kein Nachweis für „noch nie gepublisht“.

Bei aktueller JWT-Anlage sind `state` und `revision_status` tatsächlich nil
(Code, Schema und lokale Metadaten bestätigen die Defaults). empty/draft/nil
allein sind daher kein sicherer Lebenszyklusnachweis. Künftige Freigabe:
bekannte Editor-Herkunft + nachgewiesener Ersteller + zuverlässig noch nie
erfolgreich gepublisht + keine weiteren Konflikte. Widersprüchliche/unklare
Bestandsdaten blockieren. Ein dauerhafter Erstpublish-Vermerk muss alle
Publish-Pfade abdecken und jede Rückstufung überleben.

### 2. Ersteller und Herkunft

Der aktuelle Letter besitzt keine entsprechenden dauerhaften Felder.
`Editor::Letter.last_change_by_user_id` wird bei Änderungen umgeschrieben;
Arbeitskopien können geschlossen und später durch andere Personen neu angelegt
werden. `last_saved_change_applied_at` wird bereits bei Anlage der Arbeitskopie
gesetzt und beweist keinen Publish. JWT-Aktionen werden durch den allgemeinen
ApplicationController-Logger ausdrücklich übersprungen. PaperTrail-/Einzellogs
sind kein lückenloser Ersteller-/Nie-Publish-Nachweis.

Folge: Migration und vertrauenswürdige Setzung bei Create/Publish (F-155), kein
Backfill aus aktuellem Pin/letztem Bearbeiter. `provenienz` und `kind_of_sources`
beschreiben Quellen, nicht die technische Erstellungsherkunft. Altfälle bleiben
zunächst gesperrt; eine nachträgliche Freigabe braucht gesonderten Nachweis.

### 3. Abhängigkeiten beim Verwerfen

| Bereich | Erforderliche Behandlung |
| --- | --- |
| Editor-Arbeitsstände, Pins, Changes/Details | Gezielt über kanonische Letter-ID und echte Editor-ID-Kette bereinigen; Composite-FKs/current_change berücksichtigen; eigene Änderungen nur nach bestätigtem Discard verwerfen |
| Figure-Staging | Explizit pro Editor-ID bereinigen; Model-destroy räumt Dateien nicht automatisch auf; keine fremden/geteilten Bilder per Präfixglob löschen |
| Notes/XmlSpots/XmlRefs | Unscoped auch FootNote/NULL-Typen behandeln; eigene abhängige Daten versus eingehende Fremdverweise unterscheiden |
| Korrespondenz-/Person-/Ort-/Werk-/RISM-Zuordnungen, Tags/Facets | Eigene Join-Daten entfernen, keine gemeinsam genutzten Stammsätze |
| Header-Beziehungen und XML-Verweise anderer Briefe | In der ersten Version blockieren; andere Briefe nicht stillschweigend verändern |
| Check-ins | Sowohl letter_id als auch historischen letter_name berücksichtigen; Tabelle ohne Primärschlüssel |
| Annotationsbriefe/-Snippets | Sind per letter_name statt Letter-Assoziation gebunden; laufende Vorgänge blockieren, sonst explizit behandeln |
| xml_ids / xml_id_hist_entries | Nicht vollständig durch Letter-Assoziationen erfasst; FK-/Historieregel festlegen, sonst kann die Löschung scheitern |
| Warteschlangen, Wartungs-/Suchlogs, WebLinks, InternalComments, Export-Tracking | Eigentümerschaft und Auditretention je Tabelle prüfen; Worker dürfen gelöschte Daten nicht erneut schreiben |
| DOI/registrierte externe Referenzen | In der ersten Version blockieren; DOI dependent:nullify ist mit den NOT-NULL-Entitätsfeldern keine sichere Standardlöschung |
| LogEntry, LetterVersion/PaperTrail, LetterDeletion | Gezielten Lösch-/Rename-Nachweis mit Akteur/alter Kennung/ID erhalten, nicht blind vorhandene dependent:destroy-Regeln übernehmen |
| Kanonische Datei, Index/Caches, Backup/Synchronisation | Altstand sichern, kontrolliert aus aktivem Bestand entfernen, Teilfehler kompensieren, Wiederauferstehen durch Import/Restore verhindern |

Konkrete zusätzliche Vorbedingung **F-156**: `Letter#editor_user_pinned_letters`
vergleicht aktuell `editor_letter_id` direkt mit `Letter.id`. Diese Relation kann
bei zufälliger ID-Kollision fremde Pins treffen; sie muss über editor_letters
geführt werden. **Nicht ungeprüft Letter.destroy! als Komplettlösung verwenden.**

`incoming_relations` wird derzeit beim Letter-destroy automatisch gelöscht;
das aktualisiert aber nicht die XML-Dateien anderer Briefe. Incoming
`XmlRef(pointable_type=Letter)` sind ebenfalls gesondert zu prüfen. Ein fehlender
DB-Verweis beweist nicht die Abwesenheit eines XML-Verweises in einem anderen
Brief oder einer aktuellen Editor-Arbeitskopie. Weltweite externe Referenzfreiheit
lässt sich nicht aus der lokalen Datenbank beweisen; bekannte Registrierungen
und kontrollierte Exporte müssen ausdrücklich berücksichtigt werden.

### 4. Was muss beim Umbenennen geändert werden?

| Repräsentation | Behandlung |
| --- | --- |
| Letter.id und ID-basierte Beziehungen | Erhalten; kein Delete/Create als Rename |
| Letter.name / abgeleitete Datums-, Jahres-, Checksum-/Suchdaten | Aus neuer gültiger Kennung und derselben kanonischen XML-Quelle konsistent ableiten |
| Kanonischer XML-Pfad | `STORE_BASE/{FMB|GB}/{Jahr}/{Kennung}.xml`; Quelle/Ziel mit gesichertem Altstand, ohne Überschreiben und mit Kompensation behandeln |
| TEI-Root xml:id | Auf neue Kennung setzen |
| Eigene title/@key | Dokumenttitel im titleStmt sowie eigenes msItem/title[@type=letter] gezielt umstellen |
| precursor/successor und fremde Briefverweise | Andere Zielbriefe unverändert lassen, auch FMB/GB-Querverweise; eingehende Referenzen gesondert behandeln |
| data-key / key / URI-Verweise | Editor- und kanonische Darstellung unterscheiden; nur exakte semantische Zielverweise anpassen, kein globales Ersetzen aller Texte |
| Editor-Baseline und aktuelles XML | Beide auf neue Identität umstellen, lokale Inhaltsänderungen erhalten |
| Aktive Undo-/Redo-Historie | Komprimierte Vollstände und Diffs korrekt transformieren/neu berechnen; sonst begründet blockieren, nicht still löschen |
| Unabhängige UUID-xml:ids, XML-Deklaration, Namespaces, schemaLocation, xml:space | Erhalten |
| Figure-IDs, Preview und Staging-Verzeichnis | ID-basiert und daher ohne nötige Umbenennung |
| Vorhandene Bilddateinamen/graphic-URLs | Bleiben unverändert. Nur neue Uploads erhalten den neuen Briefpräfix |
| Name-basierte Check-ins, Annotation-Jobs, Header-Keys, Elasticsearch-Brief-ID/Notizmetadaten, Caches | Explizit aktualisieren, invalidieren oder wegen Konflikts blockieren |
| Historische Versionen, Zeitstempelkopien, Backup-/Git-Historie | Historische Namen/Inhalte nicht umschreiben; Audit mit alter/neuer Kennung; Restore/Reimport muss alte Identität erkennen und darf sie nicht unbemerkt wiederherstellen |

Eine Änderung von FMB nach GB würde auch Richtung und Autor-Kontext verändern.
Eine Änderung des Datumssegments würde `letter_date`/`year` und gegebenenfalls
`creation/date/@when` berühren. Deshalb sind beide Änderungen in der ersten
Version ausgeschlossen; nur die zweistellige laufende Nummer darf geändert
werden.

Der existierende AtomicWriteService schützt einen Dateiaustausch, aber überschreibt
ein vorhandenes Ziel und kompensiert nur diesen einen Pfad. Für Rename ist er
keine fertige transaktionale Zwei-Pfad-Lösung. UNIQUE(name) existiert, aber kein
nachgewiesener UNIQUE(lower(name))-Index; Zielkollisionen und alle Schreibpfade
müssen die Lowercase-Regel zuverlässig beachten.

### 5. Aktive Arbeitskopie und Konkurrenz

Die eigene Arbeitskopie darf nicht allein wegen ihres Bestehens blockieren:
sie wird schon beim Anlegen erzeugt und die Aktion wird aus einem offenen Tab
aufgerufen. Fremde persistente Arbeitsstände/Pins zunächst konservativ blockieren;
sie beweisen keine Live-Anwesenheit, dürfen aber auch nicht ungefragt verloren gehen.
Ein ehrlicher Grund wäre `letter_has_other_working_copies`.

Vor Rename ausstehendes Autosave abschließen; bei Discard bewusst bestätigen,
dass lokale Änderungen verworfen werden. Uploads und andere exklusive Requests
vorher abschließen. Backend prüft nach Erwerb einer gemeinsamen Briefsperre erneut.
Eine Sperre nur im neuen Service reicht nicht, solange Save/Upload/Unpin sie nicht
beachten. Ein alter Browserrequest darf nach Rename/Discard keinen Altstand
zurückschreiben. Worker-/Queue-Prüfung muss bereits laufende, aus der Queue
entnommene Jobs mit erfassen. Versions-/ETag-Vertrag in F-157 festlegen.

### 6. Capabilities

**Technisch lieferbar, aktuell noch nicht vorhanden.** Gemeinsame Policy aus
F-155 verwenden; Benutzerkontext beim Serialisieren explizit übergeben. Eigenes
Ergebnis für rename/discard, `allowed=true` nur mit `reason_code=null`.
Nichtersteller erhalten z.B. `not_letter_creator`, einmal gepublishte Briefe
`letter_already_published`, nicht belegbare Altfälle `letter_provenance_unknown`.
Weitere Gründe für Arbeitsstände/Schreibvorgänge/Referenzen nach F-160 festlegen.

Letters Show/by_name und Pinned Show/Index sind unterschiedliche Codepfade
(Pinned Show ist ein manuell aufgebauter Hash). Anlage, Such-/Recent-Responses
ebenfalls auf tatsächliche UI-Nutzung prüfen. Keine personenbezogenen
Capabilities in einem globalen Cache wiederverwenden. Einmal gelieferte
Capabilities ersetzen nicht die erneute Prüfung beim Mutationsrequest.

### 7. Endpunkte und Frontend-Vertrag

`PATCH /jwt/editor/letters/{id}` und `DELETE /jwt/editor/letters/{id}` sind
passend für die kanonische Ressource. Beide existieren dort noch nicht.
PATCH ist zunächst ausdrücklich auf letter.name beschränkt, kein allgemeiner
Metadateneditor. `id` bleibt numerisch; `Letter#to_param` liefert aktuell den
Namen, deshalb URL-Erzeugung nicht blind über ein Letter-Objekt durchführen.

200 beim Rename mit aktualisiertem Brief und Capabilities; 204 beim Delete ohne
Body. 401 für fehlende Anmeldung, 403 für Nichtersteller/fehlende Berechtigung,
404 für unbekannte ID, 409 für Zustands-/Bearbeitungs-/Referenz-/Namenskonflikte,
422 für ungültige Kennung/Datum. Falls F-157 echtes If-Match einführt, zusätzlich
412 dokumentieren. DELETE braucht keinen notwendigen JSON-Body; Bestätigung
gehört in den Dialog, Versionsschutz unabhängig davon in den API-Vertrag.

**Verbindlich:** Jede neue JWT-Route und jede Request-/Response-/Statusänderung
muss im selben Implementierungspatch in der kanonischen Backend-Datei
`docs/openapi/jwt.yaml` stehen – einschließlich Capabilities, reason_code-Enums,
204 ohne Body, Fehler- und Erfolgsbeispielen. OPENAPI_SPEC_PATH verwenden.
Geplante Endpunkte jetzt nicht als bereits funktionierende Operationen ausgeben.

## Umsetzungsplan mit zugehörigen Backend-Tickets

Die Backend-Ticketdetails liegen unter
`../metamw_edge_version/audit/tickets/open/` relativ zum Frontend-Root; die
verbindliche Liste ist dort TICKETS.md. Planung zusätzlich in ARBEITSPAKETE.md,
Abschnitt 7. Pro Implementierungsauftrag einen Backend-Befund bearbeiten.

1. **F-155:** Ersteller/Herkunft/ersten erfolgreichen Publish dauerhaft speichern,
   Legacy-Daten unbekannt behandeln und zentrale JWT-Policy implementieren.
2. **F-156:** falsche direkte Pin-Zuordnung getrennt korrigieren und mit
   absichtlich kollidierenden Brief-/Editor-IDs absichern.
3. **F-157:** Save/Upload/Publish/Pinning und Rename/Discard über denselben
   Brief-Sperr-/Versionsmechanismus koordinieren.
4. **F-158:** sicheren gemeinsamen Discard-Service mit Abhängigkeitsprüfung,
   Datei-/Staging-/Indexbehandlung, Sicherung, Kompensation und Audit erstellen.
5. **F-159:** Rename-Service mit stabiler ID, selektiver TEI-Anpassung,
   erhaltenem Inhalt/Undo-Redo und sicherer Dateiumbenennung erstellen.
6. **F-160:** Capabilities sowie PATCH/DELETE an JWT anbinden; OpenAPI,
   Response-/Security-Tests und Fehlervertrag im selben Patch aktualisieren.
7. **F-161:** klassisches Backend-Löschen für jeden angemeldeten Benutzer auf
   sicheren gemeinsamen Service umstellen. Nach F-158 unabhängig von FE möglich.

Frontend anschließend beziehungsweise vertraglich parallel:

- **F-113-FE1:** sichtbare Aktionen, deaktivierte Anfangszustände und barrierefreie
  Hinweise; Capabilities typisiert lesen und Codes übersetzen. Bis F-160 verfügbar
  ist, keine Freigabe aus state/Pin/User-Heuristiken berechnen.
- **F-113-FE2:** Rename mit Format-/404-Verfügbarkeitsprüfung, gespeicherten
  Änderungen/Versionsschutz, PATCH und konsistenter Aktualisierung von Tabs,
  Redux, Briefdaten und Caches. ID beibehalten, Inhalt nicht verlieren.
- **F-113-FE3:** bestätigtes Discard, DELETE/204 ohne JSON-Parser, kontrolliertes
  Entfernen lokaler Briefzustände und Tab-Wechsel. Tab-Schließen bleibt separat.
- Vor Freischaltung End-to-End-Abnahme: neuer Brief -> Änderungen -> Rename ->
  Undo/Redo -> Publish (danach beide JWT-Aktionen gesperrt); separater neuer Brief
  -> Discard; Nicht-Ersteller und klassischer Backend-Nutzer; Fehler/Teilrollback.
- Backend-Vertragsabgleich `script/check_jwt_openapi.rb`, gezielte Specs und
  Backend-Vollsuite mit 16 Workern. Frontend-Parser-/UI-Tests, Typecheck und
  gegebenenfalls Build nach den jeweiligen AGENTS.md. Beispiele in diesem Ticket
  sind bis zur Implementierung geplante Verträge, keine bereits verfügbare API.

## Festgelegter Umfang der ersten Version

- JWT-Rename und JWT-Discard sind ausschließlich dem dauerhaft nachgewiesenen
  Ersteller vor dem ersten erfolgreichen Publish erlaubt.
- Rename ändert nur die zweistellige laufende Nummer. Präfix und Datum bleiben
  unverändert.
- Bekannte eingehende Beziehungen und XML-Verweise blockieren beide Operationen;
  fremde Briefe werden nicht automatisch mitverändert.
- Bestehende Bildnamen und `graphic`-URLs bleiben unverändert.
- Es gibt kein zusätzliches Zeitfenster nach der Erstellung.
- Eine öffentliche oder administrative Wiederherstellungsfunktion gehört nicht
  zur ersten Version. Eine spätere Retention-/Quarantänelösung wird separat
  geplant.

## Code- und Schemanachweise der Prüfung

Backend-Repository, Stand 6ffa83f3:

- `app/services/editor/create_letter_service.rb`: Anlage von Letter/Datei/Arbeitskopie/Pin, kein dauerhafter Ersteller.
- `app/models/letter.rb`: state-Enum, published-Scope, direkte Pin-Assoziation, dependencies, Namens-/Datumsvalidierung, to_param.
- `app/models/editor/letter.rb`, `user_pinned_letter.rb`, `letter_change.rb`: persönliche Arbeitsstände, Initialtimestamp und komprimierte Historie.
- `app/services/editor/editor_pinned_letter_service.rb`: Unpin entfernt Arbeitskopie und Staging, nicht den kanonischen Brief.
- `app/services/editor/editor_publish_letter_service.rb`, `app/models/concerns/doc_manageable.rb`, `app/services/letter_publishing/publish_letters_service.rb`: Publish-/Lock-/Rollback-Pfade und internal_use/draft.
- `app/controllers/letters_controller.rb`, `app/forms/letters/destroy_form.rb`: bisheriges administratives DB-Aufräumen und write_all-Checks.
- `app/models/concerns/letter_header_relation_associations.rb`, `xml_ref.rb`, `note.rb`, `doi_register.rb`: eingehende Verweise, ausgeblendete Notes und DOI-Konflikte.
- `app/services/letter_storage/atomic_write_service.rb`, `letter_images/storage.rb`, `letter_images/promotion_service.rb`: Grenzen atomarer Dateien, IDs/Bildnamen und Staging.
- `app/services/elasticsearch/export_letters_service.rb`, `export_notes_letter_service.rb`: Briefname als ES-ID und Notizmetadatum; Live-/Einzelexport unterscheiden.
- `db/structure.sql`: FK-, NOT-NULL-, Index- und nicht automatisch bereinigte Tabellen.

Diese Prüfung ändert ausschließlich Ticket-/Planungsdokumentation. Keine
Rename-/Delete-Operation, Migration oder neue API implementiert. Die bisherigen
65 JWT-Operationen bleiben unverändert; zukünftige Änderungen müssen nach dem
obigen Plan gemeinsam mit OpenAPI erfolgen.

## Prüfung der Dokumentation

Am 26.10.2026: Ticketnummern F-155 bis F-161, vorhandene Detaildateien,
Markdown-Codeblöcke und Formatierung geprüft. Frontend `yarn tsc --noEmit`
erfolgreich; Backend `script/check_jwt_openapi.rb` bestätigt unverändert alle
65 registrierten JWT-Operationen. Keine Anwendungsdateien geändert; keine
Spec-Suite oder destruktiven Funktionstests für diese reine Analyse ausgeführt.
