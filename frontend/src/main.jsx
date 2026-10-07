import React from 'react';
import ReactDOM from 'react-dom/client';
import { ReactLenis } from 'lenis/react';
import App from './App.jsx';
import './index.css';
import 'lenis/dist/lenis.css';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const lenisOptions = {
  autoRaf: true,
  anchors: !prefersReducedMotion,
  smoothWheel: !prefersReducedMotion,
  lerp: prefersReducedMotion ? 1 : 0.085,
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ReactLenis root options={lenisOptions}>
      <App />
    </ReactLenis>
  </React.StrictMode>
);
