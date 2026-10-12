# Automatische Annotationen in der Editoransicht – Ticketgrundstruktur

**Stand:** 12.10.2026 · **Status:** Entwurf zur fachlichen und technischen Abstimmung

**Quelle:** [20261002_annotationen_auswertung_hartrumpf.md](20261002_annotationen_auswertung_hartrumpf.md). Das angefragte Dokument liegt im Repository unter `docs/tickets/`, nicht unter `doc/`.

**Ziel:** Automatische Annotationen direkt im geöffneten Brief starten, fortlaufend anzeigen, prüfen und nachbearbeiten. Der separate bisherige Annotationsbereich wird dadurch ersetzt. Die Kennungen `AA-01` bis `AA-13` sind vorläufige Planungskennungen, keine bereits angelegten Tracker-Tickets.

## Grundlage und Abgrenzung

Der Quelltext des Frontends wurde ergänzend geprüft. Er enthält eigene Annotationsrouten (`/automatic_annotations/...`), einen eigenen Redux-Slice und separate API-Aufrufe für Annotationsbriefe, XML, Entitäten, Status, Sperren, Zurücksetzen und Schreiben in eine Datei. Im Editor bestehen dagegen eigene Briefzustände, Tabs, XML-Bearbeitung und eine Erkennung zwischenzeitlich geänderter Briefe. Die Ablösung ist deshalb mehr als ein Verschieben der bisherigen Oberfläche.

Die Backend-Anforderungen wurden mit der Rails-Anwendung unter `../metamw/` abgeglichen (der angefragte Pfad `../metmaw/` existiert nicht). **Prüfstand: `master`, Commit `123ba465`, nach `git fetch` identisch mit `origin/master`, sauberer Arbeitsbaum.** Geprüft wurden Routen, Controller, Models, Services, Serializer, Datenbankstruktur, Job-Konfiguration und einschlägige Specs. Es handelt sich um eine statische Quellcodeanalyse; produktive Daten und der externe Sempria-Dienst wurden nicht abgefragt. Neue Routen und Datenmodelle unten bleiben Planungsvorschläge.

Nicht zum Umfang gehören die beiläufig erwähnten Matomo-Daten und Terminnotizen. Die im Quelldokument enthaltene frühere Bitte um Diagramme ist Kontext; dieses Dokument liefert die jetzt angefragte Ticketplanung.

## Verbindliche Ergänzung: Modus `AutomaticAnnotations`

Die nachträgliche Vorgabe ersetzt die Aktivierung über das Kontextmenü und die bisher nur empfohlene Bearbeitungssperre:

- Der Editor erhält einen eigenen Modus `AutomaticAnnotations`, unabhängig von der Darstellung als WYSIWYG oder Code.
- Ein sichtbarer Modus-Button öffnet im normalen Editor eine Sicherheitsabfrage zum Start. Erst nach Bestätigung wird die Sitzung initialisiert. Der zuvor gesetzte Cursor bestimmt weiterhin die Startposition; der Button muss diese Auswahl erhalten.
- Im aktiven Modus öffnet derselbe Button eine Sicherheitsabfrage zum Beenden. Abbrechen, Escape oder Schließen einer der beiden Abfragen verändert den Modus nicht und sendet keinen Start-/Stoppauftrag.
- Solange der Modus aktiv ist, sind ausschließlich die Prüfung/Bearbeitung automatischer Annotationen und die dafür notwendigen Speicher-/Feedbackaktionen erlaubt. Alle anderen Bearbeitungen sind gesperrt: Freitext/XML, Formatierung, manuelle Auszeichnungen, Metadaten, Uploads, allgemeines Speichern, Undo/Redo, Reset, Rebase und Veröffentlichung. Auch bereits geöffnete Dialoge, Tastenkürzel und direkte API-Aufrufe dürfen die Sperre nicht umgehen.
- Der Briefwechsel bleibt gesperrt. Start und Ende müssen mit dem Backend abgestimmt sein; während eines Übergangs darf keine konkurrierende Bearbeitung erfolgen. Ein fehlgeschlagener oder unklarer Stopp gibt die Bearbeitung nicht frei; nach einem unklaren Requestausgang wird der Serverstatus abgefragt.
- **Suchende und Modusende werden getrennt:** Wenn Sempria keine weiteren Treffer findet, endet die Suche. Der Modus bleibt zur Prüfung aktiv, bis der Benutzer ihn über Button und Sicherheitsabfrage beendet. Damit erfolgt auch der reguläre Abschluss über den geforderten Weg. Technische Sitzungsabläufe werden separat über den Serverstatus behandelt.

Diese Regeln sind Anforderungen für die Umsetzung; der Modus ist mit diesem Dokument noch nicht implementiert.

## Ergebnis des Backend-Scans

Die Anwendung verwendet laut `.ruby-version` Ruby 2.7.7 und laut `Gemfile.lock` Rails 5.2.8.1. Active Job ist bereits auf `delayed_job` konfiguriert; für diese Funktion ist daher zunächst keine neue Queue-Infrastruktur erforderlich.

| Bereich | Im Backend vorhanden | Konsequenz für die Tickets |
| --- | --- | --- |
| Start und Ergebniseingang | `LetterAutomaticAnnotationsController` → `LetterAutomaticAnnotations::NewForm` → `Sempria::LetterAnnotationService`; Start per HTTP-GET mit Briefname/Präfix, anschließend Prüfung von XML-Dateien in `ANNOTATION_PATH` anhand ihrer Dateizeiten | Kein vorhandener interaktiver Start mit XML-Ausschnitt und Cursoranker. AA-04/AA-05 benötigen einen neuen Ablauf. Der bisherige Start ist kein eigener Annotation-Background-Job. |
| Annotationsdaten | `LetterAutoAnnoJob`, `LetterAutoAnnoLetter`, `LetterAutoAnnoSnippet`, `LetterAutoSnippetReference`; Original-/Arbeits-XML, `xml_id`, Kandidaten, finale Entität und Status | Daten und Zuordnungen wiederverwenden/migrieren. Startanker, Editor-Arbeitskopiebezug, Versionsvertrag, Feedbackzustellung und Entscheidungshistorie fehlen in diesen Tabellen. |
| Trefferextraktion | `Sempria::ExtractXmlContent` liest `persName`/`placeName` mit `producer`; Kandidaten für Person, Settlement, Institution und Sight; auch `open_no_recommendation` | Neue Einzelergebnisse strikt und namespace-bewusst verarbeiten. Die vier Typen und Treffer ohne Kandidaten bilden die belegte Ausgangsbasis; weitere Typen fachlich entscheiden. |
| Entscheidungen | `Jwt::AutomaticAnnoSnippetsController` und `Sempria::HandleAnnotationSnippetService` ändern Entität/Status; XML wird separat über `AutomaticAnnoLettersController#set_xml_content` geschrieben | Im geprüften Entscheidungspfad wird kein Feedback an Sempria gesendet. AA-07 benötigt eine gemeinsame Entscheidungsoperation und verlässliche Feedbackzustellung. |
| Editor-Arbeitsstand | `Editor::Letter#xml_content` als Basis, `xml_content_current` als Arbeitskopie; `Editor::UserPinnedLetter` ordnet Benutzer zu; `EditorTrackChangesService` schreibt Historie | Bestätigte Annotationen sollten in die vorhandene Arbeitskopie und Historie integriert werden, nicht in einen dritten vollständigen Briefstand. |
| Veröffentlichung | `EditorPublishLetterService` nutzt `Letter.publish!` mit Sperre auf dem Brief und Konfliktprüfung; `staleness` und `rebase` existieren bereits | Veröffentlichung bleibt eine eigene Aktion. Zusätzlicher Versionsschutz ist für gleichzeitige Änderungen derselben Arbeitskopie und Annotationsentscheidungen nötig. |
| Alte Dateiausgabe | `HandleAnnotationLetterService#write_content` schreibt atomar eine Datei mit Präfix `sempria-` und entfernt danach die Eingangsdatei aus `ANNOTATION_PATH` | Das ist nicht der Editor-Publish-Pfad. AA-11 muss neben Datenbankständen auch diese Zwischen-/Ausgabedateien und die Sempria-Revert-Funktion berücksichtigen. |
| Sperren | `locking_user_id`/`locked_at` am Annotationsbrief; `set_locking_user` übernimmt einen Benutzerparameter, bestimmte Briefaktionen prüfen die Sperre | Keine gemeinsame Editor-/Annotationssperre. Sitzungseigentümer aus dem authentifizierten Benutzer ableiten und Regeln auch für Snippet- und Editor-Schreiboperationen durchsetzen. |

**Empfohlener technischer Zuschnitt:** Sitzungen auf einen kanonischen `Letter` und die konkrete `Editor::Letter`-Arbeitskopie beziehen; Vorschläge und Feedback separat persistieren; bestätigte Änderungen über den Editor-Änderungsdienst übernehmen; Veröffentlichung über den vorhandenen Publish-Pfad. Die Sitzungshistorie darf nicht allein von einer löschbaren Arbeitskopie abhängen. Ob die vorhandenen Annotationsmodelle erweitert oder neue Sitzungsmodelle mit Bestandsübernahme eingeführt werden, wird in AA-03 entschieden. Für die erste Version bietet sich inkrementelles Polling an; ein bestehender Streaming-Vertrag für Annotationen wurde nicht gefunden.

**Externe Abhängigkeit:** Aus dem Rails-Code lässt sich nicht ableiten, ob Sempria bereits XML-Ausschnitte, einzelne Treffer, Entscheidungsfeedback und Abbruch unterstützt. Der dort implementierte Datei-/Batch-Vertrag genügt dem Zielablauf nicht. Die Abstimmung aus AA-02 ist Voraussetzung für die reale Sempria-Anbindung; ein Prototyp kann gegen einen vereinbarten Testadapter entstehen.

## Fachliche Klärungen und Arbeitsannahmen

1. **Suchablauf:** Die ersten Notizen verlangen eine Benutzerentscheidung vor dem nächsten Vorschlag. Die spätere Ablaufplanung und Zusammenfassung beschreiben eine parallel weiterlaufende Suche. Arbeitsannahme ist die spätere Variante; AA-02 muss klären, wie bereits berechnete Vorschläge auf neues Feedback reagieren.
2. **Startposition:** „Ab dem ausgewählten Markup“ wird vorläufig als Beginn des per Cursor bestimmten TEI-Elements verstanden. Ob stattdessen exakt die Zeichenposition gemeint ist, muss abgestimmt werden. Ein bloßer Ausschnitt des XML-Strings ist kein verlässlicher TEI-Teilbaum.
3. **Vorschlag oder bestätigte Annotation:** Die Darstellung im Brief soll automatisch aktualisiert werden. Offen ist, ob ungeprüfte Vorschläge bereits im gespeicherten Brief-XML stehen. Empfehlung: Vorschläge separat speichern und im Editor sichtbar darstellen; erst bestätigte Änderungen in den maßgeblichen Briefstand übernehmen.
4. **Bearbeitung im Modus – festgelegt:** Im Modus `AutomaticAnnotations` sind alle anderen Änderungen gemäß obiger Ergänzung gesperrt, auch nach Ende der Suche. Noch zu klären ist ausschließlich der Umgang mit ungespeicherten Änderungen vor der Aktivierung; sie dürfen nicht stillschweigend verloren gehen.
5. **Ende und Nachbearbeitung:** Die Suche kann automatisch enden; das reguläre Modusende erfolgt über denselben Button mit Sicherheitsabfrage. Empfehlung: Offene Vorschläge bleiben nach Modusende erhalten und können auch nach erneutem Öffnen geprüft werden. Für spätere Änderungen wird der Modus über den bestätigten Buttonstart erneut betreten; eine reine Nachprüfung vorhandener Vorschläge darf nicht automatisch einen neuen Suchlauf auslösen. Nachträgliches Feedback muss Sempria auch ohne laufende Suche erreichen können.
6. **Bestandsdaten:** Fachlich festlegen, ob offene alte Vorgänge übernommen, vor dem Wechsel abgeschlossen oder lesbar archiviert werden. Bereits bestätigte Briefauszeichnungen müssen erhalten bleiben.

## Ticketübersicht

| Kennung | Titel | Abhängigkeiten |
| --- | --- | --- |
| AA-01 | Modus AutomaticAnnotations als Grundlage einführen | –; zuerst umsetzen und abnehmen |
| AA-02 | Ablauf, Zustände und Schnittstellen abstimmen | AA-01 |
| AA-03 | Annotationssitzungen und Vorschläge bereitstellen | AA-01, AA-02 |
| AA-04 | Startposition und Suchinitialisierung an den Modus anbinden | AA-01, AA-03 |
| AA-05 | Schrittweise Sempria-Suche im Backend ausführen | AA-01, AA-03 |
| AA-06 | Neue Vorschläge abrufen und im Brief hervorheben | AA-01, AA-04, AA-05 |
| AA-07 | Vorschläge bearbeiten, akzeptieren und verwerfen | AA-01, AA-06 |
| AA-08 | Übersicht und nachträgliche Korrekturen integrieren | AA-01, AA-07 |
| AA-09 | Briefstand, Speicherung und konkurrierende Änderungen absichern | AA-01, AA-03; gemeinsam mit AA-06/AA-07 entwickeln |
| AA-10 | Suchabbruch und Wiederherstellung an den Modus anbinden | AA-01, AA-04, AA-05; mit AA-09 abstimmen |
| AA-11 | Bestehendes Annotationssystem ablösen | AA-01, AA-06 bis AA-10, Bestandsentscheidung aus AA-02; Umschaltung nach AA-12 |
| AA-12 | Gesamtablauf und Ablösung abnehmen | AA-01, AA-04 bis AA-10 und Migrationsvorbereitung aus AA-11 |
| AA-13 | Ungenutzten Annotationscode in Frontend und Backend entfernen | AA-01, AA-11 einschließlich Umschaltung, AA-12 |

**Umsetzungsreihenfolge:** AA-01 ist das erste, eigenständig prüfbare Grundlagen-Ticket. Alle weiteren Erweiterungen bauen auf seinem aktiven Modus und seinen zentralen Sperren auf; die bisherigen Kennungen wurden entsprechend um eins erhöht. AA-03, AA-04, AA-09 und AA-10 erweitern diese Grundlage, sie führen keinen zweiten Modus oder unabhängige Sperren ein.

Alle Tickets gehören zur vollständigen Ablösung. Zuerst wird der Modus ohne Sempria-Anbindung abgenommen. Danach folgt der technische Durchstich Start → erster Vorschlag → Entscheidung → Feedback → Stopp. AA-11 bereitet die Migration vor, AA-12 nimmt den neuen Ablauf und den Migrationsprobelauf ab; erst danach erfolgt die Umschaltung aus AA-11. AA-13 entfernt anschließend den nachweislich ungenutzten Code und prüft den bereinigten Stand erneut.

## AA-01 – Modus AutomaticAnnotations als Grundlage einführen

**Priorität:** zuerst umsetzen und abnehmen. **Abhängigkeiten:** keine späteren Annotations-Tickets; unabhängig vom externen Sempria-Vertrag prüfbar.

**Ziel:** Der Editor besitzt einen expliziten Modus `AutomaticAnnotations`, auf dem sämtliche folgenden Annotationsfunktionen aufbauen.

**Frontend / Umfang:**
- Zentralen Editor-Modus mit den Übergängen Start/Ende einführen, getrennt von WYSIWYG-/Codeansicht und dem späteren Suchstatus.
- Einen sichtbaren Button für Start und Beenden mit jeweils eigener Sicherheitsabfrage integrieren. Erst Bestätigen sendet den Auftrag; Abbrechen, Escape und Schließen ändern nichts. Die vorhandene Cursorposition bleibt beim Fokuswechsel erhalten.
- Während des aktiven Modus alle anderen Änderungen und den Briefwechsel sperren, einschließlich Codebearbeitung, Metadaten, manueller Auszeichnungen, Uploads, allgemeinem Speichern, Undo/Redo, Reset, Rebase, Veröffentlichung, Tastenkürzeln und bereits geöffneten Dialogen.
- Eine zentrale Prüfung für zulässige Aktionen bereitstellen. Spätere Tickets dürfen ausschließlich ihre gezielten Annotationsaktionen ergänzen; das Ausblenden einzelner Bedienelemente genügt nicht.
- Übergänge gegen Doppelklicks absichern; bei unklarem Serverstatus keine Bearbeitung freigeben. Beim Neuladen den Modus vom Backend wiederherstellen. Für diese erste Ausbaustufe den Start bei ungespeicherten oder noch laufenden Änderungen verhindern und verständlich darauf hinweisen.

**Notwendige Backend-Änderungen:**
- Einen minimalen persistenten Moduszustand mit kanonischem Brief, konkreter `Editor::Letter`-Arbeitskopie, authentifiziertem Eigentümer und Zustandskennung bereitstellen. Idempotente Operationen für Aktivieren, Statusabfrage und Beenden sowie atomaren Sperrerwerb/-freigabe implementieren. AA-03 ergänzt später Vorschläge und Suchdaten auf dieser Grundlage.
- Die vorhandene Cookie-Authentifizierung nutzen und Eigentümer-/Briefrechte prüfen. Gleichzeitige Aktivierungen für denselben Brief verhindern; Freigabe nur durch berechtigte Operationen, mit definiertem Umgang mit abgelaufenen/verwaisten Modussitzungen.
- Eine gemeinsame serverseitige Modusprüfung für die betroffenen Schreibpfade ergänzen, insbesondere `Jwt::Editor::PinnedLettersController`, `LetterChangesController` und Figure-Uploads. Direkte API-Aufrufe und weitere Clients dürfen die Sperre nicht umgehen. Bereits laufende Schreibvorgänge und Aktivierung müssen über denselben Sperrmechanismus koordiniert werden.
- Neue Annotationsoperationen dürfen später nur über ausdrücklich autorisierte interne Pfade schreiben, nicht über ein frei übermittelbares Umgehungsflag. Die Modusaktivierung dieses Grundlagen-Tickets benötigt weder einen Sempria-Auftrag noch Vorschlagsdaten.

**Akzeptanzkriterien:** Der Modus lässt sich ohne Sempria-Anbindung über Button und bestätigte Sicherheitsabfrage aktivieren und beenden. Abbrechen beider Abfragen sendet keinen Auftrag. Im aktiven Modus ist kein anderer Bearbeitungsweg nutzbar; direkte Requests und konkurrierende Clients werden ebenfalls abgewiesen. Nach Neuladen bleiben Modus und Sperren erhalten. Fehlgeschlagenes/unklares Beenden gibt keine Bearbeitung frei; nach bestätigtem Ende sind die normalen Funktionen wieder nutzbar. Frontend- und Backend-Tests decken Bestätigung/Abbruch, Übergänge, konkurrierende Requests, Sperren und Wiederherstellung ab.

**Abgrenzung:** Startposition als Suchbereich, Sempria-Kommunikation, Vorschläge und Feedback werden in den Folgetickets ergänzt. Der Modus kann daher vollständig vor diesen Erweiterungen umgesetzt und geprüft werden.

## AA-02 – Ablauf, Zustände und Schnittstellen abstimmen

**Ziel:** Fachabteilung, Frontend, Rails-Backend und Sempria arbeiten mit einem eindeutigen Prozessmodell.

**Frontend / Umfang:**
- Start, laufende Suche, Prüfung, Nachbearbeitung und Ende als Ablauf skizzieren; offene Punkte oben entscheiden und die verbindlichen Modusregeln berücksichtigen.
- Unterstützte Annotationstypen und bearbeitbare Felder festlegen, einschließlich vorhandener Auszeichnungen und überschneidender Treffer.
- Deutsche Status- und Fehlermeldungen sowie die Darstellung gesperrter Funktionen bestimmen. Die Bearbeitungssperre selbst und beide Sicherheitsabfragen sind verbindlich.

**Notwendige Backend-Änderungen / Vorarbeit:**
- Sempria-Vertrag für Start, nächsten Treffer, Feedback, Korrektur früheren Feedbacks, Suchende und Abbruch prüfen und dokumentieren. Fehlende Funktionen als externe Sempria-Abhängigkeiten ausweisen.
- Sitzungs-, Vorschlags- und Rückmeldestatus getrennt definieren. Beispiel: Suche läuft/beendet/gestoppt/fehlgeschlagen; Vorschlag offen/akzeptiert/verworfen; Rückmeldung ausstehend/zugestellt/fehlgeschlagen.
- Zusätzlich den aktiven Editormodus getrennt vom Suchstatus führen: `AutomaticAnnotations` bleibt nach Suchende aktiv, bis das bestätigte Beenden serverseitig abgeschlossen ist.
- Referenzen auf Briefversion und Fundstelle, Reihenfolge der Ergebnisse, Fehlerschema sowie Polling oder Push vertraglich festlegen.
- **Konkreter Ausgangspunkt:** `app/services/sempria/letter_annotation_service.rb` übermittelt derzeit Briefname/Präfix und `force`, aber keinen XML-Inhalt, Startanker oder Benutzerentscheid. Den neuen Vertrag ausdrücklich gegen diese Lücke abstimmen; keine bereits vorhandene Schritt-/Feedback-API unterstellen.
- Das vorhandene `Sempria::Support::AnnoStatusHandling` leitet Brief-/Jobabschluss aus geschlossenen Vorschlägen ab. Beim neuen Ablauf Suchende unabhängig vom Prüfabschluss definieren. Auch die Bedeutung von „akzeptiert“, „in Arbeitskopie gespeichert“ und „veröffentlicht“ sowie spätere Rücknahmen trennen.

**Akzeptanzkriterien:** Ein abgestimmter Ablauf und Beispielnachrichten für Start, Treffer, Entscheidung, Korrektur und Ende liegen vor. Parallelität und Wirkung späterer Entscheidungen sind ausdrücklich entschieden. Die Beispiele decken auch „kein Treffer“ und Sempria-Ausfall ab.

## AA-03 – Annotationssitzungen und Vorschläge bereitstellen

**Aufbau auf AA-01:** Den bereits vorhandenen Moduszustand um Annotationssitzung, Suchdaten und Vorschläge erweitern; Modus und Sperrmechanismus wiederverwenden.

**Ziel:** Der Editor kann einen nachvollziehbaren Annotationsvorgang für einen konkreten Brief verwalten.

**Frontend / Umfang:**
- Typisierte, an der API-Grenze validierte Verträge und einen briefbezogenen Sitzungszustand ergänzen.
- Sitzungsstatus, Vorschläge und ausgewählte Annotation vom bestehenden Altmodul entkoppeln.
- `AutomaticAnnotations` als expliziten Editor-Modus mit Übergängen für Start/Ende modellieren; zentrale Prüfungen für erlaubte Aktionen daraus ableiten, statt nur einzelne Buttons zu deaktivieren.

**Notwendige Backend-Änderungen:**
- Persistente Sitzung mit Briefbezug, Benutzer, Ausgangsversion, Startanker, Suchfortschritt, Status und externer Sempria-Referenz einführen oder vorhandenes Modell erweitern.
- Vorschläge mit stabiler ID, Fundstellenanker, XML/Entitätsdaten, Ausgangsversion, Prüfstatus und Herkunft speichern; Entscheidungen und Feedbackzustellung nachvollziehbar halten.
- Operationen für Start, Lesen einer Sitzung, Ermitteln der aktiven Sitzung und inkrementelles Lesen von Vorschlägen bereitstellen.
- Den Modus und seine Schreibsperre serverseitig führen und beim Lesen/Wiederöffnen zurückgeben; ein abgeschlossener Suchjob darf diese Sperre nicht selbst freigeben. Erneuter Moduseintritt zur Nachprüfung muss ohne neuen Sempria-Suchauftrag möglich sein.
- Schreibberechtigung und Sitzungseigentümer serverseitig prüfen; doppelte Starts und konkurrierende aktive Sitzungen für denselben Brief verhindern. Cookie-basierte Authentifizierung weiterverwenden.
- **Modelle/Migration:** Die vier bestehenden Annotationsmodelle und `db/structure.sql` als Ausgangsbasis verwenden. `LetterAutoAnnoLetter` besitzt nur `letter_name`, keinen direkten `Letter`-/Editor-Arbeitskopie-Fremdschlüssel. Für neue Sitzungen diese Bezüge, einen beständigen Eigentümer, Ausgangsrevision und externe Laufkennung ergänzen; Altdaten anhand des Brief-/Dateinamens zuordnen.
- Der vorhandene eindeutige Index auf `(letter_auto_anno_letter_id, xml_id)` schützt nur Snippets innerhalb eines Annotationsbriefs. Atomare Vergabe einer aktiven Sitzung und Idempotenz des Starts zusätzlich absichern. Die globale Prüfung auf irgendeinen offenen Job in `LetterAutomaticAnnotations::NewForm#no_running_job` ist keine nebenläufigkeitssichere Sperre pro Brief.
- `Jwt::JwtController` liefert die Cookie-Authentifizierung; neue Controller unter `Jwt::Editor` müssen zusätzlich Eigentum, Briefzuordnung und Schreibrechte prüfen. Auf Berührung mit dem bestehenden Rechte-Arbeitspaket F-048 achten, ohne dessen gesamten Umfang in diese Tickets zu übernehmen.

**Akzeptanzkriterien:** Wiederholter Start erzeugt keinen zweiten Lauf. Unberechtigte Zugriffe werden abgewiesen. Nach Neuladen sind Sitzung und bisherige Vorschläge wieder abrufbar. Automatisierte Vertrags- und Berechtigungstests decken diese Fälle ab.

## AA-04 – Startposition und Suchinitialisierung an den Modus anbinden

**Aufbau auf AA-01:** Den bestehenden Button und seine Sicherheitsabfrage um Startposition und Suchinitialisierung erweitern; kein zweiter Aktivierungsweg.

**Ziel:** Benutzer aktivieren `AutomaticAnnotations` über einen Button mit Sicherheitsabfrage; die Suche beginnt an einer gewählten Stelle im TEI-Body.

**Frontend / Umfang:**
- Per Linksklick gesetzten Cursor bzw. Elementanker beim Betätigen des Modus-Buttons und Öffnen der Sicherheitsabfrage erhalten.
- Sichtbaren Modus-Button ergänzen: inaktiv „Automatische Annotationen starten“, aktiv „Automatische Annotationen beenden“. Start ausschließlich nach ausdrücklicher Bestätigung; kein zusätzlicher Start über das Kontextmenü.
- Die Startabfrage nennt den betroffenen Brief und weist darauf hin, dass andere Bearbeitungen und der Briefwechsel bis zum Beenden gesperrt werden. Abbrechen, Escape und Schließen starten keine Sitzung.
- Start nur bei gültiger Position, Schreibberechtigung und geeignetem Briefstand erlauben; ungespeicherte Änderungen gemäß AA-02 behandeln.
- Bestehende Auswahl- und Dialogfunktionen berücksichtigen; Texte über i18n pflegen. Offene Bearbeitungen vor Aktivierung kontrolliert abschließen oder den Start verhindern; ihre Dialoge dürfen nach Aktivierung keine fremden Änderungen speichern.

**Notwendige Backend-Änderungen:**
- Startanker gegen die übergebene bzw. gesicherte Briefversion und den TEI-Body prüfen; veraltete oder unauflösbare Anker ablehnen.
- Inhalt vom vereinbarten Startpunkt bis zum Ende als gültiges, für Sempria geeignetes XML mit erforderlichem Kontext und Namespaces erzeugen.
- Sitzung starten und ihre Kennung samt bestätigter Briefversion zurückgeben; keinen direkten Browserzugriff auf Sempria voraussetzen.
- Moduseintritt und Schreibsperre atomar mit der Initialisierung sichern. Bei abgelehntem Start bleibt der Normalmodus erhalten; bei verloren gegangener Antwort klärt eine Statusabfrage, ob der Start bereits erfolgt ist.
- **Integration:** Die konkrete Benutzer-Arbeitskopie über `Editor::UserPinnedLetter.for_user_and_letter` auflösen. Als Eingabe `Editor::Letter#xml_content_current` verwenden, nachdem ausstehende Editoränderungen gespeichert und der Versionsbezug geprüft wurden; ein Start nur anhand des kanonischen Briefnamens würde diese Änderungen nicht berücksichtigen.
- `Jwt::Editor::PinnedLettersController#set_content`/`EditorTrackChangesService` für das Sichern vorhandener Bearbeitungen nutzen. Start als eigene schreibende API-Operation ergänzen; die bestehende Rails-HTML-Form für Namenspräfixe nicht als neuen Editorstart verwenden.

**Akzeptanzkriterien:** Buttonklick allein startet keine Sitzung; erst die Bestätigung aktiviert `AutomaticAnnotations`. Abbrechen/Escape/Schließen sendet keinen Startauftrag. Start am Anfang und mitten im Brief funktioniert, die Position bleibt trotz Fokuswechsel erhalten. Bereiche vor dem Startpunkt werden nicht zur Annotation ausgewählt. Ungültige Positionen und ungültiges XML starten keine Suche. Doppelte Bestätigung erzeugt keinen zweiten Lauf. Abgelehnte Starts lassen den Normalmodus unverändert; unklare Ergebnisse werden mit dem Server abgeglichen. Nach erfolgreicher Aktivierung sind andere Änderungen gesperrt.

## AA-05 – Schrittweise Sempria-Suche im Backend ausführen

**Ziel:** Sempria liefert fortlaufend Vorschläge, während Benutzer vorhandene Vorschläge prüfen können.

**Frontend / Umfang:** Suchaktivität, ausbleibende Treffer und technische Fehler unterscheidbar darstellen; keine unbestätigten Prozentangaben verwenden.

**Notwendige Backend-Änderungen:**
- Sempria-Adapter und asynchrone Verarbeitung für den in AA-02 vereinbarten Ablauf implementieren; lang laufende Suche vom HTTP-Request entkoppeln.
- Ergebnisse validieren, auf Brief und Sitzung abbilden und schrittweise speichern/bereitstellen.
- Feedback und Suche in eine definierte Reihenfolge bringen; veraltete bzw. durch Entscheidungen ungültig gewordene Vorschläge kennzeichnen oder neu berechnen lassen.
- Zeitüberschreitungen, begrenzte Wiederholungen, doppelte Ergebnisse und das explizite Signal „keine weiteren Treffer“ behandeln.
- **Infrastruktur:** Vorhandene Active-Job-/Delayed-Job-Konfiguration aus `config/application.rb` nutzen. Suchschritte und Feedbackaufträge persistent planen; externe HTTP-Aufrufe nicht innerhalb einer langen Datenbanktransaktion halten.
- **Adapter:** Den jetzigen Ablauf `LetterAnnotationService#check_status` → Datei lesen → `ExtractXmlContent.extract_content` für interaktive Sitzungen ersetzen. Ergebnis-IDs und Laufkennung statt bloßer Dateizeitvergleiche einsetzen. `ExtractXmlContent` dient als Referenz für Kandidatenzuordnung, nicht unverändert als inkrementeller Importer.
- `LetterAnnotationService#process!` überspringt externe Aufrufe in Test und Development. Der neue Adapter benötigt ausdrücklich steuerbare Fakes und getrennte Integrationstests; das Anlegen eines alten Jobs belegt noch keinen erfolgreichen Sempria-Aufruf.

**Akzeptanzkriterien:** Mehrere Treffer werden vor Suchende verfügbar. Die Suche verhält sich bei Feedback während eines laufenden Schritts gemäß AA-02. Wiederholte Antworten erzeugen keine Duplikate. Fehler werden nicht als erfolgreiches Suchende ausgegeben. Adaptertests verwenden vereinbarte Sempria-Beispiele.

## AA-06 – Neue Vorschläge abrufen und im Brief hervorheben

**Ziel:** Neue Auszeichnungen werden ohne manuelles Neuladen sichtbar und sind eindeutig auswählbar.

**Frontend / Umfang:**
- Inkrementellen Abruf oder Push-Anbindung integrieren; bei Unmount aufräumen und verspätete Antworten anderer Sitzungen ignorieren.
- Vorschläge im bestehenden WYSIWYG-Rendering optisch kennzeichnen; offene und bestätigte Auszeichnungen unterscheiden.
- Neue Treffer melden, ohne Cursor, Scrollposition oder laufende Formulareingaben ungefragt zu verwerfen.
- XML über Parser/DOM verarbeiten; Hervorhebungen über React erzeugen und nicht als UI-Markup im Brief speichern.

**Notwendige Backend-Änderungen:**
- Ergebnisse mit stabiler ID, Reihenfolge, Anker und Versionsbezug sowie Sitzungsstatus ausliefern; lückenlosen Wiederanschluss ermöglichen.
- Falls XML-Änderungen übertragen werden, ihre Basisversion angeben. Nicht zuordenbare Fundstellen als Konflikt melden statt an eine ähnliche Textstelle anzuhängen.
- **API/Serializer:** `Jwt::AutomaticAnnoSnippetsController#index` liefert derzeit eine vollständige, nach ID sortierte Liste; `Jwt::LetterAutoAnnoSnippets::IndexSerializer` liefert Kandidaten und finale Referenz. Für den Editor Laufkennung, Fundstellenkontext, Basisrevision, Vorschlagsrevision und Änderungsposition ergänzen. Ein Cursor nur über neue IDs würde spätere Statuskorrekturen verpassen; auch Updates müssen abrufbar sein.
- Den Datenvertrag mit dem bestehenden `key`/`data-key`-Darstellungsweg aus `PinnedLettersController#show` abstimmen. Editor-Darstellungsattribute dürfen nicht unbemerkt als Sempria- oder TEI-Fachattribute übernommen werden.

**Akzeptanzkriterien:** Jeder Treffer erscheint einmal an der richtigen Stelle. Neue Ergebnisse setzen ein geöffnetes Bearbeitungsformular nicht zurück. Ungültiges oder manipuliertes XML wird sicher zurückgewiesen. Ereignisse eines beendeten oder anderen Laufs verändern den Brief nicht.

## AA-07 – Vorschläge bearbeiten, akzeptieren und verwerfen

**Ziel:** Jede Benutzerentscheidung wirkt konsistent auf Brief, Vorschlagsstatus und Sempria-Feedback.

**Frontend / Umfang:**
- Bearbeiten, Akzeptieren und Verwerfen im Editor anbieten; bestehende Entitätssuche und geeignete Dialogbausteine wiederverwenden.
- Beim Bearbeiten die fachlich freigegebenen Felder und Entitätsverknüpfungen ändern können.
- Speichern einer Entscheidung und Zustellung an Sempria getrennt anzeigen; Doppelklicks und erneutes Absenden während laufender Requests behandeln.

**Notwendige Backend-Änderungen:**
- Eine konsistente Entscheidungsoperation bereitstellen: Vorschlag, erwartete Version, Entscheidung und ggf. korrigierte Daten entgegennehmen und validieren.
- Änderungen nur für den Eigentümer des aktiven Modus `AutomaticAnnotations` erlauben und auf die betreffende Annotation begrenzen; beliebige zusätzliche Briefänderungen im Request zurückweisen.
- Briefänderung und Prüfstatus gemeinsam absichern; die bisher getrennten Aufrufe für Entität, Gesamt-XML und Status nicht unverändert als neue Schreibkette übernehmen.
- Feedback dauerhaft zur Zustellung vormerken und mit Vorschlags-/Entscheidungskennung an Sempria senden; Wiederholungen dürfen die fachliche Wirkung nicht verdoppeln.
- Bei Ablehnung nur die betreffende vorgeschlagene Auszeichnung entfernen, nicht Brieftext oder unabhängige Auszeichnungen.
- **Bestehende Schreibpfade zusammenführen:** `AutomaticAnnoSnippetsController#set_entity` und `#set_status`, `AutomaticAnnoLettersController#set_xml_content` sowie `HandleAnnotationSnippetService` durch eine koordinierte Editor-Entscheidungsoperation ablösen. Arbeitskopie/Historie, Vorschlagsstatus und ausstehendes Feedback gemeinsam in einer DB-Transaktion sichern; Zustellung erst danach über Delayed Job.
- Bestehende Suche über `Jwt::Editor::EntitiesController#search` und `Search::JwtSearchService` nutzen. Personen-/Ortsdaten und Kandidaten lassen sich weiterverwenden; keine zweite Entitätssuche aufbauen.
- Den Statusvertrag vereinheitlichen: Das Backend kennt `CHANGED` → `closed_change`, der bisherige Frontend-Service typisiert `UPDATED`, während der Bearbeitungsdialog tatsächlich `ACCEPTED` sendet. Neue Entscheidungen müssen unveränderte Annahme und inhaltliche Korrektur eindeutig unterscheiden und vertraglich testen.

**Akzeptanzkriterien:** Alle drei Aktionen ergeben den vereinbarten Briefstand und korrektes Feedback. Ein Sempria-Ausfall verliert keine gespeicherte Entscheidung und bleibt sichtbar. Wiederholung nach Verbindungsabbruch erzeugt keine doppelte Änderung. Versionskonflikte führen nicht zu Teiländerungen.

## AA-08 – Übersicht und nachträgliche Korrekturen integrieren

**Ziel:** Benutzer können alle gefundenen Auszeichnungen über eine Seitenleiste wiederfinden und später bearbeiten.

**Frontend / Umfang:**
- Übersicht mit Textkontext, Typ, Prüfstatus und ggf. ausstehender Rückmeldung bereitstellen; Auswahl springt zur Fundstelle.
- Offene, akzeptierte, bearbeitete und verworfene Vorschläge nachvollziehbar anzeigen; Filter und Zähler vorsehen.
- Entscheidungen erneut öffnen und gemäß AA-02 korrigieren können, auch nach Suchende und erneutem Öffnen des Briefes.
- Nach Modusende bleibt die Übersicht lesbar. Zum Ändern vorhandener Entscheidungen zunächst über denselben Modus-Button mit Sicherheitsabfrage wieder in `AutomaticAnnotations` wechseln; dabei keine neue Suche ungefragt starten.

**Notwendige Backend-Änderungen:**
- Briefbezogenen Zugriff auf bisherige Sitzungen und Vorschläge bereitstellen, bei Bedarf mit Pagination und Statusfiltern.
- Revidierte Entscheidungen versionieren und als Korrektur des früheren Feedbacks an Sempria übertragen.
- Aktuelle Fundstellen prüfen; nach späteren Briefänderungen nicht mehr eindeutig zuordenbare Vorschläge als Konflikt kennzeichnen.
- **Datenmodell:** `reference_key_final`/`reference_type_final` am `LetterAutoAnnoSnippet` speichern nur den aktuellen Endstand. Eine eigene Entscheidungshistorie mit Revision, Benutzer, Zeitpunkt und Feedbackbezug ergänzen; `Editor::LetterChange` allein genügt nicht, weil Reset, Rebase und Publish die Editorhistorie verändern/löschen.
- `open_no_recommendation` in Listen, Filtern und offenen Zählern berücksichtigen; `LetterAutoAnnoLetters::ShowSerializer#snippets_open` zählt derzeit nur `open`. Die finale Anzeige aus den bestehenden Serializern lässt sich weiterverwenden, die aggregierten Statusregeln müssen angepasst werden.

**Akzeptanzkriterien:** Bereits geprüfte Vorschläge bleiben auffindbar. Eine nachträgliche Änderung aktualisiert Brief, Übersicht und Feedback konsistent. Nicht mehr vorhandene Fundstellen werden verständlich angezeigt und führen nicht zu Änderungen an anderen Stellen.

## AA-09 – Briefstand, Speicherung und konkurrierende Änderungen absichern

**Aufbau auf AA-01:** Die bereits durchgesetzten Modussperren um die erlaubten Annotations-Schreibpfade und deren Versions-/Historienkonsistenz erweitern.

**Ziel:** Annotationsverarbeitung und Editor verwenden einen abgestimmten Briefstand ohne verlorene Änderungen.

**Frontend / Umfang:**
- Annotationsänderungen mit Editor-State, Änderungsmarkierung und dem gezielten Speichern von Entscheidungen verbinden; allgemeines Speichern und Undo/Redo bleiben im Modus gesperrt.
- Bestehende Erkennung veralteter Briefe und Neuladen/Rebase mit laufenden Sitzungen abstimmen.
- Alle anderen Bearbeitungswege zentral sperren: strukturelle Änderungen, Code-/Freitextbearbeitung, Formatierung, manuelle Auszeichnungen, Metadaten, Uploads, Reset, Rebase und Veröffentlichung. Die Sperre gilt auch für Tastenkürzel, Kontextmenüs und bereits geöffnete Dialoge.

**Notwendige Backend-Änderungen:**
- Maßgeblichen Speicherstand und Übergang von Vorschlag zu dauerhaftem TEI definieren; getrennte Annotations- und Editorstände konsolidieren bzw. kontrolliert synchronisieren.
- Versionsprüfung und atomare Schreibvorgänge für betroffene Editor- und Annotationsoperationen sicherstellen; vorhandene Sperren konsistent nutzen/erweitern.
- Eine gemeinsame serverseitige Modusprüfung vor den betroffenen Schreiboperationen ergänzen, insbesondere `PinnedLettersController#set_content`, `#publish`, `#reset_letter`, `#rebase`, Unpin, `LetterChangesController#undo`/`#redo` und Figure-Uploads. Direkte Requests und weitere Clients dürfen den gesperrten Briefstand ebenfalls nicht verändern. Nur autorisierte, auf die Annotation begrenzte Entscheidungs-/Ergebnisoperationen dürfen intern den Änderungsdienst nutzen; kein vom Client frei setzbares Umgehungsflag.
- TEI validieren und fremde Attribute, Namespaces, IDs sowie bestehende manuelle Annotationen bewahren. Nur eigene temporäre Darstellungsdaten ausschließen.
- Bestehende Validierungs-, Speicher-, Veröffentlichungs- und gegebenenfalls Suchindexprozesse gezielt anbinden; Veröffentlichung ungeprüfter Vorschläge nach der Entscheidung aus AA-02 behandeln.
- **Arbeitskopie/Historie:** `EditorTrackChangesService`, `Editor::LetterChange` und `Editor::LetterChangeDetail` integrieren; nötige Annotations-Änderungstypen ergänzen. Neue Revisionsprüfung unter einer gemeinsamen Schreibsperre für Entscheidungen, `set_content` und Hintergrundänderungen vorsehen. Die vorhandene `stale?`-Prüfung vergleicht nur kanonischen Brief und Basisstand, nicht zwei konkurrierende Bearbeitungen derselben Arbeitskopie.
- **Publish/Datei:** `EditorPublishLetterService` mit `Letter#lock!`, `Letter.publish!` und HTTP-409-Konfliktbehandlung beibehalten. Nicht bei jeder Entscheidung den alten `sempria-`-Dateiexport auslösen. `LetterStorage::AtomicWriteService` stellt atomaren Austausch und strikte XML-Prüfung bereit, aber allein weder vollständige TEI-Fachvalidierung noch dauerhafte Versionierung; hierfür den bestehenden Publish-/Sicherungspfad nutzen und die Fehlerfälle testen.
- **Undo/Reset/Rebase:** `LetterUndoRedoService`, `EditorResetLetterService`, `EditorRebaseLetterService` und `EditorPinnedLetterService` einbeziehen. Diese allgemeinen Aktionen sind im aktiven Modus gesperrt. Auch nach Modusende darf ein Rückgängigmachen einer bestätigten Annotation XML und Sempria nicht auseinanderlaufen lassen: als neue Entscheidung samt Feedback behandeln oder für diese Änderung sperren. Unpin/Rebase darf die unabhängige Annotationshistorie nicht löschen.

**Akzeptanzkriterien:** Während `AutomaticAnnotations` sind sämtliche anderen Änderungen sowohl über Oberfläche/Tastatur als auch über direkte API-Aufrufe und weitere Clients gesperrt. Annotationsentscheidungen funktionieren weiterhin über ihren begrenzten Schreibpfad. Ein alter Gesamt-XML-Stand überschreibt keine neuere Entscheidung. Ungültiges TEI hinterlässt weder einen geänderten Brief noch einen irreführenden Prüfstatus. XML-Roundtrip-, Modussperr- und Konflikttests sichern diese Fälle ab.

## AA-10 – Suchabbruch und Wiederherstellung an den Modus anbinden

**Aufbau auf AA-01:** Das vorhandene bestätigte Modusende und die Wiederherstellung mit laufenden Suchjobs, Vorschlägen und Feedback koordinieren. Button, Sicherheitsabfrage und Navigationssperre bestehen bereits.

**Ziel:** Der aktive Modus hält den Benutzer beim aktuellen Brief und lässt sich verlässlich beenden.

**Frontend / Umfang:**
- Briefwechsel über Tabs, Suche, Favoriten, interne Links und Routennavigation während des Modus verhindern; Schließen des aktiven Brieftabs entsprechend behandeln.
- Beenden über denselben Modus-Button wie beim Start: Sicherheitsabfrage öffnen und erst nach Bestätigung den Stopp-/Endauftrag senden. Die Abfrage erklärt, dass die Suche gestoppt wird und gespeicherte Entscheidungen erhalten bleiben. Noch nicht gespeicherte Annotationsbearbeitungen müssen vor Abschluss kontrolliert behandelt werden.
- Abbrechen, Escape oder Schließen der Abfrage lässt `AutomaticAnnotations` unverändert aktiv. Nach Suchende „Suche abgeschlossen“ anzeigen; der Modus und seine Bearbeitungssperre bleiben bis zum bestätigten Beenden bestehen.
- Nach bestätigtem Ende Navigation und reguläre Bearbeitung freigeben; offene Vorschläge gemäß AA-02 erhalten.
- Neuladen, Verbindungsabbruch, Sitzungsablauf und Logout behandeln. Beim Wiederöffnen den Serverstatus abfragen; einen Browserabbruch nicht als zuverlässig zugestellten Stopp betrachten.

**Notwendige Backend-Änderungen:**
- Idempotente Stopp-/Modusendeoperation, definierte Endzustände und atomare Freigabe der zugehörigen Sperren implementieren. Auch nach bereits abgeschlossener Suche muss diese Operation den Modus beenden können. Suchende allein gibt keine Bearbeitung frei.
- Laufende Hintergrundarbeit abbrechen bzw. begrenzen und verspätete Ergebnisse nach Stopp von weiteren Briefänderungen ausschließen.
- Verwaiste Sitzungen durch vereinbarte Ablauf-/Wiederaufnahmebedingungen behandeln; gespeicherte Entscheidungen und ausstehendes Feedback erhalten.
- **Sperren/Lebenszyklus:** `AutomaticAnnoLettersController#set_locking_user` nicht unverändert übernehmen: Es setzt/löscht derzeit einen übermittelten Benutzer, während Snippet-Schreibaktionen die Briefsperrprüfung nicht aufrufen. Erwerb, Verlängerung und Freigabe an den authentifizierten Sitzungseigentümer und eine atomare Zustandsprüfung binden. Editor-Schreiboperationen müssen dieselben Modusregeln berücksichtigen.
- `Sempria::RemoveJobAndLettersService` löscht Jobs, Annotationsbriefe und Eingangsdateien; dies ist kein geeigneter Stopp. Stattdessen Endzustand speichern und jeden verzögerten Suchjob vor Ergebnisübernahme erneut auf Laufkennung und Endzustand prüfen. Bereits gespeichertes Feedback auch nach Stopp weiter zustellen.

**Akzeptanzkriterien:** Der aktive Modus erlaubt keinen regulären Briefwechsel. Ein Klick auf den Modus-Button zeigt zunächst die Sicherheitsabfrage; Abbrechen/Escape/Schließen sendet keinen Endauftrag und hält alle Sperren aufrecht. Bestätigtes Beenden funktioniert während eines Sempria-Aufrufs und nach Suchende. Erst die serverseitig bestätigte Beendigung gibt reguläre Bearbeitung und Navigation frei; bei Fehler oder unklarem Ausgang bleiben sie bis zum Statusabgleich gesperrt. Keine Treffer beendet nur die Suche. Nach Neuladen werden Modus und Sperre wiederhergestellt, ohne einen zweiten Lauf zu starten; ein abgebrochener Browser hinterlässt keine dauerhafte Sperre.

## AA-11 – Bestehendes Annotationssystem ablösen

**Ziel:** Nach der Umstellung gibt es einen verbindlichen Annotationsworkflow in der Editoransicht.

**Frontend / Umfang:**
- Alten Navigationseinstieg und separate Ansichten nach erfolgreicher Abnahme außer Betrieb nehmen; die Entfernung ungenutzter Implementierung erfolgt ausdrücklich in AA-13.
- Bestehende Links auf sinnvolle neue Ziele umleiten bzw. einen verständlichen Hinweis anzeigen.
- Wiederverwendete Entitätssuche und Dialoge für die Codebereinigung in AA-13 erfassen; Hilfetexte zum neuen Ablauf aktualisieren.

**Notwendige Backend-Änderungen:**
- Alte Jobs, Annotationsbriefe, XML-Zwischenstände, Entscheidungen und Sperren inventarisieren; die in AA-02 gewählte Übernahme-/Archivierungsregel implementieren.
- Alte Datensätze eindeutig den Editorbriefen zuordnen. Fehlende Zuordnungen separat ausweisen und nicht stillschweigend verwerfen.
- Bisherige Routen unter `/jwt/automatic_annotations` und `/jwt/automatic_annotation_letters` samt Schreib-/Reset-Aktionen kontrolliert stilllegen, sobald alle Verbraucher umgestellt sind.
- Umschaltung und Rückfallverfahren vorbereiten; neue Entscheidungen bei einem Rückfall sichern. Keine parallelen, unkoordinierten Schreibwege zulassen.
- **Zusätzliche Alt-Einstiege:** Auch Rails-HTML-Routen unter `letter_automatic_annotations`, zugehörige Form/Views und `app/assets/javascripts/lib/letter_automatic_annotations/check_status.coffee` in die Ablösung aufnehmen. Sonst könnte das Redaktionssystem weiterhin alte Batch-Aufträge erzeugen.
- **Dateibestand:** Neben den vier Annotations-Tabellen die Eingänge in `MetaMw::Sempria::ANNOTATION_PATH` und Ausgaben mit `LETTER_FILE_PREFIX = 'sempria-'` erfassen. `Sempria::RevertLettersService` liest/bearbeitet diese Präfixdateien; dessen weiteren Bedarf ausdrücklich entscheiden. Datenbankmigration allein erfasst den bisherigen Workflow nicht vollständig.
- **Gemeinsam verwendeter Code:** `Search::JwtSearchService` verwendet Serializer unter `Jwt::LetterAutoAnnoSnippets` auch für die Editor-Entitätssuche. Diese vor Entfernung des Altmoduls weiterverwenden oder in einen gemeinsamen Bereich verschieben; den Namespace nicht pauschal löschen.

**Akzeptanzkriterien:** Übernommene oder archivierte Bestandsdaten sind nachprüfbar vollständig. Bestehende bestätigte Annotationen bleiben unverändert. Alte Einstiege führen nicht mehr in den bisherigen Workflow. Ein Migrationsprobelauf und eine geprüfte Rückfallbeschreibung liegen vor.

## AA-12 – Gesamtablauf und Ablösung abnehmen

**Ziel:** Die integrierte Lösung ist fachlich nutzbar und für die Ablösung des Altverfahrens abgesichert.

**Frontend / Umfang:**
- Durchgängige Tests für Start ab gewählter Position, mehrere Treffer, alle Entscheidungen, spätere Korrektur, Navigation, Stopp und Wiederöffnung ergänzen.
- Beide Sicherheitsabfragen einschließlich Abbrechen/Escape/Schließen, Doppelbestätigung und fehlgeschlagener/unklarer Requests testen. Die vollständige Sperre anderer Änderungen über Buttons, Tastenkürzel, Codeansicht, offene Dialoge und direkte API-Aufrufe nachweisen. Suchende darf den Modus nicht unbemerkt verlassen.
- Lange Briefe, viele Vorschläge, vorhandene Annotationen und verschachteltes TEI in die Abnahme aufnehmen.
- Deutsche Texte, Tastaturbedienbarkeit, Fokusverhalten und sichtbare Rückmeldung ohne reine Farbcodierung prüfen.

**Notwendige Backend-Änderungen / Qualitätssicherung:**
- Vertrags-, Integrations- und Migrationstests für Suche, Feedback, Versionierung, Berechtigungen, doppelte Requests und Abbruch bereitstellen.
- Sempria-Testadapter mit reproduzierbaren verzögerten, fehlerhaften und doppelten Antworten ergänzen; zusätzlich den vereinbarten Ablauf gegen eine Sempria-Testinstanz prüfen.
- Betriebsdiagnose für fehlgeschlagene Läufe und ausstehendes Feedback über Sitzungs-/Vorschlagskennungen bereitstellen, ohne unnötig vollständige Briefinhalte zu protokollieren.
- **Vorhandene Spec-Basis:** Controller-Specs `spec/controllers/jwt/automatic_anno_{jobs,letters,snippets}_controller_spec.rb`, `spec/services/sempria/letter_annotation_service_spec.rb` und `spec/models/letter_auto_anno_status_spec.rb` decken Teile des Altverfahrens ab. Ergänzend Editor-Tracking-, Publish-, Rebase-, Staleness- und Atomic-Write-Specs erhalten und erweitern.
- Negative Rechte-/Sperrtests mit realistisch authentifizierten Benutzern ergänzen: Die bestehenden Snippet-Controller-Specs stubben `authorized` auf `true` und belegen daher keine vollständige Zugriffskontrolle. Neue Tests müssen zusätzlich Entscheidung/Feedback, Arbeitskopieversion, Jobwiederholung und Stopp während eines Ergebniseingangs abdecken.
- Rails-Implementierungen gemäß Backend-`AGENTS.md` zunächst gezielt im Compose-Service `web` testen, anschließend vollständig mit `docker compose run -e RAILS_ENV=test web bundle exec parallel_rspec -n 16 spec/` (vorbereitete Worker-Testdatenbanken vorausgesetzt). Keine Host-Ruby-Tests als Ersatz ausweisen.

**Akzeptanzkriterien:** Fachliche Abnahme am vereinbarten Briefbestand dokumentiert. Kein stiller Verlust von Entscheidungen oder Briefänderungen in den Fehlerfällen. Gezielt betroffene Tests und TypeScript-Prüfung sind erfolgreich; erforderliche Backend-Prüfungen und der Migrationsprobelauf sind dokumentiert. Die Abschaltung des Altverfahrens erfolgt erst nach dieser Abnahme.

## AA-13 – Ungenutzten Annotationscode in Frontend und Backend entfernen

**Ziel:** Nach Ablösung des bisherigen Verfahrens verbleibt nur Annotationscode, der im neuen Ablauf oder von anderen aktiven Funktionen tatsächlich verwendet wird.

**Abhängigkeiten:** AA-01, abgeschlossene Umschaltung und Bestandsbehandlung aus AA-11 sowie Abnahme aus AA-12. Dieses Ticket entfernt Code; es ist kein Auftrag zum pauschalen Löschen historischer Daten.

**Frontend / Umfang:**
- Verwendungen der alten Annotationskomponenten, Routen, Layouts, Services, Hooks, Redux-Slices/Thunks, Typen, Schemas, XML-Helfer, Styles und i18n-Texte erfassen und die nicht mehr verwendeten Teile entfernen.
- Insbesondere `src/components/auto_anno/`, `src/services/auto_anno/`, `AutoAnnoLayout`, `useAutoAnnoLetterLock`, `auto.letter.snippet.slice`, `auto.snippet.thunks` und die bisherigen Routen in `src/App.tsx` prüfen. Gemeinsam genutzte Bausteine vor dem Löschen herauslösen und ihre Imports aktualisieren.
- Nicht mehr benötigte Altverfahrens-Tests und Mocks entfernen; weiterhin relevante Regressionstests auf die neue Implementierung übertragen. Abhängigkeiten nur entfernen, wenn kein aktiver Verbraucher verbleibt.

**Notwendige Backend-Änderungen:**
- Nachgewiesen ungenutzte `Jwt::AutomaticAnno*Controller`, Rails-HTML-Controller/-Forms/-Views, CoffeeScript-Assets, Serializer und alte Sempria-Batch-, Export-, Reset- und Sperrfunktionen entfernen. Routen, Asset-Registrierungen, Tasks, Jobs, Konfiguration und Dokumentation entsprechend bereinigen; dynamische Rails-Verwendungen zusätzlich zur Textsuche prüfen.
- Die Verwendung von `Sempria::LetterAnnotationService`, `ExtractXmlContent`, `HandleAnnotationLetterService`, `HandleAnnotationSnippetService`, `RemoveJobAndLettersService` und `RevertLettersService` einzeln nachweisen. Im neuen Ablauf weiterverwendete Services/Funktionen bleiben erhalten oder werden in einen gemeinsamen Bereich verschoben.
- Besonders `Search::JwtSearchService` und die dort verwendeten Serializer aus `Jwt::LetterAutoAnnoSnippets` schützen: Die aktive Editor-Entitätssuche muss nach der Bereinigung unverändert funktionieren.
- Alte Models nur entfernen, wenn Migration/Archivierung und laufende Verbraucher sie nicht mehr benötigen. Ein Entfernen von Tabellen, Spalten, Archivzugriffen oder Dateien benötigt die konkrete Bestandsentscheidung aus AA-11 und eine eigene nachvollziehbare Migration; Codebereinigung darf keine Entscheidungen oder Briefstände verlieren.
- Veraltete Specs/Factories/Fixtures gezielt bereinigen und weiterhin relevante XML-, Status-, Rechte- und Speicherschutztests auf die neuen Pfade übertragen. Die bestehende Delayed-Job-Infrastruktur und gemeinsam genutzte Speicher-/Publish-Dienste bleiben Bestandteil der Anwendung.

**Akzeptanzkriterien:** Eine geprüfte Liste dokumentiert entfernte und begründet weiterverwendete Bestandteile für beide Repositories. Es bestehen keine verwaisten Imports, Routen auf gelöschte Controller, Asset-Einträge oder laufenden Jobs auf entfernte Klassen. Alte Annotationsfunktionen sind nicht mehr aufrufbar; vereinbarte Weiterleitungen bleiben gültig. Der neue Modus samt Annotationsablauf sowie Editor-Entitätssuche und Veröffentlichung funktionieren auf dem bereinigten Stand. Frontend-Typecheck, betroffene Tests, Lint-Prüfung ohne zusätzliche Warnungen und Build sowie gezielte Rails-Specs und die vollständige Backend-Suite mit 16 Workern sind erfolgreich. Bestandsdaten bleiben entsprechend AA-11 erhalten.

## Technische Anknüpfungspunkte im aktuellen Frontend

- Altmodul: `src/components/auto_anno/`, `src/services/auto_anno/apiAutoAnno.service.ts`, `src/redux/slices/auto.letter.snippet.slice.ts`, `src/hooks/useAutoAnnoLetterLock.ts`, Routen in `src/App.tsx`.
- Editorintegration: `src/components/editor/letter/Center/LetterViewContainer/RightClickActionMenu.tsx`, `src/components/editor/letter/Center/LetterTabs.tsx`, `src/redux/slices/editor.letter.slice.ts`, `src/redux/thunks/editor.letter.thunk.ts`.
- Briefkonflikte: `src/components/editor/letter/LetterStalenessMonitor.tsx` und die zugehörigen Hooks.
- Vorhandene Testbasis: `tests/services/auto_anno/apiAutoAnno.service.test.ts`, `tests/components/auto_anno/snippet_form/ShowButtons.test.tsx`, `tests/hooks/useAutoAnnoLetterLock.test.ts`, Kontextmenü- und XML-Rendering-Tests unter `tests/components/editor/letter/Center/`.

## Nachweisbare Backend-Anknüpfungspunkte

Alle Backend-Pfade in den Tickets beziehen sich auf `../metamw/`. Zentrale Einstiege für die Umsetzung:

- [Routen](../../../metamw/config/routes.rb), [bisheriger Sempria-Aufruf und Dateiimport](../../../metamw/app/services/sempria/letter_annotation_service.rb), [Extraktion der Vorschläge](../../../metamw/app/services/sempria/extract_xml_content.rb).
- [Annotationsbrief-Controller](../../../metamw/app/controllers/jwt/automatic_anno_letters_controller.rb), [Snippet-Controller](../../../metamw/app/controllers/jwt/automatic_anno_snippets_controller.rb), [Entscheidungsdienst](../../../metamw/app/services/sempria/handle_annotation_snippet_service.rb), [Datenbankstruktur](../../../metamw/db/structure.sql).
- [Editor-Arbeitskopie](../../../metamw/app/models/editor/letter.rb), [Änderungsdienst](../../../metamw/app/services/editor/editor_track_changes_service.rb), [Editor-Controller](../../../metamw/app/controllers/jwt/editor/pinned_letters_controller.rb), [Publish-Dienst](../../../metamw/app/services/editor/editor_publish_letter_service.rb).
- [Alte Dateiausgabe](../../../metamw/app/services/sempria/handle_annotation_letter_service.rb), [atomarer Dateiaustausch](../../../metamw/app/services/letter_storage/atomic_write_service.rb), [Sempria-Revert](../../../metamw/app/services/sempria/revert_letters_service.rb).

**Prüfgrenze:** Der Backend-Scan und die Ticketkonkretisierung ändern keinen Rails-Code und keine Daten. Backend-Specs und Live-Sempria-Tests wurden für diese Dokumentationsarbeit nicht ausgeführt. Die genannten vorhandenen Tests wurden als Planungsgrundlage gelesen, nicht als aktuell bestandener Backend-Testlauf ausgewiesen.
