'use client';

import React, { useMemo, useCallback } from 'react';
import {
    ReactFlow,
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    Node,
    Edge,
    Position,
    Handle,
    BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import { motion } from 'framer-motion';

// Types from parent
interface Opening {
    id: string;
    name: string;
    display_name: string;
    description: string;
    category: string;
}

interface OpeningConceptMapProps {
    openings: Opening[];
    onSelectOpening: (opening: Opening) => void;
}

// Custom Node Component
const OpeningNode = ({ data }: { data: { label: string; opening: Opening; isRoot: boolean } }) => {
    return (
        <div className={`px-4 py-3 shadow-xl rounded-xl border-2 flex flex-col items-center justify-center min-w-[150px] transition-all
      ${data.isRoot
                ? 'bg-amber-500 border-amber-300 text-black shadow-amber-500/20'
                : 'bg-zinc-900/90 border-zinc-700 text-zinc-100 hover:border-amber-500/50'
            }
    `}>
            <Handle type="target" position={Position.Top} className="!bg-zinc-500 !w-2 !h-2" />
            <div className="font-bold text-xs uppercase tracking-wider text-center font-display">
                {data.label}
            </div>
            {/* {!data.isRoot && (
        <div className="text-[9px] text-zinc-500 font-mono mt-1 opacity-60">
           {data.opening.name}
        </div>
      )} */}
            <Handle type="source" position={Position.Bottom} className="!bg-zinc-500 !w-2 !h-2" />
        </div>
    );
};

const nodeTypes = {
    opening: OpeningNode,
};

// Layout Helper (Dagre)
const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    const isHorizontal = direction === 'LR';
    dagreGraph.setGraph({ rankdir: direction, ranksep: 100, nodesep: 50 });

    nodes.forEach((node) => {
        // Estimating dimensions for layout (since we don't know exact rendered size yet)
        // Root nodes are usually wider or standard.
        dagreGraph.setNode(node.id, { width: 180, height: 60 });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        // We are shifting the dagre node position (anchor=center center) to the top left
        // so it matches the React Flow node anchor point (top left).
        // Actually dagre nodes are center based?
        // React flow default is top-left.
        return {
            ...node,
            targetPosition: isHorizontal ? Position.Left : Position.Top,
            sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
            // We need to pass a position for React Flow
            position: {
                x: nodeWithPosition.x - (180 / 2),
                y: nodeWithPosition.y - (60 / 2),
            },
            style: { opacity: 1 }, // Ensure visible
        };
    });

    return { nodes: layoutedNodes, edges };
};


export default function OpeningConceptMap({ openings, onSelectOpening }: OpeningConceptMapProps) {

    // 1. Convert Openings to Hierarchy
    // We assume 'name' uses underscores for hierarchy: e.g. "Sicilian_Defense_Najdorf_Variation"
    // OR we use display_name splitting.
    // The provided script suggests: "Kings_Pawn_Game_Leonardis_Variation"
    // Let's use the `name` field if available, or fallback to display_name cleaning.

    const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
        const nodes: Node[] = [];
        const edges: Edge[] = [];
        const nodeMap = new Map<string, Node>();

        // Sort by name length to process parents first usually, or just map them all.
        // Actually, we need to handle parent-child relationships.
        // Let's iterate and build a tree.

        // Helper to find parent: 
        // "A_B_C" -> Parent is "A_B".
        // If "A_B" doesn't exist, maybe "A" exists?
        // We need to support fuzzy matching if exact parents aren't in the list, 
        // OR we create "Virtual" nodes if we assume the hierarchy exists.
        // For now, let's only link if parent exists in the `openings` list.

        // 1. Map all existing openings for quick lookup
        const openingMap = new Map<string, Opening>();
        openings.forEach(op => openingMap.set(op.name, op));

        openings.forEach(op => {
            // Create Node
            const parts = op.name.split('_'); // Assuming snake_case from Lichess tags
            // Display name might be "Sicilian Defense: Najdorf"
            // Let's try to derive a short label.
            // If it has ':', take the last part.

            let label = op.display_name;
            if (label.includes(':')) {
                label = label.split(':').pop()?.trim() || label;
            } else if (label.includes(',')) {
                // "Sicilian Defense, Najdorf Variation" -> "Najdorf Variation" ?
                // Maybe just show full name if short, or truncation.
            }

            // Clean up common prefixes? 
            // If parent is connected, we can show only the "Diff".
            // For now, show full display name (shortened).

            const newNode: Node = {
                id: op.name,
                type: 'opening',
                data: {
                    label: label,
                    opening: op,
                    isRoot: false // will update later
                },
                position: { x: 0, y: 0 } // layout will fix
            };
            nodes.push(newNode);
            nodeMap.set(op.name, newNode);
        });

        // 2. Build Edges
        // Strategy: Look for the "Longest Prefix" match in the existing nodes.
        // e.g. "Sicilian_Defense_Najdorf"
        // Candidates: "Sicilian_Defense", "Sicilian"
        // We pick the longest one that matches.

        openings.forEach(op => {
            const parts = op.name.split('_');
            if (parts.length <= 1) {
                // It's a root!
                const node = nodeMap.get(op.name);
                if (node) node.data.isRoot = true;
                return;
            }

            // Try to find a parent
            let foundParent = false;
            // Iterate backwards from full length - 1 down to 1
            for (let i = parts.length - 1; i >= 1; i--) {
                const potentialParentName = parts.slice(0, i).join('_');
                if (nodeMap.has(potentialParentName)) {
                    // Link it!
                    edges.push({
                        id: `${potentialParentName}->${op.name}`,
                        source: potentialParentName,
                        target: op.name,
                        type: 'smoothstep',
                        animated: true,
                        style: { stroke: '#71717a', strokeWidth: 2 },
                    });
                    foundParent = true;
                    break; // Stop after finding the immediate parent
                }
            }

            if (!foundParent) {
                // Treat as root if no parent found in the current set (orphans)
                const node = nodeMap.get(op.name);
                if (node) node.data.isRoot = true;
            }
        });

        // Compute Layout
        return getLayoutedElements(nodes, edges);

    }, [openings]);

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    // Re-run layout if openings change (expensive but necessary if list changes)
    React.useEffect(() => {
        setNodes(initialNodes);
        setEdges(initialEdges);
    }, [initialNodes, initialEdges, setNodes, setEdges]);

    const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
        onSelectOpening(node.data.opening as Opening);
    }, [onSelectOpening]);

    return (
        <div className="w-full h-[600px] bg-zinc-950/50 rounded-3xl border border-zinc-800 overflow-hidden relative group">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.05] pointer-events-none" />

            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={onNodeClick}
                nodeTypes={nodeTypes}
                fitView
                className="bg-transparent"
                minZoom={0.1}
                maxZoom={1.5}
                defaultEdgeOptions={{ type: 'smoothstep' }}
            >
                <Background color="#333" gap={20} size={1} variant={BackgroundVariant.Dots} />
                <Controls className="bg-zinc-800 border border-zinc-700 fill-zinc-400 text-zinc-400" />
                <MiniMap
                    nodeStrokeColor={(n) => {
                        return n.data.isRoot ? '#f59e0b' : '#3f3f46';
                    }}
                    nodeColor={(n) => {
                        return n.data.isRoot ? '#fbbf24' : '#18181b';
                    }}
                    className="bg-zinc-900 border border-zinc-800 rounded-lg !bottom-4 !right-4"
                    maskColor="rgba(0, 0, 0, 0.6)"
                />
            </ReactFlow>

            {/* Legend / Info */}
            <div className="absolute top-4 left-4 bg-zinc-900/80 backdrop-blur border border-zinc-800 p-3 rounded-xl pointer-events-none">
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Root</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-zinc-800 border border-zinc-600"></div>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Variation</span>
                </div>
            </div>
        </div>
    );
}
