import * as vscode from "vscode";
import { registerCommands } from "./commands";
import { DiagramPanel } from "./panels/DiagramPanel";

export function activate(context: vscode.ExtensionContext) {
  console.log("Activating TextUSM extension");
  registerCommands(context);
  console.log("TextUSM extension activated successfully");
}

export function deactivate() {
  if (DiagramPanel.activePanel) {
    DiagramPanel.activePanel._panel.dispose();
  }
}
