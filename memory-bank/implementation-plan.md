# 仮説キャンバス React.js 移行計画

以下のタスクを実行し、frontend ディレクトリ配下の Elm 実装を全て破棄、extension 配下に React.js 実装を移管します。

## 1. Elm→React.js フルリライト

- frontend ディレクトリ配下で仮説キャンバスのダイアログをレンダリングしている仕組みを Elm から React.js に全⾯書き換え
- 仮説キャンバスの画面構成・データフローを Elm コードから抽出し、React アーキテクチャに落とし込む

## 2. ディレクトリ構成・コード移行

- frontend 配下の Elm 実装を破棄し、`extension/vscode` の既存 webpack プロジェクト内に React コンポーネントを組み込む
- `extension/vscode/webpack.config.js` に対してキャンバス用エントリポイントと TSX ローダー設定を追加

## 3. アーキテクチャ検討・資料作成

- Elm 実装を元にした React.js のアーキテクチャ選定（コンポーネント構成、状態管理、ビルド・開発環境）
- ディレクトリ構成案をまとめ、`memory-bank/architecture.md` へ記載
- アーキテクチャ検討ドキュメントを Markdown 形式で作成

## 4. 詳細タスク洗い出し・工数見積もり

- React 実装に必要なコンポーネント・フック・ユーティリティの一覧化
- 移行フェーズごとの TODO リスト作成（タスクごとに優先度・依存関係を明示）
- 各タスクの概算工数を算出
- 見積もり結果を `memory-bank/progress.md` に連携

---

_作業開始日：YYYY-MM-DD_
