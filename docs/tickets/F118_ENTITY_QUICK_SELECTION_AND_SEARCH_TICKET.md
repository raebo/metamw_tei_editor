# F-118 – Entitäten-Schnellauswahl und vollständig erreichbare Suchtreffer

**Stand:** 06.11.2026

**Status:** Ticketvorschlag; fachliche und technische Abstimmung mit dem Backend
ausstehend.

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

### Fehlende Schnellauswahl

Beim Öffnen eines Entitätenpanels fehlen Vorschläge für Entitäten, die mit hoher
Wahrscheinlichkeit benötigt werden:

- im gesamten Datenbestand besonders häufig verwendete Entitäten;
- bereits im aktuell bearbeiteten Brief erwähnte Personen und Entitäten;
- Autor, Schreiber und Empfänger des aktuellen Briefes;
- Absende- und Empfangsort des aktuellen Briefes.

Benutzer müssen deshalb auch sehr häufige oder bereits im Briefkopf vorhandene
Entitäten erneut über die Volltextsuche finden.

## Ziel

Die Entitätenpanels erhalten eine verständliche Schnellauswahl und eine Suche,
deren vollständige Treffermenge schrittweise erreichbar bleibt.

1. Ohne Suchbegriff zeigt das Panel briefbezogene und häufig verwendete
   Vorschläge in getrennten Bereichen.
2. Nach Eingabe eines Suchbegriffs steht die reguläre Suche im Vordergrund.
3. Weitere Treffer können nachgeladen werden, bis die Ergebnismenge erschöpft
   ist.
4. Ein Klick auf einen Vorschlag verwendet denselben geprüften Auswahl- und
   Speicherpfad wie ein regulärer Suchtreffer.
5. Frontend und Backend verwenden einen verbindlichen, typisierten und in
   `docs/openapi/jwt.yaml` dokumentierten Vertrag.

## Vorgeschlagenes UI-Konzept

### Zustand ohne Suchbegriff

Lange historische Personennamen und Werktitel eignen sich besser für kompakte
Listenzeilen als für schmale Chips. Das Panel kann deshalb wie folgt aufgebaut
werden:

```text
┌──────────────────────────────────────────┐
│ Person auszeichnen                      │
│ ┌──────────────────────────────────────┐ │
│ │ Person suchen …                  🔍  │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ IN DIESEM BRIEF                          │
│  Felix Mendelssohn Bartholdy             │
│  Empfänger · erwähnt                 ＋  │
│                                          │
│  Lea Mendelssohn Bartholdy               │
│  erwähnt                             ＋  │
│                                          │
│ HÄUFIG VERWENDET                         │
│  Carl Friedrich Zelter               ＋  │
│  Fanny Hensel                         ＋  │
│  …                                       │
└──────────────────────────────────────────┘
```

- „In diesem Brief“ steht vor „Häufig verwendet“, weil der Briefkontext in der
  Regel relevanter ist als eine globale Statistik.
- Pro Listenzeile werden Primärname und optional eine kurze Herkunft angezeigt,
  beispielsweise „Schreiber“, „Empfänger“, „erwähnt“, „Absendeort“ oder
  „Empfangsort“.
- Ein Klick auf die gesamte Zeile oder die Hinzufügen-Schaltfläche wählt die
  Entität aus. Die Zeile muss vollständig per Tastatur erreichbar sein.
- Bereits für die aktuelle Auszeichnung hinzugefügte Schlüssel werden wie bisher
  ausgefiltert oder sichtbar deaktiviert.
- Identische Entitäten erscheinen nur einmal. Mehrere Gründe werden gemeinsam
  angezeigt, beispielsweise „Empfänger · erwähnt“.
- Bei mehr als zehn briefbezogenen Vorschlägen kann der Bereich zunächst
  eingeklappt werden; die fachliche Reihenfolge darf nicht von der globalen
  Häufigkeit überschrieben werden.

### Zustand mit Suchbegriff

Sobald ein Benutzer Text eingibt, werden die beiden Vorschlagsbereiche durch die
Suchergebnisse ersetzt oder nach unten verschoben. Empfohlen wird die klarere
Variante „ersetzen“:

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

### Leere und fehlerhafte Zustände

- Keine Eingabe und keine Vorschläge: verständlicher Leerzustand, Suchfeld bleibt
  nutzbar.
- Suchbegriff ohne Treffer: „Keine passenden Entitäten gefunden“ und Möglichkeit,
  den Suchbegriff zu ändern beziehungsweise den vorhandenen Neuanlageprozess zu
  verwenden.
- Vorschlagsendpunkt nicht erreichbar: reguläre Suche bleibt nutzbar.
- Suchendpunkt nicht erreichbar: technische Fehlermeldung; der Fehler darf nicht
  als leere Trefferliste ausgegeben werden.

## Fachliche Vorschlagsquellen

### Personen

Der briefbezogene Bereich berücksichtigt duplikatfrei:

- im Brieftext ausgezeichnete Personen;
- Autoren des Briefes und der Schreibakte;
- Schreiber des Briefes und der Schreibakte;
- Empfänger beziehungsweise Adressaten;
- gegebenenfalls weitere fachlich bestätigte Rollen aus dem TEI-Header.

### Orte

Der briefbezogene Bereich berücksichtigt duplikatfrei:

- Absendeort beziehungsweise Schreibort;
- Empfangsort;
- im Brieftext ausgezeichnete Orte, Sehenswürdigkeiten und Institutionen,
  jeweils passend zum aktuell ausgewählten Entitätstyp.

### Werke und weitere Entitäten

- Im aktuellen Brief bereits ausgezeichnete Werke werden vorgeschlagen.
- Die global häufigsten Einträge werden getrennt nach `CREATION` und
  `PROTAG_CREATION` berechnet.
- Für alle weiteren unterstützten Entitätstypen gilt dieselbe Vertragsstruktur,
  auch wenn `letter_context` leer ist.

## Backend-Arbeitsbereich

### F-118-BE1 – Häufig verwendete Entitäten ermitteln

- Für jeden unterstützten Entitätstyp eine Rangliste der zehn am häufigsten
  verwendeten Entitäten erzeugen.
- Die Auswertung einmal initial und danach mindestens täglich über einen
  wiederholbaren Job aktualisieren.
- Ergebnis atomar ersetzen, sodass während einer Aktualisierung keine teilweise
  gefüllte Liste ausgeliefert wird.
- Stabile Reihenfolge definieren: Verwendungshäufigkeit absteigend, danach ein
  deterministischer Tie-Breaker, beispielsweise normalisierter Name und
  Entitätsschlüssel.
- Ungültige, gelöschte oder nicht mehr auflösbare Schlüssel nicht ausliefern.
- Zeitpunkt der letzten erfolgreichen Berechnung verfügbar machen.

Vor der Umsetzung fachlich festzulegen:

- Zählt jede einzelne Auszeichnung oder höchstens eine Verwendung je Brief?
- Werden nur veröffentlichte Briefe oder auch Drafts und Arbeitskopien gezählt?
- Ist die Rangliste projektweit, benutzerbezogen oder rollenbezogen? Vorschlag:
  zunächst projektweit und nicht benutzerbezogen.

### F-118-BE2 – Briefbezogene Vorschläge ermitteln

- Die aktuelle persönliche Editor-Arbeitskopie anhand von `letter_id` und
  angemeldetem Benutzer auswerten, nicht ausschließlich den zuletzt
  veröffentlichten Brief.
- Relevante TEI-Knoten und Rollen entsprechend dem Entitätstyp sammeln.
- Entitäten über `entityKey` deduplizieren und mehrere Quellen zusammenführen.
- Nur Schlüssel ausliefern, die weiterhin über den kanonischen Entitätsbestand
  auflösbar sind.
- Fehlende Rollen oder leere Bereiche als leere Arrays und nicht als Fehler
  zurückgeben.

### F-118-BE3 – Vorschlagsendpunkt und OpenAPI

Unverbindlicher Pfadvorschlag für die gemeinsame Abstimmung:

```http
GET /jwt/editor/entities/quick_picks?letter_id=123&entity_type=PERSON&limit=10
Accept: application/json
```

Vorgeschlagene Antwort:

```json
{
  "entity_type": "PERSON",
  "generated_at": "2026-11-06T02:00:00Z",
  "letter_context": [
    {
      "id": 18613,
      "entityKey": "PSN0000001",
      "entityName": "Mendelssohn Bartholdy (bis 1816: Mendelssohn), Jacob Ludwig Felix (1809-1847)",
      "entityLastName": "Mendelssohn Bartholdy (bis 1816: Mendelssohn)",
      "entityFirstName": "Jacob Ludwig Felix",
      "sources": ["receiver", "mentioned"]
    }
  ],
  "frequently_used": [
    {
      "id": 18613,
      "entityKey": "PSN0000001",
      "entityName": "Mendelssohn Bartholdy (bis 1816: Mendelssohn), Jacob Ludwig Felix (1809-1847)",
      "entityLastName": "Mendelssohn Bartholdy (bis 1816: Mendelssohn)",
      "entityFirstName": "Jacob Ludwig Felix",
      "rank": 1,
      "usage_count": 471
    }
  ]
}
```

Nicht personenbezogene Einträge verwenden weiterhin mindestens `id`,
`entityKey` und `entityName`.

Der endgültige Pfad, erlaubte `entity_type`-Werte, Limits, Null-Semantik,
Autorisierung sowie 401-/404-/422-/500-/503-Antworten werden vor der
Frontend-Implementierung verbindlich in der Backend-Datei
`docs/openapi/jwt.yaml` dokumentiert und mit Vertragstests abgesichert.

### F-118-BE4 – Entitätssuche paginierbar machen

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

### F-118-FE1 – Typisierter Vorschlagsdienst

- Den neuen Endpunkt über einen typisierten Service anbinden.
- Antwort an der Systemgrenze validieren.
- Personenfelder und allgemeine Entitätsfelder entsprechend dem OpenAPI-Vertrag
  abbilden.
- Briefkontext und häufige Entitäten über `entityKey` deduplizieren, ohne die
  beiden sichtbaren Herkunftsgruppen unkenntlich zu machen.
- Alte Requests bei Entitätstyp- oder Briefwechsel abbrechen beziehungsweise
  veraltete Antworten ignorieren.

### F-118-FE2 – Schnellauswahl in den Panels

- Gemeinsame, wiederverwendbare Komponente für Überschrift, Ladezustand,
  Vorschlagszeile, Herkunft und Fehlerzustand erstellen.
- Zunächst mindestens Personen-, Orts- und Werkpanel anbinden.
- Ein Klick ruft denselben bestehenden Auswahlhandler auf wie ein regulärer
  Autocomplete-Treffer; kein zweiter XML-Schreibpfad wird eingeführt.
- Ohne aktive Textmarkierung bleiben Vorschläge sichtbar, aber entsprechend der
  allgemeinen Menü- und Panelkonvention deaktiviert und erklärt.
- Bereits hinzugefügte Einträge nicht erneut anbieten.
- Deutsche und englische UI-Texte über i18n pflegen.

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

## Akzeptanzkriterien

- Beim Öffnen eines unterstützten Entitätenpanels erscheinen ohne Suchbegriff
  getrennte Bereiche „In diesem Brief“ und „Häufig verwendet“.
- Die häufigen Entitäten werden mindestens täglich aktualisiert; ein fehlender
  Aktualisierungslauf verhindert die reguläre Suche nicht.
- Personen aus Autor-, Schreiber- und Empfängerrollen sowie erwähnte Personen
  werden passend zum aktuellen Brief vorgeschlagen.
- Absende- und Empfangsort werden im Ortspanel vorgeschlagen.
- Doppelte `entityKey` erscheinen innerhalb eines Bereichs nur einmal.
- Ein Klick auf einen Vorschlag verhält sich fachlich wie die Auswahl desselben
  Eintrags aus der Suche.
- Bei der Suche nach `Bartholdy` ist `PSN0000001` durch die Trefferliste und das
  Nachladen weiterer Ergebnisse erreichbar.
- Die UI macht sichtbar, wenn weitere Ergebnisse existieren; es gibt keine
  stille Begrenzung auf die ersten 20 Treffer.
- Neue Suchanfragen, Nachladen, leere Ergebnisse sowie 401, 422, 500, 503 und
  Netzwerkfehler sind in Frontend- und Backendtests abgedeckt.
- OpenAPI beschreibt Erfolgsantworten, leere Arrays, Pagination oder Cursor,
  Fehlercodes und sämtliche unterstützten Entitätstypen verbindlich.

## Rollout-Reihenfolge

1. Fachliche Entscheidungen zur Häufigkeitsberechnung und zu den
   Briefkontextrollen treffen.
2. Backendvertrag in der kanonischen OpenAPI-Datei ergänzen.
3. Backend-Suchpagination und Vorschlagsendpunkt samt Vertragstests umsetzen.
4. Backend ausrollen und die dokumentierten Antworten gemeinsam prüfen.
5. Frontendparser, UI und Tests implementieren.
6. Gemeinsame Live-Abnahme mit häufigen und seltenen Namen sowie allen
   unterstützten Entitätstypen durchführen.

## Abgrenzung

- Dieses Ticket ersetzt nicht die vorhandene Möglichkeit, neue Entitäten
  anzulegen.
- Die globale Häufigkeit ist keine automatische fachliche Empfehlung und wird
  deshalb optisch vom Briefkontext getrennt.
- Das Frontend berechnet keine eigene globale Rangliste aus lokal geladenen
  Briefen.
- Der hier beschriebene Endpunkt ist ein Vorschlag und noch kein verbindlicher
  JWT-Vertrag. Verbindlich wird ausschließlich die abgestimmte Änderung in
  `docs/openapi/jwt.yaml` des Backends.
