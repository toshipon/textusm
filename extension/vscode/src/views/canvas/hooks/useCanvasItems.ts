import { useContext } from 'react';
import { CanvasContext } from '../CanvasProvider';

export function useCanvasItems() {
  const { dispatch } = useContext(CanvasContext);
  return {
    addItem: (item: any) => dispatch({ type: 'ADD_ITEM', payload: item }),
    removeItem: (item: any) => dispatch({ type: 'REMOVE_ITEM', payload: item }),
  };
}