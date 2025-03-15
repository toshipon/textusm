import * as vscode from "vscode";

export const setPreviewActiveContext = (value: boolean) => {
  vscode.commands.executeCommand("setContext", "textUsmPreviewFocus", value);
};
