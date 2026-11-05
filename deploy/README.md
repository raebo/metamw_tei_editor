# Frontend-Deployment

Das Deployment-Skript erstellt ein eigenständiges Release, baut es vollständig
und schaltet erst anschließend den Symlink `current` atomar auf den neuen Stand
um. Ein fehlgeschlagener Build verändert damit das aktive Release nicht.

## Voraussetzungen auf dem Server

- Bash, Git, `flock`, Node.js, Corepack/Yarn und optional PM2
- SSH-Zugriff auf das Git-Repository
- eine lokale Deployment-Konfiguration `deploy/.env`, angelegt aus
  `deploy/.env.example`
- folgende Dateien unter `/home/debian/apps/tei_editor/shared`:
  - `.env`
  - `tei_editor.config.js`
  - `webpack.production.config.js`

Abhängigkeiten werden pro Release mit `yarn install --immutable` installiert.
Lediglich der Yarn-Downloadcache wird releaseübergreifend verwendet. Dadurch
bleiben Releases und Rollbacks voneinander unabhängig.

Die Datei `deploy/.env` konfiguriert ausschließlich das Deployment und wird
nicht committed. Die Datei `shared/.env` enthält dagegen die vom Frontend-Build
benötigte Anwendungskonfiguration und wird in jeden Release-Ordner verlinkt.

Vor dem ersten Aufruf:

```bash
cp deploy/.env.example deploy/.env
```

Anschließend müssen die Werte in `deploy/.env` für das jeweilige Zielsystem
geprüft werden.

## Aufruf

Standardmäßig wird `master` ausgerollt:

```bash
./deploy/deploy.sh
```

Ein anderer Branch kann als erstes Argument angegeben werden:

```bash
./deploy/deploy.sh feature/example
```

Ob der laufende PM2-Prozess nach dem atomaren Symlink-Wechsel neu gestartet
wird, steuert `RESTART_PM2` in `deploy/.env`. Alternativ kann der Wert für
einen einzelnen Aufruf überschrieben werden:

```bash
RESTART_PM2=true ./deploy/deploy.sh master
```

Das Skript verhindert parallele Deployments, validiert `dist/index.html` sowie
die nach dem Build erzeugte Datei `dist/git-info.json` vor der Aktivierung und
stellt die Leserechte der statischen Dateien für den Webserver sicher. Inaktive
Releases werden nach 30 Tagen entfernt; der aktuell aktive Release-Ordner wird
von der Bereinigung ausgenommen.
