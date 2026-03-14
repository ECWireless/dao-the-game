import './polyfills';
import React from 'react';
import ReactDOM from 'react-dom/client';
import './theme/fonts.css';
import './theme/tokens.css';
import './theme/global.css';
import RootApp from './RootApp';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RootApp />
  </React.StrictMode>
);
