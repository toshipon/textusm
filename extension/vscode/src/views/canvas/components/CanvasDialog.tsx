import React from 'react';
import { useCanvas } from '../hooks/useCanvas';
import HypothesisCanvas from './HypothesisCanvas';

const CanvasDialog: React.FC = () => {
  const { hypothesisCanvas } = useCanvas();

  // Canvas データの更新処理は useCanvasItems フックを使って実装
  const handleEdit = (section: any, content: string) => {
    console.log(`Editing ${section}:`, content);
    // 後で dispatch を呼び出す実装に置き換える
  };

  return (
    <div className="canvas-dialog">
      <div className="canvas-header">
        <h2>仮説キャンバス</h2>
      </div>
      <div className="canvas-container">
        <HypothesisCanvas 
          data={hypothesisCanvas}
          onEdit={handleEdit}
        />
      </div>
    </div>
  );
};

export default CanvasDialog;
