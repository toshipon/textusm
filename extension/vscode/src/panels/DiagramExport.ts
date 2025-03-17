import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

export class DiagramExport {
  static async exportPng(message: { text: string }, panel: vscode.WebviewPanel): Promise<void> {
    const dir: string =
      vscode.workspace.getConfiguration().get("textusm.exportDir") ??
      (vscode.workspace.workspaceFolders &&
      vscode.workspace.workspaceFolders.length > 0
        ? vscode.workspace.workspaceFolders[0].uri.path
        : ".");
    const title = panel.title;
    const filePath = path.join(
      dir ??
        `${
          vscode.workspace.workspaceFolders
            ? vscode.workspace.workspaceFolders[0]
            : ""
        }/`,
      `${title}.png`
    );
    const base64Data = message.text.replace(/^data:image\/png;base64,/, "");

    try {
      fs.writeFileSync(filePath, base64Data, "base64");
      vscode.window.showInformationMessage(`Exported: ${filePath}`, {
        modal: false,
      });
    } catch {
      vscode.window.showErrorMessage(`Export failed: ${filePath}`, {
        modal: false,
      });
    }
  }

  static async exportSvg(
    message: { text: string; width: number; height: number },
    panel: vscode.WebviewPanel
  ): Promise<void> {
    const backgroundColor = vscode.workspace
      .getConfiguration()
      .get("textusm.backgroundColor");
    const title = panel.title;
    const dir: string =
      vscode.workspace.getConfiguration().get("textusm.exportDir") ??
      (vscode.workspace.workspaceFolders &&
      vscode.workspace.workspaceFolders.length > 0
        ? vscode.workspace.workspaceFolders[0].uri.path
        : ".");
    const filePath = path.join(
      dir ??
        `${
          vscode.workspace.workspaceFolders
            ? vscode.workspace.workspaceFolders[0]
            : ""
        }/`,
      `${title}.svg`
    );

    const svgo = await import("svgo");
    const optimizedSvg = svgo.optimize(
      `<?xml version="1.0"?>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${message.width} ${
        message.height
      }" width="${message.width}" height="${
        message.height
      }" style="background-color: ${backgroundColor};">
      ${message.text
        .split("<div")
        .join('<div xmlns="http://www.w3.org/1999/xhtml"')
        .split("<img")
        .join('<img xmlns="1http://www.w3.org/1999/xhtml"')}
      </svg>`,
      {
        plugins: [
          {
            name: "preset-default",
            params: {
              overrides: {
                convertShapeToPath: {
                  convertArcs: true,
                },
                convertPathData: false,
              },
            },
          },
        ],
      }
    );

    try {
      fs.writeFileSync(filePath, optimizedSvg.data);
      vscode.window.showInformationMessage(`Exported: ${filePath}`, {
        modal: false,
      });
    } catch {
      vscode.window.showErrorMessage(`Export failed: ${filePath}`, {
        modal: false,
      });
    }
  }
}