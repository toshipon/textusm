import * as vscode from "vscode";
import * as path from "path"; // Node.js の path モジュールをインポート
import { getUri } from "../utils/getUri"; // ヘルパー関数をインポート
import { getNonce } from "../utils/getNonce"; // ヘルパー関数をインポート
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai"; // Gemini クライアントをインポート
import Anthropic from '@anthropic-ai/sdk'; // Claude クライアントをインポート
import OpenAI from 'openai'; // OpenAI クライアントをインポート

// --- 定数 ---
const CHAT_WEBVIEW_ID = "hypothesisCanvasChat";
const CHAT_TITLE = "Hypothesis Canvas Chat";
const CONFIG_SECTION = "textusm.hypothesisCanvas";
const GEMINI_API_KEY_CONFIG = "geminiApiKey";
const CLAUDE_API_KEY_CONFIG = "claudeApiKey";
const OPENAI_API_KEY_CONFIG = "openaiApiKey";
const SELECTED_LLM_CONFIG = "selectedLlm";

// モデル名 (必要に応じて設定から取得するように変更可能)
const GEMINI_MODEL_NAME = "gemini-1.5-flash";
const CLAUDE_MODEL_NAME = "claude-3-haiku-20240307"; // 例: Haiku モデル
const OPENAI_MODEL_NAME = "gpt-4o-mini"; // 例: GPT-4o mini

type LlmType = "Gemini" | "Claude" | "OpenAI"; // | "Copilot"; // 将来のサポート

export class HypothesisCanvasChatPanel {
  public static currentPanel: HypothesisCanvasChatPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];

  // LLM クライアントインスタンス
  private _genAI: GoogleGenerativeAI | undefined;
  private _anthropic: Anthropic | undefined;
  private _openai: OpenAI | undefined;
  private _selectedLlm: LlmType = "Gemini"; // デフォルト

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._extensionUri = extensionUri;

    // LLM クライアントを初期化
    this._initializeLlmClients();

    // パネルが破棄されたときの処理
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Webview の HTML コンテンツを設定
    this._panel.webview.html = this._getWebviewContent(this._panel.webview, this._extensionUri);

    // Webview からのメッセージリスナーを設定
    this._setWebviewMessageListener(this._panel.webview);

    // 設定変更を監視してクライアントを再初期化
    vscode.workspace.onDidChangeConfiguration(e => {
        const affectsConfig = (key: string) => e.affectsConfiguration(`${CONFIG_SECTION}.${key}`);
        if (
            affectsConfig(GEMINI_API_KEY_CONFIG) ||
            affectsConfig(CLAUDE_API_KEY_CONFIG) ||
            affectsConfig(OPENAI_API_KEY_CONFIG) ||
            affectsConfig(SELECTED_LLM_CONFIG)
        ) {
            this._initializeLlmClients();
        }
    }, null, this._disposables);
  }

  /**
   * 設定に基づいて LLM クライアントを初期化します。
   */
  private _initializeLlmClients() {
    const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
    this._selectedLlm = config.get<LlmType>(SELECTED_LLM_CONFIG) || "Gemini"; // デフォルトは Gemini

    // Reset clients
    this._genAI = undefined;
    this._anthropic = undefined;
    this._openai = undefined;

    let apiKey: string | undefined;
    let clientInitialized = false;
    let errorMessage: string | undefined;

    try {
        switch (this._selectedLlm) {
            case "Gemini":
                apiKey = config.get<string>(GEMINI_API_KEY_CONFIG);
                if (apiKey) {
                    this._genAI = new GoogleGenerativeAI(apiKey);
                    console.log("Gemini client initialized.");
                    clientInitialized = true;
                } else {
                    errorMessage = "Gemini API Key not configured.";
                }
                break;
            case "Claude":
                apiKey = config.get<string>(CLAUDE_API_KEY_CONFIG);
                if (apiKey) {
                    this._anthropic = new Anthropic({ apiKey });
                    console.log("Claude client initialized.");
                    clientInitialized = true;
                } else {
                    errorMessage = "Claude API Key not configured.";
                }
                break;
            case "OpenAI":
                apiKey = config.get<string>(OPENAI_API_KEY_CONFIG);
                if (apiKey) {
                    this._openai = new OpenAI({ apiKey });
                    console.log("OpenAI client initialized.");
                    clientInitialized = true;
                } else {
                    errorMessage = "OpenAI API Key not configured.";
                }
                break;
            // case "Copilot": // 将来のサポート
            //     // Copilot の初期化ロジック (利用可能な場合)
            //     break;
            default:
                errorMessage = `Unsupported LLM selected: ${this._selectedLlm}`;
                console.warn(errorMessage);
        }
    } catch (error: any) {
        errorMessage = `Error initializing ${this._selectedLlm} client: ${error.message}`;
        console.error(errorMessage, error);
    }


    if (!clientInitialized && errorMessage) {
        console.warn(`${errorMessage} Client not initialized.`);
        // パネルが開いている場合はユーザーに通知
        if (HypothesisCanvasChatPanel.currentPanel === this) {
            this._panel.webview.postMessage({ command: 'showError', text: `Error: ${errorMessage} Please check your settings.` });
        }
    } else if (clientInitialized) {
        // 初期化成功時にウェルカムメッセージを更新 (任意)
        // this._panel.webview.postMessage({ command: 'addMessage', sender: 'System', text: `Using ${this._selectedLlm}.` });
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
        // toolkitUri と dist ディレクトリをローカルリソースルートとして許可
        localResourceRoots: [toolkitUri, vscode.Uri.file(path.join(extensionUri.fsPath, 'dist'))]
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
    // スタイルシートの URI を取得
    const stylesUri = getUri(webview, extensionUri, ["dist", "webview.css"]); // 仮のパス、ビルドプロセスで生成される想定

    return /*html*/ `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}'; style-src ${webview.cspSource} 'unsafe-inline'; font-src ${webview.cspSource};">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${CHAT_TITLE}</title>
        <link rel="stylesheet" href="${stylesUri}"> <!-- スタイルシートをリンク -->
        <!-- インラインスタイルを削除 -->
      </head>
      <body>
        <div id="chat-container">
          <h2>${CHAT_TITLE}</h2>
          <div id="messages">
            <p>Welcome! Ask me to help build your Hypothesis Canvas. Currently using: ${this._selectedLlm}</p>
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

          function addMessage(sender, text, isLLMResponse = false) {
            removeLoadingMessage(); // Remove loading indicator if it exists
            const messageContainer = document.createElement('div');
            messageContainer.className = 'message-container';

            const p = document.createElement('p');
            // Basic escaping, consider a library for more robust HTML sanitization if needed
            const escapedText = text.replace(/</g, "&lt;").replace(/>/g, "&gt;"); // Use &lt; and &gt; for escaping
            p.innerHTML = \`<strong>\${sender}:</strong> \${escapedText}\`;
            messageContainer.appendChild(p);

            if (isLLMResponse && sender !== 'System' && sender !== 'You') {
              const buttonContainer = document.createElement('div');
              buttonContainer.className = 'action-buttons';

              const insertButton = document.createElement('vscode-button');
              insertButton.textContent = 'Insert to Markdown';
              insertButton.appearance = 'secondary';
              insertButton.addEventListener('click', () => {
                vscode.postMessage({ command: 'insertToMarkdown', text: text });
              });
              buttonContainer.appendChild(insertButton);
              messageContainer.appendChild(buttonContainer);
            }

            messagesDiv.appendChild(messageContainer);
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
                // Check if the sender is one of the known LLMs to determine if it's an LLM response
                const isLLM = ["Gemini", "Claude", "OpenAI"].includes(message.sender);
                addMessage(message.sender || "LLM", message.text, isLLM);
                break;
              case 'showError': // Handle error messages from extension
                 removeLoadingMessage();
                 addMessage("System", \`Error: \${message.text}\`, false); // Error messages are not LLM responses for insertion
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
            console.log(`Message from webview (using ${this._selectedLlm}):`, text);

            let responseText = "";
            let errorMessage: string | undefined;

            // --- プロンプトの準備 (LLM ごとに調整可能) ---
            // TODO: より洗練されたプロンプトエンジニアリングを実装する
            const basePrompt = `You are an assistant helping a user build a Hypothesis Canvas. The user's request is: "${text}". Provide a helpful response to assist them.`;

            try {
                switch (this._selectedLlm) {
                    case "Gemini":
                        if (!this._genAI) {
                            errorMessage = "Gemini client not initialized. Check API Key setting.";
                            break;
                        }
                        const safetySettings = [
                            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                        ];
                        const model = this._genAI.getGenerativeModel({ model: GEMINI_MODEL_NAME, safetySettings });
                        const result = await model.generateContent(basePrompt);
                        responseText = result.response.text();
                        break;

                    case "Claude":
                        if (!this._anthropic) {
                            errorMessage = "Claude client not initialized. Check API Key setting.";
                            break;
                        }
                        const claudeResponse = await this._anthropic.messages.create({
                            model: CLAUDE_MODEL_NAME,
                            max_tokens: 1024, // 必要に応じて調整
                            messages: [{ role: "user", content: basePrompt }],
                        });
                        // Claude SDK v4 では content はブロックの配列
                        if (claudeResponse.content && claudeResponse.content.length > 0 && claudeResponse.content[0].type === 'text') {
                            responseText = claudeResponse.content[0].text;
                        } else {
                            errorMessage = "Received unexpected response format from Claude.";
                        }
                        break;

                    case "OpenAI":
                        if (!this._openai) {
                            errorMessage = "OpenAI client not initialized. Check API Key setting.";
                            break;
                        }
                        const openaiResponse = await this._openai.chat.completions.create({
                            model: OPENAI_MODEL_NAME,
                            messages: [{ role: "user", content: basePrompt }],
                        });
                        responseText = openaiResponse.choices[0]?.message?.content || "";
                        break;

                    // case "Copilot":
                    //     // Copilot API 呼び出し (利用可能な場合)
                    //     break;

                    default:
                        errorMessage = `Selected LLM (${this._selectedLlm}) is not supported for sending messages.`;
                }

            } catch (error: any) {
              console.error(`Error calling ${this._selectedLlm} API:`, error);
              errorMessage = `An error occurred while contacting ${this._selectedLlm}.`;
              if (error instanceof Error) {
                  errorMessage += ` ${error.message}`;
              }
              // API キー関連のエラーをより具体的に表示
              if (error.message?.includes('API key') || error.status === 401) {
                   errorMessage = `Invalid ${this._selectedLlm} API Key. Please check your settings.`;
              }
            }

            if (errorMessage) {
                console.error(errorMessage);
                webview.postMessage({ command: 'showError', text: errorMessage });
            } else {
                console.log(`${this._selectedLlm} Response:`, responseText);
                webview.postMessage({ command: 'addMessage', sender: this._selectedLlm, text: responseText });
            }

            return;

          case 'insertToMarkdown':
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
              vscode.window.showErrorMessage("No active text editor found.");
              return;
            }
            if (editor.document.languageId !== 'markdown') {
              vscode.window.showErrorMessage("The active editor is not a Markdown file.");
              return;
            }

            const document = editor.document;
            const textToInsert = message.text; // Text from the LLM response

            // Find Markdown sections (lines starting with ##)
            const sections: { label: string; line: number }[] = [];
            for (let i = 0; i < document.lineCount; i++) {
              const line = document.lineAt(i);
              if (line.text.startsWith('## ')) {
                sections.push({ label: line.text.substring(3).trim(), line: i });
              }
            }

            if (sections.length === 0) {
              // If no sections found, insert at the end of the file
              const endPosition = new vscode.Position(document.lineCount, 0);
              editor.edit(editBuilder => {
                // Add newlines before and after for spacing
                editBuilder.insert(endPosition, `\n\n${textToInsert}\n`);
              }).then(success => {
                if (success) {
                  vscode.window.showInformationMessage("Text inserted at the end of the file.");
                } else {
                  vscode.window.showErrorMessage("Failed to insert text.");
                }
              });
              return;
            }

            // Show Quick Pick to select section
            const selectedSection = await vscode.window.showQuickPick(
              sections.map(s => ({ label: s.label, description: `Line ${s.line + 1}`, line: s.line })),
              { placeHolder: "Select the section to insert the text into" }
            );

            if (selectedSection) {
              // Find the position to insert (start of the line after the selected section header)
              // We'll insert two lines below the header for spacing.
              const insertPosition = new vscode.Position(selectedSection.line + 1, 0);

              editor.edit(editBuilder => {
                // Add newlines before and after the inserted text for better formatting
                editBuilder.insert(insertPosition, `\n${textToInsert}\n`);
              }).then(success => {
                if (success) {
                  vscode.window.showInformationMessage(`Text inserted under section: ${selectedSection.label}`);
                  // Optionally reveal the inserted text
                  editor.revealRange(new vscode.Range(insertPosition, insertPosition.translate(textToInsert.split('\n').length + 1)));
                } else {
                  vscode.window.showErrorMessage("Failed to insert text.");
                }
              });
            } else {
              vscode.window.showInformationMessage("Insertion cancelled.");
            }
            return;
        }
      },
      undefined,
      this._disposables
    );
  }
}