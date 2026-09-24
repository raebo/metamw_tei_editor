# Oxygen-Feature-Migration

## Zweck und Quelle

Dieser Backlog überführt die noch nicht abgedeckten Aktionen aus der Oxygen-Framework-Datei
`XML/fmbc_framework/framework/fmb-c.framework` in fachlich gebündelte Umsetzungstickets für den
Webeditor. Die vollständige Zuordnung steht in
`docs/audit/OXYGEN_FRAMEWORK_FEATURE_COMPARISON.csv`.

Die CSV ist die verbindliche Zuordnung zwischen Oxygen-Aktion und Ticket:

- `ticket_id` verweist auf das zuständige Ticket in diesem Dokument.
- `implemented=no` und `resolution=open` kennzeichnen einen offenen Migrationspunkt.
- Nach Implementierung und Abnahme werden beide Werte auf `implemented=yes` und
  `resolution=implemented` gesetzt.
- Wird eine Oxygen-Aktion fachlich ausdrücklich verworfen, bleibt `implemented=no` und
  `resolution` wird auf `not_required` gesetzt. Ein solcher Entscheid ist im Ticket zu begründen.
- Enthält ein Ticket sowohl umzusetzende als auch zu verwerfende Aktionen, muss es vor Abschluss
  entsprechend aufgeteilt oder jede CSV-Zeile einzeln aufgelöst werden.

## Gemeinsame Definition of Done

Ein Umsetzungsticket ist erst abgeschlossen, wenn:

1. das gewünschte Verhalten im WYSIWYG-Editor über eine erreichbare UI-Aktion verfügbar ist,
2. erzeugtes TEI-XML namespacesicher, wohlgeformt und mit dem FMB-C-Schema abgestimmt ist,
3. vorhandene Auszeichnungen bearbeitet und – soweit fachlich vorgesehen – entfernt werden können,
4. Tastaturbedienung und sichtbare deutsche/englische Texte in die bestehende i18n-Struktur
   integriert sind,
5. mindestens ein positiver und ein relevanter Fehler-/Grenzfall als Regressionstest vorliegen,
6. TypeScript, ESLint, die relevanten Tests und bei Build-Auswirkungen der Production-Build
   erfolgreich sind,
7. alle zugehörigen CSV-Zeilen aktualisiert wurden.

## Tickets

### OXY-001 – Absatz- und Abschnittsstrukturen bearbeiten

- Status: Umgesetzt und abgenommen
- Priorität: P1
- Oxygen-Aktionen: `paragraph`, `section`, `paragraph ohne Einzug hängend`,
  `paragraph zentriert`, `paragraph rechts`, `paragraph ohne Einzug`,
  `Absatz ohne Einzug eingerückt in Brieftext hinzufügen`
- Ausgangslage: Der Webeditor besitzt keine dedizierten Befehle für die verschiedenen
  FMB-C-Absatzvarianten und hierarchischen Abschnitte.
- Ziel: Absätze einfügen, teilen und in die vorgesehenen Einzugs-/Ausrichtungsvarianten umwandeln;
  zulässige Abschnittsebenen kontextabhängig anlegen.
- Akzeptanzkriterien: Alle genannten Varianten erzeugen die vorgesehenen `p`-/`div*`-Strukturen;
  unzulässige Einfügepositionen werden verhindert; bestehender Text bleibt erhalten.
- Tests: Einfügen, Umschließen/Teilen, Umwandeln und ungültiger Kontext.
- Umsetzungsstand: Absatzvarianten sind über Kontextmenü und Oxygen-kompatible Shortcuts
  erreichbar. Abschnitte können hierarchisch als Kind oder gleichrangig angelegt und ihre
  Überschriften bearbeitet werden. Die manuelle Abnahme wurde erfolgreich durchgeführt und die
  zugehörigen CSV-Zeilen wurden als implementiert markiert.

### OXY-002 – Listen und Listeneinträge bearbeiten

- Status: Umgesetzt und getestet
- Priorität: P2
- Oxygen-Aktionen: `item`, `ordered list`, `itemizedlist`, `sort`, `list without items`
- Ausgangslage: Dedizierte Listenbefehle aus Oxygen fehlen.
- Ziel: Nummerierte und unnummerierte TEI-Listen sowie Einträge anlegen und sortieren.
- Akzeptanzkriterien: Listen können aus Auswahl oder leer erzeugt, erweitert und nach den
  fachlich erlaubten Kriterien sortiert werden.
- Tests: Leere Liste, Auswahl in Liste umwandeln, Eintrag ergänzen und Sortierung.
- Umsetzungsstand: Nummerierte und unnummerierte TEI-Listen können über das Kontextmenü leer
  nach einem Absatz oder aus einer Textauswahl erzeugt werden. Bestehende Listen lassen sich um
  Einträge erweitern; Einträge können bearbeitet oder einzeln gelöscht und Listen vollständig
  gelöscht werden. Die direkten Einträge lassen sich anhand ihres normalisierten Textinhalts
  stabil auf- oder absteigend sortieren; Inline-Markup und bestehende XML-IDs bleiben bei der
  Umwandlung erhalten. Ein sichtbarer, fokussierbarer Caret-Anker hält auch leere Listen im
  WYSIWYG auswählbar. Für diese Oxygen-Aktionen sind keine Shortcuts dokumentiert. DOM-,
  Rendering-, Dialog- und Kontextmenütests decken alle Akzeptanzkriterien ab.

### OXY-003 – Tabellen vollständig bearbeiten

- Status: Umgesetzt und getestet
- Priorität: P2
- Oxygen-Aktionen: `insert.table`, `insert.table.row.below`, `insert.table.cell`,
  `insert.table.column.after`, `table.join.row.cells`, `table.split.left`, `table.split.right`,
  `table.join.cell.above`, `table.join.cell.below`, `table.split.below`, `table.split.above`,
  `delete.table.column`, `delete.table.row`, `sort_table`, `insert.table.row.above`,
  `insert.table.column.before`, `insert.table.columns.custom`, `insert.table.rows.custom`,
  `table.join`, `table.split`
- Ausgangslage: Die Oxygen-Tabellenoperationen haben keine gleichwertige Weboberfläche.
- Ziel: TEI-Tabellen erstellen sowie Zeilen, Spalten und Zellen einfügen, löschen, verbinden,
  teilen und sortieren.
- Akzeptanzkriterien: Jede Operation ist nur in einem gültigen Tabellenkontext verfügbar und
  bewahrt eine wohlgeformte, rechteckige Tabellenstruktur.
- Tests: Strukturänderungen einschließlich erster/letzter Zeile oder Spalte und ungültige Auswahl.
- Umsetzungsstand: TEI-Tabellen können über das Kontextmenü erstellt und strukturell bearbeitet
  werden. Zeilen und Spalten lassen sich einzeln oder in frei gewählter Anzahl einfügen und
  löschen; Zellen können horizontal beziehungsweise vertikal verbunden, richtungsabhängig
  geteilt, als Klartext bearbeitet und Tabellen nach einer gewählten Spalte sortiert werden. Auch
  eine vollständige Tabelle kann samt Inhalt über eine ausdrücklich benannte Löschaktion entfernt werden. Eine
  validierte logische Tabellenmatrix berücksichtigt `rows`-/`cols`-Spannen und verhindert
  nicht-rechteckige Ergebnisse. In der WYSIWYG-Ansicht werden TEI-`row`/`cell` als sichtbare,
  fokussierbare HTML-`tr`/`td` dargestellt; ein separater Caret-Anker macht zusätzlich jede
  Tabelle als Ganzes auswählbar. Das Tabellen-Kontextmenü gruppiert die Befehle in einer weiteren
  Ebene nach Zelle, Zeile, Spalte und gesamter Tabelle. Für diese Oxygen-Aktionen sind keine
  Shortcuts dokumentiert. Struktur-, Rendering-, Dialog- und Kontextmenütests decken die
  Operationen und Grenzfälle ab.

### OXY-004 – Bilder, grafische Elemente, Image-Maps und SVG

- Status: Umgesetzt und getestet
- Priorität: P2
- Oxygen-Aktionen: `insert image`, `edit.image.map`, `imagemap.expand.area`,
  `imagemap.collapse.area`, `Grafisches Element`, `SVG einbinden`,
  `Grafisches Inline-Element (in Textzeile)` und
  `Grafisches Inline-Element (in Textzeile) - Kopie`
- Bisheriger Teilumfang: F-110 und F-111 stellen vorhandene Figures über die geschützte
  JWT-Route dar und ermöglichen das Einfügen von JPEG-/PNG-Dateien mit Kategorie, Position,
  Überschrift und Beschreibung. Die bisherige Inline-Aktion wird durch denselben gemeinsamen
  Uploadworkflow abgedeckt. F-112 ergänzt die vergrößerte, barrierefrei bedienbare
  Bildvorschau. Die Umsetzung liegt in den Commits `af5c0e6`, `ff26412` und `09a04c7`; die
  zugehörigen Matrixzeilen sind einzeln als implementiert aufgelöst.
- Umsetzungsstand des ergänzten Teilumfangs: Das Kontextmenü und die Oxygen-Shortcuts
  `Ctrl+Shift+J` beziehungsweise `Alt+Shift+J` öffnen einen gemeinsamen Dialog für die explizite
  Blockgrafik- und Inline-Kopie-Variante. Der Dialog erzeugt die freigegebenen `figure`-,
  `graphic`-, `head`- und `figDesc`-Strukturen und validiert Grafikreferenzen. Bestehende
  SVG-Ressourcen können mit `mimeType="image/svg+xml"` referenziert werden; ihre Anzeige erfolgt
  weiterhin ausschließlich als passive `<img>`-Quelle über die geschützte JWT-Route. SVG-Upload,
  aktive SVG-Knoten und direkte Browserzugriffe auf `graphic/@url` bleiben ausgeschlossen.
  Bildkarten werden TEI-konform als `facsimile`/`surface` mit rechteckigen oder polygonalen
  `zone`-Bereichen angelegt, bearbeitet und gelöscht. Die WYSIWYG-Ansicht stellt gültige Bereiche
  als kontrolliert berechnete Overlays dar und bildet die Oxygen-Aktionen zum Ein- und Ausblenden
  lokal ab. Struktur-, Dialog-, Kontextmenü-, Shortcut-, Rendering-, URL- und XSS-Regressionstests
  decken die Akzeptanzkriterien ab; die zugehörigen CSV-Zeilen sind als implementiert markiert.

### OXY-005 – XML-IDs und TEI-Elementdokumentation

- Status: Offen
- Priorität: P3
- Oxygen-Aktionen: `id.options`, `generate.ids`, `show.TEIp5.documentation`
- Ausgangslage: Oxygen bietet ID-Konfiguration, automatische ID-Erzeugung und kontextsensitive
  TEI-Dokumentation.
- Ziel: Fachlich klären und implementieren, welche Elemente automatisch IDs erhalten und wie die
  passende TEI-Dokumentation aus der Weboberfläche geöffnet wird.
- Akzeptanzkriterien: Generierte IDs sind dokumentweit eindeutig und stabil; externe
  Dokumentationslinks werden sicher geöffnet.
- Tests: ID-Kollisionen, wiederholte Ausführung und URL-Erzeugung für Elementnamen.

### OXY-006 – Kommentararten und Anmerkungen vervollständigen

- Status: Offen
- Priorität: P1
- Oxygen-Aktionen: `Kommentar_Textk_Worterkl_Einzelst`, `Anmerkungen`,
  `Anmerkungen zur Handschrift hinzufügen`
- Ausgangslage: Kommentare sind teilweise vorhanden, decken aber FMB-Gesamtkommentar,
  Übersetzung, fremde Hand, Position/Urheber und Handschriftenanmerkungen nicht vollständig ab.
- Ziel: Den bestehenden Kommentarworkflow um alle fachlichen Varianten und Attribute erweitern.
- Akzeptanzkriterien: Kommentarart, Sprache, Verantwortlichkeit, Position und Urheber werden korrekt
  im TEI gespeichert und beim erneuten Öffnen vollständig rekonstruiert.
- Tests: Jede Kommentarart, Bearbeitung, Löschung und fehlende Pflichtangaben.

### OXY-007 – Fußnoten und Fußnotenreferenzen

- Status: Offen
- Priorität: P1
- Oxygen-Aktionen: `Fußnote`, `Fußnotenreferenz`, `Fußnote des Briefautors - old`,
  `Fußnote - neu1`, `Fußnotenreferenz - neu1`, `Fußnote des Briefautors`,
  `Fußnotenreferenz - neu2`, `Fußnote - neu2`, `Fußnote - neu3`
- Ausgangslage: Ein Shortcut und Dialogtyp sind vorbereitet, aber es gibt keine erreichbare
  Dialogimplementierung für den vollständigen Fußnotenworkflow.
- Ziel: Fußnote und Referenz gemeinsam erzeugen, eindeutig verbinden und bearbeiten.
- Akzeptanzkriterien: IDs und Targets sind eindeutig und konsistent; bestehende Fußnoten können
  bearbeitet oder entfernt werden; Legacy-Varianten werden auf ein gemeinsames Modell migriert.
- Tests: Erstellen, mehrere Fußnoten, Bearbeiten/Löschen und defekte Referenzen.

### OXY-008 – Interne und externe Querverweise

- Status: Offen
- Priorität: P1
- Oxygen-Aktionen: `Querverweise auf Registereinträge`, `Querverweise auf Briefauszeichnungen`,
  `Querverweise auf externe URLs`, `Querverweise auf interne URLs`,
  `Querverweise unspezifisch Ziel`, `Querverweise unspezifisch Start`
- Ausgangslage: Die spezialisierten Oxygen-Verweisarten fehlen im Webeditor.
- Ziel: Verweise auf Register, Briefe, Briefauszeichnungen, interne/externe Ressourcen und frei
  definierte Anker über validierte Auswahldialoge anlegen.
- Akzeptanzkriterien: Targets werden passend normalisiert, Mehrfachziele unterstützt und ungültige
  beziehungsweise unsichere URLs abgewiesen.
- Tests: Alle Zielarten, mehrere Targets, fehlendes Ziel und URL-Sicherheitsfälle.

### OXY-009 – Sprach- und typografische Sonderauszeichnungen

- Status: Offen
- Priorität: P1
- Oxygen-Aktionen: `Fremdsprachiger Text`, `Abkürzungen`, `Bruchzahlen horizontale Linie`,
  `Bruchzahlen vertikaler Slash`, `Bruchzahlen vertikal ohne Slash`, `Hochstellung`,
  `Tiefstellung`, `Unterstrich auf Grundline`, `Latintype`, `Antiqua in Drucken`,
  `Frakturschrift in Drucken`, `Gesperrte Schrift in Drucken`, `Kapitälchen in Drucken`,
  `Zeilenumbruch`, `Sonderzeichen einfügen für Mehrfachauszeichnung`,
  `Der Brief ist vollständig in lateinischen Buchstaben ...`
- Ausgangslage: Der Schnellformatierer unterstützt nur fett, kursiv und einfache Unterstreichung.
- Ziel: Die fehlenden sprachlichen und typografischen TEI-Auszeichnungen über ein konsistentes
  Formatierungsmenü bereitstellen.
- Akzeptanzkriterien: Attribute und verschachtelte Strukturen entsprechen den FMB-C-Vorgaben;
  Mehrfachauszeichnungen verändern vorhandenes Markup nicht unbeabsichtigt.
- Tests: Jede Formatklasse, verschachtelte Auswahl, Rücknahme und kollabierte Auswahl.

### OXY-010 – Rekonstruierten Briefinhalt auszeichnen

- Status: Offen
- Priorität: P1
- Oxygen-Aktionen: `Rekonstruierter Briefinhalt`
- Ausgangslage: Die spezielle Struktur für rekonstruierte Briefpassagen fehlt.
- Ziel: Rekonstruierten Text mit Nummer, Verantwortlichkeit und Lacuna-Markern einfügen.
- Akzeptanzkriterien: Die Aktion erzeugt die vollständige FMB-C-Struktur und validiert alle
  Pflichtangaben.
- Tests: Einfügen mehrerer Passagen, fehlende Angaben und Positionierung im Schreibakt.

### OXY-011 – Dateline, Schlussformel, Signatur und weitere Briefstrukturen

- Status: Offen
- Priorität: P1
- Oxygen-Aktionen: `Schlussformel in neuer Zeile  hinzufügen - unterhalb des Schreibaktes Variante 2`,
  `Closer in Zeile`, `Signatur in neuer Zeile`, `Dateline oben Variante 2`,
  `Dateline unten Variante 2`,
  `Schlussformel in neuer Zeile  hinzufügen - oberhalb des Schreibaktes Variante 2`,
  `Dateline oben`, `Dateline unten`,
  `Schlussformel in neuer Zeile  hinzufügen - unterhalb des Schreibaktes`,
  `Schlussformel in neuer Zeile  hinzufügen - oberhalb des Schreibaktes`,
  `Schlussformel unten Test`, `Schlussformel unten Test - Kopie`,
  `Schlussformel unten Test - Kopie - Kopie`,
  `Schlussformel unten Test - Kopie - Kopie - Kopie`, `Signatur innerhalb der Zeile`,
  `Dateline in Zeile`, `Salute inline`,
  `Schlussformel in neuer Zeile  hinzufügen - unterhalb des Schreibaktes - Variante 3`,
  `Motto`, `Motto unten hinzufügen`, `Überschrift hinzufügen`, `Vermerk hinzufügen`
- Ausgangslage: Begrüßungsformeln sind teilweise vorhanden; die übrigen positionsabhängigen
  Briefstrukturen und mehrere experimentelle Varianten fehlen.
- Ziel: Ein gemeinsames, kontextsensitives Strukturmenü für Dateline, Salute, Closer, Signatur,
  Motto, Überschrift und Vermerk schaffen; Test-/Kopievarianten fachlich konsolidieren.
- Akzeptanzkriterien: Position, Ausrichtung und erlaubter Elternknoten werden validiert; jede
  fachlich freigegebene Struktur kann angelegt, bearbeitet und entfernt werden.
- Tests: Oberhalb/unterhalb/inline, verschiedene Schreibakte und ungültige Positionen.

### OXY-012 – Textkritische Auszeichnungen

- Status: Offen
- Priorität: P1
- Oxygen-Aktionen: `Emendation nichtautographe Editionsvorlage`,
  `Emendation autographe Editionsvorlage durch Schreiber`,
  `Emendation nichtautographe Editionsvorlage 2`, `Unleserliche Zeichen - supplied`,
  `Unleserliche Zeichen - unclear`, `Unleserliche Zeichen - gap`, `Durchgestrichen`,
  `Einfügungen des Schreibers oder fremder Hand`, `Durchgestrichen - Kopie`,
  `Einfügungen des Schreibers - Part`, `Emendation autographe Editionsvorlage durch Editor`,
  `Einfügungen des Editors`
- Ausgangslage: Der Webeditor besitzt noch keinen vollständigen textkritischen Apparat.
- Ziel: Emendationen, Ergänzungen, Lücken, Tilgungen und Einfügungen mit Urheber, Sicherheit,
  Position und Sichtbarkeit FMB-C-konform erfassen.
- Akzeptanzkriterien: Jede Variante erzeugt das erwartete `choice`-/`sic`-/`corr`-/`supplied`-/
  `unclear`-/`gap`-/`del`-/`add`-Markup und kann verlustfrei bearbeitet werden.
- Tests: Alle Varianten, geschachteltes Markup, leere Auswahl und Attributvalidierung.

### OXY-013 – TEI-Dokumentgrundstruktur und Header-Erstellung

- Status: Offen
- Priorität: P1
- Oxygen-Aktionen: `TEI`, `Header Text Body`, `TEI Header Text Body`
- Ausgangslage: Der Headerdialog bearbeitet bestehende Strukturen, kann eine fehlende
  TEI-/Header-/Text-/Body-Grundstruktur aber nicht vollständig erzeugen.
- Ziel: Eine valide FMB-C-Dokumentgrundstruktur beim Anlegen oder Reparieren eines Briefs erzeugen.
- Akzeptanzkriterien: Namespace, Schemaangabe, `xml:id`, `xml:space` und Pflichtbereiche bleiben
  erhalten beziehungsweise werden korrekt angelegt; bestehender Inhalt wird nicht überschrieben.
- Tests: Leeres Dokument, teilweise vorhandene Struktur und bereits vollständiger Brief.

### OXY-014 – Quellenbeschreibungen vollständig verwalten

- Status: Offen
- Priorität: P1
- Oxygen-Aktionen: `Quellen hinzufügen (Quellenbeschreibung Handschrift) old`,
  `Quellenbeschreibung Druck-Part`, `Quellenbeschreibung Rekonstruktion`,
  `Quellenbeschreibung Handschrift`, `Incipit (Quellenbeschreibung Handschrift)`,
  `Quellenbeschreibung Druck`, `Quellenbeschreibung Handschrift-Part`,
  `Quellen hinzufügen (Quellenbeschreibung)`,
  `Briefbeilage hinzufügen/ersetzen in Rekonstruktion - old`,
  `Briefbeilage hinzufügen/ersetzen in Rekonstruktion`,
  `Quellen hinzufügen (Quellenbeschreibung Rekonstruktion)`
- Ausgangslage: RISM-Standorte, Provenienz und Standardbeilagen sind teilweise vorhanden; komplette
  Quellenbeschreibungen für Handschrift, Druck und Rekonstruktion fehlen.
- Ziel: Quellentypen, Incipit, bibliografische Nachweise und Rekonstruktionsbeilagen in einem
  gemeinsamen Quellenworkflow verwalten.
- Akzeptanzkriterien: Neue und bestehende `sourceDesc`-/`msDesc`-Strukturen werden korrekt
  unterschieden; mehrere Quellen bleiben adressierbar; bestehende RISM-Daten gehen nicht verloren.
- Tests: Handschrift, Druck, Rekonstruktion, zusätzliche Quelle und bestehende Teilstruktur.

### OXY-015 – Beliebige Elemente verschieben

- Status: Offen
- Priorität: P2
- Oxygen-Aktionen: `Move`, `Verschieben von Elementen`
- Ausgangslage: Aktuell können nur Schreibakte gezielt verschoben werden.
- Ziel: Fachlich zugelassene Geschwisterelemente allgemein nach oben beziehungsweise unten bewegen.
- Akzeptanzkriterien: Die Aktion berücksichtigt Schema-/Elternregeln, verhindert Bereichsüberschritte
  und aktualisiert abhängige Nummerierungen.
- Tests: Erstes/letztes Element, unzulässiger Elternwechsel und nummerierte Strukturen.

### OXY-016 – Versstrukturen bearbeiten

- Status: Offen
- Priorität: P2
- Oxygen-Aktionen: `Verse - Test`, `Verse - erste Verszeile hinzufügen`,
  `Verse - Verszeilen hinzufügen`, `Verse - Verszeilen mit Einzug hinzufügen`
- Ausgangslage: Für Versgruppen und eingerückte Verszeilen existiert keine dedizierte Oberfläche.
- Ziel: Versgruppen anlegen und weitere normale oder eingerückte Verszeilen hinzufügen.
- Akzeptanzkriterien: Erste und weitere Zeilen erzeugen konsistente `lg`-/`l`-Strukturen; die
  Testaktion wird fachlich konsolidiert.
- Tests: Neue Versgruppe, weitere Zeile, Einzug und ungültiger Kontext.

### OXY-017 – Schlagwörter im TEI-Header verwalten

- Status: Offen
- Priorität: P1
- Oxygen-Aktionen: `Schlagwort eintragen oder ersetzen (Header/profileDesc) Part 1`, `setTagsVar`,
  `Schlagwort eintragen oder ersetzen (Header/profileDesc)`,
  `Schlagwort hinzufügen (Header/profileDesc) Part 1`,
  `Schlagwort hinzufügen (Header/profileDesc)`
- Ausgangslage: Der aktuelle Headerdialog verwaltet keine FMB-C-Schlagwortliste.
- Ziel: Schlagwörter suchen, hinzufügen, ersetzen und entfernen.
- Akzeptanzkriterien: Schlüssel und Anzeige werden getrennt gespeichert, Duplikate verhindert und
  bestehende Schlagwörter vollständig geladen.
- Tests: Hinzufügen, Ersetzen, Entfernen, Duplikat und leere Suche.

### OXY-018 – Platzhalterfelder sicher ausfüllen

- Status: Offen
- Priorität: P3
- Oxygen-Aktionen: `Selection-Part1`, `Selection-Part2`, `Selection-all`,
  `Selection-all-nur-Feld`
- Ausgangslage: Oxygen enthält Hilfsaktionen zum sicheren Durchlaufen und Ersetzen markierter
  Platzhalterfelder.
- Ziel: Zunächst fachlich prüfen, ob nach den formularbasierten Webworkflows noch ein allgemeiner
  Platzhaltermodus benötigt wird; falls ja, eine zugängliche Navigation und Validierung umsetzen.
- Akzeptanzkriterien: Kein Platzhalter kann versehentlich im publizierten XML verbleiben; eine
  Nichtübernahme wird als `not_required` begründet.
- Tests: Mehrere Felder, Abbruch, leeres Pflichtfeld und Publikationsprüfung.

### OXY-019 – Oxygen-Test-, Skript- und Legacy-Hilfsaktionen bewerten

- Status: Offen
- Priorität: P3
- Oxygen-Aktionen: `setSuperResolv`, `checkOpChain`, `checkOp`, `setLetterVar`, `checkOpJS`,
  `movie1`, `movie2`, `movie3`, `char-test`
- Ausgangslage: Diese Einträge sind überwiegend technische Oxygen-Skripte oder ausdrücklich als
  Testaktionen bezeichnet und keine klaren eigenständigen Nutzerfunktionen.
- Ziel: Für jede Aktion ihre aufrufende Fachfunktion und aktuelle Relevanz dokumentieren; benötigte
  Teile einem Fachticket zuordnen, obsolete Aktionen auf `not_required` setzen.
- Akzeptanzkriterien: Jede CSV-Zeile besitzt eine begründete Einzelentscheidung; notwendige
  Funktionen wurden in ein konkretes Umsetzungsticket verschoben.
- Tests: Nur für tatsächlich übernommene Laufzeitfunktionalität erforderlich.

### OXY-020 – Schreibakte ersetzen

- Status: Offen
- Priorität: P2
- Oxygen-Aktionen: `Schreibakt ersetzen`, `Schreibakt ersetzen - part1`,
  `Schreibakt ersetzen - part2`, `Schreibakt ersetzen - part2b`,
  `Schreibakt ersetzen - part2c`
- Ausgangslage: Schreibakte können angelegt, sortiert und hinsichtlich Autor/Schreiber bearbeitet,
  aber nicht über den Oxygen-Workflow strukturell ersetzt werden.
- Ziel: Schreibakttyp beziehungsweise Schreibaktstruktur kontrolliert ersetzen, ohne Briefinhalt
  oder Referenzen zu verlieren.
- Akzeptanzkriterien: Alle fachlich zulässigen Varianten sind auswählbar; Migration ist atomar und
  erhält Inhalt, IDs und Reihenfolge.
- Tests: Jede Variante, Abbruch, bestehende Referenzen und Backendfehler.

### OXY-021 – Institutions- und Sammlungs-Makros bewerten

- Status: Offen
- Priorität: P2
- Oxygen-Aktionen: `Felix Mendelssohn Bartholdy Part`, `Felix Mendelssohn Bartholdy`,
  `*MNY++ Mendelssohn Letters`, `*MNY++ Mendelssohn Letters Part`, `Musikabteilung`,
  `Musikabteilung Part`, `Handschriftenabteilung`, `Handschriftenabteilung Part`,
  `*Music Section`, `*Music Section Part`, `Green Books`, `Green Books Part`
- Ausgangslage: Oxygen enthält fest verdrahtete Text-/Signaturmakros für Personen, Sammlungen und
  Abteilungen.
- Ziel: Fachlich entscheiden, welche Makros weiterhin benötigt werden und sie gegebenenfalls als
  konfigurierbare Vorlagen statt als fest verdrahtete Einzelbefehle implementieren.
- Akzeptanzkriterien: Jede Aktion ist einzeln als `implemented` oder `not_required` entschieden;
  übernommene Vorlagen sind zentral konfiguriert und lokalisierbar.
- Tests: Vorlagenauswahl, exakte Ausgabe und Änderung der zentralen Konfiguration.

### OXY-022 – Asynchrone Briefautoren kennzeichnen

- Status: Offen
- Priorität: P1
- Oxygen-Aktionen: `Asynchrone_Briefautoren`
- Ausgangslage: Für zusätzliche Briefautoren ohne eigenen Schreibakt fehlt die Oxygen-Auszeichnung
  `note[type="asynchronous_authors"]` mit Autorenanzahl.
- Ziel: Die Kennzeichnung in den Header-/Autorenworkflow integrieren und aus bestehenden Briefen
  wieder einlesen.
- Akzeptanzkriterien: Die Autorenanzahl wird validiert, korrekt gespeichert und bei Änderungen der
  Autoren konsistent gehalten.
- Tests: Kein, ein und mehrere asynchrone Autoren sowie bestehende Kennzeichnung.

## Pflege der Vergleichsmatrix

Bei Abschluss eines Tickets sind die zugehörigen Zeilen in
`docs/audit/OXYGEN_FRAMEWORK_FEATURE_COMPARISON.csv` gemeinsam mit der Implementierung zu ändern:

```text
implemented=yes
resolution=implemented
```

Bei einem dokumentierten Produktentscheid gegen eine Übernahme gilt stattdessen:

```text
implemented=no
resolution=not_required
```

`ticket_id` bleibt in beiden Fällen als dauerhafte Rückverfolgbarkeit erhalten.
