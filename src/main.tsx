// src/main.tsx
import { Buffer } from 'buffer';
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
window.Buffer = Buffer;

createRoot(document.getElementById("root")!).render(<App />);
