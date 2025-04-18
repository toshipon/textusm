import * as vscode from "vscode";
import * as path from "path";

enum HypothesisCommand {
  openCanvas = "hypothesisCanvas.openCanvas",
}

export class CanvasViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "hypothesisCanvas";
  private static currentPanel: vscode.WebviewPanel | undefined;
  private _view?: vscode.WebviewView;
  private _disposables: vscode.Disposable[] = [];

  constructor(private readonly extensionUri: vscode.Uri) {
    // エディタの変更を監視
    this._disposables.push(
      vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor) {
          this._updateCanvasWithFile(editor.document);
        }
      })
    );

    // ドキュメントの変更を監視
    this._disposables.push(
      vscode.workspace.onDidChangeTextDocument((event) => {
        if (event.document === vscode.window.activeTextEditor?.document) {
          this._updateCanvasWithFile(event.document);
        }
      })
    );
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;
    const webview = webviewView.webview;
    webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, "dist")],
    };
    const html = this.getHtmlForWebview(webview);
    webview.html = html;

    // webviewがマウントされたら、現在のアクティブファイルでキャンバスを更新
    webview.onDidReceiveMessage((message) => {
      if (message.command === "webviewMounted") {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          this._updateCanvasWithFile(editor.document);
        }
      }
    });

    // 現在のエディタでキャンバスを初期化
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      this._updateCanvasWithFile(editor.document);
    }
  }

  private _updateCanvasWithFile(document: vscode.TextDocument): void {
    if (!this._view?.webview && !CanvasViewProvider.currentPanel?.webview) {
      return;
    }

    // マークダウンファイルのみ処理
    if (document.languageId !== "markdown") {
      return;
    }

    const content = document.getText();
    const filename = path.basename(document.fileName);

    // Webviewに内容を送信
    const message = {
      command: "updateCanvas",
      content,
      filename,
    };

    if (this._view?.webview) {
      this._view.webview.postMessage(message);
    }

    if (CanvasViewProvider.currentPanel?.webview) {
      CanvasViewProvider.currentPanel.webview.postMessage(message);
    }
  }

  public static createOrShowPanel(extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor?.viewColumn;
    if (CanvasViewProvider.currentPanel) {
      CanvasViewProvider.currentPanel.reveal(column);
      return;
    }
    const panel = vscode.window.createWebviewPanel(
      CanvasViewProvider.viewType,
      "Hypothesis Canvas",
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, "dist")],
      }
    );
    panel.webview.html = new CanvasViewProvider(extensionUri).getHtmlForWebview(
      panel.webview
    );
    CanvasViewProvider.currentPanel = panel;

    // Webviewからのメッセージを処理
    panel.webview.onDidReceiveMessage((message) => {
      if (message.command === "webviewMounted") {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          new CanvasViewProvider(extensionUri)._updateCanvasWithFile(
            editor.document
          );
        }
      }
    });

    panel.onDidDispose(() => {
      CanvasViewProvider.currentPanel = undefined;
    });
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    const toolkitUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this.extensionUri,
        "node_modules",
        "@vscode",
        "webview-ui-toolkit",
        "dist",
        "toolkit.js"
      )
    );
    const stylesUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, "dist", "canvas.css")
    );
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, "dist", "canvasScript.js")
    );
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src ${webview.cspSource} 'unsafe-inline'; style-src ${webview.cspSource} 'unsafe-inline';">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="${stylesUri}">
</head>
<body>
  <div id="canvas-root"></div>
  <script type="module" src="${toolkitUri}"></script>
  <script>
    // VSCodeのwebviewオブジェクトをグローバル変数として公開
    const vscode = acquireVsCodeApi();
    
    // Webviewの読み込み完了時にバックエンドに通知
    window.addEventListener('load', () => {
      vscode.postMessage({ command: 'webviewMounted' });
    });
  </script>
  <script src="${scriptUri}"></script>
</body>
</html>`;
  }
}
