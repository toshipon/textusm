import { useContext } from 'react';
import { CanvasContext } from '../CanvasProvider';

export function useCanvas() {
  const { state } = useContext(CanvasContext);
  return state;
}
