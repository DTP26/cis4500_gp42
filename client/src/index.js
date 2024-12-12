import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

document.documentElement.style.background = "linear-gradient(180deg, #1a1a1d, #343a40)";
document.documentElement.style.height = "auto";
document.documentElement.style.minHeight = "100%";

document.body.style.background = "transparent";
document.body.style.margin = "0";
document.body.style.padding = "0";
document.body.style.minHeight = "100%";
document.body.style.color = "#ffffff";
document.body.style.fontFamily = "'Press Start 2P', 'monospace'";

const globalStyles = `html, body {
    p {
    font-family: 'Orbitron', 'sans-serif'; 
    font-size: 1rem; 
    color: #e0e0e0;
    line-height: 1.5; 
  }

    .MuiTableCell-head {
    color: #ffffff;
    font-weight: bold;
  }
  
  .MuiTableCell-root {
    color: #ffffff;
  }
}`

const styleTag = document.createElement('style');
styleTag.innerHTML = globalStyles;
document.head.appendChild(styleTag);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);