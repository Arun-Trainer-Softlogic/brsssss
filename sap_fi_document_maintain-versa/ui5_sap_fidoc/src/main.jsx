import { createRoot } from 'react-dom/client';
import { BrowserRouter } from "react-router";
import { ThemeProvider } from '@ui5/webcomponents-react';
import { setTheme } from '@ui5/webcomponents-base/dist/config/Theme';
import '@ui5/webcomponents-react/dist/Assets';
import { App } from './App';
import './index.css';

const container = document.getElementById('root');
const root = createRoot(container);
setTheme("sap_fiori_3");
root.render(
  <ThemeProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ThemeProvider>
);