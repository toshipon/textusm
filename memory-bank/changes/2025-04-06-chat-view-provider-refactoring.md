# ChatViewProvider のリファクタリングと差分表示機能の追加

## 概要
2025-04-06に、VSCode拡張機能のChatViewProviderコンポーネントを改善し、コードの分割と差分表示機能を実装しました。

## 変更内容

### 1. コードの分割
ChatViewProviderの責務を以下の4つの専門クラスに分離しました：

- `WebviewContentProvider`: Webviewのコンテンツ生成を担当
  - HTMLテンプレートの生成
  - Webviewスクリプトの管理
  - スタイリングの管理

- `MessageHandler`: チャットメッセージと編集機能の処理を担当
  - メッセージの送受信処理
  - AIによるテキスト編集処理
  - 差分表示の制御

- `FileOperations`: ファイル操作を担当
  - ファイルのドラッグ&ドロップ処理
  - 新規ファイル作成処理

- `SettingsManager`: LLM設定の管理を担当
  - API設定の保存
  - LLM選択の管理
  - 設定の永続化

### 2. 差分表示機能の実装

#### スタイリング
```css
.diff-view {
  background: var(--vscode-editor-background);
  padding: 10px;
  margin: 10px 0;
  border-radius: 4px;
  font-family: monospace;
}

.diff-view .diff-header {
  color: var(--vscode-textPreformat-foreground);
  margin-bottom: 5px;
}

.diff-view .diff-content {
  white-space: pre-wrap;
}

.diff-view .diff-line-added {
  background-color: var(--vscode-diffEditor-insertedTextBackground);
  color: var(--vscode-diffEditor-insertedTextColor);
}

.diff-view .diff-line-removed {
  background-color: var(--vscode-diffEditor-removedTextBackground);
  color: var(--vscode-diffEditor-removedTextColor);
}
```

#### 差分表示ロジック
```javascript
function createDiffView(originalText, newText) {
  const diffContainer = document.createElement('div');
  diffContainer.className = 'diff-view';

  const diffHeader = document.createElement('div');
  diffHeader.className = 'diff-header';
  diffHeader.textContent = 'Proposed Changes:';
  diffContainer.appendChild(diffHeader);

  const diffContent = document.createElement('div');
  diffContent.className = 'diff-content';

  // 単純な行ベースの差分表示
  const originalLines = originalText.split('\n');
  const newLines = newText.split('\n');
  
  let diffHtml = '';
  for (let i = 0; i < Math.max(originalLines.length, newLines.length); i++) {
    const originalLine = originalLines[i] || '';
    const newLine = newLines[i] || '';
    
    if (originalLine !== newLine) {
      if (originalLine) {
        diffHtml += `<div class="diff-line-removed">- ${originalLine}</div>`;
      }
      if (newLine) {
        diffHtml += `<div class="diff-line-added">+ ${newLine}</div>`;
      }
    } else {
      diffHtml += `<div>${originalLine}</div>`;
    }
  }
  
  diffContent.innerHTML = diffHtml;
  diffContainer.appendChild(diffContent);
  return diffContainer;
}
```

### 3. メリット
- コードの責務が明確に分離され、メンテナンス性が向上
- 各クラスが単一責任の原則に従い、テストが容易に
- 差分表示により、AIによる編集内容が視覚的に確認可能
- VSCodeのテーマに準拠したデザインで一貫性を維持

### 4. 今後の改善点
- より高度な差分アルゴリズムの実装（例：Myers差分アルゴリズム）
- 差分表示のパフォーマンス最適化
- インラインでの差分表示のサポート