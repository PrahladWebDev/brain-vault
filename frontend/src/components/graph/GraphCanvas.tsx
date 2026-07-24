import { useEffect, useRef, useState, useCallback } from 'react';
import {
  forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide, SimulationNodeDatum,
} from 'd3-force';
import { useNavigate } from 'react-router-dom';
import type { GraphNode, GraphEdgeData } from '@/types';
import { categoryColor } from '@/utils/format';

interface SimNode extends SimulationNodeDatum, GraphNode {}
interface SimEdge { source: SimNode; target: SimNode; weight: number; isManual: boolean }

export default function GraphCanvas({
  nodes, edges, physics,
}: {
  nodes: GraphNode[];
  edges: GraphEdgeData[];
  physics?: { charge: number; linkDistance: number };
}) {
  const navigate = useNavigate();
  const svgRef = useRef<SVGSVGElement>(null);
  const [simNodes, setSimNodes] = useState<SimNode[]>([]);
  const [simEdges, setSimEdges] = useState<SimEdge[]>([]);
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const panState = useRef<{ dragging: boolean; startX: number; startY: number; ox: number; oy: number }>({
    dragging: false, startX: 0, startY: 0, ox: 0, oy: 0,
  });
  const simRef = useRef<ReturnType<typeof forceSimulation<SimNode>> | null>(null);

  const width = 900;
  const height = 620;

  useEffect(() => {
    const nodesCopy: SimNode[] = nodes.map((n) => ({ ...n }));
    const edgesCopy = edges
      .map((e) => ({ ...e, source: e.source as any, target: e.target as any, }))
      .filter((e) => nodesCopy.some((n) => n.id === e.source) && nodesCopy.some((n) => n.id === e.target));

    const sim = forceSimulation(nodesCopy)
      .force('charge', forceManyBody().strength(physics?.charge ?? -160))
      .force(
        'link',
        forceLink(edgesCopy as any)
          .id((d: any) => d.id)
          .distance((d: any) => (physics?.linkDistance ?? 90) * (1.4 - (d.weight || 0.3)))
          .strength((d: any) => Math.max(0.05, d.weight))
      )
      .force('center', forceCenter(width / 2, height / 2))
      .force('collide', forceCollide().radius(28))
      .on('tick', () => {
        setSimNodes([...nodesCopy]);
        setSimEdges([...(edgesCopy as any)]);
      });

    simRef.current = sim;
    return () => { sim.stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges, physics?.charge, physics?.linkDistance]);

  const screenToWorld = useCallback((clientX: number, clientY: number) => {
    const rect = svgRef.current!.getBoundingClientRect();
    const x = (clientX - rect.left - transform.x) / transform.k;
    const y = (clientY - rect.top - transform.y) / transform.k;
    return { x, y };
  }, [transform]);

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.001;
    setTransform((t) => ({ ...t, k: Math.min(3, Math.max(0.3, t.k + delta)) }));
  };

  const onCanvasPointerDown = (e: React.PointerEvent) => {
    panState.current = { dragging: true, startX: e.clientX, startY: e.clientY, ox: transform.x, oy: transform.y };
  };
  const onCanvasPointerMove = (e: React.PointerEvent) => {
    if (dragId) {
      const { x, y } = screenToWorld(e.clientX, e.clientY);
      const node = simNodes.find((n) => n.id === dragId);
      if (node) { node.fx = x; node.fy = y; simRef.current?.alpha(0.3).restart(); }
      return;
    }
    if (panState.current.dragging) {
      const dx = e.clientX - panState.current.startX;
      const dy = e.clientY - panState.current.startY;
      setTransform((t) => ({ ...t, x: panState.current.ox + dx, y: panState.current.oy + dy }));
    }
  };
  const onCanvasPointerUp = () => {
    panState.current.dragging = false;
    if (dragId) {
      const node = simNodes.find((n) => n.id === dragId);
      if (node) { node.fx = null; node.fy = null; }
      setDragId(null);
    }
  };

  const onNodePointerDown = (e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    setDragId(id);
  };

  const connectedIds = new Set<string>();
  if (hoveredId) {
    simEdges.forEach((e: any) => {
      const s = typeof e.source === 'object' ? e.source.id : e.source;
      const t = typeof e.target === 'object' ? e.target.id : e.target;
      if (s === hoveredId) connectedIds.add(t);
      if (t === hoveredId) connectedIds.add(s);
    });
  }

  return (
    <div className="glass-card overflow-hidden">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="h-[420px] w-full cursor-grab touch-none active:cursor-grabbing sm:h-[500px] lg:h-[620px]"
        onWheel={onWheel}
        onPointerDown={onCanvasPointerDown}
        onPointerMove={onCanvasPointerMove}
        onPointerUp={onCanvasPointerUp}
        onPointerLeave={onCanvasPointerUp}
      >
        <g transform={`translate(${transform.x},${transform.y}) scale(${transform.k})`}>
          {simEdges.map((e: any, i) => {
            const s = typeof e.source === 'object' ? e.source : simNodes.find((n) => n.id === e.source);
            const t = typeof e.target === 'object' ? e.target : simNodes.find((n) => n.id === e.target);
            if (!s || !t) return null;
            const dimmed = hoveredId && s.id !== hoveredId && t.id !== hoveredId;
            return (
              <line
                key={i}
                x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                stroke={e.isManual ? '#22d3ee' : '#8b5cf6'}
                strokeOpacity={dimmed ? 0.05 : 0.15 + e.weight * 0.35}
                strokeWidth={e.isManual ? 1.5 : Math.max(0.5, e.weight * 2)}
              />
            );
          })}

          {simNodes.map((n) => {
            const dimmed = hoveredId && n.id !== hoveredId && !connectedIds.has(n.id);
            const r = n.isFavorite ? 10 : 7;
            return (
              <g
                key={n.id}
                transform={`translate(${n.x},${n.y})`}
                onMouseEnter={() => setHoveredId(n.id)}
                onMouseLeave={() => setHoveredId(null)}
                onPointerDown={(e) => onNodePointerDown(e, n.id)}
                onClick={(e) => { e.stopPropagation(); navigate(`/links?linkId=${n.id}`); }}
                className="cursor-pointer"
                opacity={dimmed ? 0.25 : 1}
              >
                <circle r={r} fill={categoryColor(n.category)} stroke="#0d0d14" strokeWidth={2} />
                {n.isFavorite && <circle r={r + 3} fill="none" stroke="#fbbf24" strokeWidth={1} strokeDasharray="2 2" />}
                <text
                  x={r + 6}
                  y={4}
                  fontSize={10}
                  fill={hoveredId === n.id ? '#e2e8f0' : '#8896ab'}
                  className="pointer-events-none select-none"
                >
                  {n.label.length > 28 ? n.label.slice(0, 28) + '…' : n.label}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      <div className="flex items-center justify-between border-t border-white/[0.06] px-4 py-2.5 text-[11px] text-slate-500">
        <span>{simNodes.length} nodes · {simEdges.length} connections</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><span className="h-1.5 w-3 rounded-full bg-accent-500/60" /> Auto-related</span>
          <span className="flex items-center gap-1"><span className="h-1.5 w-3 rounded-full bg-cyan-400/60" /> Manual link</span>
        </div>
      </div>
    </div>
  );
}
