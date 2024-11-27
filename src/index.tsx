import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { Provider, useDispatch } from "react-redux";
import { store } from "./redux/redux.store";
import { loginState } from "./redux/slices/user.slice";
import { getMe } from "./services/user.service";

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
