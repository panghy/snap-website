import React from 'react';
import styles from './LoadingSkeleton.module.css';

interface LoadingSkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  width,
  height,
  className = '',
  variant = 'text'
}) => {
  const getVariantClass = () => {
    switch (variant) {
      case 'circular':
        return styles.circular;
      case 'rectangular':
        return styles.rectangular;
      default:
        return styles.text;
    }
  };

  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height
  };

  return (
    <div
      className={`${styles.skeleton} ${getVariantClass()} ${className}`}
      style={style}
      data-testid="loading-skeleton"
    />
  );
};

export default LoadingSkeleton;