import React from 'react';
import { useCanvas } from '../hooks/useCanvas';
import { useCanvasItems } from '../hooks/useCanvasItems';
import { DialogHeader } from './common/DialogHeader';
import { ItemList } from './common/ItemList';
import { Controls } from './common/Controls';

const CanvasDialog: React.FC = () => {
  const { items } = useCanvas();
  const { addItem, removeItem } = useCanvasItems();

  return (
    <div className="canvas-dialog">
      <DialogHeader title="Hypothesis Canvas" />
      <ItemList items={items} onRemove={removeItem} />
      <Controls onAdd={addItem} />
    </div>
  );
};

export default CanvasDialog;
