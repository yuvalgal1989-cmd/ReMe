import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { isIOS, isNative } from './utils/platform';

// Add platform class to <html> so CSS can target native vs browser
if (isNative) document.documentElement.classList.add('platform-native');
if (isIOS)    document.documentElement.classList.add('platform-ios');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
