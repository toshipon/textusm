import * as vscode from "vscode";
// 既存のインポート文に ChatMessage を追加
import { LlmService, ChatMessage } from "../../services/LlmService";
import { DiagramWebview } from "../../panels/DiagramWebview";
import { v4 as uuidv4 } from "uuid";
import * as path from "path";

export class MessageHandler {
  constructor(
    private readonly _llmService: LlmService,
    private readonly _instructions: string,
    private readonly _extensionUri: vscode.Uri
  ) {}

  public async handlePreviewCanvas(webview: vscode.Webview): Promise<void> {
    try {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        throw new Error("アクティブなエディタが見つかりません。");
      }
      if (editor.document.languageId !== "markdown") {
        throw new Error("アクティブなエディタがMarkdownファイルではありません。");
      }

      const document = editor.document;
      const content = document.getText();
      
      // 新しいWebviewパネルを作成
      const panel = vscode.window.createWebviewPanel(
        'diagramPreview',
        '仮説キャンバス プレビュー',
        vscode.ViewColumn.Beside,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
          localResourceRoots: [
            vscode.Uri.file(path.join(this._extensionUri.fsPath, 'dist')),
            vscode.Uri.file(path.join(this._extensionUri.fsPath, 'js')),
            // frontendのElmビルド出力先を指定
            vscode.Uri.file(path.join(this._extensionUri.fsPath, 'js'))
          ]
        }
      );

      // webview-ui-toolkitのスクリプトURIを取得
      const toolkitUri = panel.webview.asWebviewUri(
        vscode.Uri.file(path.join(this._extensionUri.fsPath, 'node_modules', '@vscode', 'webview-ui-toolkit', 'dist', 'toolkit.js'))
      );

      // メインスクリプトのURIを取得
      // frontendのElmアプリケーションのスクリプトを読み込む
      // frontendのElmビルド成果物を指定
      const scriptUri = panel.webview.asWebviewUri(
        vscode.Uri.file(path.join(this._extensionUri.fsPath, 'js', 'elm.js'))
      );

      console.log('Loading Elm script from:', scriptUri.toString());

      // DiagramWebviewを使用してプレビューを表示
      // DiagramTypeの指定: "hyp" for HypothesisCanvas
      panel.webview.html = DiagramWebview.generateWebviewContent(
        panel,
        scriptUri,
        content,
        'hyp',
        DiagramWebview.getConfig()
      );

    } catch (error: any) {
      console.error("Error showing preview:", error);
      webview.postMessage({
        command: "showError",
        text: error.message,
      });
    }
  }

  public async handleEditWithAI(
    message: any,
    webview: vscode.Webview
  ): Promise<void> {
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
      const originalText = !selection.isEmpty
        ? document.getText(selection)
        : document.getText();
      const editRange = !selection.isEmpty
        ? selection
        : new vscode.Range(
            document.positionAt(0),
            document.positionAt(document.getText().length)
          );

      // 編集中の状態を表示
      webview.postMessage({
        command: "updateEditStatus",
        status: "editing"
      });

      const editedText = await this._llmService.editMarkdownText(
        originalText,
        message.text
      );

      // 差分を表示
      webview.postMessage({
        command: "showDiff",
        originalText,
        newText: editedText
      });

      // 編集完了状態を表示
      webview.postMessage({
        command: "updateEditStatus",
        status: "complete"
      });

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
  }

  public async handleSendMessage(
    text: string,
    document: vscode.TextDocument | undefined,
    webview: vscode.Webview
  ): Promise<void> {
    try {
      let fileContext = "";
      if (document) {
        const fileName = document.fileName.split('/').pop() || '';
        const fileContent = document.getText();
        fileContext = `
Current active file: ${fileName}
File content:
\`\`\`${document.languageId}
${fileContent}
\`\`\`
`;
      }

      const basePrompt = `You are an assistant helping a user build a Hypothesis Canvas. Use the following instructions as your knowledge base:

${this._instructions}

${fileContext}

The user's request is: "${text}". Provide a helpful response to assist them.`;
      
      // basePrompt を ChatMessage[] 形式に変換
      const messages: ChatMessage[] = [
        { role: "user", parts: [{ text: basePrompt }] }
      ];
      const responseText = await this._llmService.generateResponse(messages);
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
  }

  public async handleApplyDiff(
    message: any,
    webview: vscode.Webview
  ): Promise<void> {
    try {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        throw new Error("アクティブなエディタが見つかりません。");
      }

      const document = editor.document;
      const diffData = message.diffData;

      if (!diffData || typeof diffData.newText !== 'string') {
        throw new Error("無効な差分データです。");
      }

      // ドキュメント全体を新しいテキストで置き換える
      const fullRange = new vscode.Range(
        document.positionAt(0),
        document.positionAt(document.getText().length)
      );

      await editor.edit(editBuilder => {
        editBuilder.replace(fullRange, diffData.newText);
      });

      // 成功メッセージをWebviewに送信 (任意)
      webview.postMessage({
        command: "updateStatus",
        status: "success",
        message: "変更を適用しました。"
      });

      // VSCodeの情報メッセージを表示 (任意)
      vscode.window.showInformationMessage("変更を適用しました。");

    } catch (error: any) {
      console.error("Error applying diff:", error);
      webview.postMessage({
        command: "showError",
        text: `差分の適用に失敗しました: ${error.message}`,
      });
      // VSCodeのエラーメッセージを表示 (任意)
      vscode.window.showErrorMessage(
        `差分の適用に失敗しました: ${error.message}`
      );
    }
  }

}