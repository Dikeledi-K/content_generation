import React from 'react';
import ReactDOM from 'react-dom/client';
import { FluentProvider, createLightTheme } from '@fluentui/react-components';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/global.css';

const brand = {
  10: '#050f0c', 20: '#0a1c17', 30: '#0f2a22', 40: '#13382d',
  50: '#174538', 60: '#1a4f41', 70: '#1c5546', 80: '#1e5b4b',
  90: '#2c6b5a', 100: '#3c7b69', 110: '#4f8b7a', 120: '#659b8b',
  130: '#7dac9d', 140: '#97beb1', 150: '#b4d1c7', 160: '#d4e5df',
};

const theme = {
  ...createLightTheme(brand),
  fontFamilyBase: 'Inter, "Segoe UI Variable", "Segoe UI", system-ui, -apple-system, sans-serif',
  // Warm ivory surfaces instead of stark white, to match the parchment palette.
  colorNeutralBackground1: '#fffcf6',
  colorNeutralBackground1Hover: '#f8f1e4',
  colorNeutralBackground1Pressed: '#f1e8d7',
  colorNeutralStroke1: '#d5c6ab',
  colorNeutralStroke1Hover: '#c0ab86',
  colorNeutralStroke1Pressed: '#a8915f',
  colorNeutralStrokeAccessible: '#7d6a4b',
  colorNeutralStrokeAccessibleHover: '#6b5a3e',
  colorNeutralBackgroundDisabled: '#eee6d6',
  colorNeutralForegroundDisabled: '#9d917c',
  colorNeutralStrokeDisabled: '#e2d7c3',
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <FluentProvider theme={theme} style={{ background: 'transparent' }}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </FluentProvider>
  </React.StrictMode>
);
