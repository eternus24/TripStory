// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import AppShell from './App'; // AppShell이 default export
import reportWebVitals from './reportWebVitals';

import { BrowserRouter } from 'react-router-dom';
import AuthProvider from './context/AuthContext';
import AdminProvider from './context/AdminContext';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <BrowserRouter>
    <AuthProvider>
      <AdminProvider>
        <AppShell />
      </AdminProvider>
    </AuthProvider>
  </BrowserRouter>
);

reportWebVitals();