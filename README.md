# Online TEI Editor

React-18-/TypeScript-Frontend für einen TEI-XML-Editor (Editionsprojekt, HU Berlin / MetaMW). Build via Webpack 5, Paketmanager Yarn 4 (`packageManager: yarn@4.9.1`).

Details zu Architektur, Verzeichnisstruktur und Arbeitskonventionen siehe `AGENTS.md`/`CLAUDE.md`; bekannte offene Punkte siehe `audit.md`.

## Setup

```bash
yarn install
```

Vor dem ersten Start `.env.example` nach `.env` kopieren und anpassen. `REACT_APP_API_URL` ist Pflicht; nur die in `PUBLIC_ENV_ALLOWLIST` (siehe `webpack.config.js`) gelisteten Variablen landen im Client-Bundle.

## Available Scripts

Im Projektverzeichnis stehen folgende Scripts zur Verfügung:

### `yarn start`

Startet den Dev-Server (`webpack serve --mode development`) mit Hot Reload.

### `yarn build`

Erstellt den Production-Build (`webpack --mode production`) im Ordner `dist/`: minifiziert, mit Content-Hashes in den Dateinamen.

### `yarn test`

Führt die Jest-Testsuite aus. Im Repository empfohlen: `yarn test --runInBand`.

### `yarn tsc --noEmit`

Typecheck ohne Build-Ausgabe.

### `yarn eslint src tests --max-warnings=0`

Lint-Check (Konfiguration: `eslint.config.mjs`, ESLint-Flat-Config).

## DEPLOYMENT INSTRUCTIONS

### Install PM2 Globally

```bash
sudo npm install -g pm2
```

### Serve Static Files with a HTTP Server

```bash
sudo npm install -g serve
```

### Create Build Output

```bash
rm -rf dist # Remove the existing build directory

yarn build
```

### Start Your React App with PM2

```bash
pm2 start "serve -s dist -l 3000" --name FMBC_TEI_EDITOR
```

* `serve -s dist`: Serves the static files from the `dist` directory.
* `-l 3000`: Specifies the port (you can change it if needed).
* `--name`: Gives a friendly name to the PM2 process.


### Set PM2 to Restart on Server Reboot

```bash
pm2 startup
```

#### Save the PM2 Process List

```bash
pm2 save
```

### Monitor Your Application

```bash
pm2 monit
```

### Restarting Application

```bash
pm2 restart tei_editor
```

### Pm2 logrotate

* To enable log rotation, you can use the following command:

```bash
pm2 install pm2-logrotate
```

```bash
pm2 set pm2-logrotate:dateFormat YYYY-MM-DD
pm2 set pm2-logrotate:rotateInterval '0 0 * * *'
```
* the logs can be found in the /home/user/.pm2/logs


## Lokales HTTPS Setup

mkcert installieren und Zertifikate erstellen:

    sudo apt install mkcert
    mkcert -install
    mkdir certs && cd certs
    mkcert editor.metamw.local backend.metamw.local
