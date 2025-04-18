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
    // Open the React Canvas view instead of the Elm preview
    await vscode.commands.executeCommand("hypothesisCanvas.openCanvas");
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
        throw new Error(
          "アクティブなエディタがMarkdownファイルではありません。"
        );
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
        status: "editing",
      });

      const editedText = await this._llmService.editMarkdownText(
        originalText,
        message.text
      );

      // 差分を表示
      webview.postMessage({
        command: "showDiff",
        originalText,
        newText: editedText,
      });

      // 編集完了状態を表示
      webview.postMessage({
        command: "updateEditStatus",
        status: "complete",
      });

      await editor.edit((editBuilder) => {
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
      let originalTextForDiff = ""; // 差分表示用の元テキスト
      if (document) {
        const fileName = document.fileName.split("/").pop() || "";
        const fileContent = document.getText();
        originalTextForDiff = fileContent; // 元テキストを保持
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

The user's request is: "${text}".
If your response includes modifications to the file content, enclose the *complete modified file content* within [DIFF_START] and [DIFF_END] markers.
For example:
This is a regular response part.
[DIFF_START]
This is the complete modified content of the file.
It might be multiple lines.
[DIFF_END]
This is another regular response part.

Provide a helpful response to assist them.`;

      // basePrompt を ChatMessage[] 形式に変換
      const messages: ChatMessage[] = [
        { role: "user", parts: [{ text: basePrompt }] },
      ];
      const responseText = await this._llmService.generateResponse(messages);

      // レスポンスから差分情報を抽出する試み
      const diffStartMarker = "[DIFF_START]";
      const diffEndMarker = "[DIFF_END]";
      const diffStartIndex = responseText.indexOf(diffStartMarker);
      const diffEndIndex = responseText.indexOf(diffEndMarker);

      if (document) {
        // ドキュメントが存在する場合のみ差分処理を試みる
        console.log("Document exists, attempting diff processing."); // デバッグログ
        let newText = responseText; // デフォルトでは応答全体を newText とする
        let messageBeforeDiff = "";
        let messageAfterDiff = "";

        // マーカーが存在すれば抽出、なければ応答全体を使用
        if (
          diffStartIndex !== -1 &&
          diffEndIndex !== -1 &&
          diffStartIndex < diffEndIndex
        ) {
          newText = responseText
            .substring(diffStartIndex + diffStartMarker.length, diffEndIndex)
            .trim();
          messageBeforeDiff = responseText.substring(0, diffStartIndex).trim();
          messageAfterDiff = responseText
            .substring(diffEndIndex + diffEndMarker.length)
            .trim();
          console.log("Diff markers found. Extracted newText."); // デバッグログ
        } else {
          console.log(
            "Diff markers not found or invalid. Using full responseText as newText."
          ); // デバッグログ
          // マーカーがない場合、応答全体が newText となるため、前後のメッセージは空にする
          messageBeforeDiff = "";
          messageAfterDiff = "";
        }

        // 差分前後のメッセージがあれば表示 (マーカーがあった場合のみ)
        if (messageBeforeDiff) {
          console.log("Sending message before diff."); // デバッグログ
          webview.postMessage({
            command: "addMessage",
            sender: this._llmService.selectedLlm,
            text: messageBeforeDiff,
          });
        }

        // 常に差分を表示 (newText が応答全体の場合も含む)
        console.log("Sending showDiff command to webview."); // デバッグログ
        webview.postMessage({
          command: "showDiff",
          originalText: originalTextForDiff, // 保持しておいた元のファイル内容
          newText: newText,
        });

        // 差分後のメッセージがあれば表示 (マーカーがあった場合のみ)
        if (messageAfterDiff) {
          console.log("Sending message after diff."); // デバッグログ
          webview.postMessage({
            command: "addMessage",
            sender: this._llmService.selectedLlm,
            text: messageAfterDiff,
          });
        }
      } else {
        // ドキュメントがない場合は、通常通りメッセージ全体を表示
        console.log("No active document. Sending full response as addMessage."); // デバッグログ
        webview.postMessage({
          command: "addMessage",
          sender: this._llmService.selectedLlm,
          text: responseText,
        });
      }
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

      if (!diffData || typeof diffData.newText !== "string") {
        throw new Error("無効な差分データです。");
      }

      // ドキュメント全体を新しいテキストで置き換える
      const fullRange = new vscode.Range(
        document.positionAt(0),
        document.positionAt(document.getText().length)
      );

      // newText から ```markdown と ``` を除去 (正規表現を使用)
      let cleanedText = diffData.newText.trim(); // まず前後の空白を除去

      const codeBlockStartRegex = /^```markdown\s*/; // 先頭の ```markdown とそれに続く空白文字(改行含む)にマッチ
      const codeBlockEndRegex = /\s*```$/; // 末尾の ``` とその前の空白文字(改行含む)にマッチ

      cleanedText = cleanedText.replace(codeBlockStartRegex, ""); // 先頭のマーカーを除去
      cleanedText = cleanedText.replace(codeBlockEndRegex, ""); // 末尾のマーカーを除去

      await editor.edit((editBuilder) => {
        // fullRange を使ってドキュメント全体を置換
        editBuilder.replace(fullRange, cleanedText);
      });

      // 成功メッセージをWebviewに送信 (任意)
      webview.postMessage({
        command: "updateStatus",
        status: "success",
        message: "変更を適用しました。",
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
