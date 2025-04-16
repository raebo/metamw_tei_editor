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

// const refreshStore = () => {
//   const savedState = localStorage.getItem('reduxState');
//   if (savedState) {
//     const parsedState = JSON.parse(savedState);
//     // Dispatch actions to restore the state
//     if (parsedState.user) {
//       store.dispatch(loginState(parsedState.user));
//     }
//   }
// };
// refreshStore();

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
