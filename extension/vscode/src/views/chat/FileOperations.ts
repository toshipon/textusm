import * as vscode from "vscode";
import * as path from "path";
import { isValidTextUsm, formatTextUsm } from "../../utils/textUsmValidator";

export class FileOperations {
  /**
   * TextUSMフォーマットの検証とフォーマット適用を行う
   */
  public async validateAndFormatContent(document: vscode.TextDocument): Promise<void> {
    const text = document.getText();
    // テキストが空の場合は処理をスキップ
    if (!text.trim()) {
      return;
    }

    // TextUSMフォーマットが無効な場合のみ処理を実行
    if (!isValidTextUsm(text)) {
      try {
        const formatted = formatTextUsm(text);
        // フォーマット後のテキストが空でないことを確認
        if (formatted.trim()) {
          const edit = new vscode.WorkspaceEdit();
          edit.replace(
            document.uri,
            new vscode.Range(
              document.lineAt(0).range.start,
              document.lineAt(document.lineCount - 1).range.end
            ),
            formatted
          );
          await vscode.workspace.applyEdit(edit);
          await document.save();
        }
      } catch (error) {
        console.error('Error formatting TextUSM:', error);
        // フォーマットエラーの場合は元のテキストを保持
      }
    }
  }

  public async handleFileDropped(
    uris: string[],
    updateSyncStatus: () => void
  ): Promise<void> {
    if (uris && uris.length > 0) {
      const fileUri = vscode.Uri.file(uris[0]);
      try {
        const document = await vscode.workspace.openTextDocument(fileUri);
        await this.validateAndFormatContent(document);
        await vscode.window.showTextDocument(document);
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
        // 新規ファイルの場合はデフォルトのTextUSMフォーマットを適用
        const defaultContent = "Root\n  Child1\n  Child2";
        const writeEdit = new vscode.WorkspaceEdit();
        writeEdit.insert(fileUri, new vscode.Position(0, 0), defaultContent);
        await vscode.workspace.applyEdit(writeEdit);
        
        await this.validateAndFormatContent(document);
        await vscode.window.showTextDocument(document);
        
        updateSyncStatus();
        vscode.window.showInformationMessage('新規Markdownファイルを作成しました。');
      } catch (error) {
        console.error('Error creating new file:', error);
        vscode.window.showErrorMessage('ファイルの作成に失敗しました。');
      }
    }
  }

  /**
   * ファイル保存時のイベントハンドラを設定
   */
  public setupFileWatcher(): vscode.Disposable {
    return vscode.workspace.onWillSaveTextDocument(async (e) => {
      if (e.document.languageId === 'markdown') {
        await this.validateAndFormatContent(e.document);
      }
    });
  }
}