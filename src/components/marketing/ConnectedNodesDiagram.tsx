'use client';

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface Node {
  id: string;
  cx: number;
  cy: number;
  r: number;
  root?: boolean;
}

const nodes: Node[] = [
  { id: 'root', cx: 70, cy: 150, r: 10, root: true },
  { id: 'a', cx: 170, cy: 60, r: 6 },
  { id: 'b', cx: 290, cy: 95, r: 6 },
  { id: 'c', cx: 270, cy: 215, r: 6 },
  { id: 'd', cx: 155, cy: 250, r: 6 },
  { id: 'e', cx: 45, cy: 45, r: 5 },
];

const edges: [string, string][] = [
  ['root', 'a'],
  ['root', 'b'],
  ['root', 'c'],
  ['root', 'd'],
  ['root', 'e'],
  ['a', 'b'],
  ['c', 'd'],
];

function findNode(id: string): Node {
  const node = nodes.find((n) => n.id === id);
  if (!node) throw new Error(`Unknown node id: ${id}`);
  return node;
}

const root = findNode('root');

export default function ConnectedNodesDiagram({ className }: { className?: string }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <svg
      viewBox="0 0 320 280"
      className={className}
      role="img"
      aria-label="Diagram of connected nodes representing CoFabri's suite of apps working together"
    >
      {edges.map(([fromId, toId], index) => {
        const from = findNode(fromId);
        const to = findNode(toId);
        return (
          <motion.line
            key={`${fromId}-${toId}`}
            x1={from.cx}
            y1={from.cy}
            x2={to.cx}
            y2={to.cy}
            className="stroke-border"
            strokeWidth={1.5}
            initial={shouldReduceMotion ? false : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { duration: 0.6, delay: index * 0.12, ease: 'easeOut' }
            }
          />
        );
      })}
      {nodes.map((node, index) => (
        <motion.circle
          key={node.id}
          cx={node.cx}
          cy={node.cy}
          r={node.r}
          className={node.root ? 'fill-primary' : 'fill-primary/60'}
          initial={shouldReduceMotion ? false : { scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { duration: 0.4, delay: 0.6 + index * 0.08, ease: 'easeOut' }
          }
          style={{ transformOrigin: `${node.cx}px ${node.cy}px` }}
        />
      ))}
      {!shouldReduceMotion && (
        <motion.circle
          cx={root.cx}
          cy={root.cy}
          r={root.r}
          className="fill-primary"
          initial={{ opacity: 0.5, scale: 1 }}
          animate={{ opacity: [0.5, 0, 0.5], scale: [1, 1.8, 1] }}
          transition={{ duration: 2.5, delay: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: `${root.cx}px ${root.cy}px` }}
        />
      )}
    </svg>
  );
}
