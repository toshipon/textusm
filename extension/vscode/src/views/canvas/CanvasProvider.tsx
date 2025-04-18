import React, { createContext, useReducer, ReactNode } from 'react';
import { HypothesisCanvasData } from './components/HypothesisCanvas';

export type CanvasState = {
  hypothesisCanvas: HypothesisCanvasData;
};

type Action = 
  | { type: 'UPDATE_SECTION'; payload: { section: keyof HypothesisCanvasData; content: string } }
  | { type: 'LOAD_CANVAS'; payload: HypothesisCanvasData };

// 空のデータで初期化
const initialData: HypothesisCanvasData = {
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
  marketSize: []
};

const initialState: CanvasState = {
  hypothesisCanvas: initialData
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
