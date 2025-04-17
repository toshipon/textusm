import React from 'react';

interface DialogHeaderProps {
  title: string;
}

export const DialogHeader: React.FC<DialogHeaderProps> = ({ title }) => (
  <div className="dialog-header">
    <h2>{title}</h2>
  </div>
);
