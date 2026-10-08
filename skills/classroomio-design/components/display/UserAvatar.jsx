import React from 'react';
import { Avatar } from './Avatar.jsx';
export function UserAvatar({ src, alt = 'User', size = 24, style }) {
  const placeholder = <span style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'flex-end', justifyContent: 'center', background: '#1447e6', overflow: 'hidden' }}>
    <svg viewBox="0 0 90 90" width="100%" height="100%" aria-label="User avatar" role="img">
      <circle cx="45" cy="34" r="16" fill="#fff" opacity="0.9"/>
      <path d="M13 90c0-20 14-32 32-32s32 12 32 32z" fill="#fff" opacity="0.9"/>
    </svg>
  </span>;
  return <Avatar src={src || undefined} alt={alt} size={size} fallback={placeholder} style={{ fontSize: 0, ...style }}/>;
}
