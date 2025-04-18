import * as vscode from "vscode";
import * as path from "path";
import { getUri } from "../../utils/getUri";
import { getNonce } from "../../utils/getNonce";
import {
  CONFIG_SECTION,
  SELECTED_LLM_CONFIG,
  LlmType,
} from "../../services/LlmService";

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
    const stylesUri = getUri(webview, this._extensionUri, [
      "dist",
      "webview.css",
    ]);
    // Load the bundled script from the dist directory
    const scriptUri = getUri(webview, this._extensionUri, [
      "dist",
      "webviewScript.js",
    ]);

    // Get current configuration
    const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
    const currentLlm = config.get<LlmType>(SELECTED_LLM_CONFIG) || "Gemini";
    const hasApiKey = !!config.get<string>(`${currentLlm.toLowerCase()}ApiKey`);

    return /*html*/ `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}' 'unsafe-inline' ${
      webview.cspSource
    }; style-src ${webview.cspSource} 'unsafe-inline'; font-src ${
      webview.cspSource
    };">
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
                    placeholder="${
                      hasApiKey
                        ? "設定済み (変更する場合は入力してください)"
                        : "API Keyを入力してください"
                    }"
                    style="${
                      hasApiKey
                        ? "background-color: var(--vscode-editor-inactiveSelectionBackground);"
                        : ""
                    }">
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
               <div class="button-container">
                 <vscode-button id="send-button" appearance="primary">Send</vscode-button>
                 <vscode-button id="preview-button" appearance="secondary">プレビュー</vscode-button>
               </div>
            </div>
          </div>

           <script nonce="${nonce}">const vscode = acquireVsCodeApi();</script>
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
            
            /* Styles for character-level diff */
            .diff-view .diff-content pre { /* Ensure pre formatting */
              white-space: pre-wrap;
              word-wrap: break-word;
              margin: 0; /* Reset default pre margin */
              font-family: var(--vscode-editor-font-family, monospace); /* Use editor font */
              font-size: var(--vscode-editor-font-size);
            }
            .diff-view .diff-char-added {
              background-color: var(--vscode-diffEditor-insertedTextBackground);
              color: var(--vscode-diffEditor-insertedTextColor);
              text-decoration: underline; /* Optional: Add underline for clarity */
            }
            .diff-view .diff-char-removed {
              background-color: var(--vscode-diffEditor-removedTextBackground);
              color: var(--vscode-diffEditor-removedTextColor);
              text-decoration: line-through; /* Use strikethrough for removed chars */
            }
            .apply-diff-link {
              color: var(--vscode-textLink-foreground);
              text-decoration: none;
              cursor: pointer;
              margin-left: 5px; /* Add some space */
            }
            .apply-diff-link:hover {
              text-decoration: underline;
            }
          </style>
           <script nonce="${nonce}" src="${scriptUri}"></script>
        </body>
      </html>`;
  }
}
