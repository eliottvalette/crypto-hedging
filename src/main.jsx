import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/App.css';
import { BrowserRouter as Router } from 'react-router-dom';
import { initGA, logPageView } from './utils/analytics';

initGA('G-SGKSHNPSX3');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <App />
    </Router>
  </React.StrictMode>
);

logPageView();