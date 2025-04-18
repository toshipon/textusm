import * as vscode from "vscode";
import * as path from "path";

enum HypothesisCommand {
  openCanvas = "hypothesisCanvas.openCanvas",
}

export class CanvasViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "hypothesisCanvas";
  private static currentPanel: vscode.WebviewPanel | undefined;
  private _view?: vscode.WebviewView;
  constructor(private readonly extensionUri: vscode.Uri) {}

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
  <script src="${scriptUri}"></script>
</body>
</html>`;
  }
}
