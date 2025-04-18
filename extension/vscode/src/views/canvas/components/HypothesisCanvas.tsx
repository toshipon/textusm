import React from 'react';
import { CanvasCell } from './CanvasCell';
import Constants from '../utils/Constants';

export interface HypothesisCanvasData {
  purpose: string[];
  vision: string[];
  means: string[];
  advantage: string[];
  metrics: string[];
  valueProposition: string[];
  obviousProblem: string[];
  latentProblem: string[];
  alternatives: string[];
  situation: string[];
  channel: string[];
  trend: string[];
  revenueModel: string[];
  marketSize: string[];
}

interface HypothesisCanvasProps {
  data: HypothesisCanvasData;
  onEdit?: (section: keyof HypothesisCanvasData, content: string) => void;
}

export const HypothesisCanvas: React.FC<HypothesisCanvasProps> = ({
  data,
  onEdit
}) => {
  const itemHeight = Constants.itemHeight;
  const halfWidth = Constants.itemWidth * 2 - Constants.canvasOffset;
  const quarterWidth = Constants.itemWidth - Constants.canvasOffset;

  // 各セクションの編集ハンドラ
  const handleEdit = (section: keyof HypothesisCanvasData) => (content: string) => {
    onEdit && onEdit(section, content);
  };

  return (
    <svg
      viewBox={`0 0 ${Constants.itemWidth * 4} ${itemHeight * 4}`}
      width="100%"
      height="100%"
      style={{ maxWidth: '100%', height: 'auto' }}
    >
      {/* 最上段: 目的・ビジョン */}
      <CanvasCell 
        title="目的" 
        content={data.purpose} 
        size={[halfWidth, itemHeight - Constants.canvasOffset]} 
        position={[0, 0]} 
        onEdit={handleEdit('purpose')} 
      />
      <CanvasCell 
        title="ビジョン" 
        content={data.vision} 
        size={[halfWidth, itemHeight - Constants.canvasOffset]} 
        position={[halfWidth, 0]} 
        onEdit={handleEdit('vision')} 
      />

      {/* 中央左側: 実現手段・優位性・指標・提案価値 */}
      <CanvasCell 
        title="実現手段" 
        content={data.means} 
        size={[quarterWidth, itemHeight - Constants.canvasOffset]} 
        position={[0, itemHeight - Constants.canvasOffset]} 
        onEdit={handleEdit('means')} 
      />
      <CanvasCell 
        title="優位性" 
        content={data.advantage} 
        size={[quarterWidth, itemHeight - Constants.canvasOffset]} 
        position={[0, itemHeight * 2 - Constants.canvasOffset * 2]} 
        onEdit={handleEdit('advantage')} 
      />
      <CanvasCell 
        title="指標" 
        content={data.metrics} 
        size={[quarterWidth, itemHeight - Constants.canvasOffset]} 
        position={[quarterWidth, itemHeight - Constants.canvasOffset]} 
        onEdit={handleEdit('metrics')} 
      />
      <CanvasCell 
        title="提案価値" 
        content={data.valueProposition} 
        size={[quarterWidth, itemHeight - Constants.canvasOffset]} 
        position={[quarterWidth, itemHeight * 2 - Constants.canvasOffset * 2]} 
        onEdit={handleEdit('valueProposition')} 
      />

      {/* 中央右側: 顕在課題・潜在課題・代替手段・状況・チャネル・傾向 */}
      <CanvasCell 
        title="顕在課題" 
        content={data.obviousProblem} 
        size={[quarterWidth, itemHeight - Constants.canvasOffset]} 
        position={[halfWidth, itemHeight - Constants.canvasOffset]} 
        onEdit={handleEdit('obviousProblem')} 
      />
      <CanvasCell 
        title="潜在課題" 
        content={data.latentProblem} 
        size={[quarterWidth, itemHeight - Constants.canvasOffset]} 
        position={[halfWidth, itemHeight * 2 - Constants.canvasOffset * 2]} 
        onEdit={handleEdit('latentProblem')} 
      />
      <CanvasCell 
        title="代替手段" 
        content={data.alternatives} 
        size={[quarterWidth, Math.floor(itemHeight / 2)]} 
        position={[Constants.itemWidth * 3 - Constants.canvasOffset, itemHeight - Constants.canvasOffset]} 
        onEdit={handleEdit('alternatives')} 
      />
      <CanvasCell 
        title="状況" 
        content={data.situation} 
        size={[quarterWidth, Math.floor(itemHeight / 2)]} 
        position={[Constants.itemWidth * 3 - Constants.canvasOffset, itemHeight + Math.floor(itemHeight / 2)]} 
        onEdit={handleEdit('situation')} 
      />
      <CanvasCell 
        title="チャネル" 
        content={data.channel} 
        size={[quarterWidth, Math.floor(itemHeight / 2)]} 
        position={[Constants.itemWidth * 3 - Constants.canvasOffset, itemHeight * 2 - Constants.canvasOffset * 2]} 
        onEdit={handleEdit('channel')} 
      />
      <CanvasCell 
        title="傾向" 
        content={data.trend} 
        size={[quarterWidth, Math.floor(itemHeight / 2)]} 
        position={[
          Constants.itemWidth * 3 - Constants.canvasOffset, 
          itemHeight * 2 + Math.floor(itemHeight / 2) - Constants.canvasOffset * 3
        ]} 
        onEdit={handleEdit('trend')} 
      />

      {/* 最下段: 収益モデル・市場規模 */}
      <CanvasCell 
        title="収益モデル" 
        content={data.revenueModel} 
        size={[halfWidth, itemHeight - Constants.canvasOffset]} 
        position={[0, itemHeight * 3 - Constants.canvasOffset * 3]} 
        onEdit={handleEdit('revenueModel')} 
      />
      <CanvasCell 
        title="市場規模" 
        content={data.marketSize} 
        size={[halfWidth, itemHeight - Constants.canvasOffset]} 
        position={[halfWidth, itemHeight * 3 - Constants.canvasOffset * 3]} 
        onEdit={handleEdit('marketSize')} 
      />
    </svg>
  );
};

export default HypothesisCanvas;