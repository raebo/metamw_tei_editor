# F-115 – Kontextmenüs mit dauerhaft sichtbaren Aktionen vereinheitlichen

**Stand:** 05.11.2026

**Status:** Umgesetzt; manuelle Abnahme ausstehend.

**Typ:** Feature

**Priorität:** Noch festzulegen

**Betroffener Bereich:** WYSIWYG-Editor, Rechtsklick-Kontextmenüs und deren
Untermenüs

## Ausgangslage

Die Kontextmenüs des WYSIWYG-Editors behandeln momentan nicht verfügbare Aktionen
uneinheitlich. Abhängig von Auswahl, Cursorposition und ausgewähltem TEI-Element
werden einzelne Einträge teilweise vollständig ausgeblendet. Dadurch verändert
sich die Menüstruktur und Benutzer können nur schwer erkennen, welche Funktionen
grundsätzlich existieren und warum sie an der aktuellen Stelle nicht nutzbar sind.

## Ziel

Alle Aktionen, die fachlich zum jeweils geöffneten Kontextmenü gehören, werden
immer an derselben Position angezeigt. Eine im aktuellen Kontext nicht ausführbare
Aktion bleibt sichtbar, ist jedoch deaktiviert und wird eindeutig ausgegraut.

„Alle Aktionen“ bezieht sich dabei auf den jeweiligen fachlichen Kontext. Ein
spezialisiertes Menü, beispielsweise für einen Autor oder Schreiber im Header,
zeigt weiterhin nur seine kontextbezogenen Aktionen und keine sachfremden
Body-Aktionen.

## Erwartetes Verhalten

- Die Einträge und ihre Reihenfolge bleiben innerhalb desselben Kontextmenüs
  unabhängig von der aktuellen Verfügbarkeit stabil.
- Nicht verfügbare Einträge werden nicht entfernt, sondern sichtbar deaktiviert.
- Deaktivierte Einträge unterscheiden sich optisch eindeutig von aktiven
  Einträgen, mindestens durch eine ausgegraute Darstellung von Text und Icon.
- Deaktivierte Einträge lassen sich weder per Maus noch per Tastatur auslösen und
  öffnen keinen Dialog beziehungsweise kein Untermenü.
- Untermenüs folgen demselben Prinzip. Enthält ein Untermenü aktuell keine
  ausführbare Aktion, bleibt der übergeordnete Eintrag sichtbar und stellt seinen
  deaktivierten Zustand verständlich dar.
- Aktive Einträge behalten ihr bisheriges Verhalten.
- Wenn ein fachlicher Grund verfügbar ist, wird er über einen Tooltip oder einen
  vergleichbaren barrierefrei erreichbaren Hilfetext erklärt.

## Technischer Arbeitsbereich

- Die Ermittlung der Sichtbarkeit und der Ausführbarkeit von Menüeinträgen
  voneinander trennen.
- Die vorhandenen Menüdefinitionen und Filter zentral darauf prüfen, ob sie
  Einträge anhand von Cursor, Auswahl, TEI-Knoten oder Bearbeitungszustand
  vollständig entfernen.
- Für jeden Eintrag einen einheitlichen deaktivierten Zustand an die
  Material-UI-Komponente übergeben.
- Einheitliche Styles für deaktivierten Text, Icons und Carets verwenden.
- Für verschachtelte Menüs sicherstellen, dass der Wechsel zwischen Ebenen und
  das Schließen des Menüs unverändert funktionieren.
- Semantik und Tastaturbedienung mit `disabled` beziehungsweise `aria-disabled`
  korrekt abbilden; ein nur optisch ausgegrauter, weiterhin ausführbarer Eintrag
  ist nicht zulässig.

## Umsetzung

- Haupt- und Untermenüs verwenden die gemeinsame Komponente
  `EditorCommandMenuItem`. Sie setzt den nativen deaktivierten Zustand,
  `aria-disabled`, die ausgegraute Darstellung und den erklärenden Hilfetext.
- Fachlich passende Aktionen bleiben sichtbar, wenn lediglich ihre aktuelle
  Voraussetzung fehlt. Dies gilt insbesondere für:
  - das Bearbeiten strukturierter Absatzinhalte,
  - das Bearbeiten und Löschen einzelner Listeneinträge bei Auswahl der gesamten
    Liste,
  - Zellen-, Zeilen- und Spaltenaktionen bei Auswahl einer Tabelle über ihr
    Caret,
  - das Löschen einer nicht vorhandenen Abschnittsüberschrift,
  - das Einfügen einer Adresszeile außerhalb einer geeigneten Position sowie
  - das Starten eines weiteren Bild-Uploads während eines laufenden Uploads.
- Spezialisierte Menüs, etwa für bestehende Auszeichnungen oder
  Autoren-/Schreiber-Kontexte, behalten ausschließlich ihre fachlich passenden
  Aktionen.
- Die Menügruppen für Textauswahl, kollabierten Cursor, Absatz, Liste und Tabelle
  behalten eine feste fachliche Reihenfolge. Ein deaktiviertes Untermenü öffnet
  sich nicht.

## Prüfung

- Automatisierte Tests prüfen aktive und deaktivierte Einträge, die
  Nichtauslösung deaktivierter Aktionen, erklärende Hilfetexte sowie den Wechsel
  zwischen Untermenüs.
- Gezielte Tests:
  `yarn test --runInBand tests/components/editor/letter/Center/LetterViewContainer/RightClickActionMenu.test.tsx tests/components/editor/letter/SectionAddressLine.test.tsx`
- Typprüfung: `yarn tsc --noEmit`
- Für die manuelle Abnahme sind insbesondere eine komplette Liste, das
  Tabellen-Caret, ein Absatz mit Auszeichnung und ein parallel laufender
  Bild-Upload zu prüfen. Die jeweils nicht ausführbaren Befehle müssen sichtbar,
  ausgegraut und ohne Auswirkung anklickbar beziehungsweise per Tastatur
  ansteuerbar sein.

### Korrekturen aus der manuellen Abnahme

- Der Deaktivierungsgrund wird nicht mehr ausschließlich als natives
  `title`-Attribut hinterlegt. Ein Material-UI-Tooltip zeigt die Hilfsmeldung nun
  auch über deaktivierten Menüeinträgen an.
- „Begrüßungsformel hinzufügen“ ordnet den gerenderten Absatz über dessen
  stabilen `data-editor-xml-path` dem Quell-XML zu. Zusätzliche WYSIWYG-Elemente
  wie Carets beeinflussen die Referenz nicht mehr.
- Regressionstests decken den sichtbaren Tooltip und das Öffnen der
  Begrüßungsformel ohne „Could not resolve node in XML doc“ ab.
- Bei den ersten drei Textmarkierungen einer Browser-Sitzung erscheint unten
  links ein Lernhinweis. Er nennt `Esc` sowie den Mausweg „Rechtsklick auf die
  Markierung → Markierung aufheben“, blendet sich nach sieben Sekunden aus und
  verschwindet unmittelbar beim Aufheben der Markierung. Danach bleibt die
  Bedienung ohne wiederkehrenden Hinweis verfügbar.

## Akzeptanzkriterien

- Innerhalb eines fachlichen Kontextmenüs werden verfügbare und nicht verfügbare
  Aktionen vollständig und in stabiler Reihenfolge angezeigt.
- Nicht verfügbare Aktionen sind eindeutig ausgegraut und können über Maus,
  Tastatur oder Shortcut des Menüeintrags nicht ausgelöst werden.
- Kontextfremde Aktionen werden weiterhin nicht in spezialisierte Menüs gemischt.
- Haupt- und Untermenüs verwenden dieselbe Darstellungs- und
  Deaktivierungslogik.
- Mindestens die Kontexte Textauswahl, kollabierter Cursor, Absatz, Liste,
  Tabelle sowie Header-Autor/Schreiber werden geprüft.
- Automatisierte Tests decken sichtbare aktive und deaktivierte Einträge,
  unveränderte Reihenfolge, fehlende Auslösung sowie mindestens ein Untermenü ab.
- Die manuelle Abnahme bestätigt, dass der jeweilige Funktionsumfang erkennbar
  bleibt und der deaktivierte Zustand ohne Ausprobieren verständlich ist.

## Abgrenzung

Dieses Ticket ändert nicht die fachlichen Voraussetzungen einzelner Aktionen und
führt keine neuen TEI-Bearbeitungsfunktionen ein. Es vereinheitlicht ausschließlich
deren Auffindbarkeit, deaktivierten Zustand und Darstellung in den vorhandenen
Kontextmenüs.
