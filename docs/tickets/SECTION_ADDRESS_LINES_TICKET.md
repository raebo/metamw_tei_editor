# Adresszeilen vor Abschnitten einfügen und bearbeiten

**Status:** implementiert; fachliche Browser-/Publish-Abnahme offen. **Stand:** 22.10.2026.

## Ziel und Bedienung

- Klick auf das Dreieck eines Briefabschnitts öffnet dessen Menü mit „Adresszeile einfügen“.
- Ein Klick auf diese Aktion fügt unmittelbar vor dem gewählten Abschnitt eine Adresszeile mit dem Anfangsinhalt `ADRLINE` ein. Weitere Zeilen an derselben Stelle werden demselben Adressblock hinzugefügt.
- Alternativ im Brieftext mit Linksklick einen Abschnitt wählen und über dessen Kontextmenü oder `Strg+Alt+C` eine Adresszeile davor einfügen. Der Shortcut bleibt ohne gewählten Abschnitt, außerhalb des Briefs und in Dialogen/Eingabefeldern inaktiv.
- Jede Zeile erhält im Editor ein ausgefülltes Rechteck als sichtbare Markierung, auch bei leerem Inhalt.
- Rechtsklick auf die Markierung oder Zeile bietet „Adresszeile bearbeiten“ und „Adresszeile löschen“ an. Bearbeiten öffnet ein einzeiliges Textfeld; Abbrechen verändert nichts.
- Beim Löschen der letzten `<addrLine>` wird auch das umgebende `<address>` entfernt. Anschließend leere, ausschließlich für diesen Block erzeugte Hüllelemente werden ebenfalls entfernt. Nachbarabschnitte, andere Zeilen und fremde Inhalte bleiben unverändert.
- Markierungen sind auch per Tastatur erreichbar und gelangen nicht ins gespeicherte XML.

## TEI-Vertrag

TEI P5 definiert [`<addrLine>`](https://tei-c.org/release/doc/tei-p5-doc/en/html/ref-addrLine.html) als Zeile innerhalb von [`<address>`](https://tei-c.org/release/doc/tei-p5-doc/en/html/ref-address.html). `type="addrline"` ist eine projektspezifische Kennzeichnung des umgebenden Abschnitts, kein Ersatz für das Element `<addrLine>`.

Für einen unnummerierten Abschnitt ergibt sich beispielsweise:

```xml
<div xmlns="http://www.tei-c.org/ns/1.0" type="addrline" xml:id="address_block_example">
  <p>
    <address>
      <addrLine xml:id="address_line_example">Herrn Felix Mendelssohn Bartholdy</addrLine>
    </address>
  </p>
</div>
```

Bei nummerierten Abschnitten die vorhandene Ebene (`div1` bis `div7`) als Geschwisterelement beibehalten. Die Umsetzung bearbeitet gezielt diese Adressblöcke; bestehende Empfänger-/Absenderadressen werden nicht global ersetzt. Strukturierte Altinhalte dürfen durch ein reines Textfeld nicht stillschweigend eingeebnet werden.

## Frontend

- Abschnittsmarker, Kontextmenü und XML-Darstellung erweitern.
- DOM-basierte Hilfsfunktionen für Einfügen, Lesen, Bearbeiten und gezieltes Löschen; stabile XML-IDs, TEI-Namespace und fremde Attribute erhalten.
- Dialog über bestehende Redux-Referenzen integrieren; deutsche/englische UI-Texte über i18n.
- Bestehenden Editor-Speicherweg und Änderungstypen `ADDRLINE_ADDED`, `ADDRLINE_CHANGED` und `ADDRLINE_REMOVED` verwenden.

## Backend

Keine neue API vorgesehen: Der vorhandene Editor-Schreibpfad wird weiterverwendet. Das Backend-Enum benötigt die Einträge `addrline_added: 401`, `addrline_changed: 402` und `addrline_removed: 403`, damit Einfügen, Bearbeiten und Löschen getrennt nachvollziehbar sind. Vorhandene Validierung und Publish-Verarbeitung müssen den TEI-Block unverändert erhalten. Das projektspezifische Schema ist bei der fachlichen Publish-Abnahme zusätzlich zu prüfen; die TEI-Referenz ersetzt keine Prüfung gegen das eingesetzte Projektschema.

## Akzeptanz und Tests

- Einfügen vor erstem, mittlerem und verschachteltem Abschnitt; wiederholtes Einfügen verwendet denselben Adressblock.
- Zeilen sind leer und gefüllt sichtbar, rechtsklickbar und einzeln bearbeitbar/löschbar.
- Löschen einer von mehreren Zeilen erhält die übrigen. Löschen der letzten entfernt `<address>` und nur leere eigene Hüllen.
- Text mit XML-Sonderzeichen wird als Text gespeichert; mehrzeiliger/ungültiger Inhalt wird zurückgewiesen. Strukturierte Inhalte und fremde XML-Daten bleiben erhalten.
- Komponenten-/Regressionstests decken Menü, Dialog, Rendering und XML-Operationen ab; TypeScript und betroffene Lint-Prüfung laufen fehlerfrei.

Bestehende Blöcke mit `type="addrLine"` werden ebenfalls zum Bearbeiten, Löschen und Ergänzen erkannt; neue Blöcke verwenden weiterhin `type="addrline"`. Rechtsklick ist direkt auf dem Text `ADRLINE` und auf dem Rechteck möglich.
