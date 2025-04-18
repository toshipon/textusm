import React, { useState, useEffect } from 'react';
import { useCanvas } from '../hooks/useCanvas';
import { useCanvasItems } from '../hooks/useCanvasItems';
import HypothesisCanvas from './HypothesisCanvas';

const CanvasDialog: React.FC = () => {
  const { hypothesisCanvas } = useCanvas();
  const { updateSection, loadCanvas } = useCanvasItems();
  const [filename, setFilename] = useState<string>("仮説キャンバス");
  
  // WebViewメッセージを受信するためのハンドラを設定
  useEffect(() => {
    // キャンバスデータを受け取るコールバックを登録
    window.canvasDataCallback = (data) => {
      console.log('Canvas data received:', data);
      loadCanvas(data);
    };
    
    // タイトル（ファイル名）を受け取るコールバックを登録
    window.canvasTitleCallback = (title) => {
      setFilename(title);
    };
    
    // クリーンアップ
    return () => {
      window.canvasDataCallback = undefined;
      window.canvasTitleCallback = undefined;
    };
  }, [loadCanvas]);

  // セクション編集ハンドラ
  const handleEdit = (section: any, content: string) => {
    updateSection(section, content);
  };

  return (
    <div className="canvas-dialog">
      <div className="canvas-header">
        <h2>仮説キャンバス: {filename}</h2>
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
