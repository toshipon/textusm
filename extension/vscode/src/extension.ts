import * as vscode from "vscode";
import { registerCommands } from "./commands";
import { DiagramPanel } from "./panels/DiagramPanel";
import { ChatViewProvider } from "./views/chat/ChatViewProvider";

export function activate(context: vscode.ExtensionContext) {
  console.log("Activating TextUSM extension");
  registerCommands(context);

  // Register Hypothesis Canvas View Provider
  // Register Chat View Provider
  const chatProvider = new ChatViewProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      ChatViewProvider.viewType,
      chatProvider
    )
  );

  // Register Chat Pop-out Command
  context.subscriptions.push(
    vscode.commands.registerCommand('hypothesisCanvas.openChat', () => {
      ChatViewProvider.createOrShowPanel(context.extensionUri);
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
