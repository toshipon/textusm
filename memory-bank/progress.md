# 開発進捗 (2025-04-05)

## 仮説キャンバス機能 (VS Code 拡張機能)

### 実装済み

*   **設定項目:**
    *   `package.json` に Gemini, Claude, OpenAI の API キーを設定するための項目 (`textusm.hypothesisCanvas.*ApiKey`) を追加。
    *   `package.json` に使用する LLM (Gemini, Claude, OpenAI) を選択するための設定項目 (`textusm.hypothesisCanvas.selectedLlm`) を追加。
*   **チャットインターフェース:**
    *   `TextUSM: Open Hypothesis Canvas Chat` コマンド (`textusm.hypothesisCanvas.showChat`) を追加。
    *   基本的な Webview パネル (`HypothesisCanvasChatPanel`) を作成し、コマンド実行時に表示されるようにした。
    *   VS Code UI Toolkit を導入し、基本的なチャット UI (メッセージ表示エリア、入力エリア、送信ボタン) を実装。
    *   Enter キーでのメッセージ送信に対応。
    *   Webview のスタイルを外部 CSS ファイル (`webview.css`) に分離し、Webpack で処理するように設定。
*   **LLM 連携:**
    *   `@google/generative-ai`, `@anthropic-ai/sdk`, `openai` ライブラリをインストール。
    *   設定 (`textusm.hypothesisCanvas.selectedLlm`) に基づいて使用する LLM (Gemini, Claude, OpenAI) を決定。
    *   選択された LLM に応じて、対応する API キーを設定から取得し、クライアントを初期化する処理 (`_initializeLlmClients`) を実装。
    *   チャットで送信されたメッセージを、選択された LLM の API (Gemini: `gemini-1.5-flash`, Claude: `claude-3-haiku-20240307`, OpenAI: `gpt-4o-mini`) に送信し、応答を表示する機能を実装。
    *   各 LLM の API キー未設定時や API エラー発生時の基本的なエラーハンドリングを追加。
    *   API 呼び出し中のローディング表示を追加。

### 未実装・今後のタスク

*   **マークダウン連携:**
    *   チャットの会話内容（特に LLM の提案）を、関連する仮説キャンバスのマークダウンファイルに反映させる機能。
    *   どのファイル/セクションを更新するかを特定する仕組み。
*   **プレビュー連携:**
    *   チャット内から、関連するマークダウンファイルのプレビューを開くためのリンクまたはボタン。
*   **Copilot サポート:**
    *   GitHub Copilot Chat API (利用可能であれば) または代替手段の調査・実装。
*   **プロンプト改善:**
    *   仮説キャンバス作成支援に特化した、より効果的なプロンプトエンジニアリング。
    *   会話履歴や現在のキャンバス内容をコンテキストとして活用する。
*   **UI/UX 改善:**
    *   メッセージ表示の改善 (コードブロック、リストなど)。
    *   エラー表示の改善。
    *   LLM 選択 UI (設定だけでなく、チャット UI 内での切り替えなど)。
*   **テスト:**
    *   各機能の単体テストおよび結合テスト。