# Automatische Annotationen in der Editoransicht – Ticketgrundstruktur

**Stand:** 12.10.2026 · **Status:** Entwurf zur fachlichen und technischen Abstimmung

**Quelle:** [20261002_annotationen_auswertung_hartrumpf.md](20261002_annotationen_auswertung_hartrumpf.md). Das angefragte Dokument liegt im Repository unter `docs/tickets/`, nicht unter `doc/`.

**Ziel:** Automatische Annotationen direkt im geöffneten Brief starten, fortlaufend anzeigen, prüfen und nachbearbeiten. Der separate bisherige Annotationsbereich wird dadurch ersetzt. Die Kennungen `AA-01` bis `AA-11` sind vorläufige Planungskennungen, keine bereits angelegten Tracker-Tickets.

## Grundlage und Abgrenzung

Der Quelltext des Frontends wurde ergänzend geprüft. Er enthält eigene Annotationsrouten (`/automatic_annotations/...`), einen eigenen Redux-Slice und separate API-Aufrufe für Annotationsbriefe, XML, Entitäten, Status, Sperren, Zurücksetzen und Schreiben in eine Datei. Im Editor bestehen dagegen eigene Briefzustände, Tabs, XML-Bearbeitung und eine Erkennung zwischenzeitlich geänderter Briefe. Die Ablösung ist deshalb mehr als ein Verschieben der bisherigen Oberfläche.

Die Backend-Anforderungen wurden mit der Rails-Anwendung unter `../metamw/` abgeglichen (der angefragte Pfad `../metmaw/` existiert nicht). **Prüfstand: `master`, Commit `123ba465`, nach `git fetch` identisch mit `origin/master`, sauberer Arbeitsbaum.** Geprüft wurden Routen, Controller, Models, Services, Serializer, Datenbankstruktur, Job-Konfiguration und einschlägige Specs. Es handelt sich um eine statische Quellcodeanalyse; produktive Daten und der externe Sempria-Dienst wurden nicht abgefragt. Neue Routen und Datenmodelle unten bleiben Planungsvorschläge.

Nicht zum Umfang gehören die beiläufig erwähnten Matomo-Daten und Terminnotizen. Die im Quelldokument enthaltene frühere Bitte um Diagramme ist Kontext; dieses Dokument liefert die jetzt angefragte Ticketplanung.

## Ergebnis des Backend-Scans

Die Anwendung verwendet laut `.ruby-version` Ruby 2.7.7 und laut `Gemfile.lock` Rails 5.2.8.1. Active Job ist bereits auf `delayed_job` konfiguriert; für diese Funktion ist daher zunächst keine neue Queue-Infrastruktur erforderlich.

| Bereich | Im Backend vorhanden | Konsequenz für die Tickets |
| --- | --- | --- |
| Start und Ergebniseingang | `LetterAutomaticAnnotationsController` → `LetterAutomaticAnnotations::NewForm` → `Sempria::LetterAnnotationService`; Start per HTTP-GET mit Briefname/Präfix, anschließend Prüfung von XML-Dateien in `ANNOTATION_PATH` anhand ihrer Dateizeiten | Kein vorhandener interaktiver Start mit XML-Ausschnitt und Cursoranker. AA-03/AA-04 benötigen einen neuen Ablauf. Der bisherige Start ist kein eigener Annotation-Background-Job. |
| Annotationsdaten | `LetterAutoAnnoJob`, `LetterAutoAnnoLetter`, `LetterAutoAnnoSnippet`, `LetterAutoSnippetReference`; Original-/Arbeits-XML, `xml_id`, Kandidaten, finale Entität und Status | Daten und Zuordnungen wiederverwenden/migrieren. Startanker, Editor-Arbeitskopiebezug, Versionsvertrag, Feedbackzustellung und Entscheidungshistorie fehlen in diesen Tabellen. |
| Trefferextraktion | `Sempria::ExtractXmlContent` liest `persName`/`placeName` mit `producer`; Kandidaten für Person, Settlement, Institution und Sight; auch `open_no_recommendation` | Neue Einzelergebnisse strikt und namespace-bewusst verarbeiten. Die vier Typen und Treffer ohne Kandidaten bilden die belegte Ausgangsbasis; weitere Typen fachlich entscheiden. |
| Entscheidungen | `Jwt::AutomaticAnnoSnippetsController` und `Sempria::HandleAnnotationSnippetService` ändern Entität/Status; XML wird separat über `AutomaticAnnoLettersController#set_xml_content` geschrieben | Im geprüften Entscheidungspfad wird kein Feedback an Sempria gesendet. AA-06 benötigt eine gemeinsame Entscheidungsoperation und verlässliche Feedbackzustellung. |
| Editor-Arbeitsstand | `Editor::Letter#xml_content` als Basis, `xml_content_current` als Arbeitskopie; `Editor::UserPinnedLetter` ordnet Benutzer zu; `EditorTrackChangesService` schreibt Historie | Bestätigte Annotationen sollten in die vorhandene Arbeitskopie und Historie integriert werden, nicht in einen dritten vollständigen Briefstand. |
| Veröffentlichung | `EditorPublishLetterService` nutzt `Letter.publish!` mit Sperre auf dem Brief und Konfliktprüfung; `staleness` und `rebase` existieren bereits | Veröffentlichung bleibt eine eigene Aktion. Zusätzlicher Versionsschutz ist für gleichzeitige Änderungen derselben Arbeitskopie und Annotationsentscheidungen nötig. |
| Alte Dateiausgabe | `HandleAnnotationLetterService#write_content` schreibt atomar eine Datei mit Präfix `sempria-` und entfernt danach die Eingangsdatei aus `ANNOTATION_PATH` | Das ist nicht der Editor-Publish-Pfad. AA-10 muss neben Datenbankständen auch diese Zwischen-/Ausgabedateien und die Sempria-Revert-Funktion berücksichtigen. |
| Sperren | `locking_user_id`/`locked_at` am Annotationsbrief; `set_locking_user` übernimmt einen Benutzerparameter, bestimmte Briefaktionen prüfen die Sperre | Keine gemeinsame Editor-/Annotationssperre. Sitzungseigentümer aus dem authentifizierten Benutzer ableiten und Regeln auch für Snippet- und Editor-Schreiboperationen durchsetzen. |

**Empfohlener technischer Zuschnitt:** Sitzungen auf einen kanonischen `Letter` und die konkrete `Editor::Letter`-Arbeitskopie beziehen; Vorschläge und Feedback separat persistieren; bestätigte Änderungen über den Editor-Änderungsdienst übernehmen; Veröffentlichung über den vorhandenen Publish-Pfad. Die Sitzungshistorie darf nicht allein von einer löschbaren Arbeitskopie abhängen. Ob die vorhandenen Annotationsmodelle erweitert oder neue Sitzungsmodelle mit Bestandsübernahme eingeführt werden, wird in AA-02 entschieden. Für die erste Version bietet sich inkrementelles Polling an; ein bestehender Streaming-Vertrag für Annotationen wurde nicht gefunden.

**Externe Abhängigkeit:** Aus dem Rails-Code lässt sich nicht ableiten, ob Sempria bereits XML-Ausschnitte, einzelne Treffer, Entscheidungsfeedback und Abbruch unterstützt. Der dort implementierte Datei-/Batch-Vertrag genügt dem Zielablauf nicht. Die Abstimmung aus AA-01 ist Voraussetzung für die reale Sempria-Anbindung; ein Prototyp kann gegen einen vereinbarten Testadapter entstehen.

## Fachliche Klärungen und Arbeitsannahmen

1. **Suchablauf:** Die ersten Notizen verlangen eine Benutzerentscheidung vor dem nächsten Vorschlag. Die spätere Ablaufplanung und Zusammenfassung beschreiben eine parallel weiterlaufende Suche. Arbeitsannahme ist die spätere Variante; AA-01 muss klären, wie bereits berechnete Vorschläge auf neues Feedback reagieren.
2. **Startposition:** „Ab dem ausgewählten Markup“ wird vorläufig als Beginn des per Cursor bestimmten TEI-Elements verstanden. Ob stattdessen exakt die Zeichenposition gemeint ist, muss abgestimmt werden. Ein bloßer Ausschnitt des XML-Strings ist kein verlässlicher TEI-Teilbaum.
3. **Vorschlag oder bestätigte Annotation:** Die Darstellung im Brief soll automatisch aktualisiert werden. Offen ist, ob ungeprüfte Vorschläge bereits im gespeicherten Brief-XML stehen. Empfehlung: Vorschläge separat speichern und im Editor sichtbar darstellen; erst bestätigte Änderungen in den maßgeblichen Briefstand übernehmen.
4. **Bearbeitung während der Suche:** Die Quelle erlaubt die Bearbeitung von Vorschlägen, sagt aber erst nach Ende wieder allgemeine Bearbeitung zu. Empfehlung für die erste Version: Annotationsprüfung erlauben, sonstige strukturelle/XML-Änderungen während des Modus sperren. Ungespeicherte Änderungen vor dem Start kontrolliert sichern.
5. **Ende und Nachbearbeitung:** Suchende ist nicht gleich abgeschlossene Prüfung. Empfehlung: Offene Vorschläge bleiben nach Suchende oder manuellem Stopp erhalten und können auch nach erneutem Öffnen geprüft werden. Nachträgliches Feedback muss Sempria auch ohne laufende Suche erreichen können.
6. **Bestandsdaten:** Fachlich festlegen, ob offene alte Vorgänge übernommen, vor dem Wechsel abgeschlossen oder lesbar archiviert werden. Bereits bestätigte Briefauszeichnungen müssen erhalten bleiben.

## Ticketübersicht

| Kennung | Titel | Abhängigkeiten |
| --- | --- | --- |
| AA-01 | Ablauf, Zustände und Schnittstellen abstimmen | – |
| AA-02 | Annotationssitzungen und Vorschläge bereitstellen | AA-01 |
| AA-03 | Startposition und Aktivierung im Editor integrieren | AA-02 |
| AA-04 | Schrittweise Sempria-Suche im Backend ausführen | AA-02 |
| AA-05 | Neue Vorschläge abrufen und im Brief hervorheben | AA-03, AA-04 |
| AA-06 | Vorschläge bearbeiten, akzeptieren und verwerfen | AA-05 |
| AA-07 | Übersicht und nachträgliche Korrekturen integrieren | AA-06 |
| AA-08 | Briefstand, Speicherung und konkurrierende Änderungen absichern | AA-02; gemeinsam mit AA-05/AA-06 entwickeln |
| AA-09 | Modus beenden, Navigation sperren und Sitzungen wiederherstellen | AA-03, AA-04; mit AA-08 abstimmen |
| AA-10 | Bestehendes Annotationssystem ablösen | AA-05 bis AA-09, Bestandsentscheidung aus AA-01 |
| AA-11 | Gesamtablauf und Ablösung abnehmen | AA-03 bis AA-10 |

Alle Tickets gehören zur vollständigen Ablösung. Ein erster technischer Durchstich umfasst Start → erster Vorschlag → Entscheidung → Feedback → Stopp; er ersetzt noch nicht das bestehende System.

## AA-01 – Ablauf, Zustände und Schnittstellen abstimmen

**Ziel:** Fachabteilung, Frontend, Rails-Backend und Sempria arbeiten mit einem eindeutigen Prozessmodell.

**Frontend / Umfang:**
- Start, laufende Suche, Prüfung, Nachbearbeitung und Ende als Ablauf skizzieren; die sechs offenen Punkte oben entscheiden.
- Unterstützte Annotationstypen und bearbeitbare Felder festlegen, einschließlich vorhandener Auszeichnungen und überschneidender Treffer.
- Deutsche Status- und Fehlermeldungen sowie Verhalten von Codeansicht, Undo/Redo und allgemeiner Bearbeitung bestimmen.

**Notwendige Backend-Änderungen / Vorarbeit:**
- Sempria-Vertrag für Start, nächsten Treffer, Feedback, Korrektur früheren Feedbacks, Suchende und Abbruch prüfen und dokumentieren. Fehlende Funktionen als externe Sempria-Abhängigkeiten ausweisen.
- Sitzungs-, Vorschlags- und Rückmeldestatus getrennt definieren. Beispiel: Suche läuft/beendet/gestoppt/fehlgeschlagen; Vorschlag offen/akzeptiert/verworfen; Rückmeldung ausstehend/zugestellt/fehlgeschlagen.
- Referenzen auf Briefversion und Fundstelle, Reihenfolge der Ergebnisse, Fehlerschema sowie Polling oder Push vertraglich festlegen.
- **Konkreter Ausgangspunkt:** `app/services/sempria/letter_annotation_service.rb` übermittelt derzeit Briefname/Präfix und `force`, aber keinen XML-Inhalt, Startanker oder Benutzerentscheid. Den neuen Vertrag ausdrücklich gegen diese Lücke abstimmen; keine bereits vorhandene Schritt-/Feedback-API unterstellen.
- Das vorhandene `Sempria::Support::AnnoStatusHandling` leitet Brief-/Jobabschluss aus geschlossenen Vorschlägen ab. Beim neuen Ablauf Suchende unabhängig vom Prüfabschluss definieren. Auch die Bedeutung von „akzeptiert“, „in Arbeitskopie gespeichert“ und „veröffentlicht“ sowie spätere Rücknahmen trennen.

**Akzeptanzkriterien:** Ein abgestimmter Ablauf und Beispielnachrichten für Start, Treffer, Entscheidung, Korrektur und Ende liegen vor. Parallelität und Wirkung späterer Entscheidungen sind ausdrücklich entschieden. Die Beispiele decken auch „kein Treffer“ und Sempria-Ausfall ab.

## AA-02 – Annotationssitzungen und Vorschläge bereitstellen

**Ziel:** Der Editor kann einen nachvollziehbaren Annotationsvorgang für einen konkreten Brief verwalten.

**Frontend / Umfang:**
- Typisierte, an der API-Grenze validierte Verträge und einen briefbezogenen Sitzungszustand ergänzen.
- Sitzungsstatus, Vorschläge und ausgewählte Annotation vom bestehenden Altmodul entkoppeln.

**Notwendige Backend-Änderungen:**
- Persistente Sitzung mit Briefbezug, Benutzer, Ausgangsversion, Startanker, Suchfortschritt, Status und externer Sempria-Referenz einführen oder vorhandenes Modell erweitern.
- Vorschläge mit stabiler ID, Fundstellenanker, XML/Entitätsdaten, Ausgangsversion, Prüfstatus und Herkunft speichern; Entscheidungen und Feedbackzustellung nachvollziehbar halten.
- Operationen für Start, Lesen einer Sitzung, Ermitteln der aktiven Sitzung und inkrementelles Lesen von Vorschlägen bereitstellen.
- Schreibberechtigung und Sitzungseigentümer serverseitig prüfen; doppelte Starts und konkurrierende aktive Sitzungen für denselben Brief verhindern. Cookie-basierte Authentifizierung weiterverwenden.
- **Modelle/Migration:** Die vier bestehenden Annotationsmodelle und `db/structure.sql` als Ausgangsbasis verwenden. `LetterAutoAnnoLetter` besitzt nur `letter_name`, keinen direkten `Letter`-/Editor-Arbeitskopie-Fremdschlüssel. Für neue Sitzungen diese Bezüge, einen beständigen Eigentümer, Ausgangsrevision und externe Laufkennung ergänzen; Altdaten anhand des Brief-/Dateinamens zuordnen.
- Der vorhandene eindeutige Index auf `(letter_auto_anno_letter_id, xml_id)` schützt nur Snippets innerhalb eines Annotationsbriefs. Atomare Vergabe einer aktiven Sitzung und Idempotenz des Starts zusätzlich absichern. Die globale Prüfung auf irgendeinen offenen Job in `LetterAutomaticAnnotations::NewForm#no_running_job` ist keine nebenläufigkeitssichere Sperre pro Brief.
- `Jwt::JwtController` liefert die Cookie-Authentifizierung; neue Controller unter `Jwt::Editor` müssen zusätzlich Eigentum, Briefzuordnung und Schreibrechte prüfen. Auf Berührung mit dem bestehenden Rechte-Arbeitspaket F-048 achten, ohne dessen gesamten Umfang in diese Tickets zu übernehmen.

**Akzeptanzkriterien:** Wiederholter Start erzeugt keinen zweiten Lauf. Unberechtigte Zugriffe werden abgewiesen. Nach Neuladen sind Sitzung und bisherige Vorschläge wieder abrufbar. Automatisierte Vertrags- und Berechtigungstests decken diese Fälle ab.

## AA-03 – Startposition und Aktivierung im Editor integrieren

**Ziel:** Benutzer starten die Annotation direkt an einer gewählten Stelle im TEI-Body.

**Frontend / Umfang:**
- Per Linksklick gesetzten Cursor bzw. Elementanker für den Rechtsklick im Kontextmenü erhalten.
- Aktion „Automatische Annotationen ab hier starten“ und sichtbaren Status-/Stopp-Button ergänzen.
- Start nur bei gültiger Position, Schreibberechtigung und geeignetem Briefstand erlauben; ungespeicherte Änderungen gemäß AA-01 behandeln.
- Bestehende Auswahl-, Kontextmenü- und Dialogfunktionen berücksichtigen; Texte über i18n pflegen.

**Notwendige Backend-Änderungen:**
- Startanker gegen die übergebene bzw. gesicherte Briefversion und den TEI-Body prüfen; veraltete oder unauflösbare Anker ablehnen.
- Inhalt vom vereinbarten Startpunkt bis zum Ende als gültiges, für Sempria geeignetes XML mit erforderlichem Kontext und Namespaces erzeugen.
- Sitzung starten und ihre Kennung samt bestätigter Briefversion zurückgeben; keinen direkten Browserzugriff auf Sempria voraussetzen.
- **Integration:** Die konkrete Benutzer-Arbeitskopie über `Editor::UserPinnedLetter.for_user_and_letter` auflösen. Als Eingabe `Editor::Letter#xml_content_current` verwenden, nachdem ausstehende Editoränderungen gespeichert und der Versionsbezug geprüft wurden; ein Start nur anhand des kanonischen Briefnamens würde diese Änderungen nicht berücksichtigen.
- `Jwt::Editor::PinnedLettersController#set_content`/`EditorTrackChangesService` für das Sichern vorhandener Bearbeitungen nutzen. Start als eigene schreibende API-Operation ergänzen; die bestehende Rails-HTML-Form für Namenspräfixe nicht als neuen Editorstart verwenden.

**Akzeptanzkriterien:** Start am Anfang und mitten im Brief funktioniert. Bereiche vor dem Startpunkt werden nicht zur Annotation ausgewählt. Klicks außerhalb des Body und ungültiges XML starten keine Suche. Fehlgeschlagene Starts hinterlassen keinen aktiven UI-Modus.

## AA-04 – Schrittweise Sempria-Suche im Backend ausführen

**Ziel:** Sempria liefert fortlaufend Vorschläge, während Benutzer vorhandene Vorschläge prüfen können.

**Frontend / Umfang:** Suchaktivität, ausbleibende Treffer und technische Fehler unterscheidbar darstellen; keine unbestätigten Prozentangaben verwenden.

**Notwendige Backend-Änderungen:**
- Sempria-Adapter und asynchrone Verarbeitung für den in AA-01 vereinbarten Ablauf implementieren; lang laufende Suche vom HTTP-Request entkoppeln.
- Ergebnisse validieren, auf Brief und Sitzung abbilden und schrittweise speichern/bereitstellen.
- Feedback und Suche in eine definierte Reihenfolge bringen; veraltete bzw. durch Entscheidungen ungültig gewordene Vorschläge kennzeichnen oder neu berechnen lassen.
- Zeitüberschreitungen, begrenzte Wiederholungen, doppelte Ergebnisse und das explizite Signal „keine weiteren Treffer“ behandeln.
- **Infrastruktur:** Vorhandene Active-Job-/Delayed-Job-Konfiguration aus `config/application.rb` nutzen. Suchschritte und Feedbackaufträge persistent planen; externe HTTP-Aufrufe nicht innerhalb einer langen Datenbanktransaktion halten.
- **Adapter:** Den jetzigen Ablauf `LetterAnnotationService#check_status` → Datei lesen → `ExtractXmlContent.extract_content` für interaktive Sitzungen ersetzen. Ergebnis-IDs und Laufkennung statt bloßer Dateizeitvergleiche einsetzen. `ExtractXmlContent` dient als Referenz für Kandidatenzuordnung, nicht unverändert als inkrementeller Importer.
- `LetterAnnotationService#process!` überspringt externe Aufrufe in Test und Development. Der neue Adapter benötigt ausdrücklich steuerbare Fakes und getrennte Integrationstests; das Anlegen eines alten Jobs belegt noch keinen erfolgreichen Sempria-Aufruf.

**Akzeptanzkriterien:** Mehrere Treffer werden vor Suchende verfügbar. Die Suche verhält sich bei Feedback während eines laufenden Schritts gemäß AA-01. Wiederholte Antworten erzeugen keine Duplikate. Fehler werden nicht als erfolgreiches Suchende ausgegeben. Adaptertests verwenden vereinbarte Sempria-Beispiele.

## AA-05 – Neue Vorschläge abrufen und im Brief hervorheben

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

## AA-06 – Vorschläge bearbeiten, akzeptieren und verwerfen

**Ziel:** Jede Benutzerentscheidung wirkt konsistent auf Brief, Vorschlagsstatus und Sempria-Feedback.

**Frontend / Umfang:**
- Bearbeiten, Akzeptieren und Verwerfen im Editor anbieten; bestehende Entitätssuche und geeignete Dialogbausteine wiederverwenden.
- Beim Bearbeiten die fachlich freigegebenen Felder und Entitätsverknüpfungen ändern können.
- Speichern einer Entscheidung und Zustellung an Sempria getrennt anzeigen; Doppelklicks und erneutes Absenden während laufender Requests behandeln.

**Notwendige Backend-Änderungen:**
- Eine konsistente Entscheidungsoperation bereitstellen: Vorschlag, erwartete Version, Entscheidung und ggf. korrigierte Daten entgegennehmen und validieren.
- Briefänderung und Prüfstatus gemeinsam absichern; die bisher getrennten Aufrufe für Entität, Gesamt-XML und Status nicht unverändert als neue Schreibkette übernehmen.
- Feedback dauerhaft zur Zustellung vormerken und mit Vorschlags-/Entscheidungskennung an Sempria senden; Wiederholungen dürfen die fachliche Wirkung nicht verdoppeln.
- Bei Ablehnung nur die betreffende vorgeschlagene Auszeichnung entfernen, nicht Brieftext oder unabhängige Auszeichnungen.
- **Bestehende Schreibpfade zusammenführen:** `AutomaticAnnoSnippetsController#set_entity` und `#set_status`, `AutomaticAnnoLettersController#set_xml_content` sowie `HandleAnnotationSnippetService` durch eine koordinierte Editor-Entscheidungsoperation ablösen. Arbeitskopie/Historie, Vorschlagsstatus und ausstehendes Feedback gemeinsam in einer DB-Transaktion sichern; Zustellung erst danach über Delayed Job.
- Bestehende Suche über `Jwt::Editor::EntitiesController#search` und `Search::JwtSearchService` nutzen. Personen-/Ortsdaten und Kandidaten lassen sich weiterverwenden; keine zweite Entitätssuche aufbauen.
- Den Statusvertrag vereinheitlichen: Das Backend kennt `CHANGED` → `closed_change`, der bisherige Frontend-Service typisiert `UPDATED`, während der Bearbeitungsdialog tatsächlich `ACCEPTED` sendet. Neue Entscheidungen müssen unveränderte Annahme und inhaltliche Korrektur eindeutig unterscheiden und vertraglich testen.

**Akzeptanzkriterien:** Alle drei Aktionen ergeben den vereinbarten Briefstand und korrektes Feedback. Ein Sempria-Ausfall verliert keine gespeicherte Entscheidung und bleibt sichtbar. Wiederholung nach Verbindungsabbruch erzeugt keine doppelte Änderung. Versionskonflikte führen nicht zu Teiländerungen.

## AA-07 – Übersicht und nachträgliche Korrekturen integrieren

**Ziel:** Benutzer können alle gefundenen Auszeichnungen über eine Seitenleiste wiederfinden und später bearbeiten.

**Frontend / Umfang:**
- Übersicht mit Textkontext, Typ, Prüfstatus und ggf. ausstehender Rückmeldung bereitstellen; Auswahl springt zur Fundstelle.
- Offene, akzeptierte, bearbeitete und verworfene Vorschläge nachvollziehbar anzeigen; Filter und Zähler vorsehen.
- Entscheidungen erneut öffnen und gemäß AA-01 korrigieren können, auch nach Suchende und erneutem Öffnen des Briefes.

**Notwendige Backend-Änderungen:**
- Briefbezogenen Zugriff auf bisherige Sitzungen und Vorschläge bereitstellen, bei Bedarf mit Pagination und Statusfiltern.
- Revidierte Entscheidungen versionieren und als Korrektur des früheren Feedbacks an Sempria übertragen.
- Aktuelle Fundstellen prüfen; nach späteren Briefänderungen nicht mehr eindeutig zuordenbare Vorschläge als Konflikt kennzeichnen.
- **Datenmodell:** `reference_key_final`/`reference_type_final` am `LetterAutoAnnoSnippet` speichern nur den aktuellen Endstand. Eine eigene Entscheidungshistorie mit Revision, Benutzer, Zeitpunkt und Feedbackbezug ergänzen; `Editor::LetterChange` allein genügt nicht, weil Reset, Rebase und Publish die Editorhistorie verändern/löschen.
- `open_no_recommendation` in Listen, Filtern und offenen Zählern berücksichtigen; `LetterAutoAnnoLetters::ShowSerializer#snippets_open` zählt derzeit nur `open`. Die finale Anzeige aus den bestehenden Serializern lässt sich weiterverwenden, die aggregierten Statusregeln müssen angepasst werden.

**Akzeptanzkriterien:** Bereits geprüfte Vorschläge bleiben auffindbar. Eine nachträgliche Änderung aktualisiert Brief, Übersicht und Feedback konsistent. Nicht mehr vorhandene Fundstellen werden verständlich angezeigt und führen nicht zu Änderungen an anderen Stellen.

## AA-08 – Briefstand, Speicherung und konkurrierende Änderungen absichern

**Ziel:** Annotationsverarbeitung und Editor verwenden einen abgestimmten Briefstand ohne verlorene Änderungen.

**Frontend / Umfang:**
- Annotationsänderungen mit Editor-State, Änderungsmarkierung, Speichern und Undo/Redo gemäß AA-01 verbinden.
- Bestehende Erkennung veralteter Briefe und Neuladen/Rebase mit laufenden Sitzungen abstimmen.
- Gleichzeitige strukturelle Änderungen, Codebearbeitung, Uploads und Veröffentlichung gemäß vereinbarter Modusregeln behandeln.

**Notwendige Backend-Änderungen:**
- Maßgeblichen Speicherstand und Übergang von Vorschlag zu dauerhaftem TEI definieren; getrennte Annotations- und Editorstände konsolidieren bzw. kontrolliert synchronisieren.
- Versionsprüfung und atomare Schreibvorgänge für betroffene Editor- und Annotationsoperationen sicherstellen; vorhandene Sperren konsistent nutzen/erweitern.
- TEI validieren und fremde Attribute, Namespaces, IDs sowie bestehende manuelle Annotationen bewahren. Nur eigene temporäre Darstellungsdaten ausschließen.
- Bestehende Validierungs-, Speicher-, Veröffentlichungs- und gegebenenfalls Suchindexprozesse gezielt anbinden; Veröffentlichung ungeprüfter Vorschläge nach der Entscheidung aus AA-01 behandeln.
- **Arbeitskopie/Historie:** `EditorTrackChangesService`, `Editor::LetterChange` und `Editor::LetterChangeDetail` integrieren; nötige Annotations-Änderungstypen ergänzen. Neue Revisionsprüfung unter einer gemeinsamen Schreibsperre für Entscheidungen, `set_content` und Hintergrundänderungen vorsehen. Die vorhandene `stale?`-Prüfung vergleicht nur kanonischen Brief und Basisstand, nicht zwei konkurrierende Bearbeitungen derselben Arbeitskopie.
- **Publish/Datei:** `EditorPublishLetterService` mit `Letter#lock!`, `Letter.publish!` und HTTP-409-Konfliktbehandlung beibehalten. Nicht bei jeder Entscheidung den alten `sempria-`-Dateiexport auslösen. `LetterStorage::AtomicWriteService` stellt atomaren Austausch und strikte XML-Prüfung bereit, aber allein weder vollständige TEI-Fachvalidierung noch dauerhafte Versionierung; hierfür den bestehenden Publish-/Sicherungspfad nutzen und die Fehlerfälle testen.
- **Undo/Reset/Rebase:** `LetterUndoRedoService`, `EditorResetLetterService`, `EditorRebaseLetterService` und `EditorPinnedLetterService` einbeziehen. Ein Rückgängigmachen einer bestätigten Annotation muss entweder eine neue Entscheidung samt Feedback erzeugen oder für diese Änderung ausdrücklich gesperrt sein; XML und Sempria dürfen nicht auseinanderlaufen. Unpin/Rebase darf die unabhängige Annotationshistorie nicht löschen.

**Akzeptanzkriterien:** Gleichzeitige Änderung aus einem zweiten Client wird erkannt. Ein alter Gesamt-XML-Stand überschreibt keine neuere Entscheidung. Ungültiges TEI hinterlässt weder einen geänderten Brief noch einen irreführenden Prüfstatus. XML-Roundtrip- und Konflikttests sichern diese Fälle ab.

## AA-09 – Modus beenden, Navigation sperren und Sitzungen wiederherstellen

**Ziel:** Der aktive Modus hält den Benutzer beim aktuellen Brief und lässt sich verlässlich beenden.

**Frontend / Umfang:**
- Briefwechsel über Tabs, Suche, Favoriten, interne Links und Routennavigation während des Modus verhindern; Schließen des aktiven Brieftabs entsprechend behandeln.
- Manuelles Beenden über den Status-Button und automatisches Ende bei ausgeschöpfter Suche anzeigen.
- Nach bestätigtem Ende Navigation und reguläre Bearbeitung freigeben; offene Vorschläge gemäß AA-01 erhalten.
- Neuladen, Verbindungsabbruch, Sitzungsablauf und Logout behandeln. Beim Wiederöffnen den Serverstatus abfragen; einen Browserabbruch nicht als zuverlässig zugestellten Stopp betrachten.

**Notwendige Backend-Änderungen:**
- Idempotente Stoppoperation, definierte Endzustände und Freigabe der zugehörigen Sperren implementieren.
- Laufende Hintergrundarbeit abbrechen bzw. begrenzen und verspätete Ergebnisse nach Stopp von weiteren Briefänderungen ausschließen.
- Verwaiste Sitzungen durch vereinbarte Ablauf-/Wiederaufnahmebedingungen behandeln; gespeicherte Entscheidungen und ausstehendes Feedback erhalten.
- **Sperren/Lebenszyklus:** `AutomaticAnnoLettersController#set_locking_user` nicht unverändert übernehmen: Es setzt/löscht derzeit einen übermittelten Benutzer, während Snippet-Schreibaktionen die Briefsperrprüfung nicht aufrufen. Erwerb, Verlängerung und Freigabe an den authentifizierten Sitzungseigentümer und eine atomare Zustandsprüfung binden. Editor-Schreiboperationen müssen dieselben Modusregeln berücksichtigen.
- `Sempria::RemoveJobAndLettersService` löscht Jobs, Annotationsbriefe und Eingangsdateien; dies ist kein geeigneter Stopp. Stattdessen Endzustand speichern und jeden verzögerten Suchjob vor Ergebnisübernahme erneut auf Laufkennung und Endzustand prüfen. Bereits gespeichertes Feedback auch nach Stopp weiter zustellen.

**Akzeptanzkriterien:** Ein aktiver Lauf erlaubt keinen regulären Briefwechsel. Stopp funktioniert auch während eines laufenden Sempria-Aufrufs. Keine Treffer beendet den Modus automatisch. Nach Neuladen wird kein zweiter Lauf gestartet; ein abgebrochener Browser hinterlässt keine dauerhafte Sperre.

## AA-10 – Bestehendes Annotationssystem ablösen

**Ziel:** Nach der Umstellung gibt es einen verbindlichen Annotationsworkflow in der Editoransicht.

**Frontend / Umfang:**
- Alten Navigationseinstieg, separate Ansichten, ungenutzte Redux-Zustände und Service-Aufrufe nach erfolgreicher Abnahme entfernen.
- Bestehende Links auf sinnvolle neue Ziele umleiten bzw. einen verständlichen Hinweis anzeigen.
- Wiederverwendete Entitätssuche und Dialoge aus dem Altmodul lösen; Hilfetexte aktualisieren.

**Notwendige Backend-Änderungen:**
- Alte Jobs, Annotationsbriefe, XML-Zwischenstände, Entscheidungen und Sperren inventarisieren; die in AA-01 gewählte Übernahme-/Archivierungsregel implementieren.
- Alte Datensätze eindeutig den Editorbriefen zuordnen. Fehlende Zuordnungen separat ausweisen und nicht stillschweigend verwerfen.
- Bisherige Routen unter `/jwt/automatic_annotations` und `/jwt/automatic_annotation_letters` samt Schreib-/Reset-Aktionen kontrolliert stilllegen, sobald alle Verbraucher umgestellt sind.
- Umschaltung und Rückfallverfahren vorbereiten; neue Entscheidungen bei einem Rückfall sichern. Keine parallelen, unkoordinierten Schreibwege zulassen.
- **Zusätzliche Alt-Einstiege:** Auch Rails-HTML-Routen unter `letter_automatic_annotations`, zugehörige Form/Views und `app/assets/javascripts/lib/letter_automatic_annotations/check_status.coffee` in die Ablösung aufnehmen. Sonst könnte das Redaktionssystem weiterhin alte Batch-Aufträge erzeugen.
- **Dateibestand:** Neben den vier Annotations-Tabellen die Eingänge in `MetaMw::Sempria::ANNOTATION_PATH` und Ausgaben mit `LETTER_FILE_PREFIX = 'sempria-'` erfassen. `Sempria::RevertLettersService` liest/bearbeitet diese Präfixdateien; dessen weiteren Bedarf ausdrücklich entscheiden. Datenbankmigration allein erfasst den bisherigen Workflow nicht vollständig.
- **Gemeinsam verwendeter Code:** `Search::JwtSearchService` verwendet Serializer unter `Jwt::LetterAutoAnnoSnippets` auch für die Editor-Entitätssuche. Diese vor Entfernung des Altmoduls weiterverwenden oder in einen gemeinsamen Bereich verschieben; den Namespace nicht pauschal löschen.

**Akzeptanzkriterien:** Übernommene oder archivierte Bestandsdaten sind nachprüfbar vollständig. Bestehende bestätigte Annotationen bleiben unverändert. Alte Einstiege führen nicht mehr in den bisherigen Workflow. Ein Migrationsprobelauf und eine geprüfte Rückfallbeschreibung liegen vor.

## AA-11 – Gesamtablauf und Ablösung abnehmen

**Ziel:** Die integrierte Lösung ist fachlich nutzbar und für die Ablösung des Altverfahrens abgesichert.

**Frontend / Umfang:**
- Durchgängige Tests für Start ab gewählter Position, mehrere Treffer, alle Entscheidungen, spätere Korrektur, Navigation, Stopp und Wiederöffnung ergänzen.
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
