import React from 'react';

interface CanvasCellProps {
  title: string;
  content: string[];
  size: [number, number]; // width, height
  position: [number, number]; // x, y
  onEdit?: (content: string) => void;
}

export const CanvasCell: React.FC<CanvasCellProps> = ({
  title,
  content,
  size,
  position,
  onEdit
}) => {
  const [width, height] = size;
  const [x, y] = position;
  
  return (
    <g
      transform={`translate(${x}, ${y})`}
      className="canvas-cell"
      onClick={() => onEdit && onEdit(content.join('\n'))}
    >
      {/* セル背景 */}
      <rect
        width={width}
        height={height}
        fill="var(--vscode-editor-background)"
        stroke="var(--vscode-editorBracketMatch-border)"
        strokeWidth="1"
      />
      
      {/* タイトル */}
      <text
        x="10"
        y="25"
        fontFamily="var(--vscode-editor-font-family)"
        fontSize="16"
        fontWeight="bold"
        fill="var(--vscode-editor-foreground)"
      >
        {title}
      </text>
      
      {/* コンテンツ */}
      <foreignObject x="5" y="35" width={width - 10} height={height - 40}>
        <div
          style={{
            fontFamily: 'var(--vscode-editor-font-family)',
            fontSize: '14px',
            color: 'var(--vscode-editor-foreground)',
            padding: '5px',
            overflow: 'auto',
            height: '100%'
          }}
        >
          {content.map((item, idx) => (
            <div key={idx} className="canvas-item">• {item}</div>
          ))}
        </div>
      </foreignObject>
    </g>
  );
};

export default CanvasCell;