import * as vscode from "vscode";
import { diagrams } from "../constants/diagrams";
import { DiagramType } from "../types/DiagramType";
import { DiagramPanel } from "../panels/DiagramPanel";

export const showQuickPick = (
  context: vscode.ExtensionContext,
  callback: () => void
) => {
  const options = diagrams;
  const quickPick = vscode.window.createQuickPick();
  quickPick.items = options.map((item) => ({ label: item.label }));

  quickPick.onDidChangeSelection((selection) => {
    if (selection.length > 0) {
      const label = selection[0].label;
      const values = options.filter((item) => item.label === label);
      const editor = vscode.window.activeTextEditor;

      if (values.length > 0) {
        const diagramType = values[0].value as DiagramType;
        console.log(`Creating diagram of type: ${diagramType}`);
        DiagramPanel.createOrShow(context, diagramType);
        callback();
        quickPick.hide();
      }
    }
  });

  quickPick.onDidHide(() => quickPick.dispose());
  quickPick.show();
};
