# TextUSM 仮説キャンバス VS Code 拡張機能 技術仕様書

## 拡張機能の構造

### コアコンポーネント

```
extension/
├── src/
│   ├── extension.ts       # エントリーポイント
│   ├── llm/               # LLM統合モジュール
│   │   ├── connectors/    # 各LLM APIへのコネクタ
│   │   └── prompts/       # 仮説キャンバス用プロンプトテンプレート
│   ├── editor/            # エディタ拡張機能
│   │   ├── completion.ts  # 入力補完機能
│   │   └── syntax.ts      # 構文ハイライト
│   ├── preview/           # プレビュー機能
│   │   ├── renderer.ts    # マークダウンからのレンダリング
│   │   └── webview.ts     # WebView管理
│   ├── chat/              # チャットインターフェース
│   │   ├── ui.ts          # チャットUI
│   │   └── session.ts     # チャットセッション管理
│   └── utils/             # ユーティリティ関数
├── webview/               # WebViewのフロントエンド
│   ├── index.html         # プレビューHTML
│   ├── scripts/           # フロントエンドスクリプト
│   └── styles/            # CSSスタイル
└── test/                  # テストコード
```

## 依存関係存関係

- **VS Code API**: 拡張機能フレームワーク
- **TextUSM Core**: マークダウンパーサーとレンダラー (NPM 依存)
- **TextUSM Frontend**: ダイアグラムプレビューに使用する`frontend`ディレクトリのレンダリングコード
- **LLM API クライアント**: 各 LLM API に対応したクライアントライブラリ- **TextUSM Frontend**: ダイアグラムプレビュー機能は`frontend`ディレクトリ内のレンダリングコードを再利用

## 主要インターフェース### プレビュー機能の詳細

### LLM コネクタインターフェースダイアログプレビュー機能は、TextUSM のメインプロジェクトの`frontend`ディレクトリにあるコードを利用しています。これにより、Web 版 TextUSM と同じ高品質なビジュアル表現を拡張機能内で実現しています。

```typescriptend/src/renderer`のコードを拡張機能 WebView 内で再利用
interface LLMConnector {frontend/src/styles`の CSS を WebView 内に組み込み
name: string;再利用
initialize(apiKey: string): Promise<boolean>;
generateContent(prompt: string, context?: string[]): Promise<string>;
supportsStreaming(): boolean;
streamContent?(prompt: string, callback: (chunk: string) => void): Promise<void>;. WebView 内から TextUSM Frontend の core 機能を ES モジュールとしてインポート
}VS Code 拡張コンテキストに合わせたラッパーの実装

````3. VS Code固有の機能（テーマ、設定など）との連携

### 仮説キャンバスモデル## 依存関係

```typescriptーク
interface HypothesisCanvas {: マークダウンパーサーとレンダラー (NPM依存)
  problem: string;*: 各LLM APIに対応したクライアントライブラリ
  solution: string;
  uniqueValueProposition: string;
  keyMetrics: string[];
  unfairAdvantage: string;
  channels: string[];
  customerSegments: string[];
  costStructure: string[];
  revenueStreams: string[]; name: string;
}nitialize(apiKey: string): Promise<boolean>;
```  generateContent(prompt: string, context?: string[]): Promise<string>;
rtsStreaming(): boolean;
## 機能詳細  streamContent?(prompt: string, callback: (chunk: string) => void): Promise<void>;

### LLM プロンプト管理```

- ユーザーの入力とプロジェクトの文脈を組み合わせたプロンプト生成
- システムメッセージテンプレートでLLMの動作をカスタマイズ
- 対話履歴を利用した連続的な仮説キャンバス改善```typescript
pothesisCanvas {
### マークダウン形式  problem: string;
;
仮説キャンバスのマークダウン形式例:  uniqueValueProposition: string;
s: string[];
```markdowndvantage: string;
# 仮説キャンバス  channels: string[];
tomerSegments: string[];
## 問題 string[];
- ユーザーが直面している課題1: string[];
- ユーザーが直面している課題2}

## ソリューション
- 提供する解決策1
- 提供する解決策2
ンプト管理
## 独自の価値提案
価値提案の詳細説明- ユーザーの入力とプロジェクトの文脈を組み合わせたプロンプト生成
ッセージテンプレートでLLMの動作をカスタマイズ
## 主要指標歴を利用した連続的な仮説キャンバス改善
- 指標1
- 指標2### マークダウン形式

## 競合優位性スのマークダウン形式例:
- 優位点1
- 優位点2```markdown
バス
## チャネル
- チャネル1
- チャネル2- ユーザーが直面している課題1
ている課題2
## 顧客セグメント
- セグメント1ョン
- セグメント2- 提供する解決策1
策2
## コスト構造
- コスト項目1提案
- コスト項目2価値提案の詳細説明

## 収益の流れ標
- 収益源1
- 収益源2標2
````

### キーボードショートカット- 優位点 1

| コマンド                     | ショートカット | 説明                               |
| ---------------------------- | -------------- | ---------------------------------- | ----------------- |
| `textusm.openHypothesisChat` | Ctrl+Shift+H   | 仮説キャンバスチャットを開く       |
| `textusm.previewCanvas`      | Ctrl+Shift+V   | 仮説キャンバスプレビューを開く     |
| `textusm.exportCanvas`       | Ctrl+Shift+E   | 現在の仮説キャンバスをエクスポート |
| `textusm.insertTemplate`     | Ctrl+Shift+T   | 仮説キャンバステンプレートを挿入   | ## 顧客セグメント |

## パフォーマンス考慮事項- セグメント 2

- LLM API コール中の非同期処理と UI 応答性の維持
- 大きなキャンバスでのレンダリング最適化
- メモリ使用量の制限（特にチャット履歴保持）- コスト項目 2

## セキュリティ## 収益の流れ

- API キーは VS Code Secret Storage を使用して安全に保存
- ユーザーデータは常にローカル処理で、不必要なデータは LLM に送信しない
- 機密情報を含むプロンプトの警告システム
  ドショートカット

## エラー処理

| ショートカット | 説明 |

- LLM API 接続エラーの分かりやすいフィードバック---------|-------------------|-------------------------------------|
- マークダウン構文エラーの行単位ハイライト hesisChat` | Ctrl+Shift+H | 仮説キャンバスチャットを開く |
- 操作ミスに対する復旧オプションの提供| `textusm.previewCanvas` | Ctrl+Shift+V | 仮説キャンバスプレビューを開く |

| `textusm.exportCanvas` | Ctrl+Shift+E | 現在の仮説キャンバスをエクスポート |
| `textusm.insertTemplate` | Ctrl+Shift+T | 仮説キャンバステンプレートを挿入 |

## パフォーマンス考慮事項

- LLM API コール中の非同期処理と UI 応答性の維持
- 大きなキャンバスでのレンダリング最適化
- メモリ使用量の制限（特にチャット履歴保持）

## セキュリティ

- API キーは VS Code Secret Storage を使用して安全に保存
- ユーザーデータは常にローカル処理で、不必要なデータは LLM に送信しない
- 機密情報を含むプロンプトの警告システム

## エラー処理

- LLM API 接続エラーの分かりやすいフィードバック
- マークダウン構文エラーの行単位ハイライト
- 操作ミスに対する復旧オプションの提供
