import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { DiagramType } from "../types/DiagramType";
import { setText } from "../utils/setText";
import { setPreviewActiveContext } from "../utils/setPreviewActiveContext";
import { DIAGRAM_TYPE_TO_ELM_TYPE } from "../constants/diagrams";

export class DiagramPanel {
  public static activePanel: DiagramPanel | null;
  public static readonly viewType = "textUSM";
  public readonly _panel: vscode.WebviewPanel;

  public static createOrShow(
    context: vscode.ExtensionContext,
    diagramType: DiagramType
  ) {
    console.log("DiagramPanel.createOrShow starting with:", {
      diagramType,
      hasActivePanel: !!DiagramPanel.activePanel,
      extensionPath: context.extensionPath,
    });

    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : vscode.ViewColumn.Two;

    const editor = vscode.window.activeTextEditor;
    const text = editor ? editor.document.getText() : "";

    console.log("Current editor state:", {
      hasEditor: !!editor,
      column,
      textLength: text.length,
    });

    const title = editor ? path.basename(editor.document.fileName) : "untitled";
    const iconPath = vscode.Uri.file(
      path.join(context.extensionPath, "images", "icon.png")
    );

    if (editor) {
      editor.options.tabSize = 4;
      editor.options.insertSpaces = true;
    }

    // @ts-expect-error
    const onReceiveMessage = async (message) => {
      if (message.command === "setText") {
        if (editor) {
          await setText(editor, message.text);
        }
      } else if (message.command === "exportPng") {
        const dir: string =
          vscode.workspace.getConfiguration().get("textusm.exportDir") ??
          (vscode.workspace.workspaceFolders &&
          vscode.workspace.workspaceFolders.length > 0
            ? vscode.workspace.workspaceFolders[0].uri.path
            : ".");
        const title = DiagramPanel.activePanel?._panel.title;
        const filePath = path.join(
          dir ??
            `${
              vscode.workspace.workspaceFolders
                ? vscode.workspace.workspaceFolders[0]
                : ""
            }/`,
          `${title}.png`
        );
        const base64Data = message.text.replace(/^data:image\/png;base64,/, "");

        try {
          fs.writeFileSync(filePath, base64Data, "base64");
          vscode.window.showInformationMessage(`Exported: ${filePath}`, {
            modal: false,
          });
        } catch {
          vscode.window.showErrorMessage(`Export failed: ${filePath}`, {
            modal: false,
          });
        }
      } else if (message.command === "exportSvg") {
        const backgroundColor = vscode.workspace
          .getConfiguration()
          .get("textusm.backgroundColor");
        const title = DiagramPanel.activePanel?._panel.title;
        const dir: string =
          vscode.workspace.getConfiguration().get("textusm.exportDir") ??
          (vscode.workspace.workspaceFolders &&
          vscode.workspace.workspaceFolders.length > 0
            ? vscode.workspace.workspaceFolders[0].uri.path
            : ".");
        const filePath = path.join(
          dir ??
            `${
              vscode.workspace.workspaceFolders
                ? vscode.workspace.workspaceFolders[0]
                : ""
            }/`,
          `${title}.svg`
        );

        const svgo = await import("svgo");
        const optimizedSvg = svgo.optimize(
          `<?xml version="1.0"?>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${message.width} ${
            message.height
          }" width="${message.width}" height="${
            message.height
          }" style="background-color: ${backgroundColor};">
        ${message.text
          .split("<div")
          .join('<div xmlns="http://www.w3.org/1999/xhtml"')
          .split("<img")
          .join('<img xmlns="1http://www.w3.org/1999/xhtml"')}
        </svg>`,
          {
            plugins: [
              {
                name: "preset-default",
                params: {
                  overrides: {
                    convertShapeToPath: {
                      convertArcs: true,
                    },
                    convertPathData: false,
                  },
                },
              },
            ],
          }
        );

        try {
          fs.writeFileSync(filePath, optimizedSvg.data);
          vscode.window.showInformationMessage(`Exported: ${filePath}`, {
            modal: false,
          });
        } catch {
          vscode.window.showErrorMessage(`Export failed: ${filePath}`, {
            modal: false,
          });
        }
      }
    };

    if (DiagramPanel.activePanel) {
      const scriptSrc = DiagramPanel.activePanel._panel.webview.asWebviewUri(
        vscode.Uri.file(path.join(context.extensionPath, "js", "elm.js"))
      );
      DiagramPanel.activePanel._update(
        iconPath,
        scriptSrc,
        title,
        text,
        diagramType
      );
      DiagramPanel.activePanel._panel.webview.postMessage({
        text,
      });
      DiagramPanel.activePanel._panel.reveal(
        column ? column + 1 : vscode.ViewColumn.Two
      );
      DiagramPanel.addTextChangedEvent(editor);
      DiagramPanel.activePanel._panel.webview.onDidReceiveMessage(
        onReceiveMessage
      );
      setPreviewActiveContext(true);
      return;
    }

    // Log panel creation
    console.log("Creating new DiagramPanel", {
      diagramType,
      column,
      textContent: text.substring(0, 100) + "...", // First 100 chars
    });

    const panel = vscode.window.createWebviewPanel(
      DiagramPanel.viewType,
      title,
      column || vscode.ViewColumn.Two,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.file(path.join(context.extensionPath)),
          vscode.Uri.file(path.join(context.extensionPath, "media")),
          vscode.Uri.file(path.join(context.extensionPath, "js")),
        ],
        retainContextWhenHidden: true,
      }
    );

    // スクリプトのURIを作成する前にログを追加
    console.log("Extension path:", context.extensionPath);
    console.log(
      "Elm.js path:",
      path.join(context.extensionPath, "js", "elm.js")
    );

    const scriptSrc = panel.webview.asWebviewUri(
      vscode.Uri.file(path.join(context.extensionPath, "js", "elm.js"))
    );
    console.log("Script URI:", scriptSrc.toString());

    console.log(
      "Elm script exists:",
      fs.existsSync(path.join(context.extensionPath, "js", "elm.js"))
    );

    // Log webview configuration
    const config = vscode.workspace.getConfiguration("textusm");
    console.log("Current TextUSM configuration:", {
      backgroundColor: config.get("backgroundColor"),
      fontName: config.get("fontName"),
      activityColor: config.get("activity.color"),
      activityBgColor: config.get("activity.backgroundColor"),
    });

    const figurePanel = new DiagramPanel(
      panel,
      iconPath,
      scriptSrc,
      title,
      text,
      diagramType
    );

    DiagramPanel.activePanel = figurePanel;
    DiagramPanel.addTextChangedEvent(editor);

    figurePanel._panel.webview.onDidReceiveMessage(onReceiveMessage);
    setPreviewActiveContext(true);
  }

  private static addTextChangedEvent(editor: vscode.TextEditor | undefined) {
    let updated: null | NodeJS.Timeout = null;
    vscode.workspace.onDidChangeTextDocument((e) => {
      if (e?.document?.uri === editor?.document?.uri) {
        if (updated) {
          clearTimeout(updated);
        }
        updated = setTimeout(() => {
          DiagramPanel.activePanel?._panel.webview.postMessage({
            command: "textChanged",
            text: e.document.getText(),
          });
        }, 300);
      }
    });
  }

  constructor(
    panel: vscode.WebviewPanel,
    iconPath: vscode.Uri,
    scriptSrc: vscode.Uri,
    title: string,
    text: string,
    diagramType: string
  ) {
    this._panel = panel;
    this._update(iconPath, scriptSrc, title, text, diagramType);
    this._panel.onDidDispose(() => {
      this._panel.dispose();
      setPreviewActiveContext(false);
      DiagramPanel.activePanel = null;
    });
    this._panel.onDidChangeViewState(({ webviewPanel }) => {
      setPreviewActiveContext(webviewPanel.active);
    });
  }

  public exportPng() {
    const backgroundColor = vscode.workspace
      .getConfiguration()
      .get("textusm.backgroundColor");
    this._panel.webview.postMessage({
      command: "exportPng",
      backgroundColor,
    });
  }

  public exportSvg() {
    this._panel.webview.postMessage({
      command: "exportSvg",
    });
  }

  public zoomIn() {
    this._panel.webview.postMessage({
      command: "zoomIn",
    });
  }

  public zoomOut() {
    this._panel.webview.postMessage({
      command: "zoomOut",
    });
  }

  private _update(
    iconPath: vscode.Uri,
    scriptSrc: vscode.Uri,
    title: string,
    text: string,
    diagramType: string
  ) {
    this._panel.iconPath = iconPath;
    this._panel.title = `${title}`;
    this._panel.webview.html = this.getWebviewContent(
      scriptSrc,
      text,
      diagramType
    );
  }

  private getWebviewContent(
    scriptSrc: vscode.Uri,
    text: string,
    diagramType: string
  ) {
    const fontName = vscode.workspace
      .getConfiguration()
      .get("textusm.fontName");
    const backgroundColor = vscode.workspace
      .getConfiguration()
      .get("textusm.backgroundColor");

    const activityColor = vscode.workspace
      .getConfiguration()
      .get("textusm.activity.color");
    const activityBackground = vscode.workspace
      .getConfiguration()
      .get("textusm.activity.backgroundColor");

    const taskColor = vscode.workspace
      .getConfiguration()
      .get("textusm.task.color");
    const taskBackground = vscode.workspace
      .getConfiguration()
      .get("textusm.task.backgroundColor");

    const storyColor = vscode.workspace
      .getConfiguration()
      .get("textusm.story.color");
    const storyBackground = vscode.workspace
      .getConfiguration()
      .get("textusm.story.backgroundColor");

    const labelColor = vscode.workspace
      .getConfiguration()
      .get("textusm.label.color");
    const textColor = vscode.workspace
      .getConfiguration()
      .get("textusm.text.color");
    const lineColor = vscode.workspace
      .getConfiguration()
      .get("textusm.line.color");

    const cardWidth = vscode.workspace
      .getConfiguration()
      .get("textusm.card.width");
    const cardHeight = vscode.workspace
      .getConfiguration()
      .get("textusm.card.height");
    const toolbar = vscode.workspace.getConfiguration().get("textusm.toolbar");
    const showGrid = vscode.workspace
      .getConfiguration()
      .get("textusm.showGrid");

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
          this._panel.webview.cspSource
        }; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; script-src 'nonce-${nonce}' ${
      this._panel.webview.cspSource
    };">
        <style>
          body { 
            margin: 0; 
            padding: 0; 
            background-color: ${backgroundColor};
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
                    fontName: "${fontName}",
                    backgroundColor: "${backgroundColor}",
                    activityBackgroundColor: "${activityBackground}",
                    activityColor: "${activityColor}",
                    taskColor: "${taskColor}",
                    taskBackgroundColor: "${taskBackground}",
                    storyColor: "${storyColor}",
                    storyBackgroundColor: "${storyBackground}",
                    textColor: "${textColor}",
                    labelColor: "${labelColor}",
                    lineColor: "${lineColor}",
                    diagramType: "${
                      DIAGRAM_TYPE_TO_ELM_TYPE[diagramType as DiagramType]
                    }",
                    cardWidth: ${cardWidth},
                    cardHeight: ${cardHeight},
                    toolbar: ${toolbar},
                    showGrid: ${showGrid}
                  }
                });
                
                console.log('Elm initialized successfully');
                
                // ポートとイベントハンドラの設定
                if (app.ports) {
                  // ポートのセットアップ
                  app.ports.setText?.subscribe(text => {
                    vscode.postMessage({ command: 'setText', text });
                  });
                  
                  app.ports.getCanvasSize?.subscribe(diagramType => {
                    // キャンバスサイズ取得のロジック
                    const usmSvg = document.querySelector('#usm');
                    const bbox = usmSvg?.getBoundingClientRect();
                    if (bbox) {
                      app.ports.onGetCanvasSize.send([bbox.width, bbox.height]);
                    }
                  });
                  
                  app.ports.zoom?.subscribe(zoomIn => {
                    // ズームのロジック
                    console.log('Zoom:', zoomIn ? 'in' : 'out');
                  });
                }
                
                // メッセージハンドラ
                window.addEventListener('message', event => {
                  const message = event.data;
                  console.log('Received message:', message.command);
                  
                  if (message.command === 'textChanged') {
                    if (app.ports.onTextChanged) {
                      app.ports.onTextChanged.send(message.text);
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
                      app.ports.getCanvasSize.send("${diagramType}");
                    }
                  } else if (message.command === 'exportPng') {
                    if (app.ports.getCanvasSize) {
                      app.ports.getCanvasSize.send("${diagramType}");
                    }
                  }
                });
              }
            } catch (e) {
              handleError('Elm初期化エラー: ' + e.message);
              console.error('Full error:', e);
            }
        </script>
    </body>
    </html>`;
  }
}
