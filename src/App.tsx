import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Text, Group, Line, Circle, Arrow, Transformer } from 'react-konva';
import { NodeData, ConnectionData, GroupData, ViewPoint, AutoPayment } from './types';
import { Plus, Trash2, Link2, Box, Move, Type, Palette, X, Save, FolderOpen, RotateCcw, Play, Coins, ArrowRightLeft, Download, Upload, Maximize, ArrowRight, MousePointer2, BoxSelect, Bookmark, MapPin, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Konva from 'konva';

const STORAGE_KEY = 'mindmap_pro_state';

const COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#64748b', // slate
];

export default function App() {
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [connections, setConnections] = useState<ConnectionData[]>([]);
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [oneTimeSourceId, setOneTimeSourceId] = useState<string | null>(null);
  const [stageSize, setStageSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isEditingOneTime, setIsEditingOneTime] = useState<{ fromId: string, toId: string } | null>(null);
  const [editText, setEditText] = useState('');
  const [editBalance, setEditBalance] = useState(0);
  const [editAmount, setEditAmount] = useState(0);
  const [editInfo, setEditInfo] = useState('');
  const [oneTimeAmount, setOneTimeAmount] = useState(10);
  const [showToast, setShowToast] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, type: 'node' | 'connection' | 'stage', targetId: string | null } | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [dragTargetGroupId, setDragTargetGroupId] = useState<string | null>(null);
  const [stageScale, setStageScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectionRect, setSelectionRect] = useState<{ x1: number, y1: number, x2: number, y2: number, visible: boolean }>({ x1: 0, y1: 0, x2: 0, y2: 0, visible: false });
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [viewPoints, setViewPoints] = useState<ViewPoint[]>([]);
  const [showViewPoints, setShowViewPoints] = useState(false);
  const [isSavingView, setIsSavingView] = useState(false);
  const [viewName, setViewName] = useState('');
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const [isEditingAutoPayments, setIsEditingAutoPayments] = useState<string | null>(null);
  const [alignmentGuides, setAlignmentGuides] = useState<{ x?: number, y?: number }[]>([]);

  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setStageSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initial load from local storage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const { nodes: savedNodes, connections: savedConnections, groups: savedGroups, viewPoints: savedViewPoints } = JSON.parse(saved);
        if (savedNodes) setNodes(savedNodes);
        if (savedConnections) setConnections(savedConnections);
        if (savedGroups) {
          setGroups(savedGroups.map((g: any) => ({
            ...g,
            width: g.width || 200,
            height: g.height || 120,
            balance: g.balance || 0,
            autoPayments: g.autoPayments || []
          })));
        }
        if (savedViewPoints) setViewPoints(savedViewPoints);
      } catch (e) {
        console.error('Failed to load initial state', e);
      }
    }
  }, []);

  // Auto-save to local storage
  useEffect(() => {
    const timer = setTimeout(() => {
      if (nodes.length > 0 || connections.length > 0 || groups.length > 0 || viewPoints.length > 0) {
        const state = { nodes, connections, groups, viewPoints };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      }
    }, 3000); // Save after 3 seconds of inactivity

    return () => clearTimeout(timer);
  }, [nodes, connections, groups, viewPoints]);

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const scaleBy = 1.1;
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    const limitedScale = Math.max(0.1, Math.min(5, newScale));

    setStageScale(limitedScale);
    setStagePos({
      x: pointer.x - mousePointTo.x * limitedScale,
      y: pointer.y - mousePointTo.y * limitedScale,
    });
  };

  const resetView = () => {
    setStageScale(1);
    setStagePos({ x: 0, y: 0 });
  };

  const saveToLocal = () => {
    const state = { nodes, connections, groups, viewPoints };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    triggerToast('Mind map saved!');
  };

  const loadFromLocal = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const { nodes: savedNodes, connections: savedConnections, groups: savedGroups, viewPoints: savedViewPoints } = JSON.parse(saved);
        setNodes(savedNodes || []);
        setConnections(savedConnections || []);
        setGroups(savedGroups || []);
        setViewPoints(savedViewPoints || []);
        setSelectedId(null);
        setConnectingFrom(null);
        triggerToast('Mind map loaded!');
      } catch (e) {
        triggerToast('Failed to load.');
      }
    } else {
      triggerToast('No saved data found.');
    }
  };

  const clearCanvas = () => {
    setIsConfirmingClear(true);
  };

  const confirmClear = () => {
    setNodes([]);
    setConnections([]);
    setGroups([]);
    setViewPoints([]);
    setSelectedId(null);
    setConnectingFrom(null);
    setIsConfirmingClear(false);
    triggerToast('Canvas cleared.');
  };

  const triggerToast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(null), 3000);
  };

  const exportToJson = () => {
    const data = { nodes, connections, groups, viewPoints };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mindmap_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    triggerToast('Mind map exported!');
  };

  const importFromJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content);
        if (data.nodes && Array.isArray(data.nodes)) {
          setNodes(data.nodes);
          setConnections(data.connections || []);
          setGroups((data.groups || []).map((g: any) => ({
            ...g,
            width: g.width || 200,
            height: g.height || 120,
            balance: g.balance || 0,
            autoPayments: g.autoPayments || []
          })));
          setViewPoints(data.viewPoints || []);
          setSelectedId(null);
          setConnectingFrom(null);
          triggerToast('Mind map imported successfully!');
        } else {
          throw new Error('Invalid file format');
        }
      } catch (err) {
        triggerToast('Failed to import: Invalid JSON file.');
      }
    };
    reader.readAsText(file);
    // Reset input value so the same file can be uploaded again
    e.target.value = '';
  };

  const handleContextMenu = (e: Konva.KonvaEventObject<PointerEvent>, type: 'node' | 'connection' | 'stage', targetId: string | null) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    
    // Get pointer position relative to container
    const container = containerRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    setContextMenu({
      x: e.evt.clientX - rect.left,
      y: e.evt.clientY - rect.top,
      type,
      targetId
    });
  };

  const deleteConnection = (id: string) => {
    setConnections(prev => prev.filter(c => c.id !== id));
    triggerToast('Connection removed.');
    setContextMenu(null);
  };

  const executeOneTimePayment = (fromId: string, toId: string, amount: number) => {
    let success = false;

    // Check if source is a node or group
    setNodes(prevNodes => {
      const newNodes = [...prevNodes];
      const fromIdx = newNodes.findIndex(n => n.id === fromId);
      const toIdx = newNodes.findIndex(n => n.id === toId);

      if (fromIdx !== -1) {
        newNodes[fromIdx] = { ...newNodes[fromIdx], balance: newNodes[fromIdx].balance - amount };
        success = true;
      }
      if (toIdx !== -1) {
        newNodes[toIdx] = { ...newNodes[toIdx], balance: newNodes[toIdx].balance + amount };
        success = true;
      }
      return newNodes;
    });

    setGroups(prevGroups => {
      const newGroups = [...prevGroups];
      const fromIdx = newGroups.findIndex(g => g.id === fromId);
      const toIdx = newGroups.findIndex(g => g.id === toId);

      if (fromIdx !== -1) {
        newGroups[fromIdx] = { ...newGroups[fromIdx], balance: (newGroups[fromIdx].balance || 0) - amount };
        success = true;
      }
      if (toIdx !== -1) {
        newGroups[toIdx] = { ...newGroups[toIdx], balance: (newGroups[toIdx].balance || 0) + amount };
        success = true;
      }
      return newGroups;
    });

    if (success) {
      triggerToast(`Sent $${amount} payment!`);
    }
    setIsEditingOneTime(null);
  };

  const addNode = () => {
    // Calculate center of visible area in canvas coordinates
    const centerX = (stageSize.width / 2 - stagePos.x) / stageScale;
    const centerY = (stageSize.height / 2 - stagePos.y) / stageScale;

    const newNode: NodeData = {
      id: `node-${Date.now()}`,
      x: centerX + (Math.random() - 0.5) * 50,
      y: centerY + (Math.random() - 0.5) * 50,
      text: 'New Block',
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      balance: 0,
    };
    setNodes([...nodes, newNode]);
    setSelectedId(newNode.id);
  };

  const deleteSelected = () => {
    if (!selectedId) return;

    if (selectedId.startsWith('node-')) {
      setNodes(nodes.filter(n => n.id !== selectedId));
      setConnections(connections.filter(c => c.fromId !== selectedId && c.toId !== selectedId));
    } else if (selectedId.startsWith('group-')) {
      setGroups(groups.filter(g => g.id !== selectedId));
      setNodes(nodes.map(n => n.groupId === selectedId ? { ...n, groupId: undefined } : n));
    }
    setSelectedId(null);
  };

  const saveCurrentView = () => {
    const stage = stageRef.current;
    if (!stage) return;
    
    setViewName(`View ${viewPoints.length + 1}`);
    setIsSavingView(true);
  };

  const confirmSaveView = () => {
    const stage = stageRef.current;
    if (!stage || !viewName.trim()) return;

    const newViewPoint: ViewPoint = {
      id: `view-${Date.now()}`,
      name: viewName.trim(),
      x: stage.x(),
      y: stage.y(),
      scale: stage.scaleX(),
    };

    setViewPoints([...viewPoints, newViewPoint]);
    setIsSavingView(false);
    setViewName('');
    triggerToast('Viewpoint saved!');
  };

  const goToView = (vp: ViewPoint) => {
    const stage = stageRef.current;
    if (!stage) return;

    stage.to({
      x: vp.x,
      y: vp.y,
      scaleX: vp.scale,
      scaleY: vp.scale,
      duration: 0.5,
      easing: Konva.Easings.EaseInOut,
      onFinish: () => {
        setStagePos({ x: vp.x, y: vp.y });
        setStageScale(vp.scale);
      }
    });
    
    setShowViewPoints(false);
  };

  const deleteViewPoint = (id: string) => {
    setViewPoints(viewPoints.filter(vp => vp.id !== id));
    triggerToast('Viewpoint removed.');
  };

  const addAutoPayment = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    const otherNodes = nodes.filter(n => n.id !== nodeId);
    const targetId = otherNodes.length > 0 ? otherNodes[0].id : nodeId;

    const newAP: AutoPayment = {
      id: `ap-${Date.now()}`,
      conditionNodeId: nodeId,
      conditionType: 'greaterThan',
      conditionValue: 100,
      paymentAmount: 10,
      targetNodeId: targetId,
    };
    
    setNodes(nodes.map(n => n.id === nodeId ? {
      ...n,
      autoPayments: [...(n.autoPayments || []), newAP]
    } : n));
  };

  const removeAutoPayment = (nodeId: string, apId: string) => {
    setNodes(nodes.map(n => n.id === nodeId ? {
      ...n,
      autoPayments: n.autoPayments?.filter(ap => ap.id !== apId)
    } : n));
  };

  const updateAutoPayment = (nodeId: string, apId: string, updates: Partial<AutoPayment>) => {
    setNodes(nodes.map(n => n.id === nodeId ? {
      ...n,
      autoPayments: n.autoPayments?.map(ap => ap.id === apId ? { ...ap, ...updates } : ap)
    } : n));
  };

  const handleDragMove = (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
    let { x, y } = e.target.position();
    const snapThreshold = 5;
    const newGuides: { x?: number, y?: number }[] = [];

    if (id.startsWith('node-')) {
      // Find other nodes for snapping
      const otherNodes = nodes.filter(n => n.id !== id && !selectedNodeIds.includes(n.id));
      
      let snappedX = false;
      let snappedY = false;

      for (const other of otherNodes) {
        // Horizontal snapping (match X)
        if (!snappedX && Math.abs(x - other.x) < snapThreshold) {
          x = other.x;
          newGuides.push({ x: other.x });
          snappedX = true;
        }
        // Vertical snapping (match Y)
        if (!snappedY && Math.abs(y - other.y) < snapThreshold) {
          y = other.y;
          newGuides.push({ y: other.y });
          snappedY = true;
        }
      }
      
      // Update position on the visual element if snapped
      if (snappedX || snappedY) {
        e.target.position({ x, y });
      }
      
      setAlignmentGuides(newGuides);
    }

    if (id.startsWith('group-')) {
      const group = groups.find(g => g.id === id);
      if (!group) return;

      const dx = x - group.x;
      const dy = y - group.y;

      // Move children nodes
      setNodes(prevNodes => prevNodes.map(n => 
        n.groupId === id ? { ...n, x: n.x + dx, y: n.y + dy } : n
      ));
      
      // Update group position
      setGroups(prevGroups => prevGroups.map(g => 
        g.id === id ? { ...g, x, y } : g
      ));
    } else if (id.startsWith('node-')) {
      // If node is part of a selection, move all selected nodes
      if (selectedNodeIds.includes(id)) {
        const node = nodes.find(n => n.id === id);
        if (!node) return;

        const dx = x - node.x;
        const dy = y - node.y;

        setNodes(prevNodes => prevNodes.map(n => 
          selectedNodeIds.includes(n.id) ? { ...n, x: n.x + dx, y: n.y + dy } : n
        ));
      } else {
        // Just move this node
        setNodes(prevNodes => prevNodes.map(n => n.id === id ? { ...n, x, y } : n));
      }

      // Check for group proximity
      const groupUnder = groups.find(g => {
        return x >= g.x && x <= g.x + g.width && 
               y >= g.y && y <= g.y + g.height;
      });
      setDragTargetGroupId(groupUnder ? groupUnder.id : null);
    }
  };

  const handleDragEnd = (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
    const { x, y } = e.target.position();
    setDragTargetGroupId(null);
    setAlignmentGuides([]);
    
    if (id.startsWith('node-')) {
      if (!selectedNodeIds.includes(id)) {
        setNodes(prevNodes => prevNodes.map(n => n.id === id ? { ...n, x, y } : n));
      }
      
      // Check if dropped into a group
      const groupUnder = groups.find(g => {
        return x >= g.x && x <= g.x + g.width && 
               y >= g.y && y <= g.y + g.height;
      });

      if (groupUnder) {
        if (selectedNodeIds.includes(id)) {
          setNodes(prevNodes => prevNodes.map(n => 
            selectedNodeIds.includes(n.id) ? { ...n, groupId: groupUnder.id } : n
          ));
        } else {
          setNodes(prevNodes => prevNodes.map(n => n.id === id ? { ...n, groupId: groupUnder.id } : n));
        }
        triggerToast(`Added to ${groupUnder.title}`);
      } else {
        if (selectedNodeIds.includes(id)) {
          setNodes(prevNodes => prevNodes.map(n => 
            selectedNodeIds.includes(n.id) ? { ...n, groupId: undefined } : n
          ));
        } else {
          setNodes(prevNodes => prevNodes.map(n => n.id === id ? { ...n, groupId: undefined } : n));
        }
      }
    } else if (id.startsWith('group-')) {
      setGroups(prevGroups => prevGroups.map(g => g.id === id ? { ...g, x, y } : g));
    }
  };

  const handleNodeClick = (id: string) => {
    if (oneTimeSourceId) {
      if (oneTimeSourceId !== id) {
        setIsEditingOneTime({ fromId: oneTimeSourceId, toId: id });
      }
      setOneTimeSourceId(null);
    } else if (connectingFrom) {
      if (connectingFrom !== id) {
        const exists = connections.find(c => 
          (c.fromId === connectingFrom && c.toId === id)
        );
        if (!exists) {
          setConnections([...connections, { 
            id: `conn-${Date.now()}`, 
            fromId: connectingFrom, 
            toId: id,
            amount: 10 // Default amount
          }]);
        }
      }
      setConnectingFrom(null);
    } else {
      setSelectedId(id);
    }
  };

  const nextTurn = () => {
    setNodes(prevNodes => {
      const newNodes = [...prevNodes];
      
      // 1. Process regular connections
      connections.forEach(conn => {
        const fromIdx = newNodes.findIndex(n => n.id === conn.fromId);
        const toIdx = newNodes.findIndex(n => n.id === conn.toId);
        
        if (fromIdx !== -1 && toIdx !== -1) {
          newNodes[fromIdx] = { 
            ...newNodes[fromIdx], 
            balance: newNodes[fromIdx].balance - conn.amount 
          };
          newNodes[toIdx] = { 
            ...newNodes[toIdx], 
            balance: newNodes[toIdx].balance + conn.amount 
          };
        }
      });

      // 2. Process auto-payments
      // We iterate through a snapshot of the nodes to avoid side effects during calculation
      const snapshot = [...newNodes];
      snapshot.forEach(sourceNode => {
        if (sourceNode.autoPayments) {
          sourceNode.autoPayments.forEach(ap => {
            const conditionNode = snapshot.find(n => n.id === ap.conditionNodeId);
            const targetNode = snapshot.find(n => n.id === ap.targetNodeId);
            
            if (conditionNode && targetNode) {
              let conditionMet = false;
              if (ap.conditionType === 'greaterThan') {
                conditionMet = conditionNode.balance > ap.conditionValue;
              } else if (ap.conditionType === 'lessThan') {
                conditionMet = conditionNode.balance < ap.conditionValue;
              }

              if (conditionMet) {
                const sIdx = newNodes.findIndex(n => n.id === sourceNode.id);
                const tIdx = newNodes.findIndex(n => n.id === targetNode.id);
                if (sIdx !== -1 && tIdx !== -1) {
                  newNodes[sIdx] = { ...newNodes[sIdx], balance: newNodes[sIdx].balance - ap.paymentAmount };
                  newNodes[tIdx] = { ...newNodes[tIdx], balance: newNodes[tIdx].balance + ap.paymentAmount };
                }
              }
            }
          });
        }
      });

      return newNodes;
    });
    triggerToast('Next turn processed!');
  };

  const createGroup = () => {
    if (!selectedId || !selectedId.startsWith('node-')) return;
    
    const node = nodes.find(n => n.id === selectedId);
    if (!node) return;

    const newGroup: GroupData = {
      id: `group-${Date.now()}`,
      x: node.x,
      y: node.y,
      width: 200,
      height: 120,
      title: 'New Group',
      color: node.color,
      balance: 0,
      autoPayments: [],
    };

    setGroups([...groups, newGroup]);
    setNodes(nodes.map(n => n.id === selectedId ? { ...n, groupId: newGroup.id } : n));
    setSelectedId(newGroup.id);
  };

  const handleDoubleClick = (id: string, target?: NodeData | ConnectionData) => {
    setIsEditing(id);
    if (id.startsWith('node-')) {
      const node = target as NodeData;
      setEditText(node.text);
      setEditBalance(node.balance);
    } else if (id.startsWith('conn-')) {
      const conn = target as ConnectionData;
      setEditAmount(conn.amount);
      setEditInfo(conn.info || '');
    } else {
      const group = groups.find(g => g.id === id);
      setEditText(group?.title || '');
      setEditBalance(group?.balance || 0);
    }
  };

  const saveEdit = () => {
    if (!isEditing) return;
    if (isEditing.startsWith('node-')) {
      setNodes(nodes.map(n => n.id === isEditing ? { 
        ...n, 
        text: editText, 
        balance: editBalance
      } : n));
    } else if (isEditing.startsWith('conn-')) {
      setConnections(connections.map(c => c.id === isEditing ? { ...c, amount: editAmount, info: editInfo } : c));
    } else if (isEditing.startsWith('group-')) {
      setGroups(groups.map(g => g.id === isEditing ? { 
        ...g, 
        title: editText,
        balance: editBalance
      } : g));
    }
    setIsEditing(null);
  };

  return (
    <div ref={containerRef} className="relative w-full h-screen bg-neutral-900 overflow-hidden">
      {/* Toolbar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 p-1 bg-neutral-800/90 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl">
        <button 
          onClick={nextTurn}
          className="p-2 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors"
          title="Next Turn"
        >
          <Play size={18} />
        </button>

        <div className="w-px h-4 bg-white/10 mx-0.5" />
        <button 
          onClick={addNode}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
          title="Add Block"
        >
          <Plus size={18} />
        </button>

        <button 
          onClick={() => {
            setIsSelectMode(!isSelectMode);
            setSelectedNodeIds([]);
          }}
          className={`p-2 rounded-lg transition-colors ${isSelectMode ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-white/10 text-white/70'}`}
          title={isSelectMode ? "Switch to Pan Mode" : "Switch to Select Mode"}
        >
          {isSelectMode ? <BoxSelect size={18} /> : <MousePointer2 size={18} />}
        </button>
        
        <div className="w-px h-4 bg-white/10 mx-0.5" />
        
        <button 
          onClick={() => selectedId && setConnectingFrom(selectedId)}
          disabled={!selectedId || !selectedId.startsWith('node-')}
          className={`p-2 rounded-lg transition-colors ${
            connectingFrom ? 'bg-blue-500 text-white' : 'hover:bg-white/10 text-white/70 disabled:opacity-30'
          }`}
          title="Connect Blocks"
        >
          <Link2 size={18} />
        </button>

        <button 
          onClick={createGroup}
          disabled={!selectedId || !selectedId.startsWith('node-')}
          className="p-2 hover:bg-white/10 text-white/70 disabled:opacity-30 rounded-lg transition-colors"
          title="Create Group"
        >
          <Box size={18} />
        </button>

        <button 
          onClick={deleteSelected}
          disabled={!selectedId}
          className="p-2 hover:bg-red-500/20 text-red-400 disabled:opacity-30 rounded-lg transition-colors"
          title="Delete"
        >
          <Trash2 size={18} />
        </button>

        <div className="w-px h-4 bg-white/10 mx-0.5" />

        <button 
          onClick={saveToLocal}
          className="p-2 hover:bg-white/10 text-white/70 rounded-lg transition-colors"
          title="Save to Browser"
        >
          <Save size={18} />
        </button>

        <button 
          onClick={loadFromLocal}
          className="p-2 hover:bg-white/10 text-white/70 rounded-lg transition-colors"
          title="Load from Browser"
        >
          <FolderOpen size={18} />
        </button>

        <button 
          onClick={clearCanvas}
          className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
          title="Clear Canvas"
        >
          <RotateCcw size={18} />
        </button>

        <div className="w-px h-4 bg-white/10 mx-0.5" />

        <button 
          onClick={resetView}
          className="p-2 hover:bg-white/10 text-white/70 rounded-lg transition-colors"
          title="Reset View"
        >
          <Maximize size={18} />
        </button>

        <div className="w-px h-4 bg-white/10 mx-0.5" />

        <button 
          onClick={exportToJson}
          className="p-2 hover:bg-white/10 text-white/70 rounded-lg transition-colors"
          title="Export to JSON"
        >
          <Download size={18} />
        </button>

        <label className="p-2 hover:bg-white/10 text-white/70 rounded-lg transition-colors cursor-pointer" title="Import from JSON">
          <Upload size={18} />
          <input 
            type="file" 
            accept=".json" 
            onChange={importFromJson} 
            className="hidden" 
          />
        </label>

        <div className="w-px h-4 bg-white/10 mx-0.5" />

        <div className="flex gap-1 px-1 items-center">
          {COLORS.map(color => (
            <button
              key={color}
              onClick={() => {
                if (!selectedId) return;
                if (selectedId.startsWith('node-')) {
                  setNodes(nodes.map(n => n.id === selectedId ? { ...n, color } : n));
                } else if (selectedId.startsWith('group-')) {
                  setGroups(groups.map(g => g.id === selectedId ? { ...g, color } : g));
                }
              }}
              className="w-4 h-4 rounded-full border border-white/20 hover:scale-110 transition-transform"
              style={{ backgroundColor: color }}
            />
          ))}
          
          <div className="w-px h-4 bg-white/10 mx-1" />
          
          <label className="relative flex items-center justify-center w-6 h-6 rounded-lg hover:bg-white/10 transition-colors cursor-pointer group" title="Custom Color">
            <Palette size={14} className="text-white/70 group-hover:text-white" />
            <input 
              type="color"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={(e) => {
                const color = e.target.value;
                if (!selectedId) return;
                if (selectedId.startsWith('node-')) {
                  setNodes(nodes.map(n => n.id === selectedId ? { ...n, color } : n));
                } else if (selectedId.startsWith('group-')) {
                  setGroups(groups.map(g => g.id === selectedId ? { ...g, color } : g));
                }
              }}
            />
          </label>
        </div>

        <div className="w-px h-4 bg-white/10 mx-0.5" />

        <button 
          onClick={saveCurrentView}
          className="p-2 hover:bg-white/10 text-white/70 rounded-lg transition-colors"
          title="Save Current Viewpoint"
        >
          <MapPin size={18} />
        </button>

        <button 
          onClick={() => setShowViewPoints(!showViewPoints)}
          className={`p-2 rounded-lg transition-colors ${showViewPoints ? 'bg-amber-500/20 text-amber-400' : 'hover:bg-white/10 text-white/70'}`}
          title="Viewpoints List"
        >
          <Bookmark size={18} />
        </button>
      </div>

      {/* Viewpoints Panel */}
      <AnimatePresence>
        {showViewPoints && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute top-20 right-4 z-20 w-64 bg-neutral-800/90 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
              <h3 className="text-white font-bold text-sm uppercase tracking-wider">Viewpoints</h3>
              <button onClick={() => setShowViewPoints(false)} className="text-white/50 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto p-2 space-y-1">
              {viewPoints.length === 0 ? (
                <div className="p-4 text-center text-white/30 text-xs italic">No viewpoints saved yet.</div>
              ) : (
                viewPoints.map(vp => (
                  <div 
                    key={vp.id}
                    className="group flex items-center justify-between p-2 hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
                    onClick={() => goToView(vp)}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <MapPin size={14} className="text-amber-400 shrink-0" />
                      <span className="text-white/80 text-sm truncate">{vp.name}</span>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteViewPoint(vp.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 text-red-400 rounded-md transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auto Payment Settings Modal */}
      <AnimatePresence>
        {isEditingAutoPayments && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <div className="bg-neutral-800 p-6 rounded-2xl border border-white/10 w-[450px] shadow-2xl max-h-[80vh] flex flex-col">
              <div className="flex justify-between items-center mb-4 shrink-0">
                <div className="flex items-center gap-2">
                  <Settings size={20} className="text-amber-400" />
                  <h3 className="text-white font-medium">Auto Payment Rules</h3>
                </div>
                <button onClick={() => setIsEditingAutoPayments(null)} className="text-white/50 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-2 space-y-4 mb-6">
                {(() => {
                  const node = nodes.find(n => n.id === isEditingAutoPayments);
                  if (!node) return null;
                  
                  return (
                    <>
                      <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                        <p className="text-xs text-white/40 uppercase font-bold mb-1">Source Block</p>
                        <p className="text-white font-medium">{node.text} <span className="text-white/30 text-[10px] ml-1">(${node.balance})</span></p>
                      </div>

                      <div className="space-y-3">
                        {(node.autoPayments || []).map((ap, idx) => (
                          <div key={ap.id} className="p-4 bg-neutral-900/50 rounded-xl border border-white/5 space-y-3 relative group">
                            <button 
                              onClick={() => removeAutoPayment(node.id, ap.id)}
                              className="absolute top-2 right-2 p-1.5 text-white/20 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                            >
                              <Trash2 size={14} />
                            </button>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-[10px] text-white/30 uppercase font-bold mb-1 block">Condition Block</label>
                                <select 
                                  value={ap.conditionNodeId}
                                  onChange={(e) => updateAutoPayment(node.id, ap.id, { conditionNodeId: e.target.value })}
                                  className="w-full bg-neutral-800 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none"
                                >
                                  {nodes.map(n => (
                                    <option key={n.id} value={n.id}>{n.text} {n.id === node.id ? '(Self)' : ''}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="text-[10px] text-white/30 uppercase font-bold mb-1 block">Condition</label>
                                <div className="flex gap-1">
                                  <select 
                                    value={ap.conditionType}
                                    onChange={(e) => updateAutoPayment(node.id, ap.id, { conditionType: e.target.value as any })}
                                    className="bg-neutral-800 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none"
                                  >
                                    <option value="greaterThan">&gt;</option>
                                    <option value="lessThan">&lt;</option>
                                  </select>
                                  <input 
                                    type="number"
                                    value={ap.conditionValue}
                                    onChange={(e) => updateAutoPayment(node.id, ap.id, { conditionValue: Number(e.target.value) })}
                                    className="w-24 bg-neutral-800 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-[10px] text-white/30 uppercase font-bold mb-1 block">Pay To</label>
                                <select 
                                  value={ap.targetNodeId}
                                  onChange={(e) => updateAutoPayment(node.id, ap.id, { targetNodeId: e.target.value })}
                                  className="w-full bg-neutral-800 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none"
                                >
                                  {nodes.map(n => (
                                    <option key={n.id} value={n.id}>{n.text}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="text-[10px] text-white/30 uppercase font-bold mb-1 block">Amount</label>
                                <input 
                                  type="number"
                                  value={ap.paymentAmount}
                                  onChange={(e) => updateAutoPayment(node.id, ap.id, { paymentAmount: Number(e.target.value) })}
                                  className="w-24 bg-neutral-800 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <button 
                        onClick={() => addAutoPayment(node.id)}
                        className="w-full py-3 border border-dashed border-white/10 rounded-xl text-white/40 hover:text-white hover:bg-white/5 hover:border-white/20 transition-all flex items-center justify-center gap-2 text-sm"
                      >
                        <Plus size={16} />
                        <span>Add New Rule</span>
                      </button>
                    </>
                  );
                })()}
              </div>

              <div className="shrink-0">
                <button 
                  onClick={() => setIsEditingAutoPayments(null)}
                  className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition-colors border border-white/10"
                >
                  Done
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save Viewpoint Modal */}
      <AnimatePresence>
        {isSavingView && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <div className="bg-neutral-800 p-6 rounded-2xl border border-white/10 w-80 shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-medium">Save Viewpoint</h3>
                <button onClick={() => setIsSavingView(false)} className="text-white/50 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-white/50 uppercase mb-1">View Name</label>
                  <input 
                    type="text"
                    value={viewName}
                    onChange={(e) => setViewName(e.target.value)}
                    className="w-full bg-neutral-900 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-amber-500 transition-colors"
                    placeholder="e.g. Main Hub"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && confirmSaveView()}
                  />
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setIsSavingView(false)}
                    className="flex-1 px-4 py-2 rounded-xl border border-white/10 text-white/70 hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={confirmSaveView}
                    className="flex-1 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Clear Modal */}
      <AnimatePresence>
        {isConfirmingClear && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <div className="bg-neutral-800 p-6 rounded-2xl border border-white/10 w-80 shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-medium">Clear Canvas</h3>
                <button onClick={() => setIsConfirmingClear(false)} className="text-white/50 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <p className="text-white/70 text-sm mb-6">Are you sure you want to clear everything? This action cannot be undone.</p>
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsConfirmingClear(false)}
                  className="flex-1 px-4 py-2 rounded-xl border border-white/10 text-white/70 hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmClear}
                  className="flex-1 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editing Overlay */}
      <AnimatePresence>
        {isEditing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <div className="bg-neutral-800 p-6 rounded-2xl border border-white/10 w-80 shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-medium">Edit Label</h3>
                <button onClick={() => setIsEditing(null)} className="text-white/50 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                {!isEditing.startsWith('conn-') && (
                  <div>
                    <label className="text-white/50 text-[10px] uppercase font-bold mb-1 block">Label</label>
                    <input 
                      autoFocus
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full bg-neutral-900 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
                
                {(isEditing.startsWith('node-') || isEditing.startsWith('group-')) && (
                  <div>
                    <label className="text-white/50 text-[10px] uppercase font-bold mb-1 block">Balance</label>
                    <input 
                      type="number"
                      value={editBalance}
                      onChange={(e) => setEditBalance(Number(e.target.value))}
                      className="w-full bg-neutral-900 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                {isEditing.startsWith('conn-') && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-white/50 text-[10px] uppercase font-bold mb-1 block">Payment Amount</label>
                      <input 
                        autoFocus
                        type="number"
                        value={editAmount}
                        onChange={(e) => setEditAmount(Number(e.target.value))}
                        className="w-full bg-neutral-900 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-white/50 text-[10px] uppercase font-bold mb-1 block">Supplementary Info</label>
                      <input 
                        type="text"
                        value={editInfo}
                        onChange={(e) => setEditInfo(e.target.value)}
                        placeholder="Add notes..."
                        className="w-full bg-neutral-900 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>
              <button 
                onClick={saveEdit}
                className="w-full mt-4 bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 rounded-xl transition-colors"
              >
                Save Changes
              </button>
            </div>
          </motion.div>
        )}

        {isEditingOneTime && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <div className="bg-neutral-800 p-6 rounded-2xl border border-white/10 w-80 shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-medium">One-time Payment</h3>
                <button onClick={() => setIsEditingOneTime(null)} className="text-white/50 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-white/50 text-[10px] uppercase font-bold mb-1 block">Amount</label>
                  <input 
                    autoFocus
                    type="number"
                    value={oneTimeAmount}
                    onChange={(e) => setOneTimeAmount(Number(e.target.value))}
                    className="w-full bg-neutral-900 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <button 
                  onClick={() => executeOneTimePayment(isEditingOneTime.fromId, isEditingOneTime.toId, oneTimeAmount)}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-emerald-900/20"
                >
                  Confirm Payment
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Canvas */}
      <Stage 
        width={stageSize.width} 
        height={stageSize.height}
        ref={stageRef}
        scaleX={stageScale}
        scaleY={stageScale}
        x={stagePos.x}
        y={stagePos.y}
        draggable={!isSelectMode}
        onWheel={handleWheel}
        onDragEnd={(e) => {
          if (e.target === e.target.getStage()) {
            setStagePos({ x: e.target.x(), y: e.target.y() });
          }
        }}
        onMouseDown={(e) => {
          if (isSelectMode && e.target === e.target.getStage()) {
            const stage = e.target.getStage();
            if (!stage) return;
            const pointer = stage.getPointerPosition();
            if (!pointer) return;
            
            // Convert pointer to stage coordinates
            const x = (pointer.x - stage.x()) / stage.scaleX();
            const y = (pointer.y - stage.y()) / stage.scaleY();
            
            setSelectionRect({ x1: x, y1: y, x2: x, y2: y, visible: true });
            setSelectedNodeIds([]);
          }
        }}
        onMouseMove={(e) => {
          if (isSelectMode && selectionRect.visible) {
            const stage = e.target.getStage();
            if (!stage) return;
            const pointer = stage.getPointerPosition();
            if (!pointer) return;
            
            const x = (pointer.x - stage.x()) / stage.scaleX();
            const y = (pointer.y - stage.y()) / stage.scaleY();
            
            setSelectionRect(prev => ({ ...prev, x2: x, y2: y }));
          }
        }}
        onMouseUp={(e) => {
          if (isSelectMode && selectionRect.visible) {
            const { x1, y1, x2, y2 } = selectionRect;
            const left = Math.min(x1, x2);
            const top = Math.min(y1, y2);
            const right = Math.max(x1, x2);
            const bottom = Math.max(y1, y2);
            
            const selected = nodes.filter(node => 
              node.x >= left && node.x <= right && node.y >= top && node.y <= bottom
            ).map(n => n.id);
            
            setSelectedNodeIds(selected);
            setSelectionRect(prev => ({ ...prev, visible: false }));
            
            if (selected.length > 0) {
              triggerToast(`Selected ${selected.length} blocks`);
            }
          }
        }}
        onClick={(e) => {
          if (e.target === e.target.getStage()) {
            setSelectedId(null);
            setSelectedNodeIds([]);
            setConnectingFrom(null);
            setOneTimeSourceId(null);
            setContextMenu(null);
          }
        }}
        onContextMenu={(e) => e.evt.preventDefault()}
      >
        <Layer>
          {/* Selection Box */}
          {selectionRect.visible && (
            <Rect
              x={Math.min(selectionRect.x1, selectionRect.x2)}
              y={Math.min(selectionRect.y1, selectionRect.y2)}
              width={Math.abs(selectionRect.x2 - selectionRect.x1)}
              height={Math.abs(selectionRect.y2 - selectionRect.y1)}
              fill="rgba(59, 130, 246, 0.1)"
              stroke="#3b82f6"
              strokeWidth={1}
              dash={[5, 5]}
            />
          )}
          {/* Connections & Amounts */}
          {connections.map((conn) => {
            const from = nodes.find(n => n.id === conn.fromId);
            const to = nodes.find(n => n.id === conn.toId);
            if (!from || !to) return null;

            // Find all connections between these two nodes (any direction)
            const pairConns = connections.filter(c => 
              (c.fromId === conn.fromId && c.toId === conn.toId) ||
              (c.fromId === conn.toId && c.toId === conn.fromId)
            );
            
            // Sort IDs to get a consistent reference for the pair
            const [id1, id2] = [conn.fromId, conn.toId].sort();
            const refFrom = nodes.find(n => n.id === id1)!;
            const refTo = nodes.find(n => n.id === id2)!;

            const connIndex = pairConns.findIndex(c => c.id === conn.id);
            const totalInPair = pairConns.length;
            
            // Calculate base vector from the consistent reference
            const rdx = refTo.x - refFrom.x;
            const rdy = refTo.y - refFrom.y;
            const rlen = Math.sqrt(rdx * rdx + rdy * rdy) || 1;
            
            // Normal vector for offset (consistent for the pair)
            const rnx = -rdy / rlen;
            const rny = rdx / rlen;
            
            // Offset based on index in pair
            const step = 50; // Increased step
            const offset = (connIndex - (totalInPair - 1) / 2) * step;
            
            // Midpoint for the curve
            const midX = (from.x + to.x) / 2 + rnx * offset;
            const midY = (from.y + to.y) / 2 + rny * offset;

            return (
              <React.Fragment key={conn.id}>
                {/* Curved Arrow */}
                <Arrow
                  points={[from.x, from.y, midX, midY, to.x, to.y]}
                  stroke="#4b5563"
                  fill="#4b5563"
                  strokeWidth={2}
                  opacity={0.6}
                  tension={0.5}
                  pointerLength={10}
                  pointerWidth={10}
                  onContextMenu={(e) => handleContextMenu(e, 'connection', conn.id)}
                  onDblClick={() => handleDoubleClick(conn.id, conn)}
                />
                
                {/* Amount Label at Midpoint */}
                <Group 
                  x={midX} 
                  y={midY}
                  onContextMenu={(e) => handleContextMenu(e, 'connection', conn.id)}
                  onDblClick={() => handleDoubleClick(conn.id, conn)}
                >
                  <Rect
                    width={40}
                    height={20}
                    offsetX={20}
                    offsetY={10}
                    fill="#1f2937"
                    cornerRadius={4}
                    shadowBlur={5}
                    shadowOpacity={0.2}
                  />
                  <Text
                    text={`$${conn.amount}`}
                    width={40}
                    offsetX={20}
                    offsetY={5}
                    align="center"
                    fill="#10b981"
                    fontSize={10}
                    fontStyle="bold"
                    shadowColor="#000"
                    shadowBlur={1}
                    shadowOffset={{ x: 0.5, y: 0.5 }}
                    shadowOpacity={1}
                  />
                  {conn.info && (
                    <Text
                      text={conn.info}
                      width={120}
                      offsetX={60}
                      y={12}
                      align="center"
                      fill="#94a3b8"
                      fontSize={8}
                      fontStyle="italic"
                      shadowColor="#000"
                      shadowBlur={1}
                      shadowOffset={{ x: 0.5, y: 0.5 }}
                      shadowOpacity={1}
                    />
                  )}
                </Group>
              </React.Fragment>
            );
          })}

          {/* Groups */}
          {groups.map(group => {
            const isSelected = selectedId === group.id;
            const isHovered = hoveredId === group.id;
            const isDragTarget = dragTargetGroupId === group.id;
            
            return (
              <React.Fragment key={group.id}>
                <Group
                  x={group.x}
                  y={group.y}
                  draggable
                  onDragMove={(e) => {
                    const newPos = e.target.position();
                    const dx = newPos.x - group.x;
                    const dy = newPos.y - group.y;
                    
                    // Move the group
                    setGroups(prev => prev.map(g => g.id === group.id ? { ...g, x: newPos.x, y: newPos.y } : g));
                    
                    // Move nodes that belong to this group
                    setNodes(prev => prev.map(node => {
                      if (node.groupId === group.id) {
                        return { ...node, x: node.x + dx, y: node.y + dy };
                      }
                      return node;
                    }));
                  }}
                  onMouseEnter={(e) => {
                    setHoveredId(group.id);
                    const stage = e.target.getStage();
                    if (stage) stage.container().style.cursor = 'pointer';
                  }}
                  onMouseLeave={(e) => {
                    setHoveredId(null);
                    const stage = e.target.getStage();
                    if (stage) stage.container().style.cursor = 'default';
                  }}
                  onClick={(e) => {
                    if (oneTimeSourceId) {
                      if (oneTimeSourceId !== group.id) {
                        setIsEditingOneTime({ fromId: oneTimeSourceId, toId: group.id });
                      }
                      setOneTimeSourceId(null);
                    } else {
                      setSelectedId(group.id);
                    }
                  }}
                  onDblClick={() => handleDoubleClick(group.id)}
                  onContextMenu={(e) => handleContextMenu(e, 'node', group.id)}
                >
                  {/* Opaque background to hide connections */}
                  <Rect
                    width={group.width}
                    height={group.height}
                    fill="#171717"
                    cornerRadius={12}
                  />
                  <Rect
                    id={group.id}
                    x={0}
                    y={0}
                    width={group.width}
                    height={group.height}
                    fill={group.color}
                    opacity={isHovered || isDragTarget ? 0.25 : 0.15}
                    stroke={isSelected || isDragTarget ? '#fff' : group.color}
                    strokeWidth={isDragTarget ? 3 : 2}
                    cornerRadius={12}
                    dash={isDragTarget ? undefined : [5, 5]}
                    shadowBlur={isHovered || isDragTarget ? 15 : 0}
                    shadowColor={group.color}
                    shadowOpacity={0.4}
                    onTransform={(e) => {
                      const node = e.target;
                      const scaleX = node.scaleX();
                      const scaleY = node.scaleY();
                      const rectX = node.x();
                      const rectY = node.y();

                      // Reset Rect local transformations and apply to state
                      node.scaleX(1);
                      node.scaleY(1);
                      node.x(0);
                      node.y(0);

                      setGroups(prev => prev.map(g => g.id === group.id ? {
                        ...g,
                        x: g.x + rectX,
                        y: g.y + rectY,
                        width: Math.max(50, g.width * scaleX),
                        height: Math.max(50, g.height * scaleY),
                      } : g));
                    }}
                  />
                  <Text
                    text={group.title}
                    x={0}
                    y={10}
                    width={group.width}
                    align="center"
                    fill="#fff"
                    fontSize={14}
                    fontStyle="bold"
                    opacity={0.6}
                    shadowColor="#000"
                    shadowBlur={1}
                    shadowOffset={{ x: 0.5, y: 0.5 }}
                    shadowOpacity={1}
                  />
                  <Text
                    text={`Balance: $${group.balance || 0}`}
                    x={0}
                    y={30}
                    width={group.width}
                    align="center"
                    fill="#fff"
                    fontSize={12}
                    opacity={0.5}
                    shadowColor="#000"
                    shadowBlur={1}
                    shadowOffset={{ x: 0.5, y: 0.5 }}
                    shadowOpacity={1}
                  />
                </Group>
                {isSelected && (
                  <Transformer
                    anchorSize={8}
                    anchorCornerRadius={2}
                    anchorStroke="#3b82f6"
                    anchorFill="#fff"
                    borderStroke="#3b82f6"
                    rotateEnabled={false}
                    boundBoxFunc={(oldBox, newBox) => {
                      if (newBox.width < 50 || newBox.height < 50) {
                        return oldBox;
                      }
                      return newBox;
                    }}
                    ref={(node) => {
                      if (node && isSelected) {
                        const stage = stageRef.current;
                        if (stage) {
                          const target = stage.findOne(`#${group.id}`);
                          if (target) {
                            node.nodes([target]);
                          }
                        }
                      }
                    }}
                  />
                )}
              </React.Fragment>
            );
          })}

          {/* Nodes */}
          {nodes.map(node => {
            const isSelected = selectedId === node.id || selectedNodeIds.includes(node.id);
            const isConnecting = connectingFrom === node.id;
            const isHovered = hoveredId === node.id;
            
            return (
              <Group
                key={node.id}
                x={node.x}
                y={node.y}
                draggable
                onDragMove={(e) => handleDragMove(node.id, e)}
                onDragEnd={(e) => handleDragEnd(node.id, e)}
                onClick={(e) => {
                  if (isSelectMode) {
                    if (selectedNodeIds.includes(node.id)) {
                      setSelectedNodeIds(prev => prev.filter(id => id !== node.id));
                    } else {
                      setSelectedNodeIds(prev => [...prev, node.id]);
                    }
                  } else {
                    handleNodeClick(node.id);
                  }
                }}
                onDblClick={() => handleDoubleClick(node.id, node)}
                onContextMenu={(e) => handleContextMenu(e, 'node', node.id)}
                onMouseEnter={(e) => {
                  setHoveredId(node.id);
                  const stage = e.target.getStage();
                  if (stage) stage.container().style.cursor = 'pointer';
                }}
                onMouseLeave={(e) => {
                  setHoveredId(null);
                  const stage = e.target.getStage();
                  if (stage) stage.container().style.cursor = 'default';
                }}
                scaleX={isHovered ? 1.05 : 1}
                scaleY={isHovered ? 1.05 : 1}
              >
                <Rect
                  width={90}
                  height={45}
                  offsetX={45}
                  offsetY={22.5}
                  fill={node.color}
                  cornerRadius={8}
                  shadowBlur={isSelected || isHovered || oneTimeSourceId === node.id ? 20 : 5}
                  shadowColor={oneTimeSourceId === node.id ? '#10b981' : node.color}
                  shadowOpacity={isHovered || oneTimeSourceId === node.id ? 0.7 : 0.5}
                  stroke={isSelected ? '#fff' : isConnecting || oneTimeSourceId === node.id ? '#3b82f6' : 'transparent'}
                  strokeWidth={2}
                />
                <Text
                  text={node.text}
                  width={90}
                  offsetX={45}
                  offsetY={7}
                  align="center"
                  fill="#fff"
                  fontSize={10}
                  fontStyle="bold"
                  shadowColor="#000"
                  shadowBlur={1}
                  shadowOffset={{ x: 0.5, y: 0.5 }}
                  shadowOpacity={1}
                />
                <Text
                  text={`Bal: $${node.balance}`}
                  width={90}
                  offsetX={45}
                  offsetY={-10}
                  align="center"
                  fill="#fff"
                  fontSize={9}
                  opacity={0.9}
                  shadowColor="#000"
                  shadowBlur={1}
                  shadowOffset={{ x: 0.5, y: 0.5 }}
                  shadowOpacity={1}
                />
                {node.groupId && (
                  <Circle
                    radius={2.5}
                    x={35}
                    y={-10}
                    fill="#fff"
                    opacity={0.5}
                  />
                )}
              </Group>
            );
          })}

          {/* Alignment Guides */}
          {alignmentGuides.map((guide, i) => (
            <Line
              key={i}
              points={guide.x !== undefined 
                ? [guide.x, -10000, guide.x, 10000] 
                : [-10000, guide.y!, 10000, guide.y!]}
              stroke="#3b82f6"
              strokeWidth={1}
              dash={[5, 5]}
              opacity={0.5}
            />
          ))}
        </Layer>
      </Stage>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{ left: contextMenu.x, top: contextMenu.y }}
            className="absolute z-[100] min-w-[160px] bg-neutral-800 border border-white/10 rounded-xl shadow-2xl p-1 overflow-hidden"
          >
            {contextMenu.type === 'connection' && (
              <>
                {(() => {
                  const conn = connections.find(c => c.id === contextMenu.targetId);
                  if (!conn) return null;
                  const fromNode = nodes.find(n => n.id === conn.fromId);
                  const toNode = nodes.find(n => n.id === conn.toId);
                  if (fromNode && toNode) {
                    return (
                      <div className="px-3 py-2 flex flex-col gap-0.5 border-b border-white/5 mb-1">
                        <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-white/60">
                          <span className="truncate max-w-[60px]">{fromNode.text}</span>
                          <ArrowRight size={10} className="shrink-0 text-emerald-500/50" />
                          <span className="truncate max-w-[60px]">{toNode.text}</span>
                          <span className="ml-auto text-emerald-400">${conn.amount}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
                <button
                  onClick={() => {
                    if (contextMenu.targetId) {
                      const conn = connections.find(c => c.id === contextMenu.targetId);
                      if (conn) handleDoubleClick(conn.id, conn);
                    }
                    setContextMenu(null);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-emerald-400 hover:bg-white/5 rounded-lg transition-colors"
                >
                  <Plus size={16} />
                  <span>Add/Edit Info</span>
                </button>
                <button
                  onClick={() => contextMenu.targetId && deleteConnection(contextMenu.targetId)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-white/5 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                  <span>Cancel Connection</span>
                </button>
              </>
            )}
            {contextMenu.type === 'node' && (
              <>
                <button
                  onClick={() => {
                    setOneTimeSourceId(contextMenu.targetId);
                    setContextMenu(null);
                    triggerToast('Select target block for payment');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-emerald-400 hover:bg-white/5 rounded-lg transition-colors"
                >
                  <Coins size={16} />
                  <span>One-time Payment</span>
                </button>
                <button
                  onClick={() => {
                    setIsEditingAutoPayments(contextMenu.targetId);
                    setContextMenu(null);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-amber-400 hover:bg-white/5 rounded-lg transition-colors"
                >
                  <Settings size={16} />
                  <span>Auto Payment</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedId(contextMenu.targetId);
                    deleteSelected();
                    setContextMenu(null);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-white/5 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                  <span>Delete Block</span>
                </button>
              </>
            )}
            <div className="h-px bg-white/5 my-1" />
            <button
              onClick={() => setContextMenu(null)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/50 hover:bg-white/5 rounded-lg transition-colors"
            >
              <X size={16} />
              <span>Close</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 bg-blue-600 text-white px-6 py-3 rounded-full shadow-2xl font-medium"
          >
            {showToast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instructions */}
      <div className="absolute bottom-6 left-6 text-white/40 text-xs font-mono space-y-1">
        <p>• Drag to move blocks</p>
        <p>• Scroll to zoom, Drag canvas to pan</p>
        <p>• Double-click to edit text</p>
        <p>• Click Link icon then two blocks to connect</p>
        <p>• Drag block into a group area to merge</p>
      </div>
    </div>
  );
}
