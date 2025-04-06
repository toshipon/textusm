import * as vscode from "vscode";
import * as path from "path";
import { getUri } from "../../utils/getUri";
import { getNonce } from "../../utils/getNonce";
import { CONFIG_SECTION, SELECTED_LLM_CONFIG, LlmType } from "../../services/LlmService";

export class WebviewContentProvider {
  constructor(private readonly _extensionUri: vscode.Uri) {}

  public getWebviewContent(webview: vscode.Webview): string {
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
    const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
    const currentLlm = config.get<LlmType>(SELECTED_LLM_CONFIG) || "Gemini";
    const hasApiKey = !!config.get<string>(`${currentLlm.toLowerCase()}ApiKey`);

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
          <div id="chat-container" class="drop-target">
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
                    placeholder="${hasApiKey ? '設定済み (変更する場合は入力してください)' : 'API Keyを入力してください'}"
                    style="${hasApiKey ? 'background-color: var(--vscode-editor-inactiveSelectionBackground);' : ''}">
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
              <p>Hypothesis Canvas Chat へようこそ！ 使用するLLMを選択し、APIキーを入力して開始してください。</p>
            </div>
          
            <div id="sync-info">
              <span id="sync-file">ファイルが選択されていません</span>
              <vscode-button id="new-file-button" appearance="secondary" style="display: none;">新規ファイル作成</vscode-button>
            </div>
            <div id="input-area">
              <vscode-text-area id="message-input" placeholder="Type your message..." resize="vertical" rows="1"></vscode-text-area>
              <vscode-button id="send-button" appearance="primary">Send</vscode-button>
            </div>
          </div>

          <script type="module" nonce="${nonce}" src="${toolkitUri}"></script>
          <style nonce="${nonce}">
            .drop-target.drag-over {
              border: 2px dashed var(--vscode-button-background);
              background-color: var(--vscode-editor-background);
              opacity: 0.8;
            }

            .diff-view {
              background: var(--vscode-editor-background);
              padding: 10px;
              margin: 10px 0;
              border-radius: 4px;
              font-family: monospace;
            }
            
            .diff-view .diff-header {
              color: var(--vscode-textPreformat-foreground);
              margin-bottom: 5px;
            }
            
            .diff-view .diff-content {
              white-space: pre-wrap;
            }
            
            .diff-view .diff-line-added {
              background-color: var(--vscode-diffEditor-insertedTextBackground);
              color: var(--vscode-diffEditor-insertedTextColor);
            }
            
            .diff-view .diff-line-removed {
              background-color: var(--vscode-diffEditor-removedTextBackground);
              color: var(--vscode-diffEditor-removedTextColor);
            }
          </style>
          <script nonce="${nonce}">
            const vscode = acquireVsCodeApi();
            ${this.getWebviewScript()}
          </script>
        </body>
      </html>`;
  }

  private getWebviewScript(): string {
    return `
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
      let lastCompositionEndTime = 0;

      // ドラッグ&ドロップの実装
      const chatContainer = document.getElementById('chat-container');
      
      chatContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        chatContainer.classList.add('drag-over');
      });

      chatContainer.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        chatContainer.classList.remove('drag-over');
      });

      chatContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        chatContainer.classList.remove('drag-over');

        vscode.postMessage({
          command: 'fileDropped',
          uris: Array.from(e.dataTransfer.files).map(file => file.path)
        });
      });

      // Toggle API key visibility
      toggleApiKeyButton.addEventListener('click', () => {
        isApiKeyVisible = !isApiKeyVisible;
        apiKeyInput.type = isApiKeyVisible ? 'text' : 'password';
        toggleApiKeyButton.textContent = isApiKeyVisible ? '🔒' : '👁';
      });

      // Event Listeners
      sendButton.addEventListener('click', sendMessage);
      
      messageInput.addEventListener('compositionend', () => {
        lastCompositionEndTime = Date.now();
      });

      messageInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
          const timeSinceCompositionEnd = Date.now() - lastCompositionEndTime;
          if (timeSinceCompositionEnd < 100) {
            return;
          }
          if (!event.isComposing) {
            event.preventDefault();
            sendMessage();
          }
        }
      });

      document.getElementById('new-file-button').addEventListener('click', () => {
        vscode.postMessage({ command: 'createNewFile' });
      });

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

      function createDiffView(originalText, newText) {
        const diffContainer = document.createElement('div');
        diffContainer.className = 'diff-view';

        const diffHeader = document.createElement('div');
        diffHeader.className = 'diff-header';
        diffHeader.textContent = 'Proposed Changes:';
        diffContainer.appendChild(diffHeader);

        const diffContent = document.createElement('div');
        diffContent.className = 'diff-content';

        // 単純な行ベースの差分表示
        const originalLines = originalText.split('\\n');
        const newLines = newText.split('\\n');
        
        let diffHtml = '';
        for (let i = 0; i < Math.max(originalLines.length, newLines.length); i++) {
          const originalLine = originalLines[i] || '';
          const newLine = newLines[i] || '';
          
          if (originalLine !== newLine) {
            if (originalLine) {
              diffHtml += \`<div class="diff-line-removed">- \${originalLine}</div>\`;
            }
            if (newLine) {
              diffHtml += \`<div class="diff-line-added">+ \${newLine}</div>\`;
            }
          } else {
            diffHtml += \`<div>\${originalLine}</div>\`;
          }
        }
        
        diffContent.innerHTML = diffHtml;
        diffContainer.appendChild(diffContent);
        return diffContainer;
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
          insertButton.textContent = 'Apply Changes';
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
                syncFileElement.textContent = '編集中のファイル: ' + filename;
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

          case 'showDiff':
            const diffView = createDiffView(message.originalText, message.newText);
            // 最後のメッセージコンテナを探す
            const lastMessageContainer = messagesDiv.lastElementChild;
            if (lastMessageContainer && lastMessageContainer.classList.contains('message-container')) {
              lastMessageContainer.insertBefore(diffView, lastMessageContainer.lastElementChild);
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
    `;
  }
}