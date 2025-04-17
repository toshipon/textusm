import React, { createContext, useReducer } from 'react';

export type CanvasState = {
  items: Array<any>;
};

type Action = { type: 'ADD_ITEM'; payload: any } | { type: 'REMOVE_ITEM'; payload: any };

const initialState: CanvasState = {
  items: [],
};

function reducer(state: CanvasState, action: Action): CanvasState {
  switch (action.type) {
    case 'ADD_ITEM':
      return { ...state, items: [...state.items, action.payload] };
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter(i => i !== action.payload) };
    default:
      return state;
  }
}

export const CanvasContext = createContext<{
  state: CanvasState;
  dispatch: React.Dispatch<Action>;
}>({ state: initialState, dispatch: () => null });

const CanvasProvider: React.FC = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <CanvasContext.Provider value={{ state, dispatch }}>
      {children}
    </CanvasContext.Provider>
  );
};

export default CanvasProvider;
