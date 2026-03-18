import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import {  BrowserRouter } from 'react-router-dom'; 
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from './theme/theme';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <BrowserRouter> 
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);