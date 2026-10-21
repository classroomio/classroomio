import React from 'react';
export function ButtonGroup({ orientation = 'horizontal', children, style }) {
  const kids = React.Children.toArray(children).filter(Boolean);
  const v = orientation === 'vertical';
  return <div role="group" style={{ display: 'flex', flexDirection: v ? 'column' : 'row', width: 'fit-content', alignItems: 'stretch', ...style }}>
    {kids.map((c, i) => {
      const first = i === 0, last = i === kids.length - 1;
      const r = v ? { borderTopLeftRadius: first ? undefined : 0, borderTopRightRadius: first ? undefined : 0, borderBottomLeftRadius: last ? undefined : 0, borderBottomRightRadius: last ? undefined : 0, borderTopWidth: first ? undefined : 0 }
        : { borderTopLeftRadius: first ? undefined : 0, borderBottomLeftRadius: first ? undefined : 0, borderTopRightRadius: last ? undefined : 0, borderBottomRightRadius: last ? undefined : 0, borderLeftWidth: first ? undefined : 0 };
      Object.keys(r).forEach(k => r[k] === undefined && delete r[k]);
      return React.isValidElement(c) ? React.cloneElement(c, { key: i, style: { ...(c.props.style || {}), ...r } }) : c;
    })}
  </div>;
}