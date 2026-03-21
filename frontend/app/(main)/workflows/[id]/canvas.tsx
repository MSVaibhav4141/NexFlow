"use client";
import { useExecution } from "@/hooks/useExecution"; 
import { useState, useMemo, useEffect, useRef } from "react";
import { 
  ReactFlow, 
  Background,
  BackgroundVariant,
  Controls,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { NodeEditorModal } from "../../../../components/workflows/settings-drawer";
import { AIAgentNode, StartNode, ManualTriggerNode,WebhookTriggerNode,FormTriggerNode, SendEmailNode, SendTelegramNode, IfElseNode } from "../../../../components/workflows/custom-nodes";
import { NodeSelectorDrawer } from "../../../../components/workflows/drawer";
import { WorkflowContext } from "./workflowContext";
import { useWorkflowStore } from "@/store/useWorkflowStore";



export default function WorkflowCanvas({allNodes=[], allEdges=[]}:{allNodes:Node[], allEdges:Edge[]}) {
 

const [isDrawerOpen, setIsDrawerOpen] = useState(false);
const [isSettingsOpen, setIsSettingsOpen] = useState(false);
const [activeSettingsNodeId, setActiveSettingsNodeId] = useState<string | null>(null);
const [drawerOpener, setDrawerOpenerId] = useState<string>("")
const [handelerValue, setHandelerValue] = useState<string | null>(null)
const nodes = useWorkflowStore((state) => state.nodes);
const edges = useWorkflowStore((state) => state.edges);
const onNodesChange = useWorkflowStore((state) => state.onNodesChange);
const onEdgesChange = useWorkflowStore((state) => state.onEdgesChange);
const onConnect = useWorkflowStore((state) => state.onConnect);
const addEdge = useWorkflowStore((state) => state.addEdge);
const addNode = useWorkflowStore((state) => state.addNode);
const setInitialData = useWorkflowStore((state) => state.setInitialData);
const { startExecution, isRunning, nodeOutputs } = useExecution();

const hasHydrated = useRef(false);

 
const nodeStatuses = useWorkflowStore((state) => state.nodeStatuses);
const styledEdges = edges.map((edge) => {
    const sourceStatus = nodeStatuses[edge.source];
    const targetStatus = nodeStatuses[edge.target];

    // The wire is actively flowing
    const isRunning = sourceStatus === 'success' && targetStatus === 'running';
    // The wire is completely finished
    const isFinished = sourceStatus === 'success' && targetStatus === 'success';

    return {
      ...edge,
      // Only show the moving "marching ants" effect when running
      animated: isRunning, 
      style: {
        ...edge.style,
        strokeWidth: isRunning || isFinished ? 3 : 2,
        
        // Base color: Bright green if active/done, otherwise dull gray/green
        stroke: isRunning || isFinished ? '#22c55e' : '#3f3f46', 
        
        // THE MAGIC GLOW EFFECT: 
        // This adds a beautiful neon green shadow around the SVG path when it's running or finished!
        filter: isRunning || isFinished 
          ? 'drop-shadow(0 0 8px rgba(34, 197, 94, 0.8))' 
          : 'none',
          
        transition: 'all 0.3s ease', // Smooth transition between states
      },
    };
  });

const handleAddNode = (type: string, label: string) => {
    const newNodeId = `node-${Date.now()}`;
    
    const parentNode = nodes.find((n) => n.id === drawerOpener);
    console.log(parentNode?.type, handelerValue, parentNode?.position.y)
    const newPosition = {
      x: parentNode ? parentNode.position.x + 350 : 0,
      y: parentNode ? (parentNode.type==='ifElse' ? (handelerValue === "true" ? parentNode.position.y - 10 : parentNode.position.y + 150) :parentNode.position.y) : 0,
    };

    const newNode: Node = {
      id: newNodeId,
      type: type, 
      position: newPosition, 
      data: { 
        label: label,
        id: newNodeId,
        description: "Newly added node",
      }
    };

  
    addNode(newNode);

    if (drawerOpener) {
      const edge = { 
        id: `e-${drawerOpener}-${newNodeId}`, 
        source: drawerOpener, 
        target: newNodeId, 
        sourceHandle:handelerValue,
        animated: true, 
        style: { stroke: '#818cf8', strokeWidth: 2 }
      };
      addEdge(edge);
    }

    setIsDrawerOpen(false);
    setDrawerOpenerId("");
};


  const nodeTypes = useMemo(() => ({ 
    startNode: StartNode,
    manualTrigger: ManualTriggerNode,
    webhookTrigger: WebhookTriggerNode,
    formTrigger: FormTriggerNode,
    sendEmail: SendEmailNode,        
    sendTelegram: SendTelegramNode,  
    ifElse: IfElseNode,
    agentAi:AIAgentNode
  }), []);

  const handleOpenDrawer = (nodeId: string, handelerValue?:string) => {
    setDrawerOpenerId(nodeId);
    setIsDrawerOpen(true);
    setHandelerValue(handelerValue ?? null)
  };

  useEffect(() => {
    if(!nodes.length){
       const emptyNode: Node = { 
    id: "node-0", 
    type: "startNode", 
    position: { x: 0, y: 0 }, 
    draggable: false,
    deletable: false,
    data: { 
      setIsDrawerOpen, 
    } 
  }  

  addNode(emptyNode)
    }
  }, [nodes.length])


   useEffect(() => {
    console.log(allNodes)
    if (!hasHydrated.current) {

      if(allNodes.length === 0){
        const emptyNode: Node[] = [{ 
    id: "node-0", 
    type: "startNode", 
    position: { x: 0, y: 0 }, 
    draggable: false,
    deletable: false,
    data: { 
      setIsDrawerOpen, 
    } 
  }]

        setInitialData(emptyNode, allEdges);

      }else{
        setInitialData(allNodes, allEdges);
      }
      hasHydrated.current = true;
    }
  }, [allNodes, allEdges, setInitialData]);

  const updateNodeData = (nodeId: string, newData: any) => {
    onNodesChange([{
      id: nodeId,
      type: "replace",
      item: nodes.find(n => n.id === nodeId)!, // Keep existing node properties
    }]);
    
    // The proper ReactFlow way to update data dynamically:
    useWorkflowStore.setState((state) => ({
      nodes: state.nodes.map((node) => 
        node.id === nodeId ? { ...node, data: newData } : node
      )
    }));
  };

  const handleOpenSettings = (nodeId: string) => {
    setActiveSettingsNodeId(nodeId);
    setIsSettingsOpen(true);
  };

  // Find the actual node object to pass to the drawer
  const activeNode = nodes.find(n => n.id === activeSettingsNodeId) || null;

  

  if (!hasHydrated.current) {
    return <div className="flex items-center justify-center h-full text-white">Loading Canvas...</div>;
  }
  return (
    <div className="relative h-full w-full rounded-xl border border-white/10 bg-[#0a0a0c] overflow-hidden">
      <WorkflowContext.Provider value={{ openDrawer: handleOpenDrawer,openSettings: handleOpenSettings }}>
      <ReactFlow
        nodes={nodes}
        edges={styledEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        fitViewOptions={{ maxZoom: 1, duration: 500 }}
        defaultViewport={{x:100, y:0 , zoom:1.3}}
        colorMode="dark"
        minZoom={0.1}
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={24} 
          size={2} 
          color="#ffffff15" 
        />
        <Controls 
          showInteractive={false} 
          position="bottom-right" 
          className="bg-[#121216] border border-white/10 shadow-2xl rounded-md overflow-hidden fill-white text-white" 
        />
      </ReactFlow>
</WorkflowContext.Provider>
      <NodeSelectorDrawer 
        isOpen={isDrawerOpen} 
        toggle={setIsDrawerOpen} 
        onSelectNode={handleAddNode}
      />

      <NodeEditorModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        activeNode={activeNode}
        updateNodeData={updateNodeData}
        nodeOutputs={nodeOutputs}         
  isRunning={isRunning}           
  startExecution={startExecution}
      />
    </div>
  );
}