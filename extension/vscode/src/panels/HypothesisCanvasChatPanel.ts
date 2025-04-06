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

// --- 定数 ---
const CHAT_WEBVIEW_ID = "hypothesisCanvasChat";
const CHAT_TITLE = "Hypothesis Canvas Chat";

export class HypothesisCanvasChatPanel {
  public static currentPanel: HypothesisCanvasChatPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _syncedDocument: vscode.TextDocument | undefined;
  private readonly _extensionUri: vscode.Uri;
  private readonly _llmService: LlmService;
  private _disposables: vscode.Disposable[] = [];

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this._llmService = new LlmService();

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    this._panel.webview.html = this._getWebviewContent(
      this._panel.webview,
      this._extensionUri
    );
    this._updateSyncStatus();

    // アクティブエディタの変更を監視
    vscode.window.onDidChangeActiveTextEditor(() => {
      this._updateSyncStatus();
    }, null, this._disposables);
    this._setWebviewMessageListener(this._panel.webview);
  }


  public static render(extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (HypothesisCanvasChatPanel.currentPanel) {
      HypothesisCanvasChatPanel.currentPanel._panel.reveal(column);
      return;
    }

    const toolkitBasePath = path.join(
      extensionUri.fsPath,
      "node_modules",
      "@vscode",
      "webview-ui-toolkit",
      "dist"
    );
    const toolkitUri = vscode.Uri.file(toolkitBasePath);

    const panel = vscode.window.createWebviewPanel(
      CHAT_WEBVIEW_ID,
      CHAT_TITLE,
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [
          toolkitUri,
          vscode.Uri.file(path.join(extensionUri.fsPath, "dist")),
        ],
      }
    );

    HypothesisCanvasChatPanel.currentPanel = new HypothesisCanvasChatPanel(
      panel,
      extensionUri
    );
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

  private _getWebviewContent(
    webview: vscode.Webview,
    extensionUri: vscode.Uri
  ): string {
    const nonce = getNonce();
    const toolkitUri = getUri(webview, extensionUri, [
      "node_modules",
      "@vscode",
      "webview-ui-toolkit",
      "dist",
      "toolkit.js",
    ]);
    const stylesUri = getUri(webview, extensionUri, ["dist", "webview.css"]);

    // Get current configuration
    const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
    const currentLlm = config.get<LlmType>(SELECTED_LLM_CONFIG) || "Gemini";
    const currentApiKey =
      config.get<string>(`${currentLlm.toLowerCase()}ApiKey`) || "";

    return /*html*/ `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}'; style-src ${
      webview.cspSource
    } 'unsafe-inline'; font-src ${webview.cspSource};">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${CHAT_TITLE}</title>
        <link rel="stylesheet" href="${stylesUri}">
      </head>
      <body>
        <div id="chat-container">
          <h2>${CHAT_TITLE}</h2>
          
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
          
           <div id="sync-info">
             <span id="sync-file">Not synced with any file</span>
             <vscode-button id="new-file-button" appearance="secondary" style="display: none;">Create New File</vscode-button>
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
          let loadingMessageElement = null;

          // Event Listeners
           sendButton.addEventListener('click', sendMessage);
           messageInput.addEventListener('keydown', (event) => {
             if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
               event.preventDefault();
               sendMessage();
             }
           });

           // 新規ファイル作成ボタンのイベントリスナー
           document.getElementById('new-file-button').addEventListener('click', () => {
             vscode.postMessage({ command: 'createNewFile' });
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
              case 'updateSyncStatus':
                const syncFileElement = document.getElementById('sync-file');
                const newFileButton = document.getElementById('new-file-button');
                
                if (message.syncedFile) {
                  const filename = message.syncedFile.split('/').pop();
                  if (syncFileElement) {
                    syncFileElement.textContent = '現在のファイル: ' + filename;
                  }
                  
                  if (newFileButton) {
                    newFileButton.style.display = message.isMarkdown ? 'none' : 'inline-flex';
                  }
                } else {
                  if (syncFileElement) {
                    syncFileElement.textContent = 'ファイルが選択されていません';
                  }
                  if (newFileButton) {
                    newFileButton.style.display = 'none';
                  }
                }
                break;

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

  private _updateSyncStatus() {
    const editor = vscode.window.activeTextEditor;
    this._syncedDocument = editor?.document;

    if (!this._panel?.webview) return;

    const isMarkdown = editor?.document.languageId === 'markdown';
    this._panel.webview.postMessage({
      command: 'updateSyncStatus',
      syncedFile: editor ? editor.document.fileName : undefined,
      isMarkdown
    });
  }

  private async _setWebviewMessageListener(webview: vscode.Webview) {
    webview.onDidReceiveMessage(
      async (message: any) => {
        const command = message.command;
        const text = message.text;

        switch (command) {
          case "getLlmApiKey":
            const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
            const apiKey = config.get<string>(
              `${message.llm.toLowerCase()}ApiKey`
            );
            webview.postMessage({
              command: "updateApiKey",
              apiKey: apiKey || "",
            });
            break;

          case "createNewFile":
            const defaultUri = vscode.Uri.file(path.join(
              vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '',
              'untitled.md'
            ));
            
            const fileUri = await vscode.window.showSaveDialog({
              defaultUri,
              filters: {
                'Markdown': ['md']
              }
            });

            if (fileUri) {
              try {
                const edit = new vscode.WorkspaceEdit();
                edit.createFile(fileUri, { ignoreIfExists: true });
                await vscode.workspace.applyEdit(edit);
                
                const document = await vscode.workspace.openTextDocument(fileUri);
                await vscode.window.showTextDocument(document);
                
                this._updateSyncStatus();
                vscode.window.showInformationMessage('新規Markdownファイルを作成しました。');
              } catch (error) {
                console.error('Error creating new file:', error);
                vscode.window.showErrorMessage('ファイルの作成に失敗しました。');
              }
            }
            break;

           case "saveSettings":
            try {
              const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
              await config.update(
                SELECTED_LLM_CONFIG,
                message.llm,
                vscode.ConfigurationTarget.Global
              );
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
                  ? `Settings saved successfully. Using ${message.llm}.`
                  : `Error: ${status.errorMessage}`,
              });
            } catch (error) {
              console.error("Error saving settings:", error);
              webview.postMessage({
                command: "updateStatus",
                status: "error",
                message: "Error saving settings. Please try again.",
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
