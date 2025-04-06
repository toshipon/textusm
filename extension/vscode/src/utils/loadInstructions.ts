import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { defaultHypothesisRules } from '../instructions/hypothesisRules';

/**
 * 仮説キャンバス用のインストラクションをロードする
 * @param workspaceRoot ワークスペースのルートパス
 * @returns インストラクション文字列
 */
export function loadInstructions(workspaceRoot?: string): string {
  // カスタムインストラクションファイルの検索
  if (workspaceRoot) {
    const customInstructionsPath = path.join(workspaceRoot, '.hypothesisrules');
    if (fs.existsSync(customInstructionsPath)) {
      try {
        return fs.readFileSync(customInstructionsPath, 'utf8');
      } catch (error) {
        console.error('Error reading custom instructions:', error);
        // カスタムファイルの読み込みに失敗した場合はデフォルトを使用
      }
    }
  }

  // デフォルトのインストラクションを返す
  return defaultHypothesisRules;
}