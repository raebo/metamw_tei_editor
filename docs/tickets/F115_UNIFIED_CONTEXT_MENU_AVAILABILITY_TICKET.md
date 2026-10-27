# F-115 – Kontextmenüs mit dauerhaft sichtbaren Aktionen vereinheitlichen

**Stand:** 27.10.2026

**Status:** Offen; fachliche Anforderung aufgenommen, technische Analyse steht aus.

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
