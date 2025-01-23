# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `yarn start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `yarn test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `yarn build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `yarn eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

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
rm -rf build # Remove the existing build directory

yarn build
```

### Start Your React App with PM2
    
```bash
pm2 start "serve -s build -l 3000" --name FMBC_TEI_EDITOR
``` 

* serve -s build: Serves the static files from the build directory.
* -l 3000: Specifies the port (you can change it if needed).
* --name react-app: Gives a friendly name to the PM2 process.


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
