# VS Code Extension Architecture

## Directory Structure

```
extension/vscode/
├── src/
│   ├── commands/        # コマンド実装
│   ├── services/        # 共通サービス（LLM等）
│   ├── views/           # Webviewの実装
│   │   ├── chat/       # チャットインターフェース
│   │   └── canvas/     # キャンバス関連のビュー
│   ├── utils/          # ユーティリティ関数
│   └── extension.ts    # エントリーポイント
```

## コンポーネントの役割

### Views (`src/views/`)

チャットインターフェースやキャンバス機能など、ユーザーインターフェースに関する実装を集約します。

- `chat/`: チャットインターフェースの実装
  - `ChatViewProvider.ts`: サイドパネルとポップアウトウィンドウの両方に対応したチャットビュー
  - `ChatWebview.ts`: チャットUIの共通コンポーネント

### Services (`src/services/`)

アプリケーション全体で使用される共通機能を提供します。

- `LlmService.ts`: LLMとの通信や設定管理
- `FileService.ts`: ファイル操作の共通処理
- `ConfigService.ts`: 設定の管理

### Utils (`src/utils/`)

再利用可能なユーティリティ関数を提供します。

- `getUri.ts`: Webviewリソースのパス解決
- `getNonce.ts`: セキュリティトークン生成
- `showQuickPick.ts`: クイックピッカー表示

## 設計原則

1. **責任の分離**
   - UIコンポーネントはviews/に集約
   - ビジネスロジックはservices/に配置
   - 共通ユーティリティはutils/に配置

2. **重複の防止**
   - 共通コンポーネントは抽象化して再利用
   - Webviewのコードは共通のベースクラスを使用

3. **拡張性**
   - 新機能は適切なディレクトリに配置
   - インターフェースを明確に定義

4. **保守性**
   - 関連する機能は同じディレクトリに配置
   - クラスやモジュールの責任範囲を明確に定義