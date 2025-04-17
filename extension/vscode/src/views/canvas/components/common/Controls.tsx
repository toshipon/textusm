import React, { useState } from 'react';

interface ControlsProps {
  onAdd: (item: any) => void;
}

export const Controls: React.FC<ControlsProps> = ({ onAdd }) => {
  const [value, setValue] = useState('');

  const handleAdd = () => {
    if (value.trim()) {
      onAdd({ label: value.trim() });
      setValue('');
    }
  };

  return (
    <div className="controls">
      <input
        type="text"
        placeholder="Add new item"
        value={value}
        onChange={e => setValue(e.target.value)}
      />
      <button onClick={handleAdd}>Add</button>
    </div>
  );
};
