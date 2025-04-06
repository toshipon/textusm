import * as vscode from "vscode";
import * as path from "path";

export class FileOperations {
  public async handleFileDropped(
    uris: string[],
    updateSyncStatus: () => void
  ): Promise<void> {
    if (uris && uris.length > 0) {
      const fileUri = vscode.Uri.file(uris[0]);
      try {
        await vscode.window.showTextDocument(fileUri);
        updateSyncStatus();
        vscode.window.showInformationMessage(
          `ファイル "${fileUri.fsPath.split('/').pop()}" を開きました`
        );
      } catch (error) {
        console.error('Error opening dropped file:', error);
        vscode.window.showErrorMessage('ファイルを開けませんでした');
      }
    }
  }

  public async handleCreateNewFile(
    workspaceFolders: readonly vscode.WorkspaceFolder[] | undefined,
    updateSyncStatus: () => void
  ): Promise<void> {
    const defaultUri = vscode.Uri.file(path.join(
      workspaceFolders?.[0]?.uri.fsPath || '',
      'untitled.md'
    ));
    
    const fileUri = await vscode.window.showSaveDialog({
      defaultUri,
      filters: {
        'Markdown': ['md']
      }
    });

    if (fileUri) {
      try {
        const edit = new vscode.WorkspaceEdit();
        edit.createFile(fileUri, { ignoreIfExists: true });
        await vscode.workspace.applyEdit(edit);
        
        const document = await vscode.workspace.openTextDocument(fileUri);
        await vscode.window.showTextDocument(document);
        
        updateSyncStatus();
        vscode.window.showInformationMessage('新規Markdownファイルを作成しました。');
      } catch (error) {
        console.error('Error creating new file:', error);
        vscode.window.showErrorMessage('ファイルの作成に失敗しました。');
      }
    }
  }
}