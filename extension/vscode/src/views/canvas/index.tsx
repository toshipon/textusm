import React from 'react';
import { createRoot } from 'react-dom/client';
import CanvasProvider from './CanvasProvider';
import CanvasDialog from './components/CanvasDialog';
import MarkdownParser from './utils/MarkdownParser';

// VSCodeのメッセージハンドラ設定
declare global {
  interface Window {
    vscode: any;
  }
}

// VSCode拡張との通信機能を初期化
const initVSCodeAPI = () => {
  // メッセージハンドラの設定
  window.addEventListener('message', event => {
    const message = event.data;
    switch (message.command) {
      case 'updateCanvas':
        // マークダウンからキャンバスデータを抽出し、グローバル変数に保存
        if (message.content) {
          const canvasData = MarkdownParser.parseHypothesisCanvas(message.content);
          // Canvasデータがあればイベント発火
          if (window.canvasDataCallback) {
            window.canvasDataCallback(canvasData);
          }
          // ファイル名をタイトルに設定
          if (window.canvasTitleCallback && message.filename) {
            window.canvasTitleCallback(message.filename);
          }
        }
        break;
    }
  });
};

// グローバル変数でコールバックを管理（React Componentから設定可能に）
declare global {
  interface Window {
    canvasDataCallback?: (data: any) => void;
    canvasTitleCallback?: (title: string) => void;
  }
}

// WebView APIを初期化
initVSCodeAPI();

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
