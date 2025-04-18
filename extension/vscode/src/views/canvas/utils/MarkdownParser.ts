import { HypothesisCanvasData } from "../components/HypothesisCanvas";

/**
 * マークダウンテキストから仮説キャンバスのデータを抽出するパーサー
 */
export class MarkdownParser {
  // セクション見出しとデータ項目のマッピング
  private static readonly sectionMap: Record<
    string,
    keyof HypothesisCanvasData
  > = {
    // セクションタイトルとemoji両方に対応
    "🎯 目的": "purpose",
    目的: "purpose",
    "🔭 ビジョン": "vision",
    ビジョン: "vision",
    "🔧 実現手段": "means",
    実現手段: "means",
    "💪 優位性": "advantage",
    優位性: "advantage",
    "📊 指標": "metrics",
    指標: "metrics",
    "💎 提案価値": "valueProposition",
    提案価値: "valueProposition",
    "❗ 顕在課題": "obviousProblem",
    顕在課題: "obviousProblem",
    "❓ 潜在課題": "latentProblem",
    潜在課題: "latentProblem",
    "🔄 代替手段": "alternatives",
    代替手段: "alternatives",
    "👥 状況": "situation",
    状況: "situation",
    "🚚 チャネル": "channel",
    チャネル: "channel",
    "📈 傾向": "trend",
    傾向: "trend",
    "💰 収益モデル": "revenueModel",
    収益モデル: "revenueModel",
    "🌐 市場規模": "marketSize",
    市場規模: "marketSize",
  };

  /**
   * マークダウンテキストから仮説キャンバスデータを抽出
   * @param markdown マークダウンテキスト
   * @returns 抽出された仮説キャンバスデータ
   */
  public static parseHypothesisCanvas(markdown: string): HypothesisCanvasData {
    // デフォルトデータ（空の配列）で初期化
    const canvasData: HypothesisCanvasData = {
      purpose: [],
      vision: [],
      means: [],
      advantage: [],
      metrics: [],
      valueProposition: [],
      obviousProblem: [],
      latentProblem: [],
      alternatives: [],
      situation: [],
      channel: [],
      trend: [],
      revenueModel: [],
      marketSize: [],
    };

    // 行ごとに分割
    const lines = markdown.split("\n");
    let currentSection: keyof HypothesisCanvasData | null = null;

    // コード内容抽出用の状態変数
    let inCodeBlock = false;
    let codeContent: string[] = [];

    // 各行を処理
    for (const line of lines) {
      // コードブロック開始/終了の検出
      if (line.trim().startsWith("```")) {
        inCodeBlock = !inCodeBlock;
        continue;
      }

      // コードブロック内の場合、別処理
      if (inCodeBlock) {
        codeContent.push(line);
        continue;
      }

      // 見出しの検出（## または ### で始まる行）
      const headingMatch = line.match(/^(##|###)\s+(.+?)$/);
      if (headingMatch) {
        const heading = headingMatch[2].trim();
        // マッピングからセクション名を取得
        for (const [key, value] of Object.entries(this.sectionMap)) {
          if (heading.includes(key)) {
            currentSection = value;
            break;
          }
        }
        continue;
      }

      // 箇条書き項目の検出（- または * で始まる行）
      const itemMatch = line.match(/^[-*]\s+(.+?)$/);
      if (itemMatch && currentSection) {
        const itemText = itemMatch[1].trim();
        if (itemText) {
          canvasData[currentSection].push(itemText);
        }
        continue;
      }

      // 見出し直後の通常テキスト行（箇条書きでない場合も内容として取得）
      if (currentSection && line.trim() && !line.startsWith("#")) {
        canvasData[currentSection].push(line.trim());
      }
    }

    // 各セクションの内容に重複があれば削除
    for (const key of Object.keys(canvasData) as Array<
      keyof HypothesisCanvasData
    >) {
      canvasData[key] = [...new Set(canvasData[key])];
    }

    // コンソールに抽出結果を表示（デバッグ用）
    console.log("Parsed canvas data:", canvasData);

    return canvasData;
  }
}

export default MarkdownParser;
