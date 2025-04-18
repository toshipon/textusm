import React, { createContext, useReducer, ReactNode } from 'react';
import { HypothesisCanvasData } from './components/HypothesisCanvas';

export type CanvasState = {
  hypothesisCanvas: HypothesisCanvasData;
};

type Action = 
  | { type: 'UPDATE_SECTION'; payload: { section: keyof HypothesisCanvasData; content: string } }
  | { type: 'LOAD_CANVAS'; payload: HypothesisCanvasData };

// サンプルデータ
const sampleData: HypothesisCanvasData = {
  purpose: ['短期離職問題を解決する', '若手エンジニアの成長を支援する'],
  vision: ['すべてのエンジニアが活躍できる社会を作る'],
  means: ['オンラインメンタリング', '技術力可視化ツール'],
  advantage: ['現役エンジニアのネットワーク', '独自のスキル評価アルゴリズム'],
  metrics: ['メンタリング継続率', 'ユーザースキル成長率'],
  valueProposition: ['短期間で即戦力エンジニアになれる', '自分のペースでキャリアを構築できる'],
  obviousProblem: ['若手エンジニアの離職率の高さ', '現場と教育のギャップ'],
  latentProblem: ['キャリアの不安', '技術力の客観的評価の難しさ'],
  alternatives: ['オフラインスクール', '独学'],
  situation: ['リモートワーク増加', 'エンジニア需要の高まり'],
  channel: ['SNS', 'テックカンファレンス', 'パートナー企業'],
  trend: ['AI活用の需要増', 'Web3.0スキルへの関心'],
  revenueModel: ['サブスクリプション', '法人向けプラン', 'スキルマッチング手数料'],
  marketSize: ['国内IT人材育成市場 約500億円', 'グローバル展開で10倍の市場へ']
};

const initialState: CanvasState = {
  hypothesisCanvas: sampleData
};

function reducer(state: CanvasState, action: Action): CanvasState {
  switch (action.type) {
    case 'UPDATE_SECTION':
      const { section, content } = action.payload;
      return {
        ...state,
        hypothesisCanvas: {
          ...state.hypothesisCanvas,
          [section]: content.split('\n').map(line => line.trim()).filter(line => line)
        }
      };
    case 'LOAD_CANVAS':
      return {
        ...state,
        hypothesisCanvas: action.payload
      };
    default:
      return state;
  }
}

export const CanvasContext = createContext<{
  state: CanvasState;
  dispatch: React.Dispatch<Action>;
}>({ state: initialState, dispatch: () => null });

interface CanvasProviderProps { children: ReactNode; }
const CanvasProvider: React.FC<CanvasProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <CanvasContext.Provider value={{ state, dispatch }}>
      {children}
    </CanvasContext.Provider>
  );
};

export default CanvasProvider;
