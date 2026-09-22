# Ticket: Vollständiges TEI-XML bei WYSIWYG-Auszeichnungen erhalten

Stand: 22. September 2026

Status: umgesetzt und durch Regressionstests abgedeckt, noch nicht committed

## Problem

Beim Auszeichnen einer Textstelle im WYSIWYG-Editor wurde das für die Anzeige
erzeugte HTML-DOM wieder als XML serialisiert. Dieses DOM ist absichtlich gegen
XSS gefiltert und enthält nur eine kleine Positivliste von Attributen. Außerdem
normalisiert der Browser XML-Tagnamen als HTML-Tagnamen.

Dadurch gingen vor dem Speichern unter anderem XML-Deklaration, Namespaces,
Groß-/Kleinschreibung sowie TEI-Attribute wie `target`, `hands`, `cert`,
`notAfter`, `notBefore`, `ident`, `status`, `sortKey` und `xml:space` verloren.
Reproduziert wurde der Fehler mit `fmb-1821-01-31-01` beim Einfügen einer
Ortsauszeichnung für Zwickau.

## Ursache

`XMLDisplayParser.tsx` erzeugt aus dem vollständigen XML eine sichere
React-/HTML-Vorschau. `RightClickActionMenu.tsx` las diese Vorschau nach einer
Textmarkierung über `extractDocumentByRef()` zurück und ersetzte damit den
vollständigen XML-Inhalt im Redux-State. Neu erzeugte Elemente wurden erst
danach namespace-bewusst angelegt, weshalb nur diese Elemente vollständig
wirkten.

## Umsetzung

- Das Vorschau-DOM bleibt ausschließlich Darstellung und wird nie wieder zur
  maßgeblichen XML-Quelle.
- Gerenderte Elemente erhalten einen internen Pfad zu ihrem Ursprungsknoten.
- Eine Textauswahl wird anhand dieses Pfads und ihrer lokalen Offsets auf eine
  frisch geparste Kopie des vollständigen Redux-XML übertragen.
- Die vorhandene XSS-Filterung der Vorschau bleibt unverändert aktiv.
- Vor Backend-Schreibzugriffen wird eine fehlende XML-Deklaration ergänzt.
- Regressionstests prüfen Namespace, Tagnamen und nicht modellierte Attribute.

## Abnahmekriterien

- Eine WYSIWYG-Auszeichnung verändert keine vorhandenen Elemente oder
  Attribute außerhalb der markierten Textstelle.
- `TEI`, Default-Namespace, `xmlns:xsi`, `xsi:schemaLocation`, `xml:space` und
  beliebige gültige TEI-Attribute bleiben erhalten.
- Das Backend erhält ein wohlgeformtes Dokument mit XML-Deklaration.
- Die Anzeige führt weiterhin keine aktiven HTML-/Event-Attribute aus.
- Bereits beschädigte Arbeitskopien werden nicht automatisch rekonstruiert;
  sie müssen vor weiterer Bearbeitung auf den kanonischen Stand rebased werden.
