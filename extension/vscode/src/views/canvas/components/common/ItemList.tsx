import React from 'react';

interface ItemListProps {
  items: any[];
  onRemove: (item: any) => void;
}

export const ItemList: React.FC<ItemListProps> = ({ items, onRemove }) => (
  <ul className="item-list">
    {items.map((item, idx) => (
      <li key={idx}>
        <span>{item.label || JSON.stringify(item)}</span>
        <button onClick={() => onRemove(item)}>×</button>
      </li>
    ))}
  </ul>
);
