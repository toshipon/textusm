import { DiagramType } from "../types/DiagramType";

export const diagramTemplates: { [key in DiagramType]: string } = {
  usm: "# user_activities: USER ACTIVITIES\n# user_tasks: USER TASKS\n# user_stories: USER STORIES\n# release1: RELEASE 1\n# release2: RELEASE 2\n# release3: RELEASE 3\nUSER ACTIVITY\n    USER TASK\n        USER STORY",
  bmc: "👥 Key Partners\n📊 Customer Segments\n🎁 Value Proposition\n✅ Key Activities\n🚚 Channels\n💰 Revenue Streams\n🏷️ Cost Structure\n💪 Key Resources\n💙 Customer Relationships",
  opc: "Problems\nSolution Ideas\nUsers and Customers\nSolutions Today\nBusiness Challenges\nHow will Users use Solution?\nUser Metrics\nAdoption Strategy\nBusiness Benefits and Metrics\nBudget",
  hyp: "🎯 目的\n    われわれはなぜこの事業をやるのか？\n🔭 ビジョン\n    中長期的に顧客にどういう状況になってもらいたいか？\n🔧 実現手段\n    提案価値を実現するために必要な手段は何か\n💪 優位性\n    提案価値や実現手段の提供に貢献するリソース\n📊 指標（撤退ライン）\n    少なくとも最低限達成すべき指標\n💎 提案価値\n    われわれは顧客をどんな解決状態にするのか\n❗ 顕在課題\n    顧客が気づいている課題は何か\n❓ 潜在課題\n    顧客が気づいていない課題、解決を諦めている課題\n🔄 代替手段\n    課題を解決するために顧客が現状取っている手段\n👥 状況\n    どのような状況にある顧客が対象なのか\n🚚 チャネル\n    状況に挙げた人たちに出会うための手段\n📈 傾向\n    同じ状況にある人が一致して行う事はあるか\n💰 収益モデル\n    どうやって儲けるのか？\n🌐 市場規模\n    対象の市場となる規模感は？",
  "4ls": "Liked\nLearned\nLacked\nLonged for",
  ssc: "Start\nStop\nContinue",
  kpt: "K\nP\nT",
  persona:
    "Name\n    https://app.textusm.com/images/logo.svg\nWho am i...\nThree reasons to use your product\nThree reasons to buy your product\nMy interests\nMy personality\nMy Skills\nMy dreams\nMy relationship with technology",
  emm: "https://app.textusm.com/images/logo.svg\nSAYS\nTHINKS\nDOES\nFEELS",
  table:
    "Column1\n    Column2\n    Column3\n    Column4\n    Column5\n    Column6\n    Column7\nRow1\n    Column1\n    Column2\n    Column3\n    Column4\n    Column5\n    Column6\nRow2\n    Column1\n    Column2\n    Column3\n    Column4\n    Column5\n    Column6",
  gct: "2019-12-26 2020-01-31\n    title1\n        subtitle1\n            2019-12-26 2019-12-31\n    title2\n        subtitle2\n            2019-12-31 2020-01-04\n",
  imm: "",
  erd: "relations\n    # one to one\n    Table1 - Table2\n    # one to many\n    Table1 < Table3\ntables\n    Table1\n        id int pk auto_increment\n        name varchar(255) unique\n        rate float null\n        value double not null\n        values enum(value1,value2) not null\n    Table2\n        id int pk auto_increment\n        name double unique\n    Table3\n        id int pk auto_increment\n        name varchar(255) index\n",
  kanban: "TODO\nDOING\nDONE",
  sed: "participant\n    object1\n    object2\n    object3\nobject1 -> object2\n    Sync Message\nobject1 ->> object2\n    Async Message\nobject2 --> object1\n    Reply Message\no-> object1\n    Found Message\nobject1 ->o\n    Stop Message\nloop\n    loop message\n        object1 -> object2\n            Sync Message\n        object1 ->> object2\n            Async Message\nPar\n    par message1\n        object2 -> object3\n            Sync Message\n    par message2\n        object1 -> object2\n            Sync Message\n",
  ucd: "[Customer]\n    Sign In\n    Buy Products\n(Buy Products)\n    >Browse Products\n    >Checkout\n(Checkout)\n    <Add New Credit Card\n[Staff]\n    Processs Order\n",
  kbd: "r4\n    Esc\n    1u\n    F1\n    F2\n    F3\n    F4\n    0.5u\n    F5\n    F6\n    F7\n    F8\n    0.5u\n    F9\n    F10\n    F11\n    F12\n    0.5u\n    Home\n    End\n    PgUp\n    PgDn\n0.25u\nr4\n    ~,{backquote}\n    !,1\n    @,2\n    {sharp},3\n    $,4\n    %,5\n    ^,6\n    &,7\n    *,8\n    (,9\n    ),0\n    _,-\n    =,+\n    Backspace,,2u\n    0.5u\n    Num,Lock\n    /\n    *\n    -\nr4\n    Tab,,1.5u\n    Q\n    W\n    E\n    R\n    T\n    Y\n    U\n    I\n    O\n    P\n    {,[\n    },]\n    |,\\,1.5u\n    0.5u\n    7,Home\n    8,↑\n    9,PgUp\n    +,,,2u\nr3\n    Caps Lock,,1.75u\n    A\n    S\n    D\n    F\n    G\n    H\n    J\n    K\n    L\n    :,;\n    \",'\n    Enter,,2.25u\n    0.5u\n    4, ←\n    5\n    6,→\nr2\n    Shift,,2.25u\n    Z\n    X\n    C\n    V\n    B\n    N\n    M\n    <,{comma}\n    >,.\n    ?,/\n    Shift,,1.75u\n    0.25u\n    ↑,,,,0.25u\n    0.25u\n    1,End\n    2,↓\n    3,PgDn\n    Enter,,,2u\nr1\n    Ctrl,,1.5u\n    Alt,,1.5u\n    ,,7u\n    Alt,,1.5u\n    Ctl,,1.5u\n    0.25u\n    ←,,,,0.25u\n    ↓,,,,0.25u\n    →,,,,0.25u\n    0.25u\n    0,Ins\n    .,Del",
  free: "",
  mmp: "Mind Map\n    Topic 1\n        Subtopic 1.1\n        Subtopic 1.2\n    Topic 2\n        Subtopic 2.1\n        Subtopic 2.2\n    Topic 3\n        Subtopic 3.1\n        Subtopic 3.2",
  smp: "Home\n    About\n        Company\n        Team\n    Products\n        Product 1\n        Product 2\n    Contact",
};
