import * as vscode from "vscode";
import { showQuickPick } from "../utils/showQuickPick";
import { newTextOpen } from "../utils/newTextOpen";
import { diagrams } from "../constants/diagrams";
import { DiagramType } from "../types/DiagramType";
import { DiagramPanel } from "../panels/DiagramPanel";
import { diagramTemplates } from "../constants/templates";
import { HypothesisCanvasChatPanel } from "../panels/HypothesisCanvasChatPanel";

export const registerCommands = (context: vscode.ExtensionContext) => {
  const commands: [string, (...args: any[]) => any][] = [
    [
      "textusm.showPreview",
      () => {
        console.log("Executing showPreview command");
        showQuickPick(context, () => {});
      },
    ],
    [
      "textusm.exportSvg",
      () => {
        console.log("Executing exportSvg command");
        DiagramPanel.activePanel?.exportSvg();
      },
    ],
    [
      "textusm.exportPng",
      () => {
        console.log("Executing exportPng command");
        DiagramPanel.activePanel?.exportPng();
      },
    ],
    [
      "textusm.zoomIn",
      () => {
        console.log("Executing zoomIn command");
        DiagramPanel.activePanel?.zoomIn();
      },
    ],
    [
      "textusm.zoomOut",
      () => {
        console.log("Executing zoomOut command");
        DiagramPanel.activePanel?.zoomOut();
      },
    ],
    [
      "textusm.newDiagram",
      () => {
        console.log("Executing newDiagram command");
        const quickPick = vscode.window.createQuickPick();
        quickPick.items = diagrams.map((item) => ({ label: item.label }));

        quickPick.onDidChangeSelection((selection) => {
          if (selection.length > 0) {
            const label = selection[0].label;
            const values = diagrams.filter((item) => item.label === label);

            if (values.length > 0) {
              const diagramType = values[0].value as DiagramType;
              console.log(`Creating diagram of type: ${diagramType}`);
              const template = diagramTemplates[diagramType] || "";
              newTextOpen(template, diagramType, context);
            }
            quickPick.hide();
          }
        });

        quickPick.onDidHide(() => quickPick.dispose());
        quickPick.show();
      },
    ],
    [
      "textusm.hypothesisCanvas.showChat",
      () => {
        console.log("Executing hypothesisCanvas.showChat command");
        HypothesisCanvasChatPanel.render(context.extensionUri);
      },
    ],
  ];

  commands.forEach(([commandId, handler]) => {
    const disposable = vscode.commands.registerCommand(commandId, handler);
    context.subscriptions.push(disposable);
  });
};
