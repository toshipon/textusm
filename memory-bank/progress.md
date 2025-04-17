# 開発進捗

## 2025-04-06: チャットインターフェースの改善

### 実装の統合と整理

1. チャット機能の統合

   - `HypothesisCanvasChatPanel` と `HypothesisCanvasViewProvider` を統合
   - 新しい `ChatViewProvider` に機能を集約
   - サイドパネルとポップアウトウィンドウの両方をサポート

2. 機能の改善

   - 日本語入力時の変換確定による Enter キーの誤送信を防止
   - UI の一貫性を向上
   - コードの保守性を改善

3. ディレクトリ構造の整理
   - `src/views/chat/` に関連コードを集約
   - アーキテクチャドキュメントを作成
   - 重複コードを排除

### 技術的な変更点

1. 新しいファイル構造

   ```
   src/
   └── views/
       └── chat/
           └── ChatViewProvider.ts  # 統合されたチャット機能
   ```

2. コマンドの更新

   - `hypothesisCanvas.openChat` コマンドを追加
   - チャットのポップアウト機能をサポート

3. 改善された機能
   - 変換確定時のタイミング制御
   - WebView の共通化
   - 状態管理の改善

## 2025-04-18: 仮説キャンバス React 移行

### 詳細 TODO & 工数見積もり

| タスク                                            | 担当者 | 見積工数 (h) | 依存関係 |
| ------------------------------------------------- | ------ | ------------ | -------- |
| 1. React プロジェクト初期設定                     | -      | 2            | なし     |
| - extension/src/views/canvas フォルダ作成         |        |              |          |
| - tsconfig, webpack.config 設定                   |        |              |          |
| 2. CanvasProvider + 状態管理フック実装            | -      | 4            | 1        |
| - Context API 定義、useReducer リデューサー実装   |        |              |          |
| - useCanvas, useCanvasItems フック作成            |        |              |          |
| 3. BusinessModelCanvas コンポーネント移行         | -      | 6            | 2        |
| - index, cells (TitleCell, ContentCell, ... )     |        |              |          |
| - View レイアウト調整                             |        |              |          |
| 4. OpportunityCanvas コンポーネント移行           | -      | 6            | 2        |
| - index, cells                                    |        |              |          |
| - レイアウト調整                                  |        |              |          |
| 5. CanvasDialog, common コンポーネント作成        | -      | 3            | 3,4      |
| - DialogHeader, ItemList, Controls                |        |              |          |
| - CanvasDialog.tsx                                |        |              |          |
| 6. Webview エントリポイント & メッセージング連携  | -      | 3            | 1,2,5    |
| - index.tsx / extension.ts でポストメッセージ実装 |        |              |          |
| 7. スタイル・CSS モジュール                       | -      | 2            | 3,4,5    |
| - canvas.css, テーマ対応                          |        |              |          |
| 8. テスト & ドキュメント整備                      | -      | 3            | 1–7      |
| - ユニットテスト & E2E テスト                     |        |              |          |
| - README 更新                                     |        |              |          |
| 9. elm 実装の削除 & クリーンアップ                | -      | 3            | 1–8      |
| - frontend/src/elm 以下コード削除                 |        |              |          |

**合計見積工数**: 32h (~4 営業日)

---
