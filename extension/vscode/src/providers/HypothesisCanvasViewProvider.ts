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

const CONFIG_SECTION = "textusm.hypothesisCanvas";
const GEMINI_API_KEY_CONFIG = "geminiApiKey";
const CLAUDE_API_KEY_CONFIG = "claudeApiKey";
const OPENAI_API_KEY_CONFIG = "openaiApiKey";
const SELECTED_LLM_CONFIG = "selectedLlm";

const GEMINI_MODEL_NAME = "gemini-1.5-flash";
const CLAUDE_MODEL_NAME = "claude-3-haiku-20240307";
const OPENAI_MODEL_NAME = "gpt-4o-mini";

type LlmType = "Gemini" | "Claude" | "OpenAI";

export class HypothesisCanvasViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'hypothesisCanvasView';

  private _view?: vscode.WebviewView;
  private _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];

  private _genAI: GoogleGenerativeAI | undefined;
  private _anthropic: Anthropic | undefined;
  private _openai: OpenAI | undefined;
  private _selectedLlm: LlmType = "Gemini";

  constructor(extensionUri: vscode.Uri) {
    this._extensionUri = extensionUri;
    this._initializeLlmClients();
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
          if (this._view) {
            this._view.webview.html = this._getWebviewContent(this._view.webview);
          }
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

    if (!clientInitialized && errorMessage && this._view) {
      console.warn(`${errorMessage} Client not initialized.`);
      this._view.webview.postMessage({
        command: "updateStatus",
        status: "error",
        message: `Error: ${errorMessage} Please check your settings.`,
      });
    } else if (clientInitialized && this._view) {
      this._view.webview.postMessage({
        command: "updateStatus",
        status: "success",
        message: `Connected to ${this._selectedLlm}`,
      });
    }
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
    const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
    const currentLlm = config.get<LlmType>(SELECTED_LLM_CONFIG) || "Gemini";
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
            const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
            const apiKey = config.get<string>(
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

          case "insertToMarkdown":
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
              vscode.window.showErrorMessage("No active text editor found.");
              return;
            }
            if (editor.document.languageId !== "markdown") {
              vscode.window.showErrorMessage(
                "The active editor is not a Markdown file."
              );
              return;
            }

            const document = editor.document;
            const textToInsert = message.text;

            const sections: { label: string; line: number }[] = [];
            for (let i = 0; i < document.lineCount; i++) {
              const line = document.lineAt(i);
              if (line.text.startsWith("## ")) {
                sections.push({
                  label: line.text.substring(3).trim(),
                  line: i,
                });
              }
            }

            if (sections.length === 0) {
              const endPosition = new vscode.Position(document.lineCount, 0);
              editor
                .edit((editBuilder) => {
                  editBuilder.insert(endPosition, `\n\n${textToInsert}\n`);
                })
                .then((success) => {
                  if (success) {
                    vscode.window.showInformationMessage(
                      "Text inserted at the end of the file."
                    );
                  } else {
                    vscode.window.showErrorMessage("Failed to insert text.");
                  }
                });
              return;
            }

            const selectedSection = await vscode.window.showQuickPick(
              sections.map((s) => ({
                label: s.label,
                description: `Line ${s.line + 1}`,
                line: s.line,
              })),
              { placeHolder: "Select the section to insert the text into" }
            );

            if (selectedSection) {
              const insertPosition = new vscode.Position(
                selectedSection.line + 1,
                0
              );

              editor
                .edit((editBuilder) => {
                  editBuilder.insert(insertPosition, `\n${textToInsert}\n`);
                })
                .then((success) => {
                  if (success) {
                    vscode.window.showInformationMessage(
                      `Text inserted under section: ${selectedSection.label}`
                    );
                    editor.revealRange(
                      new vscode.Range(
                        insertPosition,
                        insertPosition.translate(
                          textToInsert.split("\n").length + 1
                        )
                      )
                    );
                  } else {
                    vscode.window.showErrorMessage("Failed to insert text.");
                  }
                });
            } else {
              vscode.window.showInformationMessage("Insertion cancelled.");
            }
            break;
        }
      },
      undefined,
      this._disposables
    );
  }
}