if (typeof crypto.randomUUID !== 'function') {
  crypto.randomUUID = function (): `${string}-${string}-${string}-${string}-${string}` {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = crypto.getRandomValues(new Uint8Array(1))[0] & 15;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    }) as `${string}-${string}-${string}-${string}-${string}`;
  };
}

import React from 'react';
import ReactDOM from 'react-dom/client';
import './assets/css/index.css';
import './assets/css/root.css';
import './assets/css/fontawesomeAll.css';
import './assets/css/fmbc.css';
import './assets/css/tei.css';
import './assets/css/tei_weblayout.css';
import './assets/css/tei_weblayout_update.css';
import './assets/css/editor.css';
import './assets/manifest.json';


import App from './App';
import reportWebVitals from './reportWebVitals';
import { Provider, useDispatch } from "react-redux";
import { store } from "./redux/redux.store";



const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <div className="App">
      <Provider store={store}>
        <App />
      </Provider>
    </div>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
