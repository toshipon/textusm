import * as vscode from "vscode";

export const setText = (editor: vscode.TextEditor, text: string) => {
  return editor.edit((builder) => {
    const document = editor.document;
    const lastLine = document.lineAt(document.lineCount - 1);
    const start = new vscode.Position(0, 0);
    const end = new vscode.Position(
      document.lineCount - 1,
      lastLine.text.length
    );
    builder.replace(new vscode.Range(start, end), text);
  });
};
