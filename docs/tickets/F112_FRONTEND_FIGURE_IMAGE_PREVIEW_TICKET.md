# F-112 – Vergrößerte Figure-Vorschau im WYSIWYG-Editor

**Status:** in Umsetzung. **Priorität:** P2. **Zuständigkeit:** Frontend-Team.

## Ausgangslage

Figures werden im Brief entsprechend ihrer TEI-Layoutattribute dargestellt. Insbesondere
`rend="inline"` und kleine `subtype`-Werte können zu einer sehr kleinen, für Details kaum
lesbaren Darstellung führen.

## Ziel

Ein Linksklick auf ein erfolgreich geladenes Figure-Bild öffnet eine vergrößerte Vorschau in
einem schwebenden Panel. Die Vorschau verändert weder XML noch Layoutattribute und verwendet
dieselbe bereits geladene Object-URL; es erfolgt kein zusätzlicher Backend-Aufruf.

## UI- und Barrierefreiheitsanforderungen

- Das Bild wird als fokussierbare Schaltfläche mit sichtbarem `zoom-in`-Hinweis angeboten.
- Maus, Enter und Leertaste öffnen dieselbe Vorschau.
- Das Panel zeigt Bild und Alternativtext und passt sich an den verfügbaren Viewport an.
- Escape, Klick auf den Hintergrund und eine sichtbare Schließen-Schaltfläche schließen das
  Panel; anschließend wird der Fokus durch das Dialogverhalten zum Auslöser zurückgeführt.
- Im Panel kann der Benutzer das Bild schrittweise vergrößern und verkleinern. Der aktuelle
  Zoomfaktor wird verständlich angezeigt und kann auf 100 Prozent zurückgesetzt werden.
- Die Zoomgrenzen verhindern sowohl ein versehentliches vollständiges Verkleinern als auch eine
  unkontrolliert große Darstellung; vorgesehen sind 50 bis 300 Prozent.
- Lade- und Fehlerplatzhalter öffnen keine Vorschau.
- SVG-Altbestand wird weiterhin ausschließlich als `<img>`-Quelle verwendet und niemals als
  DOM-Inhalt eingebettet.

## Technische Anforderungen

- Die bestehende Blob-/Object-URL wird wiederverwendet.
- Öffnen und Schließen erzeugen keinen weiteren Request an die JWT-Figure-Route.
- Zoomen verändert ausschließlich die Darstellung der vorhandenen Object-URL und erzeugt
  ebenfalls keinen weiteren Request.
- Der bestehende Object-URL-Lebenszyklus einschließlich `URL.revokeObjectURL()` bleibt erhalten.
- Die vergrößerte Darstellung darf nicht durch `rend`, `subtype` oder die Thumbnail-CSS-Größe
  begrenzt werden.

## Akzeptanzkriterien

- Linksklick, Enter und Leertaste öffnen für ein geladenes Bild das Vorschau-Panel.
- Das Bild wird innerhalb des Viewports deutlich größer und ohne Verzerrung dargestellt.
- Das Panel besitzt einen zugänglichen Namen und eine zugängliche Schließen-Schaltfläche.
- Vergrößern, Verkleinern und Zurücksetzen sind per Maus und Tastatur bedienbar; nicht mögliche
  Zoomschritte sind deaktiviert.
- Nach dem Schließen bleibt die Figure im Brief unverändert sichtbar.
- Pro Öffnen erfolgt kein zusätzlicher Netzwerkaufruf.
- Fehler- und Platzhalterzustände sind nicht interaktiv.
- Komponenten-/Regressionstests decken Öffnen, Schließen, Zoomen und die Wiederverwendung der
  Object-URL ab.

## Nicht Bestandteil

- Bearbeitung, Zuschnitt, Rotation oder Download des Bildes;
- freies Verschieben per Drag-and-drop innerhalb der Vorschau;
- Änderungen an TEI-XML, Upload-API oder Backend;
- Darstellung beliebiger externer Bild-URLs.
