import * as vscode from "vscode";
import * as path from "path";
import { getUri } from "../utils/getUri";
import { getNonce } from "../utils/getNonce";
import {
  LlmService,
  LlmType,
  CONFIG_SECTION,
  SELECTED_LLM_CONFIG
} from "../services/LlmService";


export class HypothesisCanvasViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'hypothesisCanvasView';

  private _view?: vscode.WebviewView;
  private _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];

  private readonly _llmService: LlmService;

  constructor(extensionUri: vscode.Uri) {
    this._extensionUri = extensionUri;
    this._llmService = new LlmService();
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.file(path.join(this._extensionUri.fsPath, 'dist')),
        vscode.Uri.file(path.join(this._extensionUri.fsPath, 'node_modules', '@vscode', 'webview-ui-toolkit', 'dist')),
      ],
    };

    webviewView.webview.html = this._getWebviewContent(webviewView.webview);
    this._setWebviewMessageListener(webviewView.webview);

    // Configuration change listener
    // 設定変更のリスナーを追加
    vscode.workspace.onDidChangeConfiguration(
      () => {
        if (this._view) {
          const status = this._llmService.initializeLlmClients();
          this._view.webview.postMessage({
            command: "updateStatus",
            status: status.initialized ? "success" : "error",
            message: status.initialized
              ? `Connected to ${this._llmService.selectedLlm}`
              : `Error: ${status.errorMessage}`,
          });
          this._view.webview.html = this._getWebviewContent(this._view.webview);
        }
      },
      null,
      this._disposables
    );
  }

  private _getWebviewContent(webview: vscode.Webview): string {
    const nonce = getNonce();
    const toolkitUri = getUri(webview, this._extensionUri, [
      "node_modules",
      "@vscode",
      "webview-ui-toolkit",
      "dist",
      "toolkit.js",
    ]);
    const stylesUri = getUri(webview, this._extensionUri, ["dist", "webview.css"]);

    // Get current configuration
    const currentLlm = this._llmService.selectedLlm;
    const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
    const currentApiKey = config.get<string>(`${currentLlm.toLowerCase()}ApiKey`) || "";

    return /*html*/ `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}'; style-src ${
      webview.cspSource
    } 'unsafe-inline'; font-src ${webview.cspSource};">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="${stylesUri}">
      </head>
      <body>
        <div id="chat-container">
          <div id="settings-panel">
            <div class="settings-label">LLM Configuration</div>
            <div class="settings-row">
              <vscode-dropdown id="llm-selector">
                <vscode-option value="Gemini" ${
                  currentLlm === "Gemini" ? "selected" : ""
                }>Gemini</vscode-option>
                <vscode-option value="Claude" ${
                  currentLlm === "Claude" ? "selected" : ""
                }>Claude</vscode-option>
                <vscode-option value="OpenAI" ${
                  currentLlm === "OpenAI" ? "selected" : ""
                }>OpenAI</vscode-option>
              </vscode-dropdown>
              <div class="api-key-container">
                <vscode-text-field 
                  type="password" 
                  id="api-key" 
                  placeholder="Enter API Key for selected LLM">
                </vscode-text-field>
                <button class="toggle-visibility" id="toggle-api-key" title="Toggle API key visibility">
                  👁
                </button>
              </div>
              <vscode-button id="save-settings" appearance="primary">Save Settings</vscode-button>
            </div>
            <div id="status-message"></div>
          </div>

          <div id="messages">
            <p>Welcome to Hypothesis Canvas Chat! Select your preferred LLM and enter your API key to get started.</p>
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
          const llmSelector = document.getElementById('llm-selector');
          const apiKeyInput = document.getElementById('api-key');
          const saveSettingsButton = document.getElementById('save-settings');
          const statusMessage = document.getElementById('status-message');
          const toggleApiKeyButton = document.getElementById('toggle-api-key');
          let loadingMessageElement = null;
          let isApiKeyVisible = false;

          // Toggle API key visibility
          toggleApiKeyButton.addEventListener('click', () => {
            isApiKeyVisible = !isApiKeyVisible;
            apiKeyInput.type = isApiKeyVisible ? 'text' : 'password';
            toggleApiKeyButton.textContent = isApiKeyVisible ? '🔒' : '👁';
          });

          // Enable/disable save button based on API key presence
          apiKeyInput.addEventListener('input', () => {
            saveSettingsButton.disabled = !apiKeyInput.value.trim();
          });

          // Event Listeners
          sendButton.addEventListener('click', sendMessage);
          messageInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              sendMessage();
            }
          });

          // Settings panel listeners
          llmSelector.addEventListener('change', () => {
            vscode.postMessage({ 
              command: 'getLlmApiKey', 
              llm: llmSelector.value 
            });
          });

          saveSettingsButton.addEventListener('click', () => {
            const selectedLlm = llmSelector.value;
            const apiKey = apiKeyInput.value;
            vscode.postMessage({
              command: 'saveSettings',
              llm: selectedLlm,
              apiKey: apiKey
            });
          });

          function sendMessage() {
            const message = messageInput.value;
            if (message && message.trim() !== '') {
              const trimmedMessage = message.trim();
              addMessage("You", trimmedMessage);
              vscode.postMessage({ command: 'sendMessage', text: trimmedMessage });
              messageInput.value = '';
              showLoadingMessage();
            }
          }

          function addMessage(sender, text, isLLMResponse = false) {
            removeLoadingMessage();
            const messageContainer = document.createElement('div');
            messageContainer.className = 'message-container';

            const p = document.createElement('p');
            const escapedText = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
            p.innerHTML = \`<strong>\${sender}:</strong> \${escapedText}\`;
            messageContainer.appendChild(p);

            if (isLLMResponse && sender !== 'System' && sender !== 'You') {
              const buttonContainer = document.createElement('div');
              buttonContainer.className = 'action-buttons';

              const insertButton = document.createElement('vscode-button');
              insertButton.textContent = 'Edit with AI';
              insertButton.appearance = 'secondary';
              insertButton.addEventListener('click', () => {
                vscode.postMessage({ command: 'editWithAI', text: text });
              });
              buttonContainer.appendChild(insertButton);
              messageContainer.appendChild(buttonContainer);
            }

            messagesDiv.appendChild(messageContainer);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
          }

          function showLoadingMessage() {
            removeLoadingMessage();
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

          function updateStatus(status, message) {
            statusMessage.textContent = message;
            statusMessage.className = status;
          }

          window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
              case 'addMessage':
                const isLLM = ["Gemini", "Claude", "OpenAI"].includes(message.sender);
                addMessage(message.sender || "LLM", message.text, isLLM);
                break;
              case 'showError':
                removeLoadingMessage();
                addMessage("System", \`Error: \${message.text}\`, false);
                break;
              case 'updateStatus':
                updateStatus(message.status, message.message);
                break;
              case 'updateApiKey':
                apiKeyInput.value = message.apiKey || '';
                break;
            }
          });
        </script>
      </body>
      </html>`;
  }

  private async _setWebviewMessageListener(webview: vscode.Webview) {
    webview.onDidReceiveMessage(
      async (message: any) => {
        const command = message.command;
        const text = message.text;

        switch (command) {
          case "getLlmApiKey":
            const apiKey = vscode.workspace.getConfiguration(CONFIG_SECTION).get<string>(
              `${message.llm.toLowerCase()}ApiKey`
            );
            webview.postMessage({
              command: "updateApiKey",
              apiKey: apiKey || "",
            });
            break;

          case "saveSettings":
            try {
              const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
              await config.update(
                `${message.llm.toLowerCase()}ApiKey`,
                message.apiKey,
                vscode.ConfigurationTarget.Global
              );
              const status = await this._llmService.initializeLlmClients();
              webview.postMessage({
                command: "updateStatus",
                status: status.initialized ? "success" : "error",
                message: status.initialized
                  ? `設定を保存しました。${message.llm}を使用します。`
                  : `エラー: ${status.errorMessage}`,
              });
            } catch (error) {
              console.error("Error saving settings:", error);
              webview.postMessage({
                command: "updateStatus",
                status: "error",
                message: "設定の保存に失敗しました。もう一度お試しください。",
              });
            }
            break;

          case "sendMessage":
            try {
              const basePrompt = `You are an assistant helping a user build a Hypothesis Canvas. The user's request is: "${text}". Provide a helpful response to assist them.`;
              const responseText = await this._llmService.generateResponse(basePrompt);
              webview.postMessage({
                command: "addMessage",
                sender: this._llmService.selectedLlm,
                text: responseText,
              });
            } catch (error: any) {
              console.error("Error in chat message:", error);
              webview.postMessage({
                command: "showError",
                text: error.message,
              });
            }
            break;

          case "editWithAI":
            try {
              const editor = vscode.window.activeTextEditor;
              if (!editor) {
                throw new Error("アクティブなエディタが見つかりません。");
              }
              if (editor.document.languageId !== "markdown") {
                throw new Error("アクティブなエディタがMarkdownファイルではありません。");
              }

              const document = editor.document;
              const selection = editor.selection;
              const textToEdit = !selection.isEmpty
                ? document.getText(selection)
                : document.getText();
              const editRange = !selection.isEmpty
                ? selection
                : new vscode.Range(
                    document.positionAt(0),
                    document.positionAt(document.getText().length)
                  );

              const editedText = await this._llmService.editMarkdownText(
                textToEdit,
                message.text
              );

              await editor.edit(editBuilder => {
                editBuilder.replace(editRange, editedText);
              });
              vscode.window.showInformationMessage("テキストを編集しました。");
            } catch (error: any) {
              console.error("Error editing text:", error);
              vscode.window.showErrorMessage(
                `テキストの編集に失敗しました: ${error.message}`
              );
            }
            break;
        }
      },
      undefined,
      this._disposables
    );
  }
}