import * as vscode from "vscode";
import * as path from "path";
import { getUri } from "../utils/getUri";
import { getNonce } from "../utils/getNonce";
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

// --- 定数 ---
const CHAT_WEBVIEW_ID = "hypothesisCanvasChat";
const CHAT_TITLE = "Hypothesis Canvas Chat";
const CONFIG_SECTION = "textusm.hypothesisCanvas";
const GEMINI_API_KEY_CONFIG = "geminiApiKey";
const CLAUDE_API_KEY_CONFIG = "claudeApiKey";
const OPENAI_API_KEY_CONFIG = "openaiApiKey";
const SELECTED_LLM_CONFIG = "selectedLlm";

const GEMINI_MODEL_NAME = "gemini-1.5-flash";
const CLAUDE_MODEL_NAME = "claude-3-haiku-20240307";
const OPENAI_MODEL_NAME = "gpt-4o-mini";

type LlmType = "Gemini" | "Claude" | "OpenAI";

export class HypothesisCanvasChatPanel {
  public static currentPanel: HypothesisCanvasChatPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _syncedDocument: vscode.TextDocument | undefined;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];

  private _genAI: GoogleGenerativeAI | undefined;
  private _anthropic: Anthropic | undefined;
  private _openai: OpenAI | undefined;
  private _selectedLlm: LlmType = "Gemini";

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._extensionUri = extensionUri;

    this._initializeLlmClients();
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

    vscode.workspace.onDidChangeConfiguration(
      (e) => {
        const affectsConfig = (key: string) =>
          e.affectsConfiguration(`${CONFIG_SECTION}.${key}`);
        if (
          affectsConfig(GEMINI_API_KEY_CONFIG) ||
          affectsConfig(CLAUDE_API_KEY_CONFIG) ||
          affectsConfig(OPENAI_API_KEY_CONFIG) ||
          affectsConfig(SELECTED_LLM_CONFIG)
        ) {
          this._initializeLlmClients();
        }
      },
      null,
      this._disposables
    );
  }

  private _initializeLlmClients() {
    const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
    this._selectedLlm = config.get<LlmType>(SELECTED_LLM_CONFIG) || "Gemini";

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
      if (HypothesisCanvasChatPanel.currentPanel === this) {
        this._panel.webview.postMessage({
          command: "updateStatus",
          status: "error",
          message: `Error: ${errorMessage} Please check your settings.`,
        });
      }
    } else if (clientInitialized) {
      if (HypothesisCanvasChatPanel.currentPanel === this) {
        this._panel.webview.postMessage({
          command: "updateStatus",
          status: "success",
          message: `Connected to ${this._selectedLlm}`,
        });
      }
    }
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
              this._initializeLlmClients();
              webview.postMessage({
                command: "updateStatus",
                status: "success",
                message: `Settings saved successfully. Using ${message.llm}.`,
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
            console.log(
              `Message from webview (using ${this._selectedLlm}):`,
              text
            );

            let responseText = "";
            let errorMessage: string | undefined;

            const basePrompt = `You are an assistant helping a user build a Hypothesis Canvas. The user's request is: "${text}". Provide a helpful response to assist them.`;

            try {
              switch (this._selectedLlm) {
                case "Gemini":
                  if (!this._genAI) {
                    errorMessage =
                      "Gemini client not initialized. Check API Key setting.";
                    break;
                  }
                  const safetySettings = [
                    {
                      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                    },
                    {
                      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                    },
                    {
                      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                    },
                    {
                      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                    },
                  ];
                  const model = this._genAI.getGenerativeModel({
                    model: GEMINI_MODEL_NAME,
                    safetySettings,
                  });
                  const result = await model.generateContent(basePrompt);
                  responseText = result.response.text();
                  break;

                case "Claude":
                  if (!this._anthropic) {
                    errorMessage =
                      "Claude client not initialized. Check API Key setting.";
                    break;
                  }
                  const claudeResponse = await this._anthropic.messages.create({
                    model: CLAUDE_MODEL_NAME,
                    max_tokens: 1024,
                    messages: [{ role: "user", content: basePrompt }],
                  });
                  if (
                    claudeResponse.content &&
                    claudeResponse.content.length > 0 &&
                    claudeResponse.content[0].type === "text"
                  ) {
                    responseText = claudeResponse.content[0].text;
                  } else {
                    errorMessage =
                      "Received unexpected response format from Claude.";
                  }
                  break;

                case "OpenAI":
                  if (!this._openai) {
                    errorMessage =
                      "OpenAI client not initialized. Check API Key setting.";
                    break;
                  }
                  const openaiResponse =
                    await this._openai.chat.completions.create({
                      model: OPENAI_MODEL_NAME,
                      messages: [{ role: "user", content: basePrompt }],
                    });
                  responseText =
                    openaiResponse.choices[0]?.message?.content || "";
                  break;

                default:
                  errorMessage = `Selected LLM (${this._selectedLlm}) is not supported for sending messages.`;
              }
            } catch (error: any) {
              console.error(`Error calling ${this._selectedLlm} API:`, error);
              errorMessage = `An error occurred while contacting ${this._selectedLlm}.`;
              if (error instanceof Error) {
                errorMessage += ` ${error.message}`;
              }
              if (error.message?.includes("API key") || error.status === 401) {
                errorMessage = `Invalid ${this._selectedLlm} API Key. Please check your settings.`;
              }
            }

            if (errorMessage) {
              console.error(errorMessage);
              webview.postMessage({ command: "showError", text: errorMessage });
            } else {
              console.log(`${this._selectedLlm} Response:`, responseText);
              webview.postMessage({
                command: "addMessage",
                sender: this._selectedLlm,
                text: responseText,
              });
            }
            break;

          case "editWithAI":
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
              vscode.window.showErrorMessage("アクティブなエディタが見つかりません。");
              return;
            }
            if (editor.document.languageId !== "markdown") {
              vscode.window.showErrorMessage(
                "アクティブなエディタがMarkdownファイルではありません。"
              );
              return;
            }

            const document = editor.document;
            const selection = editor.selection;
            let textToEdit: string;
            let editRange: vscode.Range;

            // 選択範囲があれば、その範囲のテキストを編集
            if (!selection.isEmpty) {
              textToEdit = document.getText(selection);
              editRange = selection;
            } else {
              // 選択範囲がない場合は、ファイル全体を編集
              textToEdit = document.getText();
              editRange = new vscode.Range(
                document.positionAt(0),
                document.positionAt(document.getText().length)
              );
            }

            try {
              // LLMにテキスト編集を依頼
              let editPrompt = `以下のMarkdownテキストを編集してください。ユーザーの意図: ${message.text}\n\n${textToEdit}`;
              let editedText = "";

              switch (this._selectedLlm) {
                case "Gemini":
                  if (!this._genAI) {
                    throw new Error("Gemini client not initialized");
                  }
                  const model = this._genAI.getGenerativeModel({
                    model: GEMINI_MODEL_NAME,
                  });
                  const result = await model.generateContent(editPrompt);
                  editedText = result.response.text();
                  break;

                case "Claude":
                  if (!this._anthropic) {
                    throw new Error("Claude client not initialized");
                  }
                  const claudeResponse = await this._anthropic.messages.create({
                    model: CLAUDE_MODEL_NAME,
                    max_tokens: 1024,
                    messages: [{ role: "user", content: editPrompt }],
                  });
                  if (
                    claudeResponse.content &&
                    claudeResponse.content.length > 0 &&
                    claudeResponse.content[0].type === "text"
                  ) {
                    editedText = claudeResponse.content[0].text;
                  }
                  break;

                case "OpenAI":
                  if (!this._openai) {
                    throw new Error("OpenAI client not initialized");
                  }
                  const openaiResponse = await this._openai.chat.completions.create({
                    model: OPENAI_MODEL_NAME,
                    messages: [{ role: "user", content: editPrompt }],
                  });
                  editedText = openaiResponse.choices[0]?.message?.content || "";
                  break;
              }

              if (editedText) {
                // 編集をドキュメントに適用
                await editor.edit(editBuilder => {
                  editBuilder.replace(editRange, editedText);
                });
                vscode.window.showInformationMessage("テキストを編集しました。");
              }
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
