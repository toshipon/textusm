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
  - `ChatWebview.ts`: チャット UI の共通コンポーネント
- `canvas/`: React.js によるキャンバスビューの実装
  - `CanvasProvider.tsx`: Context + useReducer でグローバルな Canvas 状態管理
  - `hooks/`
    - `useCanvas.ts`: カスタムフック（状態取得・更新）
    - `useCanvasItems.ts`: 項目追加・削除用フック
  - `components/`
    - `CanvasDialog.tsx`: ダイアログ全体のラッパー
    - `BusinessModelCanvas/`
      - `index.tsx`: エントリポイントコンポーネント
      - `cells/`
        - `TitleCell.tsx`
        - `ContentCell.tsx`
        - `...`: 各セルコンポーネント
    - `OpportunityCanvas/`
      - `index.tsx`
      - `cells/`
        - `...`
    - `common/`
      - `DialogHeader.tsx`
      - `ItemList.tsx`
      - `Controls.tsx`
  - `styles/`
    - `canvas.css`: 共通スタイル
  - `index.tsx`: Webview 側エントリポイント

### Services (`src/services/`)

アプリケーション全体で使用される共通機能を提供します。

- `LlmService.ts`: LLM との通信や設定管理
- `FileService.ts`: ファイル操作の共通処理
- `ConfigService.ts`: 設定の管理

### Utils (`src/utils/`)

再利用可能なユーティリティ関数を提供します。

- `getUri.ts`: Webview リソースのパス解決
- `getNonce.ts`: セキュリティトークン生成
- `showQuickPick.ts`: クイックピッカー表示

## React.js Canvas Views (`src/views/canvas/`)

Elm の `Diagram.BusinessModelCanvas.View` や `Diagram.OpportunityCanvas.View` モジュールを参考に、以下のような React コンポーネント構成を提案します。

```
extension/vscode/src/views/canvas/
├── CanvasProvider.tsx       # Context + useReducer でグローバルな Canvas 状態管理
├── hooks/
│   ├── useCanvas.ts         # カスタムフック（状態取得・更新）
│   └── useCanvasItems.ts    # 項目追加・削除用フック
├── components/
│   ├── CanvasDialog.tsx     # ダイアログ全体のラッパー
│   ├── BusinessModelCanvas/
│   │   ├── index.tsx        # エントリポイントコンポーネント
│   │   └── cells/
│   │       ├── TitleCell.tsx
│   │       ├── ContentCell.tsx
│   │       └── ...          # 各セルコンポーネント
│   ├── OpportunityCanvas/
│   │   ├── index.tsx
│   │   └── cells/
│   │       └── ...
│   └── common/
│       ├── DialogHeader.tsx
│       ├── ItemList.tsx
│       └── Controls.tsx
├── styles/
│   └── canvas.css           # 共通スタイル
└── index.tsx                # Webview 側エントリポイント
```

### 状態管理

- CanvasProvider: React Context + useReducer により、Elm の Model/Update パターンを再現
- useCanvas: 描画用データ取得・購読（`model` 相当）
- useCanvasItems: アイテム追加・削除・更新（`msg` 相当）

### ビルド・開発環境

- Webpack (`extension/vscode/webpack.config.js` を流用)
  - 既存の設定に Canvas 用のエントリポイント (`src/views/canvas/index.tsx`) を追加
  - `ts-loader` or `babel-loader` で TSX をビルド
  - CSS ローダーでスタイルをバンドル
- 開発時は `webpack --watch` で即時リロード、チャットと Canvas を同一ビルドサイクルで管理

### ディレクトリ構成要約

- `views/canvas`: Canvas に関する UI を集中
- `hooks`: リアクティブなデータアクセス
- `components`: 細かい View コンポーネント
- `styles`: UI 共通スタイル

## 設計原則

1. **責任の分離**

   - UI コンポーネントは views/に集約
   - ビジネスロジックは services/に配置
   - 共通ユーティリティは utils/に配置

2. **重複の防止**

   - 共通コンポーネントは抽象化して再利用
   - Webview のコードは共通のベースクラスを使用

3. **拡張性**

   - 新機能は適切なディレクトリに配置
   - インターフェースを明確に定義

4. **保守性**
   - 関連する機能は同じディレクトリに配置
   - クラスやモジュールの責任範囲を明確に定義
