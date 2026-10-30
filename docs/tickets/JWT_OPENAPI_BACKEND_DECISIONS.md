# Offene Backendentscheidungen zur JWT-OpenAPI-Angleichung

**Stand:** 30.10.2026

**Status:** Zur Prüfung und Abstimmung mit dem Backend

**Priorität:** P1/P2

**Frontend-Branch:** `feature/jwt-openapi-alignment`

**Kanonischer Vertrag:** `../metamw_edge_version/docs/openapi/jwt.yaml`, Version `0.2.0`

## Ziel

Dieses Dokument fasst die noch offenen Entscheidungen zusammen, die nicht allein im
Frontend getroffen oder umgesetzt werden können. Da der Online-Editor aktuell der einzige
bekannte Client der JWT-Endpunkte ist, können Request- und Response-Verträge abgestimmt
bereinigt werden.

Bereits geklärte Bereiche wie numerische Letter-IDs, Rename/Discard, Auth-Responses und der
Performanceumbau F-166 sind nicht Bestandteil dieser Entscheidungsvorlage.

## Übersicht

| Kennung | Thema | Art der Entscheidung | Empfehlung |
| --- | --- | --- | --- |
| JWT-201 | Favoriten | Fachliche Funktionsentscheidung | Benutzerbezogenen, idempotenten Endpunkt bereitstellen |
| JWT-202 | Pinning | API-Semantik | Zielzustand statt Toggle verwenden |
| JWT-203 | Entitätserstellung | Request-/Response-Vertrag | Einheitlicher Body und stabiler `entity_key` als String |
| JWT-204A | `set_content.xml_id` | OpenAPI-Korrektur | `null` für dokumentweite Änderungen erlauben |
| JWT-204B | Figure-Metadaten | Vertragsumfang | JPEG/PNG festschreiben; Metadaten optional lassen |

## JWT-201 – Favoriten

### Aktueller Zustand

Das Frontend versucht den Favoritenstatus über die Briefsuche zu verändern:

```text
GET /jwt/editor/letters/search?searchValue=FOOOBAR&letterId=...&isFavourite=...
```

Die Parameter `letterId` und `isFavourite` sind für diesen Endpunkt nicht dokumentiert und
werden vom Backend ignoriert. Das Frontend meldet trotzdem Erfolg. Die Funktion ist daher
aktuell nicht verlässlich nutzbar.

### Fachliche Entscheidung

- Wird eine persönliche Favoritenliste weiterhin benötigt?
- Falls nein: Favoritenansicht, Schaltfläche und Frontend-Service werden entfernt.
- Falls ja: Das Backend stellt einen expliziten benutzerbezogenen Endpunkt bereit.

### Empfehlung

Die vorhandene UI deutet auf einen gewollten Funktionsumfang hin. Daher wird ein
idempotenter, benutzerbezogener Endpunkt empfohlen:

```http
PATCH /jwt/editor/letters/{id}/favourite
Content-Type: application/json
```

```json
{
  "favourite": true
}
```

Erfolgsantwort:

```json
{
  "favourite": true
}
```

`{id}` bezeichnet die kanonische numerische Letter-ID. Der Zustand gehört zum
authentifizierten Benutzer.

### Abnahmekriterien

- Wiederholtes Senden desselben Zielzustands verändert das Ergebnis nicht.
- Der Favoritenstatus bleibt nach Neuladen und erneuter Anmeldung erhalten.
- Nicht vorhandene Briefe liefern einen dokumentierten 404-Fehler.
- 401, 403, 404 und Validierungsfehler werden in OpenAPI und Backendtests dokumentiert.
- Die Briefsuche wird nicht mehr als verdeckte Schreiboperation verwendet.

## JWT-202 – Pinning

### Aktueller Zustand

Das Frontend sendet an
`PATCH /jwt/editor/pinned_letters/{id}/pinned` einen gewünschten Bool-Wert. Das Backend
ignoriert diesen Wert derzeit und schaltet den vorhandenen Zustand lediglich um. Dadurch
kann ein wiederholter Request, beispielsweise nach einem unklaren Netzwerkergebnis, den
falschen Endzustand erzeugen.

### Entscheidung

- Legacy-Toggle ohne Request-Body beibehalten; oder
- den gewünschten Zielzustand explizit und idempotent setzen.

### Empfehlung

Der Endpunkt übernimmt einen expliziten Zielzustand:

```http
PATCH /jwt/editor/pinned_letters/{id}/pinned
Content-Type: application/json
```

```json
{
  "pinned": false
}
```

Erfolgsantwort:

```json
{
  "pinned": false,
  "message": "Pinned state updated"
}
```

`{id}` bleibt die kanonische numerische Letter-ID und ist keine ID einer persönlichen
Arbeitskopie.

### Abnahmekriterien

- Wiederholtes `true` beziehungsweise `false` führt immer zum selben Zustand.
- Parallele oder wiederholte Requests toggeln den Zustand nicht unbeabsichtigt zurück.
- Request-Body und Response sind in OpenAPI vollständig beschrieben.
- Backendtests decken beide Zielzustände sowie 401, 404, 409 und 422 ab.

## JWT-203 – Entitätserstellung

### Aktueller Zustand

Der OpenAPI-Vertrag verlangt `entity_type` und `entityData` im JSON-Body. Das Frontend
sendet `entity_type` derzeit als Queryparameter. Rails führt Query- und Bodyparameter zwar
zusammen, der veröffentlichte Vertrag wird dadurch aber nicht eingehalten.

Die Erfolgsantwort ist ebenfalls nicht stabil: OpenAPI beschreibt aktuell ein
`entity_key`-Objekt, während das Frontend historisch `{ "newId": number }` erwartet. Der
Backendwert kann abhängig vom Entitätstyp ein serialisiertes ActiveRecord-Objekt oder eine
Assoziation sein.

### Entscheidung

- Welcher skalare Wert identifiziert die neu erstellte Entität verlässlich?
- Welcher Erfolgsstatus soll verwendet werden?

### Empfehlung

Alle Entitätstypen verwenden denselben Request-Rahmen:

```http
POST /jwt/editor/entities
Content-Type: application/json
```

```json
{
  "entity_type": "PERSON",
  "entityData": {
    "key": "PSN0000001",
    "first_name": "Felix",
    "last_name": "Mendelssohn"
  }
}
```

Stabile Erfolgsantwort:

```json
{
  "entity_key": "PSN0000001"
}
```

Empfohlen wird HTTP 201 Created. Entscheidend ist, dass `entity_key` für Personen, Orte,
Institutionen, Sehenswürdigkeiten, Werke und Protagonistenwerke immer ein String der neu
erstellten Entität ist. Es darf kein ActiveRecord-Objekt und keine zufällige Assoziation
zurückgegeben werden.

### Abnahmekriterien

- `entity_type` wird ausschließlich im dokumentierten JSON-Body benötigt.
- Alle unterstützten Entitätstypen liefern dieselbe Response-Struktur.
- `entity_key` entspricht dem Schlüssel der tatsächlich erstellten Entität.
- Validierungsfehler verwenden einen stabilen Fehlercode und HTTP 422.
- OpenAPI-Beispiele und Backendtests decken mindestens jeden Entitätstyp einmal ab.
- Das Frontend wird erst nach Bereitstellung des stabilen Backendvertrags umgestellt.

## JWT-204A – Nullbarkeit von `set_content.xml_id`

### Aktueller Zustand

Der OpenAPI-Vertrag verlangt für
`PATCH /jwt/editor/pinned_letters/{id}/set_content` einen String in `changes.xml_id`.
Frontend und Backend verwenden bei dokumentweiten Änderungen bereits bewusst `null`.

### Empfehlung

Das bestehende fachliche Verhalten wird verbindlich dokumentiert:

```yaml
xml_id:
  type: string
  nullable: true
```

Ein leerer String sollte nicht als Ersatz für `null` verwendet werden, weil beide Werte
unterschiedliche Bedeutungen besitzen.

### Abnahmekriterien

- `xml_id: null` ist für dokumentweite Änderungen dokumentiert und getestet.
- Elementbezogene Änderungen senden weiterhin eine konkrete XML-ID.
- Das Backend unterscheidet `null` von einer unbekannten oder ungültigen XML-ID.
- OpenAPI- und Backend-Vertragstest akzeptieren beide dokumentierten Fälle.

## JWT-204B – Figure-Dateitypen und optionale Metadaten

### Aktueller Zustand

Das Backend akzeptiert beim Figure-Upload ausschließlich JPEG und PNG. Im Response-Schema
ist `content_type` derzeit jedoch ein beliebiger String. Die Request-Felder `rend` und
`subtype` sind dokumentiert, werden von der aktuellen Frontendoberfläche aber nicht
angeboten.

### Entscheidungen

- Sollen `rend` und `subtype` fachlich durch Benutzer gepflegt werden können?
- Falls ja: Welche Wertelisten oder Freitextregeln gelten?

### Empfehlung

- `content_type` wird auf `image/jpeg` und `image/png` begrenzt.
- `rend` und `subtype` bleiben vorläufig optional und nullable im Vertrag.
- Ohne fachliche Anforderung werden keine zusätzlichen UI-Felder implementiert.
- Wenn feste Werte vorgesehen sind, werden diese zuerst als OpenAPI-Enum dokumentiert.

Vorgeschlagener Response-Ausschnitt:

```yaml
content_type:
  type: string
  enum:
    - image/jpeg
    - image/png
```

Vorgeschlagene optionale Request-Felder:

```yaml
rend:
  type: string
  nullable: true
subtype:
  type: string
  nullable: true
```

### Abnahmekriterien

- Nicht unterstützte Dateitypen werden mit einem dokumentierten Validierungsfehler
  abgelehnt.
- Erfolgsantwort und tatsächlicher gespeicherter MIME-Type stimmen überein.
- Fehlende optionale Metadaten führen nicht zu leeren oder ungültigen XML-Attributen.
- Eine spätere UI-Unterstützung verwendet ausschließlich die abgestimmten Werte.

## Empfohlene Reihenfolge

1. Fachliche Entscheidung, ob Favoriten erhalten bleiben.
2. Pinning auf einen idempotenten Zielzustand umstellen.
3. Stabilen Request-/Response-Vertrag für Entity Create implementieren.
4. `xml_id`-Nullbarkeit und Figure-Schemata in OpenAPI korrigieren.
5. Backend-Routen- und Vertragstests ausführen.
6. Backend rückwärtskompatibel bereitstellen.
7. Frontend auf die neuen Verträge umstellen und gemeinsam abnehmen.

## Vom Backend zurückzumelden

Für die weitere Frontendumsetzung werden folgende Angaben benötigt:

- Favoriten: **beibehalten mit Endpunkt** oder **vollständig entfernen**;
- Pinning: bestätigter Request- und Response-Body;
- Entity Create: bestätigter Erfolgsstatus und garantierter `entity_key`-Typ;
- `xml_id`: Bestätigung von `nullable: true`;
- Figures: fachliche Entscheidung zu `rend` und `subtype` sowie bestätigtes MIME-Type-Enum;
- Backend-Commit und ausgerollte Umgebung für die gemeinsame Abnahme.
