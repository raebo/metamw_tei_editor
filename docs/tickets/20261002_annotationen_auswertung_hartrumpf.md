31.07.2026 turnus ist zu Ende

Matomo Daten an Taschow


Frau Wald Brief ohne Annotationen starten

Benutzer startet automatischen Modus

XML an SEmpria schicken

Dann werden Vorschläge erstellt. Benutzer gibt das Feedback über die erste Stelle

Request mit den Daten der Auswertung Annotator

Sempria schickt die Stelle per XML

Benutzer sieht dann welche neuen Auszeichnungen automatisch erfolgt sind und kann die bearbeiten

Nach der Festlegung der Entscheidung kann Sempria mit der nächsten Auszeichnung starten. -> Request schickt die Entscheidung und dann beginnt Sempria mit der Auswertung und der nächsten Entscheidung
Anhand dessen kann Sempria die nächste Auszeichnungen vornehmen und Vorschläge unterbreiten.

Immer so weiter bis entweder keine weitere Stelle gefunden wird oder der Benutzer den Modus beendet.

Benutzer kann festlegen an welcher Stelle mit der Bearbeitung der Auszeichnungen begonnen werden kann.


Lies dir bitte die folgenden Anforderungen und Ablaufplanung durch. Für die Abstimmung mit der Fachabteilugn benötige ich ein Swimmlane-Diagramm welches mir den Ablauf graphisch gut aufarbeitet, so dass auch einem nicht so technische versierten Benutzer der Prozess klar ist.

Für die Bearbeitung und die Erstellung der automatischen Auszeichnungen soll für den Online-Editor eine neue Vorgehensweise entwickelt werden. Der Ablauf wird hier im Folgenden beschrieben:

1. Benutzer öffnet im Editor einen Brief

2. Es gibt einen Status Button der anzeigt ob für einen Brief der "Annotations-Modus" aktiv ist. (Ein Wechsel zu anderen Briefen ist bei einem aktiven "Annotations-Modus" nicht möglich)

2. Benutzer aktiviert den Modus, in dem er mit einem Linksklick im TEI-Body den Cursor setze und dann im rechten Kontextmenü den Modus aktiviert. Der Suchprozess soll dann ab dem ausgewählten Markup beginnen

3. Im Hintergrund wird über das Backend das XML des Briefes von der ausgewählten Stelle bis zum Ende an Sempria gesendet

4. Sempria scannt das Xml-Markup und findet die erste Auszeichnung, diese wird an das Backend und dann an den Online-Editor gesendet

5. Der Online-Editor weist auf die neue Auszeichnung hin und stellt diese optisch dar.

6. Im Hintergrund wird weiter an der nächsten Auszeichnung von Sempria gearbeitet und der Brief automatisch aktualisiert

7. Der Benutzer kann jetzt die Auszeichnung bearbeiten, akzeptieren oder verwerfen. Das Ergebnis wird direkt an Sempria weitergegeben

8. In einer Seitenleiste wird angezeigt welche Auszeichnungen bisher gefunden wurden. Der Benutzer kann sich eine Übersicht anzeigen lassen welche automatische Auszeichnungen bisher erstellt wurden und diese auch im Nachhinein noch bearbeiten -> Das Ergebnis wird dannn an Sempria gesendet

9. Der Prozess wird beendet wenn entweder Sempria keine neuen Auszeichnungen findet oder der Benutzer den Prozess aktiv über den Button beendet.


Verwendete Systeme:

Online-Editor - React basiertes Online Tool für die Bearbeitung von XML-TEI Dokumenten

Backend - Ruby ON RAils Redaktionssystem für XML-TEI Dokumente (Validierung, Speicherung und Suche) Kommunikation mit externen Systemem wie Elasticsearch, Postgres oder Sempria

Sempria - Semantische Suche für Textinhalte u.a. in xml dokumenten


Hallo Herr Taschow,

anbei finden Sie zwei Diagramme die den Ablauf der automatischen Auszeichnungen für den Benutzer skizzieren.

Ein Diagramm zeigt einen groben Überblick, während das Andere mehr in die Tiefe geht und sich damit auch gut als Vorlage für die Umsetzung eignet.

Generell folgt der Prozess der automatischen Auszeichnungen nach dem folgendne Muster:

* Der Benutzer öffnet zunächst einen Brief und startet den Annotations-Modus an einer selbst gewählten Stelle im Text (Erst Linksklick um den Cursor zu plazieren, danch Start mit Rechtsklick im Contextmenü).

* Während der Modus aktiv ist, bleibt der aktuelle Brief geöffnet; ein Wechsel zu einem anderen Brief ist nicht möglich.

* Der Online-Editor übermittelt den relevanten Teil des Briefes über das Backend an Sempria.

* Sempria durchsucht den Inhalt schrittweise nach möglichen Auszeichnungen.

* Gefundene Vorschläge werden fortlaufend an den Editor zurückgegeben, im Brief hervorgehoben und zusätzlich in einer Übersicht angezeigt. Die
  weitere Suche läuft dabei im Hintergrund.

* Jeden gefundenen Vorschlag kann der Benutzer prüfen, bearbeiten, akzeptieren oder verwerfen.

* Die jeweilige Entscheidung wird über das Backend an Sempria zurückgemeldet. Dieser Ablauf wiederholt sich für alle weiteren Vorschläge.

* Der Vorgang endet entweder automatisch, wenn Sempria keine weiteren Auszeichnungen findet, oder wird vom Benutzer vorzeitig beendet. Anschließend wird der Annotations-Modus geschlossen und der Wechsel zu einem anderen Brief und auch die weitere Bearbeitung ist wieder möglich


Wenn das für Sie plausibel klingt würde ich mit der ersten prototypischen Umsetzung beginnen. Ich denke, dass dann mit den ersten Tests am Ende der Woche begonnen werden könnte.


Gerne können wir dazu aber auch noch einmal sprechen

Viele Grüße

Boris Raeschler
