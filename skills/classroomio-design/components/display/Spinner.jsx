import React from 'react';
import { Ic } from '../forms/uiShared.jsx';
export function Spinner({ size = 16, color = 'currentColor', style }) {
  return <span role="status" aria-label="Loading" style={{ display: 'inline-flex', color, ...style }}>{Ic('loader', size, { animation: 'ui-spin 1s linear infinite' })}</span>;
}