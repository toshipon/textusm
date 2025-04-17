import React from 'react';
import ReactDOM from 'react-dom';
import CanvasProvider from './CanvasProvider';
import CanvasDialog from './components/CanvasDialog';

// Mount the React app into the webview
const root = document.createElement('div');
root.id = 'canvas-root';
document.body.appendChild(root);

ReactDOM.render(
  <CanvasProvider>
    <CanvasDialog />
  </CanvasProvider>,
  document.getElementById('canvas-root')
);
