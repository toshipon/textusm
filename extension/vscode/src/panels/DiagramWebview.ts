import * as vscode from "vscode";
import { v4 as uuidv4 } from "uuid";
import { DiagramConfig } from "./types";

export class DiagramWebview {
  static generateWebviewContent(
    panel: vscode.WebviewPanel,
    scriptSrc: vscode.Uri,
    text: string,
    diagramType: string,
    config: DiagramConfig
  ): string {
    const nonce = uuidv4();

    console.log("Generating webview content with:", {
      scriptSrc: scriptSrc.toString(),
      diagramType,
      textLength: text.length,
    });

    return `<!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>TextUSM</title>
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: ${
          panel.webview.cspSource
        }; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; script-src 'nonce-${nonce}' ${
      panel.webview.cspSource
    };">
        <style>
          body { 
            margin: 0; 
            padding: 0; 
            background-color: ${config.backgroundColor};
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          }
          #svg { width: 100%; height: 100vh; display: block; }
          .error { 
            padding: 20px; 
            margin: 20px;
            background: white; 
            color: #d32f2f; 
            border-radius: 4px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.12);
          }
          .debug-info {
            position: fixed;
            bottom: 10px;
            left: 10px;
            background: rgba(0,0,0,0.7);
            color: white;
            padding: 5px 10px;
            font-size: 12px;
            border-radius: 4px;
          }
        </style>
    </head>
    <body>
        <div id="svg"></div>
        <div class="debug-info">Type: ${diagramType}, Script: ${scriptSrc}</div>
        
        <script nonce="${nonce}">
            console.log('Loading script from:', '${scriptSrc}');
            
            function handleError(message) {
              console.error(message);
              document.getElementById("svg").innerHTML = '<div class="error">' + message + '</div>';
            }
            
            window.onerror = function(message, source, lineno, colno, error) {
              handleError('JavaScript error: ' + message);
              return true;
            };
        </script>
        
        <script nonce="${nonce}" src="${scriptSrc}" 
                onerror="handleError('スクリプトの読み込みに失敗しました: ' + '${scriptSrc}')">
        </script>
        
        <script nonce="${nonce}">
            try {
              if (typeof Elm === 'undefined') {
                handleError('Elmオブジェクトが見つかりません。スクリプトが正しく読み込まれていない可能性があります。');
              } else {
                console.log('Initializing Elm application');
                const vscode = acquireVsCodeApi();
                
                const app = Elm.Extension.VSCode.init({
                  node: document.getElementById("svg"),
                  flags: {
                    text: \`${text
                      .replace(/\\/g, "\\\\")
                      .replace(/\`/g, "\\`")}\`,
                    fontName: "${config.fontName}",
                    backgroundColor: "${config.backgroundColor}",
                    activityBackgroundColor: "${config.activityBackground}",
                    activityColor: "${config.activityColor}",
                    taskColor: "${config.taskColor}",
                    taskBackgroundColor: "${config.taskBackground}",
                    storyColor: "${config.storyColor}",
                    storyBackgroundColor: "${config.storyBackground}",
                    textColor: "${config.textColor}",
                    labelColor: "${config.labelColor}",
                    lineColor: "${config.lineColor}",
                    diagramType: "${diagramType}",
                    cardWidth: ${config.cardWidth},
                    cardHeight: ${config.cardHeight},
                    toolbar: ${config.toolbar},
                    showGrid: ${config.showGrid}
                  }
                });
                
                console.log('Elm initialized successfully');
                window._elmApp = app;  // デバッグ用にグローバルに保存
                
                console.log('Available Elm ports:', Object.keys(app.ports));
                if (app.ports) {
                  console.log('Available Elm ports:', Object.keys(app.ports));
                  
                  app.ports.setText?.subscribe(text => {
                    console.log('Port setText called with:', { textLength: text.length });
                    vscode.postMessage({ command: 'setText', text });
                  });
                  
                  // getCanvasSizeは入力ポートなのでsubscribeではなくsendを使用する
                  // 代わりにonGetCanvasSizeポートのサブスクリプションを設定
                  app.ports.onGetCanvasSize?.subscribe(([width, height]) => {
                    console.log('Canvas size received from Elm:', width, height);
                    // ここでキャンバスサイズを使った処理を行う
                  });
                  
                  // zoomも入力ポートなのでsubscribeは使用できない
                  // 正しい使用方法は187-194行目のsendメソッド

                  // onTextChangedポートの存在確認
                  if (app.ports.onTextChanged) {
                    console.log('onTextChanged port is available');
                  } else {
                    console.warn('onTextChanged port is not available');
                  }
                } else {
                  console.warn('No ports found in Elm application');
                }
                
                window.addEventListener('message', event => {
                  const message = event.data;
                  console.log('WebView received message:', {
                    type: typeof message,
                    isString: typeof message === 'string',
                    command: message.command,
                    textLength: typeof message === 'string' ? message.length : (message.text ? message.text.length : 'N/A')
                  });
                  
                  if (typeof message === 'string') {
                    // 文字列の場合は直接onTextChangedに送信
                    if (app.ports?.onTextChanged) {
                      console.log('Sending text directly to Elm port:', { textLength: message.length });
                      try {
                        app.ports.onTextChanged.send(message);
                        console.log('Text sent successfully to Elm port');
                      } catch (e) {
                        console.error('Error sending text to Elm port:', e);
                      }
                    } else {
                      console.error('Cannot send text to Elm: onTextChanged port not available');
                    }
                  } else if (message.command === 'textChanged') {
                    if (app.ports?.onTextChanged) {
                      console.log('Sending text via command to Elm port:', {
                        textLength: message.text.length,
                        textSample: message.text.substring(0, 50) + '...'
                      });
                      try {
                        app.ports.onTextChanged.send(message.text);
                        console.log('Text sent successfully to Elm port via command');
                      } catch (e) {
                        console.error('Error sending text to Elm port via command:', e);
                      }
                    } else {
                      console.error('Cannot send text to Elm: onTextChanged port not available for command');
                    }
                  } else if (message.command === 'zoomIn') {
                    if (app.ports.zoom) {
                      app.ports.zoom.send(true);
                    }
                  } else if (message.command === 'zoomOut') {
                    if (app.ports.zoom) {
                      app.ports.zoom.send(false);
                    }
                  } else if (message.command === 'exportSvg') {
                    if (app.ports.getCanvasSize) {
                      app.ports.getCanvasSize.send(diagramType);
                    }
                  } else if (message.command === 'exportPng') {
                    if (app.ports.getCanvasSize) {
                      app.ports.getCanvasSize.send(diagramType);
                    }
                  }
                });

                // デバッグ用の通信テスト
                setTimeout(() => {
                  if (app.ports?.onTextChanged) {
                    console.log('Testing Elm port communication...');
                    app.ports.onTextChanged.send(text);
                  }
                }, 1000);
              }
            } catch (e) {
              handleError('Elm初期化エラー: ' + e.message);
              console.error('Full error:', e);
            }
        </script>
    </body>
    </html>`;
  }

  static getConfig(): DiagramConfig {
    return {
      fontName: vscode.workspace.getConfiguration().get("textusm.fontName") || "",
      backgroundColor: vscode.workspace.getConfiguration().get("textusm.backgroundColor") || "",
      activityColor: vscode.workspace.getConfiguration().get("textusm.activity.color") || "",
      activityBackground: vscode.workspace.getConfiguration().get("textusm.activity.backgroundColor") || "",
      taskColor: vscode.workspace.getConfiguration().get("textusm.task.color") || "",
      taskBackground: vscode.workspace.getConfiguration().get("textusm.task.backgroundColor") || "",
      storyColor: vscode.workspace.getConfiguration().get("textusm.story.color") || "",
      storyBackground: vscode.workspace.getConfiguration().get("textusm.story.backgroundColor") || "",
      labelColor: vscode.workspace.getConfiguration().get("textusm.label.color") || "",
      textColor: vscode.workspace.getConfiguration().get("textusm.text.color") || "",
      lineColor: vscode.workspace.getConfiguration().get("textusm.line.color") || "",
      cardWidth: vscode.workspace.getConfiguration().get("textusm.card.width") || 200,
      cardHeight: vscode.workspace.getConfiguration().get("textusm.card.height") || 100,
      toolbar: vscode.workspace.getConfiguration().get("textusm.toolbar") || false,
      showGrid: vscode.workspace.getConfiguration().get("textusm.showGrid") || false,
    };
  }
}