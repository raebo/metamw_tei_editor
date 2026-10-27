# F-114 – BUG: Begrüßungsformel kann nicht angelegt werden

**Stand:** 27.10.2026

**Status:** Offen; Fehler gemeldet, technische Analyse steht aus.

**Typ:** Bug

**Priorität:** Noch festzulegen

**Betroffener Bereich:** WYSIWYG-Editor, Kontextmenü eines Schreibakts,
`ADD_GREETINGS_FORMULA`

**Bezug:** OXY-011 in `docs/tickets/OXYGEN_FEATURE_MIGRATION.md`

## Fehlerbeschreibung

Das Anlegen einer neuen Begrüßungsformel im WYSIWYG-Editor funktioniert nicht.
Die bereits vorhandene Aktion zum Hinzufügen einer Begrüßungsformel führt nicht
zu einer erfolgreich gespeicherten neuen Begrüßungsformel im Brief.

Die genaue sichtbare Ausprägung – beispielsweise ausbleibende Einfügung,
Fehlermeldung oder fehlerhaftes TEI-Markup – muss bei der Reproduktion noch
festgehalten werden.

## Reproduktion

1. Einen bearbeitbaren Brief im WYSIWYG-Editor öffnen.
2. Einen geeigneten Schreibakt beziehungsweise die dafür vorgesehene Textstelle
   über das Kontextmenü auswählen.
3. „Begrüßungsformel hinzufügen“ aufrufen.
4. Position, Ausrichtung und Begrüßungstext eingeben.
5. Den Dialog speichern.

## Aktuelles Verhalten

Es wird keine erfolgreich nutzbare Begrüßungsformel angelegt. Das genaue
Fehlerbild sowie Browser- und Backend-Logs sind im Rahmen der Analyse zu ergänzen.

## Erwartetes Verhalten

- Die Begrüßungsformel wird an der ausgewählten, fachlich zulässigen Position im
  zugehörigen Schreibakt eingefügt.
- Text und gewählte Ausrichtung werden als valides TEI-Markup gespeichert.
- Die neue Begrüßungsformel ist unmittelbar in der WYSIWYG-Ansicht sichtbar.
- Nach einem erneuten Laden des Briefes bleibt sie erhalten.
- Undo/Redo und der Änderungsstatus des Briefes werden korrekt aktualisiert.
- Ungültige Einfügepositionen oder Eingaben erzeugen eine verständliche
  Fehlermeldung und verändern das XML nicht.

## Analysebereich

- Kontextmenüaktion und temporäre Markierung des Zielknotens in
  `src/constants/menuItems.ts`
- Dialogsteuerung in `EditorFormDialog.tsx`
- Einfüge- und Bearbeitungslogik in `GreetingsFormulaDialog.tsx`
- Auflösung des Zielknotens nach Öffnen des Dialogs
- erzeugtes TEI-Markup sowie Aufruf und Ergebnis des Backend-Patches
- Verhalten nach erneutem Rendern und Neuladen des Briefes

## Akzeptanzkriterien

- Der Fehler ist mit einem konkreten Brief und einer dokumentierten Zielstruktur
  reproduziert und seine Ursache beschrieben.
- Eine neue Begrüßungsformel kann über den vorgesehenen Kontextmenüeintrag
  angelegt und gespeichert werden.
- Die Einfügung erfolgt ausschließlich im ausgewählten Schreibakt und erzeugt
  keine doppelten oder verwaisten Elemente beziehungsweise temporären IDs.
- Bestehende Begrüßungsformeln und übriger Briefinhalt bleiben unverändert.
- Abbrechen, Escape und ein fehlgeschlagener Speichervorgang verändern das XML
  nicht.
- Mindestens ein Regressionstest deckt die erfolgreiche Einfügung ab; zusätzlich
  werden ein ungültiger Zielknoten und das Abbrechen des Dialogs geprüft.

## Abgrenzung

Die vollständige Umsetzung der übrigen in OXY-011 genannten Briefstrukturen
– unter anderem Dateline, Schlussformel, Signatur, Motto und Überschrift – ist
nicht Bestandteil dieses Bugfixes.
