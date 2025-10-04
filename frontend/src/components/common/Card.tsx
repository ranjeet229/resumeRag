import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'small' | 'normal' | 'large';
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'normal',
}) => {
  const paddingClasses = {
    none: '',
    small: 'p-3',
    normal: 'p-6',
    large: 'p-8',
  };

  const classes = [
    'bg-white rounded-lg shadow',
    paddingClasses[padding],
    className,
  ].join(' ');

  return <div className={classes}>{children}</div>;
};

export default Card;