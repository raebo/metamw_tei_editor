# F116: Arbeitsbrief explizit öffnen/schließen und vor Änderungsverlust warnen

**Stand:** 30.10.2026 · **Priorität:** P2 · **Status:** Frontend implementiert, automatisiert getestet und manuell abgenommen; gemeinsamer Rollout noch offen.
**Herkunft:** JWT-202 sowie bestätigte Nutzerentscheidung zum einfachen Schließverhalten.
**Backend-Gegenstück und geplanter Vertrag:** [F-167](../../../metamw_edge_version/audit/tickets/open/F-167.md).
**Verbindlicher API-Vertrag bei Umsetzung:** Backend `docs/openapi/jwt.yaml`, lokal über OPENAPI_SPEC_PATH. Keine unabhängig gepflegte OpenAPI-Kopie.

## Gemeinsame Entscheidung

- Öffnen erstellt die persönliche Arbeitskopie aus dem aktuellen kanonischen Brief. Wiederholtes Öffnen erhält eine schon offene Kopie einschließlich lokaler Änderungen und History.
- Beim bestätigten Schließen werden persönliche Arbeitskopie, Undo-/Redo-Historie und temporäre Uploads entfernt. Keine dauerhafte ruhende Arbeitskopie oder automatische Wiederaufnahmefunktion einführen.
- Vor dem Verlust unveröffentlichter Änderungen warnen; Abbrechen erhält Tab und Arbeitsstand unverändert und sendet keinen Schließrequest.
- Späteres Öffnen lädt den dann aktuellen kanonischen Stand, auch nach Änderungen aus anderer Quelle. Andere Benutzer besitzen ihre eigenen Kopien.
- Kanonischer Letter und physische XML-Datei bleiben beim Schließen erhalten. Tab schließen ist nicht das Verwerfen des gesamten neuen Briefs und nicht die administrative Deaktivierung.
- Backend/Frontend werden ausdrücklich gemeinsam ausgerollt. Kein Legacy-Alias, kein Übergangsbetrieb mit isPinned und keine zeitlich getrennte Aktivierung.

## FE1: Pinning und Schließwarnung

1. Vorhandene Tab-/Dialog-/Redux-/Autosave-Wege gemeinsam lesen. Einstieg: LetterTabs.tsx, CLOSE_TAB_WITH_CONTENT, EditorUtils.letterTabs.hasUnsavedChanges sowie apiPinnedLettersRequest.service.ts und zugehörige Mapper/Tests. Bestehenden Schließdialog nach Möglichkeit verwenden, keine parallele Dialogarchitektur aufbauen.
2. API-Service auf den in F-167 geplanten strikt booleschen Zielzustand `pinned` und die bestätigte Erfolgsantwort umstellen. Numerische kanonische Letter-ID verwenden. isPinned nicht mehr senden; keine Toggles und kein Erraten des Zielzustands aus einer Fehlermeldung.
3. Warnung mindestens bei unveröffentlichten Änderungen einschließlich bereits serverseitig gespeicherter Autosaves anzeigen. „Autosave gespeichert“ ist nicht „publiziert“. Ist der Zustand nicht zuverlässig als sauber erkennbar, konservativ warnen; keine neue komplexe Zustandsarchitektur und keine Prüfung aller geöffneten Briefe einführen.
4. Vorschlag für den Warntext: „Beim Schließen werden unveröffentlichte Änderungen, der Bearbeitungsverlauf und temporäre Uploads dieses Arbeitsbriefs verworfen. Der Brief selbst bleibt erhalten.“ Aktionen: „Abbrechen“ und „Änderungen verwerfen und schließen“. Texte über vorhandenes Deutsch-/Englisch-i18n.
5. Nur nach Bestätigung `pinned:false` senden. Abbrechen, Escape und Dialogschließen lösen keinen Request und keine Tab-/Redux-Bereinigung aus. Ein bestehender expliziter Publish-Weg darf angeboten werden, aber niemals automatisch veröffentlichen.
6. Laufende Autosaves/Uploads koordiniert abschließen oder Schließen währenddessen verhindern. Nach bestätigtem Schließrequest keine verspäteten Autosaves zulassen, die den Brief versehentlich wieder öffnen. Doppelklicks verhindern; kein neuer exklusiver Infrastrukturmechanismus erforderlich.
7. Erst nach validiertem HTTP-200-Zielzustand den lokalen Tab/Arbeitsstand entfernen und kontrolliert zum Nachbartab oder leeren Editor wechseln. Bei Fehler bleibt die UI erhalten und zeigt den Grund. 401/404/409/422/5xx und Netzwerkausfall nicht als erfolgreichen Abschluss werten. Bei unklarem Ergebnis Zustand nachlesen; keine automatischen Gegen-Toggles.
8. Wiederholtes true/false testen; bereits offene Kopien nicht neu laden oder überschreiben. Vorschau-Tabs ohne persistierte Arbeitskopie weiterhin lokal schließen, sofern keine unveröffentlichten Änderungen verloren gehen.

## FE2: Favoriten vorerst nur als Platzhalter (JWT-201)

Favoriten werden später fachlich/technisch umgesetzt. Jetzt vorhandene UI bei Bedarf als „Demnächst verfügbar“/„Coming soon“ kennzeichnen und nicht verfügbare Aktionen deaktivieren. Den wirkungslosen GET-Request mit FOOOBAR, letterId und isFavourite nicht mehr als Schreibaktion auslösen. Keine Erfolgsmeldung und keine simulierte Persistenz. Kein neuer Backend-Favoriten-Endpunkt, keine Datenhaltung oder Listensuche für diese spätere Funktion. Dieses kleine Teilpaket getrennt von FE1 patchen und testen.

## Tests und Abnahmekriterien

- Service sendet true/false korrekt, validiert bestätigten Zustand und unterscheidet Auth-/Fach-/Netzwerkfehler. Legacy-Parameter wird nicht gesendet.
- Brief ändern und autosaven: Schließwarnung erscheint trotzdem. Abbrechen/Escape erhält Inhalt, History, Tab und Uploads, kein Schließrequest.
- Bestätigen sendet genau einen false-Request; UI wird erst nach Erfolg bereinigt. Ein Fehler entfernt den Tab nicht.
- Doppelklick sowie laufende Autosave-/Upload-Vorgänge führen nicht zu verspätetem Wiederöffnen oder Verlust eines fremden Arbeitsstandes.
- Nach bestätigtem Schließen erneut öffnen: aktueller kanonischer Inhalt, keine Wiederaufnahme der verworfenen Kopie. Bereits publizierter Inhalt bleibt erhalten.
- Bereits offener Brief bleibt bei erneutem true unverändert. Mehrere Tabs werden nicht global geprüft.
- Platzhalter löst keinen Favoritenrequest und keine Erfolgsmeldung aus.
- Gezielte Jest-Tests und yarn tsc --noEmit; Lint ohne neue Fehler/Warnungen. Kanonischen OpenAPI-Vertrag und dessen Backend-Abgleich vor Abnahme prüfen. Tests noch nicht ausgeführt: dies ist ausschließlich ein Arbeitsauftrag.

## Vertrag und Zusammenarbeit

Das Backendticket F-167 enthält den geplanten Request-/Response- und Fehlervertrag. Die bestehende OpenAPI beschreibt bis zur Implementierung weiterhin das Legacy-Verhalten. Backend-Agent bearbeitet API/Service/OpenAPI/Backendtests und F-167; Frontend-Agent bearbeitet UI/Service/Parser/Jest/i18n und dieses Ticket. Jede Seite trägt ihren eigenen Commit-/Test-/Abnahmestand unten ein. Vertragliche Abweichungen zuerst gemeinsam abstimmen, nicht stillschweigend im Parser kompensieren.

Beide Seiten können parallel vorbereiten; gemeinsamer Rollout erst mit grünen Tests und zueinander passenden Releases. Keine Seite darf allein den neuen Vertrag produktiv aktivieren. Kein Commit, Push oder Deployment durch diesen Planungsauftrag.

## Risiken, Migration und Rollback

Keine Migration im Frontend. Bestätigtes Schließen verwirft persönliche unveröffentlichte Arbeit bewusst; die Warnung ist deshalb zentral. Nicht mit Briefverwerfen oder Admin-Deaktivierung vermischen. Koordinierter Rollback beider Komponenten; der alte Backend-Toggle macht wiederholte Zielzustandsrequests unsicher. Verlorene, ausdrücklich verworfene Arbeitsstände nicht automatisch rekonstruieren.

## Bearbeitungsnachweis

- FE1 Implementierung: vorbereitet. Der Client sendet `{ "pinned": true|false }`,
  validiert den bestätigten Zielzustand und liest nach einem Netzwerkausfall den
  persönlichen Pin-Stand nach. Entsprechend dem kanonischen OpenAPI-Vertrag 0.3.0
  erfolgt diese Nachprüfung auch nach HTTP 5xx, weil die Arbeitskopie bei einem
  Fehler der nachgelagerten Staging-Bereinigung bereits geschlossen sein kann.
  Ein Arbeitsbrief mit `contentChanged:true` zeigt vor dem Schließen die
  Verlustwarnung; ein nachweislich unveränderter Arbeitsbrief wird ohne unnötige
  Bestätigung geschlossen. Abbruch bereinigt keinen Zustand und
  sendet keinen Request; der lokale Tab wird erst nach bestätigtem `pinned:false`
  entfernt. Laufende Inhaltsänderungen, Uploads und Lifecycle-Aktionen blockieren
  Öffnen und Schließen; doppelte Requests werden verhindert.
- FE2 Favoriten-Platzhalter: vorbereitet. Beide Favoritenaktionen sind sichtbar
  deaktiviert und als „Demnächst verfügbar“ gekennzeichnet. Der wirkungslose
  `FOOOBAR`-Suchrequest und die simulierte Erfolgsmeldung wurden entfernt.
- Frontendtests am 30.10.2026: 44 gezielte Jest-Tests grün
  (`apiPinnedLettersRequest.service`, `LetterTabs`,
  `CloseTabWithContentDialog`, `ShowEditor.selection`, `backendService`);
  `yarn tsc --noEmit` grün; gezielter Lint der neuen beziehungsweise vollständig
  überarbeiteten F116-Dateien ohne Fehler oder Warnungen. Bestehende React/MUI-
  Testkonsolenhinweise in älteren Toolbar-/Tabtests bleiben unverändert.
- FE1/FE2 Commit: offen.
- Backend-Freigabe: F-167 ist mit Backend-Commit `065adff2` implementiert und
  übergeben; OpenAPI 0.3.0 stimmt mit dem Frontend überein. Backendnachweise:
  59 gezielte Beispiele ohne Fehler, endgültige Vollsuite mit 1815 Beispielen,
  0 Fehlern und 17 bestehenden Pending sowie OpenAPI-Abgleich 67/67. Der
  ausgerollte Stand ist noch nachzutragen.
- Gemeinsames Release/Umgebung/Datum: offen.
- Manuelle Frontendabnahme am 30.10.2026: erfolgreich. Veränderte Arbeitsbriefe
  zeigen die Verlustwarnung; unveränderte Arbeitsbriefe schließen ohne unnötige
  Bestätigung. Abbrechen und bestätigtes Schließen verhalten sich wie vorgesehen.
- Gemeinsame Live-Abnahme nach koordiniertem Deployment mit Wiederöffnen, zweitem
  Benutzer und provoziertem Fehlerfall: offen.


## Backend-Übergabe F-167: Arbeitsbaumstand 30.10.2026

Backend implementiert den abgestimmten Vertrag im Arbeitsbaum; kanonische
OpenAPI-Version jetzt **0.3.0**, weiterhin 67 JWT-Operationen. Keine neue Route.
Request ausschließlich JSON `{ "pinned": true }` beziehungsweise false; Erfolg
HTTP 200 mit pinned als tatsächlichem Bool-Zielzustand und message
`Pinned state updated`. Kein isPinned-Alias, kein X-Letter-Version für Pinning.

HTTP 401 unverändert; 404 letter_not_found; 422 invalid_pinning_parameters;
409 bei tatsächlicher Sperre/unklarer Kopie (letter_has_pending_writes,
letter_state_inconsistent, letter_has_other_working_copies); 500
letter_operation_failed. Der ursprüngliche JSON-Body wird strikt geprüft.

Wichtig für FE1-Fehlerbehandlung: Bei HTTP 500 nach fehlgeschlagener
Staging-Bereinigung kann die DB-Arbeitskopie bereits geschlossen sein. Auch
diesen unklaren Abschluss durch Pinned Index abgleichen, nicht nur reine
Netzwerkfehler. Ein kanonischer Letter-GET ist hierfür kein Nachweis des
persönlichen Pin-Zustands, weil der Brief erhalten bleibt. Keine automatische
Rekonstruktion und keine Gegen-Toggles. Rest-Staging wird über protokollierte
Editor-ID vom Betreiber bereinigt; keine internen IDs oder XML-Inhalte im
Fehlerdialog ausgeben.

Gezielter Backend-Testbereich: **59 Beispiele, 0 Fehler**; OpenAPI-Routenabgleich
67/67, Diff-Prüfung grün. Vollsuite mit 16 Workern läuft noch. Backend noch
uncommitted und nicht deployed. Endgültige Freigabe/Nachweis folgt in F-167.
Gemeinsamer Rollout bleibt erforderlich. Frontendcode durch diesen
Backend-Auftrag nicht verändert; vorliegende FE-Testergebnisse stammen aus
dem dort dokumentierten Frontend-Auftrag.


## Endgültiger Backend-Testnachweis F-167 (30.10.2026)

Backend-Vollsuite grün: **1815 Beispiele, 0 Fehler, 17 bestehende Pending**,
280 Sekunden, parallel_rspec mit 16 Workern. Gezielter Bereich 59/0; nach
Umstellung eines alten bodylosen Undo-/Redo-Testaufbaus zusätzlich 30/0.
OpenAPI **0.3.0**, weiterhin **67/67** registrierte JWT-Operationen;
Formatprüfungen grün. Vertragsdetails und Fehlerfälle wie im vorstehenden
Backend-Übergabeabschnitt implementiert, einschließlich HTTP-500-Reconciliation.

Dieser Nachweis ersetzt dort den Zwischenstand mit noch laufender Vollsuite.
Backend weiterhin nur im Arbeitsbaum, kein Implementierungscommit, Push oder
Deployment. Vor gemeinsamer Freischaltung Commit-/Release-Stände beider Seiten
festhalten und F116 gemeinsam abnehmen. Keine Backend-Übergangsvariante oder
isPinned-Unterstützung. Frontend-Anwendungsdateien durch den Backend-Auftrag
nicht verändert; Frontendtests hier nicht erneut ausgeführt.
