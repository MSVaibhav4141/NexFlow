import { create } from 'zustand';
import { Node, Edge, OnNodesChange, OnEdgesChange, OnConnect, applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';
import { Connection, EdgeChange, NodeChange } from '@xyflow/react';

interface WorkflowState {
  nodes: Node[];
  edges: Edge[];
  workflowId:string|null;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  addNode: (node: Node) => void;
  addEdge: (edge: Edge) => void;
  setWorkflowId: (id: string) => void;
  setInitialData: (nodes:Node[], edge: Edge[]) => void;
  nodeStatuses: Record<string, 'running' | 'success' | 'failed'| 'ai-running'|'paused'>;
  setNodeStatus: (nodeId: string, status: 'running' | 'success' | 'failed'|'paused') => void;
  clearStatuses: () => void;
  updateNodeData: (nodeId: string, newData: Record<string, any>) => void;
  setAiHighlight: (sourceId: string, targetId: string | null, isActive: boolean) => void;
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  nodes: [],
  edges: [],
  workflowId: null,
  nodeStatuses: {},

  setNodeStatus: (nodeId, status) => 
    set((state) => ({
      nodeStatuses: { ...state.nodeStatuses, [nodeId]: status }
    })),

  clearStatuses: () => set({ nodeStatuses: {} }),

  setWorkflowId: (id:string) => {
    set({workflowId: id})
  },
  onNodesChange: (changes: NodeChange[]) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) });
  },
  
  onEdgesChange: (changes: EdgeChange[]) => {
    set({ edges: applyEdgeChanges(changes, get().edges) });
  },
  
  onConnect: (connection: Connection) => {
    set({ edges: addEdge(connection, get().edges) });
  },

  addNode: (newNode) => {
    const prevNode = get().nodes

    if(prevNode.find(i => i.id === 'node-0')){
      set({nodes: [newNode]})
    }else{
      set({ nodes: [...get().nodes, newNode] });
    }
  },
  addEdge: (newEdge) => {
    set({edges: [...get().edges, newEdge]})
  },
  setInitialData: (nodes, edges) => {
    set({ nodes, edges });
  },
  updateNodeData: (nodeId, newData) => {
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: { ...node.data, ...newData },
          };
        }
        return node;
      }),
    }));
  },
setAiHighlight: (sourceId, targetId, isActive) => set((state) => {
  const newEdges = state.edges.map((e) => {
    if (e.source === sourceId && (targetId === null || e.target === targetId)) {
      return {
        ...e,
        animated: isActive,
        // ✅ Use className instead of style for better CSS control
        className: isActive ? 'ai-path-active' : '',
        // Keep style as an empty object when active to clear defaults
        style: isActive ? { strokeWidth: 3 } : {}, 
      };
    }
    return e;
  });

  const newNodeStatuses = { ...state.nodeStatuses };
  if (targetId) {
    newNodeStatuses[targetId] = isActive ? ('ai-running' as any) : 'idle'; 
  } else if (!isActive) {
    state.edges.forEach((e) => {
      if (e.source === sourceId && newNodeStatuses[e.target] === 'ai-running') {
        newNodeStatuses[e.target] = ('idle' as any);
      }
    });
  }

  return { edges: newEdges, nodeStatuses: newNodeStatuses };
}),
}));