import React from 'react';
import { createRoot } from 'react-dom/client';
import CanvasProvider from './CanvasProvider';
import CanvasDialog from './components/CanvasDialog';

// Mount the React app into the webview
const containerDiv = document.createElement('div');
containerDiv.id = 'canvas-root';
document.body.appendChild(containerDiv);

// Create React root and render
const container = document.getElementById('canvas-root');
if (container) {
  const root = createRoot(container);
  root.render(
    <CanvasProvider>
      <CanvasDialog />
    </CanvasProvider>
  );
}
