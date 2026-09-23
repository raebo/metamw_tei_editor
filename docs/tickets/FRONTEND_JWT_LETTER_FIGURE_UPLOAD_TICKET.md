# Ticket: Frontend-Integration für Figures in TEI-Briefen

Stand: 23. September 2026. Backend-Grundlage: F-109 auf Branch
`feature/20260923_f109_jwt_letter_figure_upload`, Commit `6507a9e` plus die
darauf aufbauende JWT-Auslieferung für publizierte Figure-Bilder im aktuellen
Branch-Stand.

Die Frontend-Integration wird in zwei getrennt abnehmbare Untertickets geteilt:

1. F-110 stellt bereits im XML vorhandene Figures im WYSIWYG-Editor dar.
2. F-111 ergänzt darauf aufbauend Auswahl, Upload und Zuweisung neuer Figures.

F-111 darf erst nach oder gemeinsam mit F-110 ausgerollt werden.

## Gemeinsame Voraussetzungen und API-Grundsätze

- Das Backend mit F-109 und der erweiterten JWT-Figure-Auslieferung muss vor
  oder gemeinsam mit dem Frontend ausgerollt werden.
- Die Authentifizierung erfolgt wie bei den vorhandenen JWT-Editor-Endpunkten
  über das Cookie `Authentication`.
- Die Routen erwarten als `pinned_letter_id` die Datenbank-ID des kanonischen
  Briefs. Nicht die ID der `Editor::UserPinnedLetter`-Relation verwenden.
- Ausschließlich ein vom aktuellen Benutzer gepinnter Brief darf über die
  JWT-Figure-Route gelesen oder bearbeitet werden.
- Für die Anzeige von Figure-Bildern darf der JWT-Editor weder `graphic/@url`
  noch die öffentliche Route `/api/letters/letter_image/...` laden.
- Gestagte und bereits publizierte Bilder werden einheitlich über die
  JWT-geschützte Figure-URL geladen.
- Backend-, XML- und Nutzereingaben gelten als nicht vertrauenswürdig und
  werden ausschließlich als Text beziehungsweise kontrollierte React-Nodes
  dargestellt.

---

## F-110 – Vorhandene TEI-Figures im WYSIWYG-Editor anzeigen

**Status:** umgesetzt und getestet. **Priorität:** P2. **Zuständigkeit:** Frontend-Team.

**Umsetzungsstand:** Die geschützte Figure-Anzeige wurde mit den Commits
`af5c0e6` und `09a04c7` umgesetzt. Parser-, Komponenten- und API-Tests decken
unter anderem JPEG, PNG, SVG-Altbestand, sichere Layoutattribute,
Fehlerzustände und den Object-URL-Lebenszyklus ab. Eine fachliche manuelle
Abnahme bleibt von diesem technischen Status unberührt.

### Ziel

Der WYSIWYG-Editor stellt alle darstellbaren `<figure>`-Elemente aus der
aktuellen XML-Arbeitskopie dar. Das gilt sowohl für bereits publizierte Bilder
als auch für gestagte Uploads, die sich schon in der Arbeitskopie befinden.

Das Frontend leitet die Bildadresse ausschließlich aus der kanonischen
Brief-ID und `figure/@xml:id` ab. Kategorie, Dateiname und `graphic/@url`
werden nicht in eine Download-URL umgerechnet.

### Geschützte Figure-Anzeige

```http
GET /jwt/editor/pinned_letters/:pinned_letter_id/figures/:figure_xml_id/image
Cookie: Authentication=<JWT>
```

Der Endpunkt:

- sucht die Figure anhand ihrer eindeutigen `xml:id` in der aktuellen
  XML-Arbeitskopie;
- validiert die dort hinterlegte `graphic/@url` serverseitig;
- verwendet zuerst einen zum aktuellen Editorbrief gehörenden gestagten
  Upload;
- fällt andernfalls auf die referenzierte publizierte Datei zurück;
- antwortet mit `404`, wenn Figure, Bildreferenz oder Datei fehlt.

Der Endpunkt liefert Bilder inline. Mögliche Medientypen sind:

- `image/jpeg`;
- `image/png`;
- `image/svg+xml` ausschließlich für bereits publizierte Dateien aus dem
  Altbestand.

SVG-Antworten werden ausschließlich als Bildquelle verwendet. Der SVG-Inhalt
darf weder gelesen noch mittels `innerHTML`, `dangerouslySetInnerHTML` oder
einer vergleichbaren API in das DOM übernommen werden.

### URL-Bildung

Beim initialen Laden, Reload sowie nach Undo, Redo oder Publish erhält das
Frontend die Figures innerhalb von `xml_content`. Für jedes darzustellende
`<figure xml:id="…">` wird die Bild-URL ausschließlich aus Brief-ID und
URL-kodierter Figure-ID gebildet:

```text
/jwt/editor/pinned_letters/<letter_id>/figures/<figure_xml_id>/image
```

Figures ohne eindeutige `xml:id` können über diesen Vertrag nicht geladen
werden. Das Frontend darf keine ID erzeugen oder das XML zur Anzeige verändern,
sondern zeigt für eine solche Figure einen lokalen Platzhalter.

Bei `fetch()` müssen Cookies mitgesendet und die Antwort als `Blob` verarbeitet
werden. Erzeugte Object-URLs sind beim Austausch, beim Entfernen einer Figure
und beim Unmount mit `URL.revokeObjectURL()` freizugeben. Liegt Frontend und API
unter demselben Origin und wird die Figure-URL direkt als `<img src>` verwendet,
wird das Cookie entsprechend der vorhandenen Cookie-Policy automatisch
gesendet. Die Blob-Variante bleibt für getrennte Origins der verbindliche
Implementierungsweg.

### Darstellung im WYSIWYG-Editor

- `<figure>` und `<graphic>` werden gezielt in kontrollierte React-Nodes
  überführt; ein `url`-Attribut wird nicht allgemein für gerenderte
  XML-Elemente freigeschaltet.
- Das Bild wird innerhalb der Position der Figure im Brieftext dargestellt.
- `rend` und `subtype` dürfen nur über eine eng begrenzte Zuordnung vorhandener
  Layoutwerte auf CSS-Klassen wirken. Unbekannte Werte erhalten ein neutrales
  Standardlayout.
- Der Alternativtext wird aus dem Textinhalt von `figDesc` gebildet. Fehlt er,
  wird eine neutrale lokalisierte Bezeichnung verwendet.
- `head` und `figDesc` werden nur als Text verarbeitet. Bestehende
  `style="display_none"`-Angaben dürfen nicht ungeprüft als Inline-CSS
  übernommen werden.
- Lade-, Fehler- und Platzhalterzustände werden für Screenreader angekündigt.
- Ein Fehler bei einem einzelnen Bild darf die übrige XML-Arbeitskopie und
  andere Figures nicht aus der Anzeige entfernen.

### Fehlerbehandlung

| HTTP-Status | Frontend-Verhalten |
| --- | --- |
| `401` | Session als abgelaufen behandeln und vorhandenen Login-Flow auslösen |
| `404` | lokalen Figure-Platzhalter mit verständlicher Beschreibung anzeigen |
| sonstige Fehler | lokalen Fehlerzustand mit Möglichkeit zum erneuten Laden anzeigen |

Fehlertexte aus `error` oder `message` dürfen ausschließlich als Text
dargestellt werden.

### Nicht Bestandteil von F-110

- Auswahl eines Einfügeankers;
- Datei-Upload oder Uploaddialog;
- Erzeugen oder Bearbeiten eines TEI-`figure`-Elements;
- SVG-Upload oder SVG-Sanitizing;
- Verwendung der öffentlichen Bildroute;
- Änderung des allgemeinen JWT-/Cookie-Verfahrens.

### Akzeptanzkriterien

- Beim Laden eines gepinnten Briefs werden alle Figures mit eindeutiger
  `xml:id` über die aus Brief-ID und Figure-ID gebildete JWT-Route geladen.
- Gestagte und publizierte JPEG-/PNG-Dateien werden über denselben
  Frontend-Codepfad dargestellt.
- Publizierte SVG-Dateien aus dem Altbestand werden ausschließlich als
  Bildquelle verwendet und nicht in das DOM übernommen.
- Weder `graphic/@url` noch die öffentliche
  `/api/letters/letter_image/...`-Route werden vom JWT-Editor geladen.
- `figDesc` wird als Alternativtext verwendet; ein lokalisierter Fallback ist
  vorhanden.
- Fehlende IDs, fehlende Dateien und `404` erzeugen einen lokalen Platzhalter,
  ohne den Briefinhalt zu verlieren.
- Object-URLs werden bei Austausch, Entfernen und Unmount freigegeben.
- XML-/HTML-Sonderzeichen in `head`, `figDesc` und Fehlermeldungen bleiben Text
  und führen weder zu HTML-Injection noch zu beschädigtem XML.
- Nach Reload, Undo und Redo entspricht die sichtbare Figure-Anzeige der
  jeweils aktuellen XML-Arbeitskopie.

### Vorgeschlagene Frontend-Tests

- Parser-/Komponententest für mehrere `<figure xml:id>` innerhalb eines Briefs;
- API-Client-Test für JWT-Cookie, Blob-Antwort und URL-kodierte Figure-ID;
- Darstellung publizierter und gestagter JPEG-/PNG-Dateien über denselben
  Endpunkt;
- SVG-Altbestand ausschließlich als `<img>`-/Bildquelle;
- `404`, fehlende `xml:id`, fehlendes `graphic` und Ladefehler;
- Alternativtext aus `figDesc` und lokalisierter Fallback;
- XSS-Regressionstest mit HTML-/XML-Sonderzeichen und manipulierten Attributen;
- Test für `URL.revokeObjectURL()` bei Austausch, Entfernen und Unmount;
- Integrationstest für Reload, Undo und Redo;
- E2E-Test für einen vorhandenen publizierten Brief mit JPEG/PNG und – sofern
  als Fixture verfügbar – einem SVG aus dem Altbestand. Dabei darf kein Aufruf
  der öffentlichen Bildroute erfolgen.

### Rollout und Rollback

Rollout-Reihenfolge: zuerst die gemeinsame JWT-Figure-Auslieferung im Backend,
danach F-110. Falls eine Feature-Konfiguration verwendet werden soll, muss ein
neues, explizit freigegebenes Frontend-Feature-Flag eingeführt und in
`.env.example` dokumentiert werden.

Rollback: Die Figure-Darstellung im WYSIWYG-Editor deaktivieren und für Figures
einen lokalen Platzhalter anzeigen. Ein Frontend-Rollback darf weder die
öffentliche Bildroute als Ersatz verwenden noch XML-Inhalte oder Bilddateien
verändern beziehungsweise löschen.

---

## F-111 – Neue Figures auswählen, hochladen und zuweisen

**Status:** umgesetzt und getestet. **Priorität:** P2. **Zuständigkeit:** Frontend-Team.

**Umsetzungsstand:** Auswahl des Einfügeankers, JPEG-/PNG-Upload,
Fehlerbehandlung, Übernahme der vollständigen XML-Arbeitskopie, Undo-/Redo-
Status, Figure-Fokus und editorweite Uploadsperren wurden mit den Commits
`af5c0e6`, `ff26412` und `09a04c7` umgesetzt und durch API-, Dialog-, Parser-
und Kontextmenütests abgesichert. Eine fachliche manuelle Abnahme bleibt von
diesem technischen Status unberührt.

**Abhängigkeit:** F-110 und das Backend mit F-109.

### Ziel

Editorinnen und Editoren können im bestehenden Briefeditor ein JPEG- oder
PNG-Bild an einer ausgewählten Stelle innerhalb des TEI-Briefbodys einfügen.
Das Frontend überträgt die Datei als `multipart/form-data` und übernimmt nach
Erfolg die vom Backend zurückgegebene vollständige XML-Arbeitskopie.

Der Upload veröffentlicht das Bild noch nicht. Die kanonische Bilddatei wird
erst durch den vorhandenen Publish-Vorgang des Briefs übernommen. Die Anzeige
der neuen Figure erfolgt über den mit F-110 eingeführten Darstellungsweg.

### UI-Anforderungen

Im Briefeditor wird eine Aktion „Bild einfügen“ angeboten. Sie ist nur aktiv,
wenn ein Element mit eindeutiger `xml:id` innerhalb von
`/TEI/text/body` als Einfügeanker bestimmt werden kann.

Der Dialog enthält:

- Bilddatei, Pflichtfeld; akzeptiert werden JPEG und PNG;
- Kategorie, Pflichtfeld:
  - `notation` – sichtbare Bezeichnung beispielsweise „Noten“;
  - `drawing` – sichtbare Bezeichnung beispielsweise „Zeichnung“;
- Einfügeposition, Pflichtfeld:
  - `before` – vor dem ausgewählten Element;
  - `after` – nach dem ausgewählten Element;
  - `append` – als Kind des ausgewählten Elements;
- optionale Überschrift (`head`);
- optionale Bildbeschreibung (`fig_desc`);
- optional erweiterte Layoutfelder `rend` und `subtype`.

Für `rend` und `subtype` gelten ohne Benutzereingabe jeweils `inline`. Werden
die Felder angeboten, dürfen sie nur Buchstaben, Ziffern, Unterstrich und
Bindestrich enthalten. Freie XML-Eingabe ist nicht zulässig.

Die serverseitige Größenobergrenze beträgt standardmäßig 10 MiB, kann aber je
Deployment abweichen. Das Frontend darf vorab gegen 10 MiB prüfen, muss `413`
aber weiterhin als maßgebliche Backend-Antwort behandeln.

### Upload-API

```http
POST /jwt/editor/pinned_letters/:pinned_letter_id/figures
Content-Type: multipart/form-data; boundary=...
Cookie: Authentication=<JWT>
```

| Feld | Typ | Pflicht | Bedeutung |
| --- | --- | --- | --- |
| `image` | Datei | ja | JPEG- oder PNG-Inhalt |
| `category` | String | ja | exakt `notation` oder `drawing` |
| `anchor_xml_id` | String | ja | eindeutige `xml:id` im TEI-Body |
| `position` | String | ja | `before`, `after` oder `append` |
| `head` | String | nein | sichtbarer Text; kein XML/HTML |
| `fig_desc` | String | nein | Bildbeschreibung; kein XML/HTML |
| `rend` | String | nein | Default `inline` |
| `subtype` | String | nein | Default `inline` |

Bei Verwendung von `FormData` darf das Frontend den `Content-Type`-Header
nicht selbst setzen, weil der Browser den Multipart-Boundary ergänzt. Cookies
müssen über die bestehende API-Client-Konfiguration mitgesendet werden.

Beispiel:

```ts
const body = new FormData();
body.append('image', file);
body.append('category', category);
body.append('anchor_xml_id', anchorXmlId);
body.append('position', position);
if (head) body.append('head', head);
if (figDesc) body.append('fig_desc', figDesc);

const response = await api.post(
  `/jwt/editor/pinned_letters/${letterId}/figures`,
  body,
);
```

Erfolgsantwort: `201 Created`

```json
{
  "letter_id": "123",
  "figure_xml_id": "figure_550e8400-e29b-41d4-a716-446655440000",
  "filename": "gb-1821-11-03-01-Z-002.jpg",
  "content_type": "image/jpeg",
  "graphic_url": "file:/P:/XML/Bilder/Zeichnungen/gb-1821-11-03-01-Z-002.jpg",
  "preview_url": "/jwt/editor/pinned_letters/123/figures/figure_550e8400-e29b-41d4-a716-446655440000/image",
  "xml_content": "<?xml version=\"1.0\" encoding=\"UTF-8\"?>...",
  "undo_available": true,
  "redo_available": false
}
```

Nach `201` muss das Frontend:

1. den lokalen XML-Editorzustand vollständig durch `xml_content` ersetzen;
2. Undo/Redo anhand von `undo_available` und `redo_available` aktualisieren;
3. den gepinnten Brief als geändert markieren;
4. die neue `figure_xml_id` für Auswahl, Fokus oder Hervorhebung verwenden;
5. die Figure über den F-110-Darstellungsweg laden;
6. Erfolg erst anzeigen, nachdem der Editorzustand übernommen wurde.

`graphic_url` ist der persistierte TEI-Wert und keine im Browser direkt zu
ladende URL. `filename` ist rein informativ. Das Frontend darf weder Wert noch
Dateiendung selbst erzeugen oder nachträglich ins XML schreiben.

### Uploadzustand und konkurrierende Aktionen

Der Uploadzustand muss editorweit verfügbar sein, weil die zu sperrenden
Aktionen in unterschiedlichen Komponenten ausgelöst werden können.

Während eines Uploads:

- Uploadaktion und Dialog-Submit gegen Doppelklick sperren;
- sichtbaren und für Screenreader angekündigten Ladezustand anzeigen;
- Dialog nicht so schließen, dass der globale Uploadzustand vorzeitig verloren
  geht;
- Reset, Rebase, Unpin und Publish über alle UI-Einstiegspunkte deaktivieren;
- bestehende XML-Arbeitskopie erst nach erfolgreicher Antwort ersetzen;
- bei Fehlern Dialogdaten und bisherige Arbeitskopie erhalten.

### Fehlerbehandlung

| HTTP-Status | Frontend-Verhalten |
| --- | --- |
| `401` | Session als abgelaufen behandeln und vorhandenen Login-Flow auslösen |
| `404` | „Brief nicht mehr gepinnt oder Einfügestelle nicht gefunden“; Arbeitskopie neu laden anbieten |
| `409` | Namenskonflikt; aktuelle Arbeitskopie neu laden und erneuten Upload anbieten |
| `413` | verständlicher Hinweis auf überschrittene Dateigröße |
| `415` | Hinweis, dass nur echte JPEG-/PNG-Dateien erlaubt sind; SVG ausdrücklich nennen |
| `422` | Validierungsfehler anzeigen; Formularwerte erhalten |
| sonstige Fehler | allgemeine Fehlermeldung und Wiederholen anbieten |

Fehlerantworten können den Text in `error` oder – bei der allgemeinen
JWT-Prüfung – in `message` enthalten. Diese Texte dürfen ausschließlich als
Text dargestellt werden.

### Editor- und Lebenszyklusverhalten

- Der Upload ist ein regulärer Editor-Schritt vom Typ `attachment_added` und
  muss mit dem vorhandenen Undo-/Redo-Workflow funktionieren.
- Undo entfernt die TEI-Referenz; Redo stellt sie wieder her. Die Figure wird
  danach erneut über ihre JWT-URL geladen.
- Publish übernimmt nur aktuell im XML referenzierte Uploads.
- Reset, Rebase und Unpin verwerfen noch nicht publizierte Uploads. Bestehende
  Bestätigungsdialoge müssen erwähnen, dass unpublizierte Bild-Uploads ebenfalls
  verworfen werden.
- Nach erfolgreichem Publish bleibt dieselbe JWT-Figure-URL verwendbar, solange
  der Brief für den Benutzer gepinnt ist; das Backend liefert dann die
  publizierte Datei.

### Sicherheit und Barrierefreiheit

- Keine SVG-, HTML- oder XML-Dateien zum Upload akzeptieren, auch wenn Endung
  oder Browser-MIME-Typ verändert wurden. Das Backend bleibt die maßgebliche
  Prüfung.
- Originaldateinamen nicht als HTML darstellen.
- `xml_content`, `head`, `fig_desc` und Fehlermeldungen niemals über
  `innerHTML` oder `dangerouslySetInnerHTML` einfügen.
- Datei-, Kategorie- und Positionsfelder benötigen sichtbare Labels und
  verständliche Validierungsfehler.
- Die neue Figure erhält über F-110 einen Alternativtext aus `fig_desc` oder
  eine neutrale lokalisierte Bezeichnung.

### Nicht Bestandteil von F-111

- SVG-Upload oder SVG-Sanitizing;
- weitere Kategorien wie `formula` oder `table`;
- Drag-and-drop-Umsortierung bestehender Figures;
- Löschen bereits publizierter Bilddateien;
- clientseitiges Erzeugen oder direktes Editieren des TEI-`figure`-Elements;
- Änderung des allgemeinen JWT-/Cookie-Verfahrens.

### Akzeptanzkriterien

- Ein berechtigter Benutzer kann JPEG und PNG als `notation` oder `drawing`
  vor, nach oder innerhalb eines ausgewählten TEI-Elements hochladen.
- Der Request wird als echtes `multipart/form-data` mit JWT-Cookie und ohne
  manuell gesetzten `Content-Type` gesendet.
- Nach `201` zeigt der Editor unmittelbar die zurückgegebene XML-Arbeitskopie,
  korrekte Undo-/Redo-Zustände und die neue Figure über den F-110-Codepfad.
- `head` und `fig_desc` mit Zeichen wie `<`, `>`, `&` und Anführungszeichen
  bleiben Text und erzeugen weder HTML-Injection noch beschädigtes XML.
- Doppelte Submits erzeugen nicht mehrere Uploads.
- `401`, `404`, `409`, `413`, `415` und `422` werden unterscheidbar und ohne
  Verlust des bisherigen Editorinhalts dargestellt.
- Nach Undo verschwindet die Figure; nach Redo erscheint sie einschließlich
  funktionierender JWT-Anzeige erneut.
- Reset-, Rebase-, Unpin- und Publish-Aktionen sind während eines Uploads über
  alle Einstiegspunkte gesperrt.
- Vorhandene Verwerfungsdialoge berücksichtigen unpublizierte Uploads.
- Das Frontend versucht weder `graphic_url` noch die öffentliche Bildroute zu
  laden und erzeugt weder Dateinamen noch TEI-Struktur selbst.

### Vorgeschlagene Frontend-Tests

- API-Client-Test für korrekte `FormData`-Felder, Cookie-Konfiguration und
  fehlenden manuell gesetzten `Content-Type`;
- Komponenten-/Dialogtests für Pflichtfelder, Kategorie, Position,
  Größenhinweis und Doppelklickschutz;
- Erfolgsfall mit Übernahme von `xml_content`, Undo-/Redo-Flags,
  `contentChanged`, Fokus auf die neue `figure_xml_id` und Figure-Abruf;
- Fehlerfälle für alle dokumentierten Statuscodes;
- XSS-Regressionstest mit HTML-/XML-Sonderzeichen in Beschreibung,
  Dateiname und Fehlermeldung;
- Undo-/Redo-Integrationstest;
- Integrationstest für die globale Sperre von Reset, Rebase, Unpin und Publish;
- E2E-Test: Brief pinnen, PNG hochladen, Figure prüfen, publizieren und Brief
  neu laden; dieselbe JWT-Figure-URL muss danach das publizierte Bild liefern;
- E2E-Test: Upload durchführen, Undo und Reset beziehungsweise Unpin ausführen
  und sicherstellen, dass keine veraltete Figure angezeigt wird.

### Rollout und Rollback

Rollout-Reihenfolge: Backend F-109, F-110 und anschließend F-111. Falls eine
Feature-Konfiguration verwendet werden soll, muss ein neues, explizit
freigegebenes Frontend-Feature-Flag eingeführt und in `.env.example`
dokumentiert werden.

Rollback: Uploadaktion und Uploaddialog deaktivieren. Die mit F-110 eingeführte
Anzeige vorhandener Figures bleibt aktiv, solange die gemeinsame JWT-Route im
Backend verfügbar ist. Ein Frontend-Rollback darf keine XML-Inhalte oder
Bilddateien verändern beziehungsweise löschen.

---

## Backend-Verifikation des gemeinsamen Anzeigevertrags

Der gemeinsame JWT-Auslieferungspfad für gestagte und publizierte Dateien ist
durch Controller-Regressionstests abgedeckt. Verifiziert sind insbesondere
JWT-/Ownership-Prüfung, Staging-Vorrang, Fallback auf den publizierten Bestand,
inhaltsbasierter Medientyp und `404` für unbekannte Figures.

```text
Gezielte Figure-/Bild-Specs: 14 examples, 0 failures
Gesamtsuite: 1492 examples, 0 failures, 17 pending
```
