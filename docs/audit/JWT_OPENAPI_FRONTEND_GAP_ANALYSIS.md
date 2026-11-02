# Abgleich JWT-OpenAPI-Vertrag und Frontend

Stand: 2026-10-30

Frontend-Branch: `feature/jwt-openapi-alignment`

Kanonischer Vertrag: `../metamw_edge_version/docs/openapi/jwt.yaml`, Version `0.2.0`

## Ziel und Vorgehen

Dieser Abgleich vergleicht alle im kanonischen OpenAPI-Vertrag registrierten JWT-Operationen mit den im Frontend tatsächlich verwendeten Aufrufen. Geprüft wurden:

- HTTP-Methode und Pfad,
- Pfad-, Query- und Body-Parameter,
- relevante Response-Felder und deren Nullbarkeit,
- fachliche Behandlung dokumentierter Statuscodes,
- clientseitige Typisierung und Validierung.

Der Backend-Routenabgleich war erfolgreich:

```text
JWT OpenAPI contract: 67 registered operations covered
```

Dieser Backend-Check bestätigt die Routenabdeckung, prüft aber weder die Frontendaufrufe noch sämtliche semantischen Details der Request- und Response-Verarbeitung.

## Zusammenfassung

- Der Vertrag enthält **67 Operationen**. Davon sind zwei Operationen für `pinned_letters` ausdrücklich als nicht implementiert und deprecated markiert.
- Das Frontend verwendet **58 Operationen**. Alle verwendeten Methoden und Pfadformen lassen sich grundsätzlich einer OpenAPI-Operation zuordnen.
- Es bestehen jedoch mehrere Abweichungen bei Payloads, Response-Modellen, Nullbarkeit und Fehlerbehandlung.
- Vier Punkte können unmittelbar und ausschließlich im Frontend korrigiert werden: Locking-Payload, Automatic-Annotation-Parser, Kategorienpfad sowie URL-Kanonisierung.
- Für Favoriten, Pinning-Semantik und einige inkonsistente Response-Typen ist eine abgestimmte Backend-Vertragsänderung sinnvoll.

## Bereits vertragskonforme Bereiche

Die folgenden zuletzt bearbeiteten Bereiche stimmen im Wesentlichen mit dem Vertrag überein:

- `GET /jwt/editor/letters/by_name/{letter_name}`: Nur der dokumentierte `404` wird als freier Briefname interpretiert; `401`, `5xx` und Netzwerkfehler bleiben Fehler.
- `POST /jwt/editor/entities/search`: Das Frontend liest die Einträge über den kleingeschriebenen Kategorie-Schlüssel und normalisiert `id` auf `entityId`.
- Briefanlage über `POST /jwt/editor/letters`: Wrapper `letter`, Feldnamen und Erfolgsantwort entsprechen dem Vertrag.
- Figure-Download und -Upload: Methoden, Multipart-Felder und zentrale Erfolgsfelder stimmen überein.
- Staleness, Rebase und Publish: Methoden, Kernantworten und der dokumentierte Publish-Konflikt `letter_changed_since_pinned` werden berücksichtigt.
- Authentifizierung verwendet Cookies mit `withCredentials`; Tokens werden nicht im Client gespeichert.

## Festgestellte Abweichungen

### A1 – Locking-Payload ist falsch verschachtelt

**Status:** Erledigt am 30.10.2026 auf `feature/jwt-openapi-alignment`.

**Priorität:** P1

**Zuständigkeit:** Frontend

Vertrag und Backend erwarten:

```json
{
  "automatic_anno_letter": {
    "userId": 10
  }
}
```

Das Frontend sendet sowohl im regulären Axios-Aufruf als auch im `keepalive`-Request derzeit nur:

```json
{ "userId": 10 }
```

Betroffene Stellen:

- `src/services/auto_anno/apiAutoAnno.service.ts`
- `src/hooks/useAutoAnnoLetterLock.ts`

Der Rails-Controller liest ausschließlich `params.dig(:automatic_anno_letter, :userId)`. Ein flacher Request wird daher wie ein Entsperren behandelt. Das Frontend muss beide Aufrufe an den bestehenden Vertrag anpassen.

### A2 – Automatic-Annotation-Entity-Suche verwendet das falsche Entry-Schema

**Status:** Erledigt am 30.10.2026 auf `feature/jwt-openapi-alignment`.

**Priorität:** P1

**Zuständigkeit:** Frontend

`GET /jwt/automatic_annotation_letters/{letter_id}/snippets/search_entity/{search_value}/{entity_type}` liefert laut Vertrag dieselbe `EntitySearchResponse` wie die Editor-Suche. Ein Eintrag enthält `id`, `entityKey`, `entityName` und bei Personen zusätzlich Vor- und Nachname.

`searchAutoAnnoSnippetEntities` validiert diese Einträge dagegen direkt mit `SnippetEntitySchema`. Dieses Schema verlangt unter anderem `entityId`, `entityType`, `entityDisplayName` und `extraData`. Vertragskonforme Suchergebnisse können deshalb an der Zod-Validierung scheitern.

Empfehlung: Den bereits für `/jwt/editor/entities/search` eingeführten zentralen Mapper und dieselbe Boundary-Validierung wiederverwenden.

### A3 – Automatic-Annotation-Zod-Schemas widersprechen dem Vertrag

**Status:** Erledigt am 30.10.2026 auf `feature/jwt-openapi-alignment`.

**Priorität:** P1

**Zuständigkeit:** Frontend

Mehrere Zod-Schemas bilden die dokumentierten Serializer nicht ab:

| Modell | Vertrag | Frontend |
|---|---|---|
| `AnnotationJob` | `service_identifier`, `status: integer|string`, `search_string: string|null`, `updated_at: string|boolean` | erwartet `name`, nur String-Status, nicht-nullbare Suche und Zeit |
| `AnnotationLetterListEntry` | kein XML-Inhalt, kein `updated_at`; enthält `letter_auto_anno_job_id` | erwartet XML-, Änderungs- und Zeitfelder |
| `AnnotationLetter` | `xml_content: string|null`; kein `xml_content_updated` oder `updated_at` | erwartet nicht-nullbares XML sowie zusätzliche Felder |
| `Snippet` | mehrere Felder nullable; Status `integer|string` | erwartet ausschließlich nicht-nullbare Strings |
| `SnippetEntityData` | mehrere Felder dürfen `null` oder legacy `false` sein | verlangt überwiegend Strings und ein Objekt für `extra_data` |

Empfehlung: Separate API-Schemas exakt aus OpenAPI ableiten und erst danach in stabile UI-Modelle mappen. Netzwerk- oder Validierungsfehler dürfen nicht durch `undefined` wie eine leere Antwort erscheinen.

### A4 – Favoritenfunktion ruft einen wirkungslosen Suchendpunkt auf

**Priorität:** P1

**Zuständigkeit:** Backend und Frontend

`setLetterFavourite` ruft derzeit auf:

```text
GET /jwt/editor/letters/search?searchValue=FOOOBAR&letterId=...&isFavourite=...
```

Der Vertrag kennt für diesen Endpunkt nur `searchValue`, `page` und `per_page`. Der Rails-Controller ignoriert `letterId` und `isFavourite`; ein Favoriten-Endpunkt existiert nicht. Die UI meldet dennoch Erfolg.

Empfehlung:

1. Fachlich entscheiden, ob Favoriten weiterhin benötigt werden.
2. Falls ja, im Backend einen expliziten, idempotenten Endpunkt samt OpenAPI-Definition und Tests einführen.
3. Anschließend das Frontend auf diesen Endpunkt umstellen und die irreführende Erfolgsmeldung ersetzen.
4. Falls nein, die nicht funktionale UI-Aktion und `setLetterFavourite` entfernen.

### A5 – Protagonistenwerk-Kategorie verwendet Query statt dokumentiertem Pfad

**Status:** Erledigt am 30.10.2026 auf `feature/jwt-openapi-alignment`.

**Priorität:** P1

**Zuständigkeit:** Frontend

Für eine konkrete Kategorie ist dokumentiert:

```text
GET /jwt/misc/protag_creation_categories/{category_id}
```

Das Frontend ruft stattdessen die Collection mit `?categoryId=...` auf. Dieser Query-Parameter ist nicht dokumentiert und wird vom Vertrag nicht garantiert.

Empfehlung: Bei gesetzter Kategorie die Pfadvariante verwenden; ohne Kategorie bleibt der Collection-Endpunkt korrekt.

### A6 – Entity Create weicht bei Request und Response ab

**Status:** Erledigt und am 02.11.2026 gemeinsam ausgerollt. Backend und OpenAPI 0.4.0
stehen in `fb460aed` beziehungsweise `4ce5f60e`; die Frontendkorrektur steht in
`1445d11`.

**Priorität:** P2

**Zuständigkeit:** zunächst Frontend, anschließend Backend empfohlen

Der vorherige Client übergab `entity_type` als Query-Parameter und nur `entityData` im Body.
Die Korrektur sendet nun beide Felder ausschließlich im dokumentierten JSON-Body.

Die frühere Typisierung als `{ newId: number }` ist entfernt. HTTP 201 wird strikt als
`{ entity_key: string }` validiert; 422 `invalid_entity_data` und 500
`entity_creation_failed` bleiben unterscheidbar.

Die sechs Mapper und der gemeinsame Service verwenden damit den abgestimmten
Request-Rahmen und die validierte Erfolgsantwort. Die gezielten Frontendtests sowie die
Backend-Vertrags- und Routentests sind erfolgreich gelaufen.

### A7 – Pinning ist als Statusoperation modelliert, im Backend aber ein Toggle

**Status:** Erledigt und ausgerollt. Die idempotente Zielzustands- und Schliesssemantik
ist im Frontend-Commit `15a2cbb` und im Backend-Commit `065adff2` umgesetzt und wurde
manuell abgenommen.

**Priorität:** P2

**Zuständigkeit:** Backend und Frontend

Der Client sendet den dokumentierten Zielzustand, das Backend setzt ihn idempotent. Das
Schliessen einer Arbeitskopie ist als eigene, bestaetigungspflichtige Operation umgesetzt;
wiederholte Requests toggeln den Zustand nicht mehr unbeabsichtigt.

### A8 – `xml_id` ist im Vertrag nicht nullable, im Frontend und Backend aber optional

**Status:** Erledigt und mit OpenAPI 0.4.0 in `4ce5f60e` ausgerollt.

**Priorität:** P2

**Zuständigkeit:** Backend/OpenAPI

`PATCH /jwt/editor/pinned_letters/{id}/set_content` dokumentiert `changes.xml_id` nun als
Pflichtfeld, das bei dokumentweiten Aenderungen `null` sein darf. Elementbezogene
Aenderungen verwenden weiterhin eine konkrete XML-ID. Backend-Vertragstests decken beide
Faelle ab; der Client benoetigt keinen kuenstlichen Leerstring.

### A9 – Nicht-kanonische URL-Schreibweisen

**Status:** Erledigt am 30.10.2026 auf `feature/jwt-openapi-alignment`.

**Priorität:** P2

**Zuständigkeit:** Frontend

Sieben Aufrufe verwenden einen zusätzlichen abschließenden Slash, obwohl der Vertrag nur die Variante ohne Slash definiert:

- `/jwt/misc/letters/author_receivers/`
- `/jwt/editor/pinned_letters/{id}/set_content/`
- `/jwt/editor/pinned_letters/{id}/reset_letter/`
- `/jwt/editor/pinned_letters/{id}/rebase/`
- `/jwt/editor/pinned_letters/{id}/publish/`
- `/jwt/editor/letters/{id}/letter_changes/undo/`
- `/jwt/editor/letters/{id}/letter_changes/redo/`

`updateUserLanguage` verwendet dagegen `jwt/misc/user/language/{lang_code}` ohne führenden Slash.

Rails/Axios tolerieren diese Varianten derzeit teilweise. Der Client sollte dennoch ausschließlich die exakten OpenAPI-Pfade verwenden, um Proxy- und Router-Abhängigkeiten zu vermeiden.

### A10 – Nullable Letter-Felder sind im Frontend zu eng typisiert

**Status:** Erledigt am 30.10.2026. Index-, Such-, Detail- und Pinned-Responses besitzen
getrennte Boundary-Schemas; nullable Werte werden erst im UI-Mapper normalisiert.

**Priorität:** P2

**Zuständigkeit:** Frontend, mit einer Backend-Ausnahme

Der Vertrag erlaubt unter anderem:

- `Letter.title: string|null`,
- `Letter.xml_content: string|null`,
- `LetterIndexEntry.title: string|null`,
- `LetterIndexEntry.updated_at: string|null`,
- `PinnedLetter.title: string|null`,
- `PinnedLetter.xml_content: string|null`.

Frontendtypen und Mapping-Funktionen deklarieren mehrere dieser Werte als zwingende Strings. `mapApiToEditorLetter` erwartet außerdem `last_updated_by_name` und `last_updated_by_id`, obwohl der dokumentierte und tatsächliche Index-Serializer diese Felder nicht liefert.

Empfehlung: Frontendtypen und Mapper an Nullbarkeit und tatsächliche Felder angleichen. Für `PinnedLetter.id` sollte das Backend den derzeit als String serialisierten kanonischen Letter-Identifier auf Integer vereinheitlichen und den Vertrag entsprechend ändern; alle anderen Letter-IDs sind bereits Integer.

### A11 – Authentifizierungsfehler werden zu pauschalem `null`

**Status:** Erledigt am 30.10.2026. Nur der dokumentierte `GET /auth/me`-Status 401 wird als
fehlende Sitzung behandelt; Netzwerk-, Server- und Validierungsfehler bleiben technische
Fehler und loeschen den bestehenden Redux-Anmeldestatus nicht.

**Priorität:** P2

**Zuständigkeit:** Frontend

`AuthService.getMe` und `AuthService.refresh` wandeln derzeit jeden Fehler in `null` um. Damit sind ein dokumentierter `401`, ein Serverfehler und ein Netzwerkausfall für die Anwendung nicht unterscheidbar.

Empfehlung: Nur die dokumentierten Authentifizierungsfehler als abgelaufene beziehungsweise fehlende Sitzung behandeln. Temporäre Netzwerk- und Serverfehler müssen separat propagiert oder als technischer Zustand dargestellt werden.

### A12 – Fehlende Validierung an mehreren API-Grenzen

**Status:** In Umsetzung. Auth-, Letter-, Pinned-Letter-, RISM-, Country-, Kind-,
Protagonistenwerk-, Misc-Letter-, Author- und Creation-Responses werden inzwischen mit
OpenAPI-nahen Boundary-Schemas validiert. Hinzu kommen die einfachen Editor-Antworten fuer
Briefexistenz, nullable XML-Inhalt und Entitaetsschluessel; die Entitaetssuche besitzt nun
einen nicht-optionalen Listen-Rueckgabetyp. Auch die stabilen Mutationsantworten fuer
Benutzersprache, `set_content`, Reset, Publish, Undo und Redo werden an der Grenze validiert.
Verbleibende heterogene Legacy-Responses werden in JWT-301 endpunktweise nachgezogen;
Entity Create aus A6 ist lokal auf die Backend-Freigabe `fb460aed`/`4ce5f60e` umgestellt.

**Priorität:** P3

**Zuständigkeit:** Frontend

Ein Teil der neueren Endpunkte wird bereits mit Zod validiert. In älteren Services werden Antworten jedoch weiterhin als `any` verarbeitet und per Type Assertion in UI-Modelle überführt, insbesondere in:

- `src/services/mappings/editorMappings.ts`,
- `src/services/editor/apiPinnedLettersRequest.service.ts`,
- `src/utils/editor/backendService.ts`.

Dadurch bleiben Nullbarkeit, fehlende Felder und Vertragsabweichungen bis zur UI unentdeckt. Besonders betroffen sind RISM-Einträge, Autoren, Länder/Arten, Werke und Pinned-Letter-Daten.

Empfehlung: API-Schemas pro OpenAPI-Komponente definieren oder generieren und danach explizit in UI-Modelle mappen. Die OpenAPI-Datei sollte dabei die einzige Quelle bleiben; keine manuell divergierende zweite Vertragskopie anlegen.

### A13 – Query- und Pfadwerte werden nicht durchgängig codiert

**Status:** Weitgehend erledigt am 30.10.2026. Die verbleibenden nicht-kanonischen Werte
gehoeren zu den fachlich ungeklaerten Aufrufen A4/A6 und werden dort gemeinsam korrigiert.

**Priorität:** P3

**Zuständigkeit:** Frontend

Einige Suchen interpolieren Nutzereingaben direkt in URLs, zum Beispiel `searchValue` bei der Briefsuche und Suchwerte in `search_for_letters`. Andere neuere Aufrufe verwenden bereits `encodeURIComponent` oder Axios-`params`.

Empfehlung: Query-Parameter durchgängig über Axios `params` und Pfadsegmente über `encodeURIComponent` aufbauen.

### A14 – Kleinere Schema-/Implementierungsdifferenzen

**Priorität:** P3

**Zuständigkeit:** gemischt

- Figure Upload unterstützt im Backend ausschließlich JPEG und PNG. Das Frontend validiert dies korrekt, während `FigureCreated.content_type` im OpenAPI-Schema nur als beliebiger String beschrieben ist. Das Backend-Schema sollte ein Enum erhalten.
- Das Figure-Request-Schema enthält die optionalen Felder `rend` und `subtype`; die aktuelle Frontendoberfläche bietet sie nicht an. Das ist nur dann eine Funktionslücke, wenn diese Metadaten fachlich benötigt werden.
- Das Frontend unterstützt für die UI-Sprache nur `de` und `en`, der Endpunkt dokumentiert zusätzlich `fr` und `it`. Dies ist eine bewusste UI-Einschränkung, solange keine viersprachige Oberfläche gefordert ist.
- Mehrere Servicefunktionen geben laut TypeScript `undefined` zurück, obwohl der Vertrag entweder eine konkrete Antwort oder einen HTTP-Fehler definiert. Diese Signaturen sollten geschärft werden.

## Nicht genutzte Operationen

Nicht jede ungenutzte OpenAPI-Operation ist eine Frontendlücke:

| Operation | Bewertung |
|---|---|
| `GET /jwt/editor/entities` | Liefert laut Vertrag absichtlich `400 Action is not supported`; kein Frontendbedarf. |
| `GET /jwt/editor/letters` | Der Client verwendet Suche und „zuletzt verwendet“ statt des vollständigen Index; derzeit keine Lücke. |
| `GET /jwt/automatic_annotation_letters/{id}/status` | Potenziell redundant, da Show-Daten Status enthalten; nur bei geplantem Polling relevant. |
| `GET /jwt/misc/author/{author_key}/creations_for_category/{category}` | Der Client lädt aktuell Autorenwerke ohne diesen Filter; fachlich prüfen, ob die UI kategorieweise filtern soll. |
| `GET /jwt/misc/protag_creation_categories/{category_id}` | Sollte vom Frontend verwendet werden, sobald A5 korrigiert wird. |
| `POST /jwt/editor/pinned_letters` | Im Vertrag als nicht implementiert/deprecated markiert; korrekt ungenutzt. |
| `DELETE /jwt/editor/pinned_letters/{id}` | Im Vertrag als nicht implementiert/deprecated markiert; korrekt ungenutzt. |

Die vier Auth-Operationen werden über `API_ENDPOINTS.AUTH` dynamisch zusammengesetzt und sind trotz fehlender Literalpfade vollständig in Benutzung.

## Empfohlene Umsetzung und Reihenfolge

### Phase 1 – Frontend gegen den bestehenden Vertrag korrigieren

1. A1 Locking-Payload in Axios- und `keepalive`-Request korrigieren.
2. A2/A3 Automatic-Annotation-Schemas und Mapper an OpenAPI angleichen.
3. A5 Kategorienpfad korrigieren.
4. A9 Pfade kanonisieren.
5. A10/A11 Nullbarkeit und Fehlerbehandlung korrigieren.
6. A12/A13 verbliebene API-Grenzen validieren und Parameter sicher codieren.

Diese Änderungen benötigen keine Backend-Vertragsänderung und können zuerst ausgeliefert werden.

### Phase 2 – Gekoppelte Backend-/Frontend-Entscheidungen

1. A4 Favoriten fachlich bestätigen und einen echten Endpunkt definieren oder die UI entfernen.
2. A7 Pinning als idempotente Statusoperation festlegen.
3. A6 Entity-Create-Response auf ein stabiles Modell vereinheitlichen.
4. A8 `xml_id`-Nullbarkeit sowie die kleineren Schemaangaben aus A14 korrigieren.
5. `PinnedLetter.id` auf einen konsistenten Typ vereinheitlichen.

Bei jeder Vertragsänderung zuerst Backendimplementierung, OpenAPI und Backendtests gemeinsam bereitstellen. Danach das Frontend mit Parser- und Integrationstests umstellen. Erst anschließend beide Stände gemeinsam ausrollen.

## Vorgeschlagene Abnahmekriterien

- Der Backend-Routenabgleich bleibt für alle registrierten Operationen grün.
- Ein automatisierter Frontendcheck meldet keine unbekannten JWT-Pfade oder abweichenden HTTP-Methoden.
- Request- und Response-Beispiele für alle im Frontend verwendeten Operationen sind durch Service- oder Parser-Tests abgedeckt.
- Nur dokumentierte fachliche Statuscodes werden in leere/null Zustände übersetzt.
- Keine JWT-Response wird an der Systemgrenze ungeprüft als `any` in das UI-Modell übernommen.
- Frontend und getestetes Backend verwenden denselben OpenAPI-Stand.
