import * as vscode from "vscode";
import * as path from "path"; // Node.js の path モジュールをインポート

/**
 * A helper function that returns a URI for a resource in the extension's directory.
 *
 * @param webview The webview instance.
 * @param extensionUri The URI of the extension directory.
 * @param pathList An array of strings representing the path segments to the resource.
 * @returns The URI of the resource.
 */
export function getUri(webview: vscode.Webview, extensionUri: vscode.Uri, pathList: string[]): vscode.Uri {
  // path.join を使用して絶対ファイルパスを構築
  const absolutePath = path.join(extensionUri.fsPath, ...pathList);
  // 絶対パスからファイル URI を作成
  const fileUri = vscode.Uri.file(absolutePath);
  // ファイル URI を Webview URI に変換
  return webview.asWebviewUri(fileUri);
}