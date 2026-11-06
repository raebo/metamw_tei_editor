# F-118 – Entitäten-Schnellauswahl und vollständig erreichbare Suchtreffer

**Stand:** 06.11.2026

**Status:** In Umsetzung; F-118A bis F-118F technisch umgesetzt, manuelle
Abnahme der noch offenen Entitätstypen sowie Suchpagination und Backendvertrag
noch offen.

**Typ:** Feature und UX-/Suchkorrektur

**Priorität:** P2 (Vorschlag)

**Beteiligte Systeme:** Online-Editor, Rails-Backend, Elasticsearch und
kanonischer JWT-OpenAPI-Vertrag

## Ausgangslage

Für die Auszeichnung von Personen, Orten, Werken und weiteren Entitäten stellt
der Online-Editor Suchfelder in den rechten Bearbeitungspanels bereit. Die Suche
verwendet derzeit:

```http
POST /jwt/editor/entities/search?per_page=20
Content-Type: application/json

{
  "search_data": {
    "entity_type": "PERSON",
    "search_value": "Bartholdy"
  }
}
```

Das Frontend wartet 300 Millisekunden nach der Eingabe, übernimmt anschließend
die vom Backend gelieferten Treffer und führt keine eigene Filterung oder
Sortierung durch.

### Konkretes Suchproblem

Bei einer breiten Personensuche wie `Bartholdy` werden mehr passende Personen
gefunden, als in der ersten Antwort enthalten sind. Der fachlich gewünschte
Treffer „Mendelssohn Bartholdy (bis 1816: Mendelssohn), Jacob Ludwig Felix
(1809-1847)“ (`PSN0000001`) kann dadurch außerhalb der ersten 20 Ergebnisse
liegen. Da die UI weder Pagination noch eine Aktion „Weitere Treffer laden“
anbietet, kann der Benutzer diesen Treffer nicht auswählen, obwohl er im
Gesamtbestand vorhanden ist.

Eine bloße Erhöhung von `per_page` verschiebt das Problem nur und ist bei häufigen
Namen weder dauerhaft noch performant genug.

### Fehlende briefinterne Schnellauswahl

Die Entitätenpanels unterscheiden derzeit nur „Vorhandener Eintrag“ und „Neuer
Eintrag“. Bereits im aktuell bearbeiteten Brief verwendete Entitäten müssen
trotzdem erneut über die Remotesuche gefunden werden.

Der aktuelle XML-Inhalt enthält die benötigten Angaben bereits. Entscheidend ist
dabei ein vorhandener kanonischer Schlüssel: Nur Elemente mit einem nicht leeren
`data-key` können sicher wiederverwendet werden. Personen und Orte kommen sowohl
im Brieftext als auch in fachlich relevanten Bereichen des TEI-Headers vor.

## Ziel

Die Entitätenpanels erhalten drei kurze Auswahlmodi:

1. **Im Brief** – initial ausgewählt; zeigt lokal und live aus dem aktuellen XML
   ermittelte, bereits verwendete keyed Entitäten.
2. **Suche** – verwendet die bestehende Remotesuche und ermöglicht das Nachladen
   weiterer Treffer.
3. **Neu** – verwendet unverändert den vorhandenen Prozess zur Neuanlage.

Ein Klick auf einen Eintrag aus „Im Brief“ verwendet anschließend denselben
geprüften Auswahl- und Speicherpfad wie ein regulärer Suchtreffer. Für die lokale
Briefauswahl ist kein neuer Backend-Endpunkt erforderlich. Frontend und Backend
müssen nur die Erweiterung der Remotesuche verbindlich in
`docs/openapi/jwt.yaml` abstimmen.

## Vorgeschlagenes UI-Konzept

### Modus „Im Brief“

Die bisherige Auswahl zwischen „Vorhandener Eintrag“ und „Neuer Eintrag“ wird
durch eine kompakte Dreifachauswahl ersetzt. „Im Brief“ ist beim Öffnen des
Panels initial aktiv:

```text
┌──────────────────────────────────────────┐
│ Person auszeichnen                      │
│                                          │
│   ● Im Brief    ○ Suche    ○ Neu         │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │ Felix Mendelssohn Bartholdy          │ │
│ │ Empfänger · im Text erwähnt      ＋  │ │
│ ├──────────────────────────────────────┤ │
│ │ Lea Mendelssohn Bartholdy            │ │
│ │ im Text erwähnt                  ＋  │ │
│ ├──────────────────────────────────────┤ │
│ │ Carl Friedrich Zelter                │ │
│ │ Schreiber                        ＋  │ │
│ └──────────────────────────────────────┘ │
│              scrollbar                   │
└──────────────────────────────────────────┘
```

- Die Bezeichnung lautet bevorzugt „Im Brief“, weil „Brief“ allein insbesondere
  bei Briefreferenzen mehrdeutig wäre. Falls der verfügbare Platz dies nicht
  zulässt, kann sichtbar „Brief“ mit dem barrierefreien Namen „Im aktuellen
  Brief“ verwendet werden.
- Die Liste wird bei jedem Öffnen und nach Änderungen von
  `editorLetter.letter.xmlContent` neu aus dem aktuellen XML gebildet.
- Die Liste erhält eine feste Maximalhöhe und scrollt innerhalb des Panels. Das
  gesamte rechte Panel soll beim Durchsehen vieler Vorschläge nicht springen.
- Lange historische Namen werden als Listenzeilen und nicht als schmale Chips
  dargestellt.
- Ein Klick auf die gesamte Zeile oder die Hinzufügen-Schaltfläche wählt die
  Entität aus. Die Zeile muss vollständig per Tastatur erreichbar sein.
- Pro Zeile werden Anzeigename und, soweit ermittelbar, der Verwendungskontext
  angezeigt, etwa „Autor“, „Schreiber“, „Empfänger“, „im Text erwähnt“,
  „Absendeort“ oder „Empfangsort“.
- Identische `data-key` erscheinen nur einmal. Mehrere Kontexte werden gemeinsam
  angezeigt, beispielsweise „Empfänger · im Text erwähnt“.
- Bereits im aktuellen Formular hinzugefügte Schlüssel werden ausgefiltert oder
  sichtbar deaktiviert.
- Enthält der Brief keine passende keyed Entität, erscheint ein verständlicher
  Leerzustand mit der Aktion „Zur Suche“.

### Modus „Suche“

„Suche“ zeigt das bestehende Autocomplete-Suchfeld. Die Ergebnisliste wird um
eine sichtbare Fortsetzungsmöglichkeit ergänzt:

```text
┌──────────────────────────────────────────┐
│ ┌──────────────────────────────────────┐ │
│ │ Bartholdy                        ✕   │ │
│ └──────────────────────────────────────┘ │
│  20 von 47 Treffern                      │
│                                          │
│  Mendelssohn Bartholdy, Carl …       ＋  │
│  Mendelssohn Bartholdy, Fanny …      ＋  │
│  …                                       │
│                                          │
│        Weitere Treffer laden             │
└──────────────────────────────────────────┘
```

- Die UI zeigt, wenn weitere Treffer vorhanden sind. Eine stille Abschneidung
  nach 20 Einträgen ist nicht zulässig.
- „Weitere Treffer laden“ wird gegenüber einem schwer erkennbaren unendlichen
  Scrollen bevorzugt. Die Aktion ist explizit, tastaturbedienbar und leichter zu
  testen.
- Bereits geladene Treffer bleiben beim Nachladen erhalten.
- Während des Nachladens erscheint nur am Listenende ein Ladeindikator; die
  vorhandenen Treffer bleiben auswählbar.
- Ein technischer Fehler beim Nachladen entfernt die bereits geladenen Treffer
  nicht und bietet „Erneut versuchen“ an.
- Der Suchbegriff wird in den Namen weiterhin hervorgehoben.
- Optional können Schlüssel oder eine knappe Zusatzinformation sekundär
  angezeigt werden, wenn gleichnamige Treffer sonst nicht unterscheidbar sind.

### Modus „Neu“

„Neu“ zeigt unverändert die vorhandenen Eingabefelder zur Anlage einer neuen
Entität. Ein Wechsel zwischen „Im Brief“, „Suche“ und „Neu“ darf keine bereits
bestätigte Auswahl unbemerkt überschreiben.

### Leere und fehlerhafte Zustände

- Keine passende keyed Entität im Brief: verständlicher Leerzustand mit Wechsel
  zur Suche; dies ist kein technischer Fehler.
- Suchbegriff ohne Treffer: „Keine passenden Entitäten gefunden“ und Möglichkeit,
  den Suchbegriff zu ändern beziehungsweise den vorhandenen Neuanlageprozess zu
  verwenden.
- Suchendpunkt nicht erreichbar: technische Fehlermeldung; der Fehler darf nicht
  als leere Trefferliste ausgegeben werden.

## Fachliche Vorschlagsquellen

### Gemeinsame Schlüsselregel

- Ausschließlich Elemente mit einem nicht leeren, fachlich gültigen `data-key`
  werden angeboten.
- Platzhalter wie `not_yet_determined`, leere Werte oder rein temporäre
  `xml:id` sind keine wiederverwendbaren Entitätsschlüssel.
- Der Schlüssel kann abhängig von der TEI-Struktur auf dem sichtbaren Element
  oder einem fachlich zugehörigen Kind liegen, beispielsweise auf
  `persName > name`, `placeName > settlement` oder `placeName > institution`.
- Dedupliziert wird über den normalisierten `data-key`, nicht über den
  Anzeigenamen.
- Kann zu einem Schlüssel kein sinnvoller Anzeigename aus dem aktuellen XML
  ermittelt werden, wird der Eintrag nicht stillschweigend mit einem falschen
  Namen angeboten.

### Personen

Der Modus „Im Brief“ berücksichtigt duplikatfrei:

- keyed `persName`-Auszeichnungen im Brieftext;
- keyed untergeordnete `name`-Elemente innerhalb eines `persName`;
- keyed Autoren und Schreiber der Schreibakte, beispielsweise `docAuthor`;
- keyed Personen aus den fachlich relevanten Headerbereichen, insbesondere
  Autor, Schreiber, Empfänger und Adressat aus `profileDesc/correspDesc`;
- weitere Header-Personen nur nach fachlicher Bestätigung.

Projekt-, Editions- und Verantwortlichkeitsnamen ohne Entitätsschlüssel werden
nicht übernommen.

### Orte

Der Modus „Im Brief“ berücksichtigt duplikatfrei:

- keyed `placeName`-Auszeichnungen im Brieftext;
- keyed Kindknoten wie `settlement`, `institution` und die vorhandene Struktur
  für Sehenswürdigkeiten;
- Absendeort beziehungsweise Schreibort aus dem fachlich relevanten
  `correspAction`-Headerbereich;
- Empfangsort aus dem fachlich relevanten `correspAction`-Headerbereich;
- jeweils nur Einträge, die zum aktuell ausgewählten Entitätstyp passen.

Sachfremde Headerorte, insbesondere die Verlagsanschrift in
`publicationStmt/address`, werden nicht als Briefvorschläge übernommen.

### Werke und weitere Entitäten

- Im Brieftext bereits ausgezeichnete keyed Werke werden vorgeschlagen.
- `CREATION` und `PROTAG_CREATION` bleiben fachlich und technisch getrennte
  Entitätstypen.
- Letter-Metadaten wie Vorgänger- und Nachfolgerkennung werden nicht automatisch
  als Werke interpretiert.
- Die konkrete TEI-Erkennung wird je Entitätstyp im jeweiligen Unterticket
  vollständig festgelegt und mit XML-Beispielen getestet.

## Backend-Arbeitsbereich

Die briefinterne Liste wird ausschließlich im Frontend aus dem bereits geladenen
aktuellen XML erzeugt. Das Backend muss dafür weder einen Vorschlagsendpunkt noch
eine tägliche Rangliste bereitstellen. Der Backend-Arbeitsbereich beschränkt sich
auf die fortsetzbare Remotesuche.

### F-118-BE1 – Entitätssuche paginierbar machen

Der vorhandene Suchendpunkt bleibt die Grundlage. Er erhält eine dokumentierte
Fortsetzungssemantik. Zwei Varianten sind mit Elasticsearch zu prüfen:

1. **Empfehlung: Cursor beziehungsweise `next_cursor`**, insbesondere wenn eine
   stabile tiefe Pagination benötigt wird.
2. Klassische Parameter `page` und `per_page`, falls die erwarteten
   Treffermengen klein bleiben und das Backend eine stabile Sortierung garantiert.

Beispiel einer erweiterten Antwort bei klassischer Pagination:

```json
{
  "id": null,
  "first_tab": "person",
  "person": {
    "entries": []
  },
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total_entries": 47,
    "has_next_page": true
  }
}
```

Zusätzlich ist die Relevanzsortierung zu prüfen:

- Suchbegriffe normalisieren und in sinnvolle Namensbestandteile zerlegen;
- exakte Schlüssel- und Namensübereinstimmungen höher gewichten;
- Vorname, Nachname und vollständigen Anzeigenamen berücksichtigen;
- bei gleicher Relevanz deterministisch sortieren;
- der Treffer `PSN0000001` muss bei `Bartholdy` spätestens durch Nachladen
  erreichbar sein, ohne dass der Benutzer den vollständigen Namen kennen muss.

Technische Suchfehler bleiben Fehlerantworten und dürfen nicht in `[]`
umgedeutet werden.

## Frontend-Arbeitsbereich

### F-118-FE1 – Lokale XML-Extraktion

- Einen reinen, separat testbaren Extraktor für das aktuelle
  `editorLetter.letter.xmlContent` bereitstellen.
- XML mit `DOMParser` verarbeiten und Parserfehler explizit behandeln.
- Nur fachlich passende Elemente mit einem nicht leeren, gültigen `data-key`
  als normalisierte Einträge zurückgeben.
- Die Entitätstypen anhand der jeweiligen TEI-Struktur unterscheiden; ein
  gleichnamiger Knoten darf nicht typübergreifend vorgeschlagen werden.
- Duplikate anhand des normalisierten `data-key` zusammenführen und dabei ihre
  Fundstellen beziehungsweise Rollen für die Anzeige erhalten.
- Bei Briefwechseln und jeder Änderung des aktuellen XML neu auswerten. Für den
  Modus „Im Brief“ wird kein API-Request ausgelöst.
- Body- und Headerfunde, fehlende oder ungültige Schlüssel, Duplikate,
  Platzhalterwerte und fehlerhaftes XML in Unit-Tests abdecken.

### F-118-FE2 – Dreifachauswahl in den Panels

- Die bisherige Auswahl durch die drei Modi „Im Brief“, „Suche“ und „Neu“
  ersetzen; „Im Brief“ ist beim Öffnen initial aktiv.
- Eine gemeinsame, wiederverwendbare Komponente für Modusauswahl, scrollbare
  Briefsliste, Fundstellen, Leerzustand und Fehlerzustand erstellen.
- Ein Klick auf einen Briefeintrag ruft denselben bestehenden Auswahlhandler auf
  wie ein regulärer Suchtreffer; kein zweiter XML-Schreibpfad wird eingeführt.
- Ein eventuell bereits vorhandener Detailabruf der kanonischen Entität bleibt
  Teil dieses Auswahlablaufs und wird nicht durch die lokale Liste ersetzt.
- Im Leerzustand direkt einen Wechsel in den Modus „Suche“ anbieten.
- Bei einem Moduswechsel Suchbegriff, Treffer und gewählten Eintrag bewusst
  erhalten oder zurücksetzen; es darf kein zufälliger Mischzustand entstehen.
- Bereits hinzugefügte Einträge nicht erneut anbieten.
- Tastaturbedienung, Fokusführung und aussagekräftige zugängliche Bezeichnungen
  sicherstellen; sichtbare Texte über i18n pflegen.

### F-118-FE3 – Fortsetzbare Suche

- Suchschema um die dokumentierten Pagination- beziehungsweise Cursorfelder
  ergänzen.
- Neue Eingabe ersetzt Treffer und Pagination vollständig.
- „Weitere Treffer laden“ hängt Ergebnisse duplikatfrei an.
- Reihenfolge des Backends unverändert übernehmen.
- Gleichzeitige oder verspätete Requests dürfen keine Ergebnisse eines neueren
  Suchbegriffs überschreiben.
- Trefferzahl beziehungsweise Hinweis auf weitere Treffer anzeigen.
- Der Benutzer kann mit Tastatur durch Treffer navigieren und weitere Treffer
  laden.

## Vorgesehene Untertickets

F-118 bleibt das Oberfeature für gemeinsame Bedienung, Extraktionsregeln und
fortsetzbare Suche. Die konkreten TEI-Knoten, Headerbereiche und XML-Beispiele
werden pro Entitätstyp in einem eigenen Unterticket festgelegt:

- **F-118A – Personen aus dem Brief (technisch umgesetzt, Abnahme offen):**
  `persName`, keyed Kindknoten sowie relevante Autor-, Schreiber-, Empfänger-
  und Adressatenangaben im Header.
- **F-118B – Siedlungen aus dem Brief (technisch umgesetzt, Abnahme offen):**
  keyed `settlement`-Einträge im Body und in fachlich relevanten
  Korrespondenzdaten.
- **F-118C – Sehenswürdigkeiten aus dem Brief (technisch umgesetzt, Abnahme
  offen):** keyed Einträge der dafür verwendeten TEI-Struktur.
- **F-118D – Institutionen aus dem Brief (technisch umgesetzt, Abnahme offen):**
  keyed `institution`-Einträge im Body und in fachlich relevanten
  Headerbereichen.
- **F-118E – Werke aus dem Brief (umgesetzt und manuell abgenommen):** keyed
  `name`-Werkreferenzen mit `CRT…`-Schlüssel innerhalb von `title`-Auszeichnungen
  im Body; Werkart aus `name/@type`. Autoren, Briefreferenzen und
  Protagonistenwerke werden ausgeschlossen.
- **F-118F – Protagonistenwerke aus dem Brief (umgesetzt und manuell
  abgenommen):** keyed `name`-Werkreferenzen mit `PRC…`-Schlüssel innerhalb von
  `title`-Auszeichnungen im Body. Der Anzeigename wird ohne untergeordnete
  Kennungen wie `idno` ermittelt; allgemeine `CRT…`-Werke werden ausgeschlossen.
  Beim direkten Hinzufügen werden die kanonischen Werkdetails und Kategorien
  über die bestehenden, in OpenAPI 0.8.0 dokumentierten Endpunkte nachgeladen.
- **F-118G – Gemeinsame Infrastruktur und Suchpagination:** wiederverwendbare
  UI-Komponente, lokaler Extraktor, Remote-Pagination und Vertragsabgleich.

## Akzeptanzkriterien

- Beim Öffnen eines unterstützten Entitätenpanels sind die Modi „Im Brief“,
  „Suche“ und „Neu“ sichtbar; „Im Brief“ ist initial ausgewählt.
- Die Briefsliste wird live aus dem aktuell geladenen XML erzeugt und löst
  keinen eigenen Backend-Request aus.
- Es erscheinen ausschließlich fachlich passende Einträge mit einem nicht
  leeren, gültigen `data-key`.
- Personen aus dem Body sowie relevante Autor-, Schreiber-, Empfänger- und
  Adressatenangaben im Header werden vorgeschlagen.
- Orte aus dem Body sowie fachlich relevante Absende-, Schreib- und
  Empfangsorte werden vorgeschlagen; die Verlagsanschrift wird ausgeschlossen.
- Doppelte `data-key` erscheinen nur einmal; mehrere Fundstellen oder Rollen
  bleiben am zusammengeführten Eintrag nachvollziehbar.
- Änderungen am XML und ein Briefwechsel aktualisieren die Briefsliste ohne
  veraltete Einträge.
- Ein Klick auf einen Vorschlag verhält sich fachlich wie die Auswahl desselben
  Eintrags aus der Suche.
- Ohne passenden Briefeintrag wird ein verständlicher Leerzustand mit direktem
  Wechsel zur Suche angezeigt.
- Bei der Suche nach `Bartholdy` ist `PSN0000001` durch die Trefferliste und das
  Nachladen weiterer Ergebnisse erreichbar.
- Die UI macht sichtbar, wenn weitere Ergebnisse existieren; es gibt keine
  stille Begrenzung auf die ersten 20 Treffer.
- Neue Suchanfragen, Nachladen, leere Ergebnisse sowie 401, 422, 500, 503 und
  Netzwerkfehler sind in Frontend- und Backendtests abgedeckt.
- OpenAPI beschreibt für die Remotesuche Erfolgsantworten, leere Arrays,
  Pagination oder Cursor, Fehlercodes und sämtliche unterstützten Entitätstypen
  verbindlich. Die rein lokale Briefsliste benötigt keinen API-Vertrag.

## Rollout-Reihenfolge

1. Die genauen TEI-Knoten und zulässigen Headerbereiche je Entitätstyp in den
   Untertickets fachlich bestätigen.
2. Gemeinsamen lokalen XML-Extraktor implementieren und mit repräsentativen
   Briefen testen.
3. Die Dreifachauswahl schrittweise je Entitätstyp anbinden und abnehmen.
4. Den Backendvertrag für die fortsetzbare Remotesuche in der kanonischen
   OpenAPI-Datei ergänzen und Vertragstests bereitstellen.
5. Backend-Suchpagination ausrollen und die dokumentierten Antworten gemeinsam
   prüfen.
6. Frontend-Pagination anbinden und die gemeinsame Live-Abnahme mit häufigen
   und seltenen Namen sowie allen unterstützten Entitätstypen durchführen.

## Abgrenzung

- Dieses Ticket ersetzt nicht die vorhandene Möglichkeit, neue Entitäten
  anzulegen.
- Die Briefsliste ist keine globale Häufigkeits- oder Empfehlungsrangliste. Sie
  bildet ausschließlich keyed Entitäten des aktuell geladenen XML ab.
- Für die lokale Briefsliste wird kein neuer Backend-Endpunkt eingeführt.
- Die bestehende Remotesuche und das Anlegen neuer Entitäten bleiben als eigene
  Modi erhalten.
- Der OpenAPI-Abgleich dieses Features betrifft ausschließlich die geplante
  Pagination der Remotesuche. Verbindlich wird nur die abgestimmte Änderung in
  `docs/openapi/jwt.yaml` des Backends.
