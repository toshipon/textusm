import * as vscode from "vscode";
import { registerCommands } from "./commands";
import { DiagramPanel } from "./panels/DiagramPanel";
import { ChatViewProvider } from "./views/chat/ChatViewProvider";

export function activate(context: vscode.ExtensionContext) {
  console.log("Activating TextUSM extension");
  registerCommands(context);

  // Register Hypothesis Canvas View Provider
  const chatProvider = new ChatViewProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      ChatViewProvider.viewType,
      chatProvider
    )
  );

  // Register Chat Pop-out Command
  context.subscriptions.push(
    vscode.commands.registerCommand("hypothesisCanvas.openChat", () => {
      ChatViewProvider.createOrShowPanel(context.extensionUri);
    })
  );

  // Register Canvas Pop-Out Command
  context.subscriptions.push(
    vscode.commands.registerCommand("hypothesisCanvas.openCanvas", () => {
      // Canvas を専用のビューで開く（プレビュー表示のみ）
      const editor = vscode.window.activeTextEditor;
      if (!editor || editor.document.languageId !== "markdown") {
        vscode.window.showErrorMessage(
          "マークダウンファイルを開いた状態で実行してください"
        );
        return;
      }

      // DiagramPanelを直接使用してキャンバスを表示
      console.log("Opening DiagramPanel for hypothesis canvas");
      try {
        DiagramPanel.createOrShow(context, "hyp");
      } catch (error) {
        console.error("Error opening hypothesis canvas:", error);
        vscode.window.showErrorMessage(
          `キャンバスの表示に失敗しました: ${error}`
        );
      }
    })
  );

  // エディタの切り替えを監視
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor && DiagramPanel.activePanel) {
        DiagramPanel.activePanel.watchEditor(editor);
      }
    })
  );

  // 初期エディタがある場合はプレビューパネルを更新
  if (vscode.window.activeTextEditor && DiagramPanel.activePanel) {
    DiagramPanel.activePanel.watchEditor(vscode.window.activeTextEditor);
  }

  console.log("TextUSM extension activated successfully");
}
export function deactivate() {
  if (DiagramPanel.activePanel) {
    DiagramPanel.activePanel._panel.dispose();
  }
}
