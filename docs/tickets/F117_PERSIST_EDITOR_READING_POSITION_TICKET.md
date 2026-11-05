# F-117 – Letzte Bearbeitungsposition benutzerbezogen speichern

**Stand:** 05.11.2026

**Status:** Offen; Idee für spätere Umsetzung aufgenommen.

**Typ:** Feature

**Priorität:** P3 (niedrig)

**Betroffener Bereich:** WYSIWYG-Editor, persönlicher Arbeitsstand, JWT-Backend

## Ausgangslage

Der Editor stellt nach einem internen Neuladen des XML-Dokuments die lokale
Scrollposition wieder her. Diese Position existiert ausschließlich während der
laufenden Editor-Sitzung. Nach Abmeldung, Browser-Neustart oder Wechsel des
Arbeitsgeräts beginnt ein erneut geöffneter Brief wieder am Dokumentanfang.

## Ziel

Für jeden Benutzer und Brief wird die zuletzt betrachtete beziehungsweise
bearbeitete Position serverseitig gespeichert. Öffnet derselbe Benutzer den Brief
nach einer erneuten Anmeldung, wird der WYSIWYG-Viewport nach dem Rendern möglichst
nah an dieser Position wiederhergestellt.

## Fachliches Verhalten

- Die Position gehört zum persönlichen Arbeitsstand des angemeldeten Benutzers
  und verändert weder TEI-XML noch den gemeinsamen Briefinhalt.
- Positionen unterschiedlicher Benutzer und Briefe bleiben strikt getrennt.
- Die Speicherung erfolgt gedrosselt und zusätzlich bei geeigneten
  Abschlussereignissen, beispielsweise Tabwechsel oder Schließen eines Briefes.
- Ein Fehler beim Speichern oder Laden darf das Öffnen und Bearbeiten des Briefes
  nicht blockieren.
- Ist die gespeicherte Stelle nach einer Inhaltsänderung nicht mehr vorhanden,
  verwendet das Frontend eine dokumentierte Rückfallposition.
- Beim Verwerfen einer persönlichen Arbeitskopie beziehungsweise beim endgültigen
  Löschen eines Briefes wird die zugehörige Position bereinigt.

## Technischer Vorschlag

Eine reine Pixelposition ist bei verändertem Inhalt, anderer Fenstergröße oder
abweichender Schriftgröße nicht stabil genug. Der Vertrag sollte deshalb eine
kombinierte Position vorsehen:

- stabile TEI-Referenz, bevorzugt `xml:id` eines sichtbaren Elements,
- relativer Abstand des Viewports zu diesem Element,
- optionaler Scrollanteil oder Pixelwert als Rückfallwert,
- Zeitstempel der letzten Aktualisierung.

Frontend und Backend legen vor der Umsetzung ein kanonisches JWT-Schema fest.
Der Vertrag wird in `docs/openapi/jwt.yaml` des Backend-Repositories ergänzt.

## Frontend-Aufgaben

- Erstes geeignetes sichtbares TEI-Element und relativen Abstand bestimmen.
- Änderungen gedrosselt übertragen; keine Anfrage für jedes Scroll-Ereignis.
- Gespeicherte Position beim Öffnen eines Briefes laden.
- Position erst nach abgeschlossenem WYSIWYG-Render wiederherstellen.
- Rückfallreihenfolge für fehlende Referenzen implementieren und testen.
- Code-Ansicht und WYSIWYG-Ansicht im Vertrag eindeutig unterscheiden.

## Backend-Aufgaben

- Benutzer- und briefbezogene Speicherung modellieren.
- Autorisierung ausschließlich für den eigenen Positionsdatensatz sicherstellen.
- Idempotente Lese- und Schreiboperationen bereitstellen.
- Bereinigung bei Discard beziehungsweise endgültigem Löschen berücksichtigen.
- Request, Response, Fehlercodes und Null-/Nichtvorhanden-Semantik in OpenAPI
  dokumentieren und mit Vertragstests absichern.

## Akzeptanzkriterien

- Nach Abmeldung und erneuter Anmeldung öffnet ein Brief nahe der zuletzt
  gespeicherten Stelle.
- Die Wiederherstellung funktioniert auch auf einem anderen Gerät mit anderer
  Fenstergröße sinnvoll.
- Andere Benutzer erhalten nicht die Position des vorherigen Bearbeiters.
- Änderungen oberhalb der gespeicherten Stelle führen nicht automatisch zu einer
  falschen absoluten Pixelposition.
- Fehlende oder veraltete Anker werden ohne Fehlermeldung auf eine definierte
  Rückfallposition abgebildet.
- Netzwerkfehler der Positionsfunktion verhindern die Briefbearbeitung nicht.
- Frontend-, Backend- und OpenAPI-Vertragstests decken Erfolgs-, Leer-,
  Berechtigungs- und Fehlerfälle ab.

## Abgrenzung

Die im aktuellen Bugfix lokal wiederhergestellte Scrollposition bei einem
XML-Neuladen bleibt unabhängig von diesem Ticket bestehen. F-117 erweitert diese
Funktion später um sitzungs- und geräteübergreifende Persistenz und erfordert eine
abgestimmte Backend-Schnittstelle.
