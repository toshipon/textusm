export const defaultHypothesisRules = `
## Textusmの基本構文とルール概要
**Textusm**は、インデントによるテキスト構造だけで様々な図表を作成できるツールです。ユーザーストーリーマップやビジネスモデルキャンバスなど、決まったフォーマットの図を**テキストの階層構造**から自動生成します。基本的なルールは以下の通りです。
 
- **インデントの一貫性**: 同じ階層レベルでは、同じインデント幅（タブまたはスペースの数）を使用してください。混在させると意図しない階層構造になる可能性があります。
- **タブ vs スペース**: タブとスペースのどちらを使用しても構いませんが、ファイル内でどちらか一方に統一することを推奨します。（例: スペース4つ）
- **インデントの深さ**: インデントを1レベル深くするには、通常タブ1つまたはスペース（例: 4つ）を追加します。
- **空行**: 空行は無視されますが、視覚的な区切りとして自由に使用できます。
- **インデントによる階層表現**: 行頭にタブあるいはスペースでインデントすることで、上位要素の子要素（サブ項目）として配置されます。インデントを増やすと階層が深くなり、減らすと浅くなります。  
  例:  

親項目
    子項目1
    子項目2

- **トップレベル項目**: インデントしていない行（行頭が文字の行）はすべてトップレベルの要素です。キャンバス系の図では、このトップレベルの行が各項目のタイトル（各ボックスの見出し）になります。子要素としてその内容を記述します。
- **テキスト内容**: 各行には自由なテキストを記述できます。箇条書きの「-」や番号付きリストのような特別な記法は不要です。**記号や絵文字**もそのまま利用可能で、図中のラベルとして表示されます（例: ✅や🎯など）。
- **改行と複数項目**: ある項目に複数の内容がある場合、同じレベルに複数行を並べることで箇条書きのように列挙できます。

## 仮説キャンバスの各要素とClineルール定義
**仮説キャンバス**は、新規事業やプロダクトに関する仮説を整理・検証するための14項目からなるキャンバスです。以下に各項目の定義とガイドを示します。

### 🎯 目的
**想定質問:** 「私たちはなぜこの事業を行うのか？」  
**記入内容:** 事業の存在意義や目指す成果（Why）を記述します。プロダクトや事業を通じて**達成したい目的**を一文で明確に表現してください。  
**記入例:** 「私たちは、〇〇を実現するためにこの事業に取り組みます。」  

### 🔭 ビジョン
**想定質問:** 「中長期的に見て、顧客にどのような状況になってもらいたいか？」  
**記入内容:** プロダクトの利用者（顧客）が将来的に得られる理想的な状態を記述します。  
**記入例:** 「将来的に、顧客が〇〇できる社会を実現したい。」  

### 🔧 実現手段
**想定質問:** 「提案価値を実現するために必要な手段は何か？」  
**記入内容:** 提案価値を形にするために必要な**機能、サービス、活動、リソース**などを列挙します。  
**記入例:**  
- 「〇〇という機能を開発する」  
- 「△△のデータベースを構築する」  

### 💪 優位性
**想定質問:** 「提案価値や実現手段の提供に貢献するリソースは何かあるか？」  
**記入内容:** それを実行するのが**他ならぬ自分たちである理由**を示すリソースや強みを書きます。  
**記入例:** 「〇〇に関する独自アルゴリズムの特許を保有している」  

### 📊 指標
**想定質問:** 「どんな指標を満たせば、この事業が進捗していると判断できるか？」  
**記入内容:** 事業の成功可否を判断するための**重要なKPIや指標**を設定します。  
**記入例:** 「半年以内に月間アクティブユーザー1,000人を達成できなければ撤退を検討する」  

### 💎 提案価値
**想定質問:** 「我々のプロダクトによって、顧客を最終的にどんな解決された状態に導くのか？」  
**記入内容:** 顧客が得られる価値や便益を端的にまとめます。  
**記入例:** 「顧客は〇〇の問題から解放され、△△ができるようになる。」  

### ❗ 顕在課題
**想定質問:** 「顧客が自覚している課題には何があるか？」  
**記入内容:** ターゲットとなる顧客層が**すでに認識している問題や不満**を書き出します。  
**記入例:**  
- 「現行システムではデータ連携に時間がかかっている」  
- 「手作業が多くミスが発生しやすい」  

### ❓ 潜在課題
**想定質問:** 「顧客がまだ気づいていない、または解決を諦めている課題は何か？」  
**記入内容:** 顧客自身は認識していないものの存在する問題を探ります。  
**記入例:** 「実は〇〇の作業を簡略化できると、生産性が飛躍的に上がるのに気づいていない」  

### 🔄 代替手段
**想定質問:** 「その課題を解決するために、顧客が今使っている手段は何か？」  
**記入内容:** 現在顧客が顕在課題に対処するために行っている**代替策や既存ソリューション**を記します。  
**記入例:**  
- 「紙のフォームに手書きしてFax送信している」  
- 「他社の△△ツールを組み合わせて対応している」  

### 👥 状況
**想定質問:** 「どのような状況にある顧客がこのプロダクトの対象になるか？」  
**記入内容:** ターゲットとなる顧客層の置かれている**具体的な状況や環境**を記述します。  
**記入例:** 「都心で飲食店を経営し、人手不足に直面している中小企業オーナー」  

### 🚚 チャネル
**想定質問:** 「その顧客（状況にある人々）と出会うための手段は何か？」  
**記入内容:** 想定した顧客にプロダクトの存在を届ける**チャネル（販路や接点）**を記述します。  
**記入例:** 「SNS広告経由でウェブサイトに誘導し問い合わせを獲得する」  

### 📈 傾向
**想定質問:** 「同じ状況にある顧客に共通する行動パターンや習慣はあるか？」  
**記入内容:** 対象顧客層の**共通した習慣・行動・パターン**を記述します。  
**記入例:** 「若い店舗オーナーほど情報収集にInstagramを利用する傾向がある」  

### 💰 収益モデル
**想定質問:** 「この事業はどのように収益を上げるのか？」  
**記入内容:** プロダクトやサービスによって**収益を得る仕組み（ビジネスモデル）**を記述します。  
**記入例:** 「基本サービスは無料提供し、プレミアム機能のサブスクリプション料金で収益化する」  

### 🌐 市場規模
**想定質問:** 「対象となる市場の規模感はどの程度か？」  
**記入内容:** 想定するマーケットの**規模やボリューム**を記述します。  
**記入例:** 「国内の〇〇市場規模は約△△億円（年間）と推定される」  
`;