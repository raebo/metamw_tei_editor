# Arbeitsplan zur Angleichung des Frontends an die JWT-OpenAPI

**Stand:** 04.11.2026

**Status:** Technische Vertragsangleichung abgeschlossen; gemeinsame Live-Smoke-Abnahme aus JWT-303 offen

**Prioritaet des Gesamtvorhabens:** P1

## Ausgangslage

Die verbindliche API-Beschreibung liegt im Backend unter
`../metamw_edge_version/docs/openapi/jwt.yaml`. Die ermittelten Abweichungen sind
in [JWT_OPENAPI_FRONTEND_GAP_ANALYSIS.md](../audit/JWT_OPENAPI_FRONTEND_GAP_ANALYSIS.md)
dokumentiert.

Dieser Plan trennt zwischen:

- Frontend-Korrekturen, die gegen den bestehenden Vertrag sofort umgesetzt werden koennen;
- abgestimmten Aenderungen, bei denen Backend, OpenAPI und Frontend gemeinsam angepasst
  werden muessen;
- Qualitaetssicherung, die erneute Abweichungen verhindern soll.

Die Kennungen `JWT-101` bis `JWT-303` sind vorlaeufige Arbeitskennungen und keine bereits
angelegten Tracker-Tickets.

## Zielbild

- Jeder vom Frontend verwendete JWT-Endpunkt ist in der OpenAPI beschrieben.
- Request-Pfade, Parameter, Bodies, Statuscodes und Responses entsprechen dem Vertrag.
- API-Antworten werden an der Systemgrenze typisiert und validiert.
- Erwartbare Fachfehler werden von Authentifizierungs-, Netzwerk- und Serverfehlern
  unterschieden.
- Gekoppelte Vertragsaenderungen werden zuerst im Backend samt OpenAPI bereitgestellt und
  danach im Frontend aktiviert.

## Reihenfolge und Abhaengigkeiten

| Reihenfolge | Paket | Prioritaet | Verantwortlich | Abhaengigkeit |
| --- | --- | --- | --- | --- |
| 1 | JWT-101 Sperr-Requests korrigieren | P1 | Frontend | keine |
| 2 | JWT-102 Entitaetssuche vereinheitlichen | P1 | Frontend | keine |
| 3 | JWT-103 Annotationsantworten an den Vertrag angleichen | P1 | Frontend | JWT-102 |
| 4 | JWT-104 Protagonistenwerk-Kategorie korrekt adressieren | P1 | Frontend | keine |
| 5 | JWT-105 URLs und Parameter kanonisieren | P2 | Frontend | keine |
| 6 | JWT-106 Briefdaten und Fehlerbehandlung haerten | P2 | Frontend | keine |
| 7 | JWT-201 Favoriten-Vertrag festlegen | P1 | Backend + Frontend | fachliche Entscheidung |
| 8 | JWT-202 Pinning idempotent gestalten | P2 | Backend + Frontend | Vertragsentscheidung |
| 9 | JWT-203 Entitaetserstellung stabilisieren | P2 | Backend + Frontend | Vertragsentscheidung |
| 10 | JWT-204 OpenAPI-Schemata korrigieren | P2 | Backend | JWT-203 beruecksichtigen |
| 11 | JWT-301 API-Grenzen vollstaendig typisieren | P2 | Frontend | JWT-101 bis JWT-204 |
| 12 | JWT-302 Vertragspruefung automatisieren | P2 | Backend + Frontend | stabile Vertraege |
| 13 | JWT-303 Gemeinsame Abnahme und Bereinigung | P2 | Backend + Frontend | alle vorherigen Pakete |

## Umsetzungsstand

- JWT-101 bis JWT-103 sind umgesetzt: Locking-Requests verwenden denselben typisierten
  Wrapper, die Entitaetssuchen teilen sich einen validierten Parser und die
  Automatic-Annotation-Responses besitzen getrennte Transport- und UI-Modelle.
- JWT-104 ist umgesetzt: Einzelne Protagonistenwerk-Kategorien werden ueber den
  dokumentierten Pfadparameter geladen.
- JWT-105 ist umgesetzt: Nicht-kanonische Slashes wurden entfernt, der Sprachpfad wurde
  korrigiert und die betroffenen freien Pfad- und Querywerte werden sicher uebertragen.
- JWT-106 ist umgesetzt: Letter-Responses werden je Endpunkt validiert und nur der
  dokumentierte Authentifizierungsfehler wird als fehlende Sitzung behandelt.
- JWT-201 bleibt bewusst zurueckgestellt. JWT-202 ist mit Frontend `15a2cbb` und Backend
  `065adff2` idempotent umgesetzt, ausgerollt und manuell abgenommen. JWT-203/204 sind mit
  Backend `fb460aed`/`4ce5f60e` und Frontend `1445d11` ebenfalls ausgerollt; der
  Vollsuite-Nachweis des Backends schliesst `3a077371` ein.
- Das erste JWT-301-Teilpaket ist umgesetzt: Auth-, Letter-, Pinned-Letter- und haeufig
  verwendete Misc-Referenzdaten werden an der API-Grenze validiert. Weitere Legacy-Grenzen
  werden endpunktweise in kleinen Folgepaketen bearbeitet.
- Das zweite JWT-301-Teilpaket validiert die einfachen Editor-Antworten fuer
  Briefexistenz, nullable XML-Inhalt und Entitaetsschluessel. Technische Fehler werden bei
  der Existenzpruefung nicht mehr als `false` beziehungsweise fehlender Brief behandelt;
  nur ein dokumentiertes `404` und eine valide Antwort `false` fuehren zur
  Nicht-gefunden-Ansicht. Die Entitaetssuche liefert typseitig stets eine Liste.
- Das dritte JWT-301-Teilpaket validiert die stabilen Antworten mutierender
  Editor-Aufrufe: Benutzersprache, `set_content`, Reset, Publish sowie Undo und Redo.
  Ein HTTP-Erfolg mit ungueltiger Antwort wird nicht mehr als erfolgreiche Aktion
  weiterverarbeitet; bei `success: false` wird die dokumentierte Meldung als Fehler
  propagiert. Die spaeter abgeschlossenen Arbeiten zu JWT-203/204 sind eigenstaendige,
  inzwischen ausgerollte Vertragspakete.
- Das vierte JWT-301-Teilpaket validiert die praefixabhaengigen Detailantworten von
  `GET /jwt/misc/entities/{entity_key}` und verarbeitet die exakte Briefsuche mit dem
  vorhandenen Letter-Schema. Der Personenmapper erhaelt nur noch einen validierten
  Transporttyp; Erfolgs-, 404-, 401-/422- und fehlerhafte Antworten sind getestet.
- Das fuenfte JWT-301-Teilpaket typisiert die Fehlergrenze der Legacy-Misc-Aufrufe in
  `backendService.ts`. Dokumentierte 401- und 422-Antworten, unerwartete HTTP-Fehler und
  Netzwerkfehler bleiben unterscheidbar; ungueltige 200-Antworten werden weiterhin als
  Schemafehler abgelehnt. Die zuvor wiederholten `any`-Catch-Pfade sind zentralisiert.
- Das sechste JWT-301-Teilpaket nutzt dieselbe typisierte Fehlergrenze auch fuer die
  Protagonistenperson und die Autoren eines Werks. Die dokumentierten 401-, 404- und
  422-Antworten bleiben von Server- und Netzwerkfehlern unterscheidbar; die bereits
  vorhandene Validierung erfolgreicher Antworten ist durch eigene Servicetests abgesichert.
  Die manuelle Abnahme hat zusaetzlich den Backend-Vertragsverstoss F-175 mit historischen
  `ProtagCreation.name: null` aufgedeckt. Das Frontend behaelt die nicht-nullbare
  Vertragspruefung bei; die Abnahme wird nach Commit und Rollout der Backendkorrektur
  wiederholt.
- Das siebte JWT-301-Teilpaket validiert die dokumentierte `Status`-Antwort aller sechs
  zustandsaendernden Automatic-Annotation-Aufrufe. Ein HTTP 200 mit fehlendem oder falsch
  typisiertem `status` wird nicht mehr als erfolgreiche Sperrung, Snippet-Aenderung,
  Inhaltsaktualisierung, Ruecksetzung oder Dateischreibung behandelt.
- Das achte JWT-301-Teilpaket validiert die Collection-Grenze der Briefsuche, zuletzt
  verwendeten Briefe und gepinnten Briefe als Arrays. Leere Ergebnisse bleiben `[]`;
  `null`, Objekte und ungueltige Eintraege werden abgelehnt. Gleichzeitig entfallen
  unmoegliche `undefined`-Rueckgabetypen der betroffenen Briefabfragen.
- Das neunte JWT-301-Teilpaket vereinheitlicht die Fehlergrenze der Automatic-Annotation-
  Aufrufe. Dokumentierte 401-, 404- und 422-Antworten, unerwartete Serverantworten sowie
  Netzwerkfehler bleiben als typisierte Fehler unterscheidbar; erfolgreiche Antworten mit
  ungueltigem Schema bleiben Validierungsfehler. Die Entitaetssuche liefert typseitig stets
  eine Trefferliste oder wirft einen Fehler, jedoch kein zusaetzliches `undefined`.
- Das zehnte JWT-301-Teilpaket schliesst die verbliebenen Pfad-, Status- und Fehlergrenzen:
  Die Snippet-Liste verlangt eine konkrete Annotationsbrief-ID, die Briefanlage akzeptiert
  ausschliesslich den dokumentierten HTTP-Status 200 und Rebase-Fehler unterscheiden
  dokumentierte 401-, 409- und 422-Antworten von unerwarteten Server- und Netzwerkfehlern.
- JWT-301 ist damit abgeschlossen. Alle direkt konsumierten JSON-Antworten der verwendeten
  JWT-Services werden an der Systemgrenze validiert oder ueber einen validierten Mapper
  verarbeitet. Der Figure-Download bleibt als binaere Antwort bewusst ausserhalb der
  JSON-Schemavalidierung und prueft stattdessen Status, MIME-Type und Blob.
- JWT-302 ist umgesetzt. `yarn check:jwt-openapi` liest ausschliesslich den kanonischen
  Vertrag aus `OPENAPI_SPEC_PATH` beziehungsweise dem dokumentierten Standardpfad, ermittelt
  die statischen und lokal zusammengesetzten JWT-Aufrufe mit dem TypeScript-Parser und gleicht
  Methode sowie normalisierte Pfadform ab. Der Check findet aktuell 57 verwendete Operationen
  bei 67 dokumentierten Operationen und ist vor Jest in `yarn test:ci` eingebunden. Eigene
  Regressionstests belegen gueltige, unbekannte und nicht kanonische Aufrufe.
- JWT-303 ist technisch vorbereitet: Der automatisierte Pfad-/Methodenabgleich ist gruen
  und ungenutzte Operationen sind bewertet. F-178 ist frontendseitig nach OpenAPI 0.7.0
  umgesetzt: Der Publish-Dialog bietet die Aktionen `Draft` und `Live`, sendet den Zielstatus
  ausdruecklich und uebernimmt danach die neu geladene Pinned-Arbeitskopie. Backend-Commit,
  gemeinsamer Rollout und Live-Smoke-Abnahme stehen noch aus; F-179 bleibt offen.

## Phase 1 – Unmittelbare Frontend-Korrekturen

### JWT-101 – Sperr-Requests korrigieren

**Ziel:** Das Frontend sendet fuer Sperren exakt den dokumentierten Request-Body.

**Umfang:**

- `automatic_anno_letter.userId` sowohl im normalen Axios-Aufruf als auch im
  Keepalive-/Beacon-Pfad senden.
- Gemeinsamen typisierten Request-Mapper verwenden, damit beide Transportwege denselben
  Body erzeugen.
- Fehlerantworten nicht als erfolgreiche Sperrung oder Entsperrung behandeln.

**Tests:** Request-Test fuer Setzen und Loesen der Sperre sowie fuer den Keepalive-Pfad;
Fehlerfaelle fuer 401, 404 und 422.

**Abnahme:** Der Backend-Request wird nicht mehr wegen eines fehlenden Wrapper-Objekts
abgelehnt und beide Frontend-Pfade senden strukturell identische Daten.

**Umgesetzt:** 30.10.2026 auf `feature/jwt-openapi-alignment`.

### JWT-102 – Entitaetssuche vereinheitlichen

**Ziel:** Alle Entitaetstypen werden aus der dokumentierten verschachtelten Antwort gelesen.

**Umfang:**

- Eine gemeinsame validierte Antwortsstruktur fuer `person`, `settlement`, `sight`,
  `institution`, `creation` und `protag_creation` einfuehren.
- `entityKey` und `entityName`, bei Personen zusaetzlich `entityLastName` und
  `entityFirstName`, in das interne Darstellungsmodell abbilden.
- Die allgemeine Editorsuche und die Suche der automatischen Annotationen auf denselben
  Parser umstellen.
- Trefferhervorhebung als React-Nodes erhalten; keine HTML-Strings einfuehren.

**Tests:** Je Kategorie mindestens eine gueltige Antwort, leere Trefferlisten, unbekannte
Kategorie und fehlerhafte Antwort; Regressionstest fuer die Trefferhervorhebung.

**Abnahme:** Alle sechs Kategorien zeigen Treffer an und lehnen ungueltige Antworten
kontrolliert ab.

**Umgesetzt:** 30.10.2026 auf `feature/jwt-openapi-alignment`.

### JWT-103 – Annotationsantworten an den Vertrag angleichen

**Ziel:** Jobs, Briefe, Snippets und Entitaeten der automatischen Annotationen koennen die
dokumentierten Feldnamen, Nullwerte und gemischten Typen verarbeiten.

**Umfang:**

- Zod-Schemata mit der OpenAPI vergleichen und Feldnamen wie `service_identifier`
  korrekt abbilden.
- Dokumentierte Nullwerte und Varianten explizit behandeln.
- Transportmodelle von UI-Modellen trennen; Normalisierung nur in zentralen Mappern.
- Ungueltige Daten mit einer nachvollziehbaren Fehlermeldung abbrechen.

**Tests:** Vertragsbeispiele, Nullwerte, optionale Felder, unterschiedliche ID-Typen und
ungueltige Antworten.

**Abnahme:** Dokumentierte Responses werden ohne Casts verarbeitet; Abweichungen werden
nicht stillschweigend verschluckt.

**Umgesetzt:** 30.10.2026 auf `feature/jwt-openapi-alignment`.

### JWT-104 – Protagonistenwerk-Kategorie korrekt adressieren

**Ziel:** Die Detailabfrage verwendet den dokumentierten Pfadparameter.

**Umfang:** Aufruf auf
`/jwt/misc/protag_creation_categories/{category_id}` umstellen, den Wert URL-kodieren und
den nicht dokumentierten Query-Parameter entfernen.

**Tests:** Service-Test fuer Pfadbildung sowie Fehlerantworten 404 und 422.

**Abnahme:** Der Request trifft die dokumentierte Rails-Route mit der gewaehlten Kategorie.

**Umgesetzt:** 30.10.2026 auf `feature/jwt-openapi-alignment`.

### JWT-105 – URLs und Parameter kanonisieren

**Ziel:** Semantisch identische Requests besitzen eine einheitliche URL-Form.

**Umfang:**

- Nicht dokumentierte abschliessende Slashes entfernen.
- Fehlenden fuehrenden Slash beim Aktualisieren der Benutzersprache ergaenzen.
- Alle dynamischen Pfad- und Querywerte mit `encodeURIComponent` oder Axios-Parametern
  uebertragen.
- Eine kleine gemeinsame URL-Hilfe nur einfuehren, wenn dadurch echte Duplikation
  entfaellt.

**Tests:** Sonderzeichen, Leerzeichen, Umlaute und Slash-Zeichen in Parametern.

**Abnahme:** Alle verwendeten Pfade entsprechen der OpenAPI und dynamische Werte koennen
keine URL-Struktur veraendern.

**Umgesetzt:** 30.10.2026 auf `feature/jwt-openapi-alignment`. Nicht funktionale oder noch
ungeklaerte Aufrufe aus JWT-201 bis JWT-203 bleiben bewusst in ihren eigenen Paketen.

### JWT-106 – Briefdaten und Fehlerbehandlung haerten

**Ziel:** Nullwerte und Statuscodes werden fachlich korrekt behandelt.

**Umfang:**

- Frontend-Typen fuer dokumentierte nullable Felder der Briefe korrigieren.
- `GET /letters/by_name/{letter_name}`: ausschliesslich 404 mit
  `letter_not_found` als freien Namen behandeln; 401, Netzwerk- und Serverfehler anzeigen.
- `getMe` und `refresh` duerfen nicht jeden Fehler in eine vermeintlich fehlende Sitzung
  umwandeln.
- Konvertierungen in Letter-Mappern zentralisieren.

**Tests:** 200, 401, 404, 422, 500, Netzwerkfehler sowie nullable Felder.

**Abnahme:** Technische Fehler fuehren weder zu einer falschen Namensfreigabe noch zu einem
unbegruendeten Logout.

**Umgesetzt:** 30.10.2026 auf `feature/jwt-openapi-alignment`.

## Phase 2 – Abgestimmte Vertragsaenderungen

Fuer jedes Paket dieser Phase gilt dieselbe Reihenfolge: fachliche Entscheidung,
Backend-Implementierung, OpenAPI-Anpassung und Backend-Vertragstest, danach
Frontend-Umstellung und gemeinsame Abnahme. Eine inkompatible Frontend-Aenderung darf nicht
vor dem passenden Backend ausgerollt werden.

### JWT-201 – Favoriten-Vertrag festlegen

**Problem:** Das Frontend sendet Favoritenparameter an die Briefsuche, die das Backend
ignoriert; ein eigener dokumentierter Favoriten-Endpunkt fehlt.

**Entscheidung:** Entweder einen expliziten idempotenten Favoriten-Endpunkt bereitstellen
oder die nicht funktionsfaehige Frontend-Funktion entfernen. Die Suchroute darf nicht als
verdeckte Schreiboperation verwendet werden.

**Abnahme:** Favorisieren und Entfernen sind dokumentiert, getestet und nach erneutem Laden
stabil; alternativ ist die Funktion vollstaendig aus der UI entfernt.

### JWT-202 – Pinning idempotent gestalten

**Status:** Erledigt, ausgerollt und manuell abgenommen. Frontend `15a2cbb`, Backend
`065adff2`.

**Problem:** Das Frontend sendet `isPinned`, waehrend das Backend diesen Wert ignoriert und
den Zustand lediglich umschaltet.

**Empfehlung:** Einen expliziten Zielzustand im Request dokumentieren und serverseitig
idempotent setzen. Wiederholte identische Requests duerfen den Zustand nicht zurueckdrehen.

**Abnahme:** Doppelte Requests und Wiederholungen nach einem unklaren Netzwerkergebnis
erzeugen den beabsichtigten Zustand.

### JWT-203 – Entitaetserstellung stabilisieren

**Status:** Erledigt und am 02.11.2026 gemeinsam ausgerollt. Backend `fb460aed`, OpenAPI
0.4.0 in `4ce5f60e`, Frontend `1445d11`.

**Umsetzung:** Alle sechs Entitaetsarten verwenden einen typisierten Request mit
`entity_type` und `entityData` im JSON-Body. HTTP 201 wird als strikt validiertes
`{ entity_key: string }` verarbeitet; die stabilen Fehlercodes `invalid_entity_data` und
`entity_creation_failed` werden als typisierte Fehler propagiert. UI-Modelle werden vor dem
Request explizit auf die dokumentierten Felder abgebildet, insbesondere
`first_name`/`last_name` und `op`.

**Abnahme:** Alle unterstuetzten Entitaetsarten verwenden denselben Request-Rahmen und eine
validierbare Response.

### JWT-204 – OpenAPI-Schemata korrigieren

**Status:** Erledigt und mit OpenAPI 0.4.0 in `4ce5f60e` ausgerollt. Die Nullbarkeit von
`xml_id`, die numerische Pinned-Letter-ID und der Figure-Vertrag sind durch Backendtests
abgesichert.

**Ziel:** Nachweislich gueltiges Backend-Verhalten und Vertrag stimmen ueberein.

**Umfang:**

- Nullable `xml_id` fuer `set_content` dokumentieren, sofern `null` fachlich weiterhin
  erlaubt bleibt; andernfalls Backend und Frontend auf einen Pflichtwert umstellen.
- `PinnedLetter.id` einheitlich als Integer serialisieren und dokumentieren.
- `content_type` beim Figure-Upload auf JPEG und PNG begrenzen.
- Entscheiden, ob optionale Figure-Metadaten `rend` und `subtype` Bestandteil des
  oeffentlichen Vertrags werden.

**Abnahme:** OpenAPI-Beispiele passieren die Backend-Vertragstests und das Frontend benoetigt
keine widerspruechlichen Sondertypen.

## Phase 3 – Absicherung und Abschluss

### JWT-301 – API-Grenzen vollstaendig typisieren

**Status:** Abgeschlossen am 04.11.2026.

**Ziel:** Verbleibende `any`-Typen und ungepruefte Casts an JWT-Responses entfernen.

**Vorgehen:** Endpunktweise vorgehen, Transporttypen aus der OpenAPI ableiten und nur an
zentralen Mappern in UI-Modelle konvertieren. Diese Arbeit beginnt nach den fachlichen
Vertragsentscheidungen, damit keine instabilen Typen zementiert werden.

**Abnahme:** Keine neue untypisierte JWT-Antwort; bekannte Altfunde sind beseitigt oder mit
einem konkreten Folgeticket begruendet.

### JWT-302 – Vertragspruefung automatisieren

**Status:** Abgeschlossen am 04.11.2026.

**Ziel:** Neue Drift wird in der Continuous Integration sichtbar.

**Umfang:**

- Backend-Routen weiterhin gegen die kanonische OpenAPI pruefen.
- Fuer kritische Frontend-Services Contract-Fixtures aus dokumentierten Beispielen testen.
- Optional einen OpenAPI-Type-Generator evaluieren; generierten Code nur einfuehren, wenn
  reproduzierbare Versionierung und ein klarer Mapping-Layer feststehen.
- Eine Aenderung der OpenAPI muss betroffene Frontend-Tests sichtbar machen.

**Abnahme:** Ein absichtlich veraenderter Request oder eine inkompatible Response laesst
mindestens einen automatisierten Check scheitern.

**Umsetzung:** `scripts/check-jwt-openapi.js` prueft alle statisch aufloesbaren JWT-Aufrufe
unter `src/` gegen Methode und Pfad der kanonischen YAML. Der Check ist als
`yarn check:jwt-openapi` einzeln ausfuehrbar und Bestandteil von `yarn test:ci`. Die
Response-Vertraege bleiben durch die vorhandenen Zod-, Service- und Mappertests abgesichert;
es wird keine zweite OpenAPI-Kopie im Frontend gepflegt.

### JWT-303 – Gemeinsame Abnahme und Bereinigung

**Status:** Technischer Abgleich abgeschlossen; Live-Smoke-Abnahme offen.

**Ziel:** Alle 67 dokumentierten Operationen sind entweder genutzt, bewusst ungenutzt oder
als veraltet gekennzeichnet.

**Umfang:**

- Route-fuer-Route-Abgleich wiederholen.
- Veraltete Endpunkte fuer gepinnte Briefe und andere nachweislich ungenutzte Operationen
  im Backend deprecaten oder entfernen, sofern kein weiterer Client existiert.
- End-to-End-Smoke-Test fuer Anmeldung, Briefsuche, Briefbearbeitung, Entitaetssuche,
  Figures und automatische Annotationen durchfuehren.
- Abweichungsanalyse aktualisieren und erledigte Punkte mit Commit oder Ticket belegen.

**Abnahme:** Es verbleibt keine undokumentierte Abweichung ohne Verantwortlichen und
Folgeticket.

**Technischer Nachweis vom 04.11.2026:**

- Frontend-Pfad-/Methodencheck: 57 verwendete von 67 dokumentierten Operationen, keine
  Abweichung;
- Backend-Routencheck: 67 registrierte Operationen abgedeckt;
- `yarn test:ci`: 80 Test-Suites und 681 Tests erfolgreich;
- `yarn tsc --noEmit`: erfolgreich;
- Lint des neuen Regressionstests: keine Fehler oder Warnungen.

Die verbleibende Abnahme ist bewusst manuell beziehungsweise gegen die gemeinsam
ausgerollte Umgebung durchzufuehren. Sie darf nicht durch den statischen Vertragscheck als
erledigt betrachtet werden.

## Test- und Freigabematrix

Jedes Implementierungsticket prueft mindestens:

- dokumentierten Erfolgsfall und leere Antwort;
- 401/403 getrennt von 404 und Validierungsfehlern;
- 500 sowie Netzwerkabbruch ohne falschen Fachzustand;
- nullable und optionale Felder;
- wiederholte Requests bei zustandsaendernden Operationen;
- ungueltige oder unerwartete API-Antworten an der Systemgrenze.

Vor Abschluss eines Frontend-Tickets sind mindestens die gezielten Jest-Tests und
`yarn tsc --noEmit` auszufuehren. ESLint darf keine neuen Fehler oder Warnungen erzeugen.
Bei Backend-/OpenAPI-Aenderungen muss zusaetzlich der dort dokumentierte
JWT-OpenAPI-Routencheck erfolgreich sein.

## Branch- und Rolloutstrategie

- Fuer die Umsetzung einen eigenen Basisbranch `feature/jwt-openapi-alignment` vom dafuer
  vorgesehenen Integrationsbranch anlegen. Der aktuelle Oxygen-Branch sollte nicht dauerhaft
  als fachlich unpassende Basis dienen.
- Jedes Arbeitspaket als kleinen Feature- oder Bugfix-Branch umsetzen und nach Abnahme in
  den Basisbranch uebernehmen.
- Reine Frontend-Korrekturen aus Phase 1 koennen unabhaengig ausgeliefert werden.
- Bei Phase 2 zuerst eine rueckwaertskompatible Backend-Version samt OpenAPI ausrollen,
  danach das Frontend umstellen und erst anschliessend alte Varianten entfernen.

## Empfohlener naechster Schritt

Als naechstes werden die gezielten Frontendtests und die manuelle Abnahme von F-178
durchgefuehrt. Danach folgen Backend-Commit, kompatibler gemeinsamer Rollout und
**JWT-303 – gemeinsame Live-Smoke-Abnahme** gegen einen eindeutig versionierten Stand.
Zu pruefen sind dabei insbesondere beide Statuswechsel, das erneute Laden der
Pinned-Arbeitskopie sowie die vorhandenen 409-/422-Fehlerpfade. JWT-201 bleibt bis zur
fachlichen Freigabe der Favoritenfunktion bewusst zurueckgestellt; F-179 wird nicht durch
eine clientseitige Annahme vorweggenommen.

## Definition of Done fuer das Gesamtvorhaben

- Alle in der Abweichungsanalyse aufgefuehrten Punkte sind umgesetzt oder als bewusst
  akzeptierte Vertragsentscheidung dokumentiert.
- OpenAPI, Backend-Verhalten und Frontend-Validierung stimmen ueberein.
- Gezielte Tests, TypeScript-Pruefung und Lint-Pruefung sind erfolgreich.
- Gekoppelte Aenderungen besitzen eine dokumentierte kompatible Rolloutreihenfolge.
- Die erneute Route-fuer-Route-Pruefung findet keine unbegruendete Luecke.


## Verbindliche Entscheidung und Aufträge zu JWT-201/JWT-202 (30.10.2026)

Die folgenden bestätigten Nutzerentscheidungen ersetzen die vorher noch offenen
Varianten für diese beiden Arbeitspakete:

- JWT-201: Favoriten später umsetzen; vorerst deaktivierter Hinweis „Demnächst
  verfügbar“, keine scheinbare Schreibaktion über die Briefsuche.
- JWT-202: Zielzustand statt Toggle. Beim bestätigten Schließen persönliche
  Arbeitskopie/History/Uploads verwerfen; bei unveröffentlichten Änderungen vorher
  warnen und Abbrechen ohne Request ermöglichen. Keine ruhenden Arbeitskopien.
- Backend und Frontend gemeinsam ausrollen, kein Legacy-Alias/Übergangsbetrieb.
- Ausführbarer Frontend-Arbeitsauftrag:
  [F116](F116_IDEMPOTENT_PINNING_CLOSE_WARNING_TICKET.md).
- Backend-Arbeitsauftrag und geplanter Vertrag:
  [F-167](../../../metamw_edge_version/audit/tickets/open/F-167.md).

JWT-202 ist inzwischen mit Frontend `15a2cbb` und Backend `065adff2` implementiert,
ausgerollt und manuell abgenommen. JWT-201 bleibt zurueckgestellt. Andere
JWT-Arbeitspakete werden nach ihrem jeweils dokumentierten Stand bearbeitet.


## Backend-Vertragsstand für JWT-203 und JWT-204A/B (30.10.2026)

Backend-F-168/F-169/F-170 und kanonische OpenAPI **0.4.0** sind committed und
ausgerollt. Verbindliche Übergabedetails im
Abschnitt Backend-Übergabe JWT-203/JWT-204A/JWT-204B der benachbarten
JWT_OPENAPI_BACKEND_DECISIONS.md. HTTP 201/entity_key:String bei Anlage;
xml_id nullable, Figure-MIME-Enum JPEG/PNG und optionale nullable Metadaten mit
inline-Defaults. Keine neue Figure-UI. Die kompatible Frontend-Umstellung ist in
`1445d11` ausgerollt; Backend-Vollsuite und Routenabgleich waren erfolgreich. JWT-301
wird in separaten Frontend-Patches fortgesetzt; Favoriten bleiben zurückgestellt.
