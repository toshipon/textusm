import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { DiagramType } from "../types/DiagramType";
import { setText } from "../utils/setText";
import { setPreviewActiveContext } from "../utils/setPreviewActiveContext";
import { DiagramWebview } from "./DiagramWebview";
import { DiagramExport } from "./DiagramExport";
import { WebviewMessage } from "./types";

export class DiagramPanel {
  public static activePanel: DiagramPanel | null;
  public static readonly viewType = "textUSM";
  public readonly _panel: vscode.WebviewPanel;
  private disposables: vscode.Disposable[] = [];
  private currentEditor?: vscode.TextEditor;
  private lastText?: string;

  private async ensurePanelActive() {
    console.log("Panel active state before check:", {
      active: this._panel.active,
      visible: this._panel.visible,
      viewColumn: this._panel.viewColumn,
    });

    if (!this._panel.active) {
      console.log("Activating panel...");
      this._panel.reveal(this._panel.viewColumn, false);
      // パネルのアクティベーションを待つ
      await new Promise((resolve) => setTimeout(resolve, 300)); // 待機時間を増やす

      console.log("Panel active state after activation:", {
        active: this._panel.active,
        visible: this._panel.visible,
        viewColumn: this._panel.viewColumn,
      });
    }
  }

  private async sendTextUpdate(text: string) {
    // await this.ensurePanelActive();

    console.log("Sending text update to WebView", {
      textLength: text.length,
      isPanelActive: this._panel.active,
      viewColumn: this._panel.viewColumn,
      textSample: text.substring(0, 50) + "...",
    });

    try {
      this._panel.webview.postMessage({
        command: "textChanged",
        text: text,
      });
      console.log("Message posted to WebView successfully");
    } catch (error) {
      console.error("Error posting message to WebView:", error);
    }
  }

  public static async createOrShow(
    context: vscode.ExtensionContext,
    diagramType: DiagramType
  ): Promise<void> {
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

    // 仮説キャンバスの場合は特別な処理
    if (diagramType === "hyp") {
      // キャンバススクリプトのURIを構築
      const canvasScriptUri = vscode.Uri.file(
        path.join(context.extensionPath, "dist", "canvasScript.js")
      );

      // 以下、通常の処理と同様
    }

    const onReceiveMessage = async (message: WebviewMessage) => {
      if (message.command === "setText") {
        if (editor) {
          await setText(editor, message.text || "");
        }
      } else if (message.command === "exportPng" && message.text) {
        await DiagramExport.exportPng(
          { text: message.text },
          DiagramPanel.activePanel?._panel as vscode.WebviewPanel
        );
      } else if (
        message.command === "exportSvg" &&
        message.text &&
        message.width &&
        message.height
      ) {
        await DiagramExport.exportSvg(
          { text: message.text, width: message.width, height: message.height },
          DiagramPanel.activePanel?._panel as vscode.WebviewPanel
        );
        // 仮説キャンバス用のメッセージハンドラを追加
      } else if (
        message.command === "webviewMounted" &&
        diagramType === "hyp"
      ) {
        console.log("仮説キャンバス WebView がマウントされました");

        // 現在のアクティブなエディタのテキストを送信
        if (editor && DiagramPanel.activePanel) {
          const content = editor.document.getText();
          const filename = path.basename(editor.document.fileName);

          // マークダウンコンテンツとファイル名をWebViewに送信
          DiagramPanel.activePanel._panel.webview.postMessage({
            command: "updateCanvas",
            content: content,
            filename: filename,
          });
        }
      }
    };

    if (DiagramPanel.activePanel) {
      try {
        console.log("Updating existing panel state:", {
          title,
          isActive: DiagramPanel.activePanel._panel.active,
          viewColumn: DiagramPanel.activePanel._panel.viewColumn,
        });

        // ダイアグラムタイプに応じて適切なスクリプトを選択
        const scriptUri = DiagramPanel.activePanel._panel.webview.asWebviewUri(
          diagramType === "hyp"
            ? vscode.Uri.file(
                path.join(context.extensionPath, "dist", "canvasScript.js")
              )
            : vscode.Uri.file(path.join(context.extensionPath, "js", "elm.js"))
        );

        await DiagramPanel.activePanel.updatePanelContent(
          text,
          iconPath,
          scriptUri,
          title,
          diagramType
        );
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        console.error("Error updating existing panel:", errorMessage);
        throw error;
      }
      DiagramPanel.activePanel._panel.reveal(
        column ? column + 1 : vscode.ViewColumn.Two,
        false
      );

      if (editor) {
        DiagramPanel.activePanel.watchEditor(editor);
      }

      DiagramPanel.activePanel._panel.webview.onDidReceiveMessage(
        onReceiveMessage
      );
      setPreviewActiveContext(true);
      return;
    }

    console.log("Creating new DiagramPanel", {
      diagramType,
      column,
      textContent: text.substring(0, 100) + "...",
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
          vscode.Uri.file(path.join(context.extensionPath, "dist")), // React ベースのスクリプト用
        ],
        retainContextWhenHidden: true,
      }
    );

    const scriptSrc = panel.webview.asWebviewUri(
      diagramType === "hyp"
        ? vscode.Uri.file(
            path.join(context.extensionPath, "dist", "canvasScript.js")
          )
        : vscode.Uri.file(path.join(context.extensionPath, "js", "elm.js"))
    );
    console.log("Script URI:", scriptSrc.toString());
    // スクリプトの存在確認（タイプに応じて適切なパスをチェック）
    const scriptPath =
      diagramType === "hyp"
        ? path.join(context.extensionPath, "dist", "canvasScript.js")
        : path.join(context.extensionPath, "js", "elm.js");
    console.log(`Script exists (${diagramType}):`, fs.existsSync(scriptPath));

    const figurePanel = new DiagramPanel(
      panel,
      iconPath,
      scriptSrc,
      title,
      text,
      diagramType
    );

    DiagramPanel.activePanel = figurePanel;
    figurePanel.lastText = text;

    if (editor) {
      figurePanel.watchEditor(editor);
    }

    figurePanel._panel.webview.onDidReceiveMessage(onReceiveMessage);
    setPreviewActiveContext(true);
  }

  public async watchEditor(editor: vscode.TextEditor): Promise<void> {
    try {
      console.log("Watching editor:", {
        fileName: editor.document.fileName,
        languageId: editor.document.languageId,
        panelActive: this._panel.active,
      });

      // 以前のエディタの監視を解除
      this.disposables.forEach((d) => d.dispose());
      this.disposables = [];
      this.currentEditor = editor;

      // 初期テキストの送信
      const initialText = editor.document.getText();
      if (initialText !== this.lastText) {
        console.log("Sending initial text:", {
          textLength: initialText.length,
          isPanelActive: this._panel.active,
        });
        this.lastText = initialText;
        await this.sendTextUpdate(initialText);
      }

      // テキスト変更の監視を設定
      let updateTimeout: NodeJS.Timeout | null = null;
      const textChangeDisposable = vscode.workspace.onDidChangeTextDocument(
        async (e) => {
          if (e.document === editor.document) {
            console.log("Document change detected:", {
              fileName: e.document.fileName,
              changeCount: e.contentChanges.length,
              isPanelActive: this._panel.active,
            });

            if (updateTimeout) {
              console.log("Clearing previous update timeout");
              clearTimeout(updateTimeout);
            }

            updateTimeout = setTimeout(async () => {
              try {
                const text = e.document.getText();
                const hasChanged = text !== this.lastText;

                console.log("Text changed event:", {
                  fileName: e.document.fileName,
                  isPanelActive: this._panel.active,
                  viewColumn: this._panel.viewColumn,
                  textLength: text.length,
                  hasChanged: hasChanged,
                  textSample: text.substring(0, 50) + "...",
                });

                // テキストが変更されたかどうかに関わらず、常に更新を送信
                this.lastText = text;

                // console.log("Ensuring panel is active before sending update");
                // await this.ensurePanelActive();

                console.log("Sending text update after change");
                await this.sendTextUpdate(text);

                console.log("Text update sent successfully");
              } catch (error) {
                console.error("Error in text change handler:", error);
                console.error(
                  "Error details:",
                  error instanceof Error ? error.stack : String(error)
                );
              }
            }, 300);
          }
        }
      );

      this.disposables.push(textChangeDisposable);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      console.error("Error in watchEditor:", errorMessage);
      throw error;
    }
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
      console.log("Panel disposed");
      this.disposables.forEach((d) => d.dispose());
      this._panel.dispose();
      setPreviewActiveContext(false);
      DiagramPanel.activePanel = null;
    });

    this._panel.onDidChangeViewState(({ webviewPanel }) => {
      console.log("Panel view state changed:", {
        active: webviewPanel.active,
        visible: webviewPanel.visible,
        viewColumn: webviewPanel.viewColumn,
      });
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
    this._panel.webview.html = DiagramWebview.generateWebviewContent(
      this._panel,
      scriptSrc,
      text,
      diagramType,
      DiagramWebview.getConfig()
    );
  }

  private async updatePanelContent(
    text: string,
    iconPath: vscode.Uri,
    scriptSrc: vscode.Uri,
    title: string,
    diagramType: string
  ): Promise<void> {
    try {
      console.log("Updating panel content:", {
        textLength: text.length,
        diagramType,
        title,
        scriptSrc: scriptSrc.toString(),
        isPanelActive: this._panel.active,
      });

      this._update(iconPath, scriptSrc, title, text, diagramType);
      console.log("Panel HTML updated");

      this.lastText = text;

      // console.log("Ensuring panel is active before sending update in updatePanelContent");
      // await this.ensurePanelActive();

      console.log("Sending text update in updatePanelContent");
      await this.sendTextUpdate(text);

      console.log("Panel content update completed successfully");
    } catch (error) {
      console.error("Error updating panel content:", error);
      console.error(
        "Error details:",
        error instanceof Error ? error.stack : String(error)
      );
      throw error;
    }
  }
}
