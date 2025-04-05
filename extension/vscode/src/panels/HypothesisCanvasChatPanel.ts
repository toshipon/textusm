import * as vscode from "vscode";
import * as path from "path"; // Node.js の path モジュールをインポート
import { getUri } from "../utils/getUri"; // ヘルパー関数をインポート
import { getNonce } from "../utils/getNonce"; // ヘルパー関数をインポート
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai"; // Gemini クライアントをインポート

// --- 定数 ---
const CHAT_WEBVIEW_ID = "hypothesisCanvasChat";
const CHAT_TITLE = "Hypothesis Canvas Chat";
const CONFIG_SECTION = "textusm.hypothesisCanvas";
const GEMINI_API_KEY_CONFIG = "geminiApiKey";
const GEMINI_MODEL_NAME = "gemini-1.5-flash"; // 使用するモデル名

export class HypothesisCanvasChatPanel {
  public static currentPanel: HypothesisCanvasChatPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  private _genAI: GoogleGenerativeAI | undefined; // Gemini クライアントインスタンス

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._extensionUri = extensionUri;

    // API キーを取得してクライアントを初期化
    this._initializeGeminiClient();

    // パネルが破棄されたときの処理
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Webview の HTML コンテンツを設定
    this._panel.webview.html = this._getWebviewContent(this._panel.webview, this._extensionUri);

    // Webview からのメッセージリスナーを設定
    this._setWebviewMessageListener(this._panel.webview);

    // 設定変更を監視してクライアントを再初期化
    vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration(`${CONFIG_SECTION}.${GEMINI_API_KEY_CONFIG}`)) {
            this._initializeGeminiClient();
        }
    }, null, this._disposables);
  }

  /**
   * Gemini クライアントを初期化します。
   */
  private _initializeGeminiClient() {
    const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
    const apiKey = config.get<string>(GEMINI_API_KEY_CONFIG);
    if (apiKey) {
      this._genAI = new GoogleGenerativeAI(apiKey);
      console.log("Gemini client initialized.");
    } else {
      this._genAI = undefined;
      console.warn("Gemini API Key not found. Client not initialized.");
      // パネルが開いている場合はユーザーに通知
      if (HypothesisCanvasChatPanel.currentPanel === this) {
          this._panel.webview.postMessage({ command: 'addMessage', sender: 'System', text: 'Error: Gemini API Key not configured in settings.' });
      }
    }
  }

  /**
   * パネルを表示または作成します。
   */
  public static render(extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (HypothesisCanvasChatPanel.currentPanel) {
      HypothesisCanvasChatPanel.currentPanel._panel.reveal(column);
      return;
    }

    const toolkitBasePath = path.join(extensionUri.fsPath, 'node_modules', '@vscode', 'webview-ui-toolkit', 'dist');
    const toolkitUri = vscode.Uri.file(toolkitBasePath);

    const panel = vscode.window.createWebviewPanel(
      CHAT_WEBVIEW_ID,
      CHAT_TITLE,
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [toolkitUri]
      }
    );

    HypothesisCanvasChatPanel.currentPanel = new HypothesisCanvasChatPanel(panel, extensionUri);
  }

  public dispose() {
    HypothesisCanvasChatPanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
    console.log("HypothesisCanvasChatPanel disposed.");
  }

  /**
   * Webview の HTML コンテンツを取得します。
   */
  private _getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri): string {
    const nonce = getNonce();
    const toolkitUri = getUri(webview, extensionUri, ["node_modules", "@vscode", "webview-ui-toolkit", "dist", "toolkit.js"]);

    return /*html*/ `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}'; style-src ${webview.cspSource} 'unsafe-inline'; font-src ${webview.cspSource};">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${CHAT_TITLE}</title>
        <style>
          body { font-family: var(--vscode-font-family); color: var(--vscode-editor-foreground); background-color: var(--vscode-editor-background); padding: 1em; height: 100vh; box-sizing: border-box; display: flex; flex-direction: column; }
          #chat-container { display: flex; flex-direction: column; flex-grow: 1; height: 0; }
          #messages { flex-grow: 1; overflow-y: auto; border: 1px solid var(--vscode-sideBar-border); margin-bottom: 1em; padding: 0.5em; }
          #input-area { display: flex; align-items: flex-end; }
          #message-input { flex-grow: 1; margin-right: 0.5em; }
          vscode-button { height: auto; }
          p { margin: 0.3em 0; white-space: pre-wrap; } /* Preserve whitespace and wrap */
          .loading { font-style: italic; color: var(--vscode-descriptionForeground); }
        </style>
      </head>
      <body>
        <div id="chat-container">
          <h2>${CHAT_TITLE}</h2>
          <div id="messages">
            <p>Welcome! Ask me to help build your Hypothesis Canvas.</p>
            <!-- Chat messages will be added here -->
          </div>
          <div id="input-area">
            <vscode-text-area id="message-input" placeholder="Type your message..." resize="vertical" rows="1"></vscode-text-area>
            <vscode-button id="send-button" appearance="primary">Send</vscode-button>
          </div>
        </div>

        <script type="module" nonce="${nonce}" src="${toolkitUri}"></script>
        <script nonce="${nonce}">
          const vscode = acquireVsCodeApi();
          const sendButton = document.getElementById('send-button');
          const messageInput = document.getElementById('message-input');
          const messagesDiv = document.getElementById('messages');
          let loadingMessageElement = null; // To keep track of the loading message

          sendButton.addEventListener('click', sendMessage);
          messageInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              sendMessage();
            }
          });

          function sendMessage() {
            const message = messageInput.value;
            if (message && message.trim() !== '') {
              const trimmedMessage = message.trim();
              addMessage("You", trimmedMessage);
              vscode.postMessage({ command: 'sendMessage', text: trimmedMessage });
              messageInput.value = '';
              showLoadingMessage(); // Show loading indicator
            }
          }

          function addMessage(sender, text) {
            removeLoadingMessage(); // Remove loading indicator if it exists
            const p = document.createElement('p');
            const escapedText = text.replace(/</g, "<").replace(/>/g, ">");
            p.innerHTML = \`<strong>\${sender}:</strong> \${escapedText}\`;
            messagesDiv.appendChild(p);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
          }

          function showLoadingMessage() {
            removeLoadingMessage(); // Remove previous loading message if any
            loadingMessageElement = document.createElement('p');
            loadingMessageElement.className = 'loading';
            loadingMessageElement.textContent = 'LLM is thinking...';
            messagesDiv.appendChild(loadingMessageElement);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
          }

          function removeLoadingMessage() {
            if (loadingMessageElement) {
              messagesDiv.removeChild(loadingMessageElement);
              loadingMessageElement = null;
            }
          }

          window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
              case 'addMessage':
                addMessage(message.sender || "LLM", message.text);
                break;
              case 'showError': // Handle error messages from extension
                 removeLoadingMessage();
                 addMessage("System", \`Error: \${message.text}\`);
                 break;
            }
          });
        </script>
      </body>
      </html>`;
  }

  /**
   * Webview からのメッセージリスナーを設定します。
   */
  private async _setWebviewMessageListener(webview: vscode.Webview) {
    webview.onDidReceiveMessage(
      async (message: any) => {
        const command = message.command;
        const text = message.text;

        switch (command) {
          case 'sendMessage':
            console.log('Message from webview:', text);

            if (!this._genAI) {
              console.error("Gemini client not initialized.");
              webview.postMessage({ command: 'showError', text: 'Gemini client not initialized. Check API Key setting.' });
              return;
            }

            try {
              // --- 安全性設定 (オプション) ---
              const safetySettings = [
                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
              ];

              // モデル取得時に安全性設定を渡す
              const model = this._genAI.getGenerativeModel({ model: GEMINI_MODEL_NAME, safetySettings });

              // --- プロンプトの準備 (仮説キャンバス支援用に調整が必要) ---
              // TODO: より洗練されたプロンプトエンジニアリングを実装する
              // 例: 現在のキャンバスの内容をコンテキストとして含める、特定のセクションについて質問するなど
              const prompt = `You are an assistant helping a user build a Hypothesis Canvas. The user's request is: "${text}". Provide a helpful response to assist them.`;

              const result = await model.generateContent(prompt); // 第2引数を削除
              const response = result.response;
              const responseText = response.text();

              console.log("LLM Response:", responseText);
              webview.postMessage({ command: 'addMessage', sender: 'LLM', text: responseText });

            } catch (error: any) {
              console.error("Error calling Gemini API:", error);
              let errorMessage = "An unknown error occurred while contacting the LLM.";
              if (error instanceof Error) {
                  errorMessage = error.message;
              } else if (typeof error === 'string') {
                  errorMessage = error;
              }
              // エラーの詳細をユーザーに伝える (API キー関連のエラーなど)
              if (error.message && error.message.includes('API key not valid')) {
                  errorMessage = "Invalid Gemini API Key. Please check your settings.";
              }
              webview.postMessage({ command: 'showError', text: errorMessage });
            }
            return;
        }
      },
      undefined,
      this._disposables
    );
  }
}