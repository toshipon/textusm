import * as vscode from "vscode";
import { LlmService } from "../../services/LlmService";

export class MessageHandler {
  constructor(
    private readonly _llmService: LlmService,
    private readonly _instructions: string
  ) {}

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
  }
}