import * as vscode from "vscode";
import { DiagramType } from "../types/DiagramType";
import { ENABLED_LANG_DIAGRAM_TYPE } from "../constants/diagrams";
import { setText } from "./setText";
import { DiagramPanel } from "../panels/DiagramPanel";

export const newTextOpen = async (
  text: string,
  diagramType: DiagramType,
  context: vscode.ExtensionContext
) => {
  console.log(`newTextOpen called with diagramType: ${diagramType}`);
  try {
    const doc = await vscode.workspace.openTextDocument({
      language: ENABLED_LANG_DIAGRAM_TYPE[diagramType],
      content: text,
    });
    console.log("Document created");

    const editor = await vscode.window.showTextDocument(doc, -1);
    console.log("Editor shown");

    await setText(editor, text);
    console.log("Text set in editor");

    setTimeout(() => {
      console.log("Creating diagram panel");
      DiagramPanel.createOrShow(context, diagramType);
    }, 300);
  } catch (error) {
    console.error("Error in newTextOpen:", error);
  }
};
