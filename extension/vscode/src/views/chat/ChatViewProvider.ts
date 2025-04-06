import * as vscode from "vscode";
import * as path from "path";
import { LlmService } from "../../services/LlmService";
import { loadInstructions } from "../../utils/loadInstructions";
import { WebviewContentProvider } from "./WebviewContentProvider";
import { MessageHandler } from "./MessageHandler";
import { FileOperations } from "./FileOperations";
import { SettingsManager } from "./SettingsManager";

export class ChatViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'hypothesisCanvasChat';
  private static currentPanel: vscode.WebviewPanel | undefined;

  private _view?: vscode.WebviewView;
  private _syncedDocument?: vscode.TextDocument;
  private readonly _llmService: LlmService;
  private _instructions: string;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];

  // 各機能のハンドラーインスタンス
  private readonly _webviewProvider: WebviewContentProvider;
  private readonly _messageHandler: MessageHandler;
  private readonly _fileOperations: FileOperations;
  private readonly _settingsManager: SettingsManager;

  constructor(extensionUri: vscode.Uri) {
    this._extensionUri = extensionUri;
    this._llmService = new LlmService();
    this._instructions = loadInstructions(vscode.workspace.workspaceFolders?.[0]?.uri.fsPath);

    // 各ハンドラーの初期化
    this._webviewProvider = new WebviewContentProvider(this._extensionUri);
    this._messageHandler = new MessageHandler(this._llmService, this._instructions, this._extensionUri);
    this._fileOperations = new FileOperations();
    this._settingsManager = new SettingsManager(this._llmService);

    // ファイルウォッチャーを設定し、disposablesに追加
    this._disposables.push(this._fileOperations.setupFileWatcher());

    // ワークスペースの変更を監視
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
      this._instructions = loadInstructions(vscode.workspace.workspaceFolders?.[0]?.uri.fsPath);
    });
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    this._view = webviewView;
    this.initializeWebview(webviewView.webview);
    this._setWebviewMessageListener(webviewView.webview);
    this._updateSyncStatus();
  }

  public static async createOrShowPanel(extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (ChatViewProvider.currentPanel) {
      ChatViewProvider.currentPanel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      ChatViewProvider.viewType,
      "Hypothesis Canvas Chat",
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.file(path.join(extensionUri.fsPath, 'dist')),
          vscode.Uri.file(path.join(extensionUri.fsPath, 'node_modules', '@vscode', 'webview-ui-toolkit', 'dist')),
        ],
      }
    );

    // パネルプロバイダーの初期化
    const provider = new ChatViewProvider(extensionUri);
    provider.initializeWebview(panel.webview);
    provider._setWebviewMessageListener(panel.webview);
    
    panel.onDidDispose(
      () => {
        ChatViewProvider.currentPanel = undefined;
      },
      null,
      provider._disposables
    );

    ChatViewProvider.currentPanel = panel;
  }

  private initializeWebview(webview: vscode.Webview) {
    webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.file(path.join(this._extensionUri.fsPath, 'dist')),
        vscode.Uri.file(path.join(this._extensionUri.fsPath, 'node_modules', '@vscode', 'webview-ui-toolkit', 'dist')),
      ],
    };

    webview.html = this._webviewProvider.getWebviewContent(webview);

    // 設定変更のリスナーを追加
    vscode.workspace.onDidChangeConfiguration(
      () => {
        const status = this._llmService.initializeLlmClients();
        webview.postMessage({
          command: "updateStatus",
          status: status.initialized ? "success" : "error",
          message: status.initialized
            ? `Connected to ${this._llmService.selectedLlm}`
            : `Error: ${status.errorMessage}`,
        });
        webview.html = this._webviewProvider.getWebviewContent(webview);
      },
      null,
      this._disposables
    );

    // エディタの変更を監視
    vscode.window.onDidChangeActiveTextEditor(async (editor) => {
      this._updateSyncStatus();
      // アクティブなエディタがMarkdownファイルの場合、TextUSMフォーマットを検証
      if (editor?.document.languageId === 'markdown') {
        await this._fileOperations.validateAndFormatContent(editor.document);
      }
    }, null, this._disposables);
  }

  private _updateSyncStatus() {
    const editor = vscode.window.activeTextEditor;
    this._syncedDocument = editor?.document;

    if (!this._view?.webview && !ChatViewProvider.currentPanel?.webview) return;

    const isMarkdown = editor?.document.languageId === 'markdown';
    const message = {
      command: 'updateSyncStatus',
      syncedFile: editor ? editor.document.fileName : undefined,
      isMarkdown
    };

    this._view?.webview?.postMessage(message);
    ChatViewProvider.currentPanel?.webview.postMessage(message);
  }

  private async _setWebviewMessageListener(webview: vscode.Webview) {
    webview.onDidReceiveMessage(
      async (message: any) => {
        const command = message.command;

          switch (command) {
            case "fileDropped":
              await this._fileOperations.handleFileDropped(
                message.uris,
                () => this._updateSyncStatus()
              );
              break;

            case "getLlmApiKey":
              this._settingsManager.handleGetLlmApiKey(message, webview);
              break;

            case "createNewFile":
              await this._fileOperations.handleCreateNewFile(
                vscode.workspace.workspaceFolders,
                () => this._updateSyncStatus()
              );
              break;

            case "saveSettings":
              await this._settingsManager.handleSaveSettings(message, webview);
              break;

            case "sendMessage":
              await this._messageHandler.handleSendMessage(
                message.text,
                this._syncedDocument,
                webview
              );
              break;

            case "editWithAI":
              await this._messageHandler.handleEditWithAI(message, webview);
              break;

            case "previewCanvas":
              await this._messageHandler.handlePreviewCanvas(webview);
              break;
        }
      },
      undefined,
      this._disposables
    );
  }
}