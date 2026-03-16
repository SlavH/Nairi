/**
 * Nairi AI Workflow Builder - State Management Store
 * React Context-based store for workflow state management
 */

"use client"

import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react'
import {
  Workflow,
  WorkflowNode,
  WorkflowEdge,
  WorkflowExecution,
  WorkflowVariable,
  ExecutionStatus,
  DataStore,
  WorkflowVersion,
  NodePosition
} from './types'

// ============================================================================
// Store State Interface
// ============================================================================

interface WorkflowState {
  currentWorkflow: Workflow | null
  workflows: Workflow[]
  selectedNodes: string[]
  selectedEdges: string[]
  clipboard: { nodes: WorkflowNode[]; edges: WorkflowEdge[] } | null
  executions: WorkflowExecution[]
  currentExecution: WorkflowExecution | null
  isExecuting: boolean
  zoom: number
  panOffset: { x: number; y: number }
  isDebugMode: boolean
  showMinimap: boolean
  showGrid: boolean
  snapToGrid: boolean
  gridSize: number
  leftPanelOpen: boolean
  rightPanelOpen: boolean
  bottomPanelOpen: boolean
  activeLeftTab: 'nodes' | 'templates' | 'variables'
  activeRightTab: 'properties' | 'logs' | 'debug'
  activeBottomTab: 'executions' | 'console' | 'analytics'
  dataStores: DataStore[]
  versions: WorkflowVersion[]
  history: Workflow[]
  historyIndex: number
  isDragging: boolean
  draggedNodeType: string | null
  isConnecting: boolean
  connectionStart: { nodeId: string; portId: string } | null
}

// ============================================================================
// Initial State
// ============================================================================

const initialState: WorkflowState = {
  currentWorkflow: null,
  workflows: [],
  selectedNodes: [],
  selectedEdges: [],
  clipboard: null,
  executions: [],
  currentExecution: null,
  isExecuting: false,
  zoom: 1,
  panOffset: { x: 0, y: 0 },
  isDebugMode: false,
  showMinimap: true,
  showGrid: true,
  snapToGrid: true,
  gridSize: 20,
  leftPanelOpen: true,
  rightPanelOpen: true,
  bottomPanelOpen: false,
  activeLeftTab: 'nodes',
  activeRightTab: 'properties',
  activeBottomTab: 'executions',
  dataStores: [],
  versions: [],
  history: [],
  historyIndex: -1,
  isDragging: false,
  draggedNodeType: null,
  isConnecting: false,
  connectionStart: null,
}

// ============================================================================
// Action Types
// ============================================================================

type Action =
  | { type: 'SET_CURRENT_WORKFLOW'; payload: Workflow | null }
  | { type: 'SET_WORKFLOWS'; payload: Workflow[] }
  | { type: 'ADD_WORKFLOW'; payload: Workflow }
  | { type: 'UPDATE_WORKFLOW'; payload: { id: string; updates: Partial<Workflow> } }
  | { type: 'DELETE_WORKFLOW'; payload: string }
  | { type: 'ADD_NODE'; payload: WorkflowNode }
  | { type: 'UPDATE_NODE'; payload: { id: string; updates: Partial<WorkflowNode> } }
  | { type: 'DELETE_NODE'; payload: string }
  | { type: 'ADD_EDGE'; payload: WorkflowEdge }
  | { type: 'UPDATE_EDGE'; payload: { id: string; updates: Partial<WorkflowEdge> } }
  | { type: 'DELETE_EDGE'; payload: string }
  | { type: 'SELECT_NODE'; payload: { nodeId: string; addToSelection?: boolean } }
  | { type: 'SELECT_EDGE'; payload: { edgeId: string; addToSelection?: boolean } }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'SET_ZOOM'; payload: number }
  | { type: 'SET_PAN_OFFSET'; payload: { x: number; y: number } }
  | { type: 'TOGGLE_DEBUG_MODE' }
  | { type: 'TOGGLE_MINIMAP' }
  | { type: 'TOGGLE_GRID' }
  | { type: 'TOGGLE_SNAP_TO_GRID' }
  | { type: 'TOGGLE_LEFT_PANEL' }
  | { type: 'TOGGLE_RIGHT_PANEL' }
  | { type: 'TOGGLE_BOTTOM_PANEL' }
  | { type: 'SET_ACTIVE_LEFT_TAB'; payload: WorkflowState['activeLeftTab'] }
  | { type: 'SET_ACTIVE_RIGHT_TAB'; payload: WorkflowState['activeRightTab'] }
  | { type: 'SET_ACTIVE_BOTTOM_TAB'; payload: WorkflowState['activeBottomTab'] }
  | { type: 'START_EXECUTION'; payload: WorkflowExecution }
  | { type: 'UPDATE_EXECUTION'; payload: { id: string; updates: Partial<WorkflowExecution> } }
  | { type: 'STOP_EXECUTION'; payload: string }
  | { type: 'CLEAR_EXECUTIONS' }
  | { type: 'START_CONNECTION'; payload: { nodeId: string; portId: string } }
  | { type: 'END_CONNECTION' }
  | { type: 'CANCEL_CONNECTION' }
  | { type: 'COPY_SELECTION' }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'SAVE_TO_HISTORY' }

// ============================================================================
// Helper Functions
// ============================================================================

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

// ============================================================================
// Reducer
// ============================================================================

function workflowReducer(state: WorkflowState, action: Action): WorkflowState {
  switch (action.type) {
    case 'SET_CURRENT_WORKFLOW':
      return {
        ...state,
        currentWorkflow: action.payload,
        selectedNodes: [],
        selectedEdges: [],
        history: action.payload ? [action.payload] : [],
        historyIndex: action.payload ? 0 : -1,
      }

    case 'SET_WORKFLOWS':
      return { ...state, workflows: action.payload }

    case 'ADD_WORKFLOW':
      return {
        ...state,
        workflows: [...state.workflows, action.payload],
        currentWorkflow: action.payload,
      }

    case 'UPDATE_WORKFLOW': {
      const { id, updates } = action.payload
      return {
        ...state,
        workflows: state.workflows.map(w =>
          w.id === id ? { ...w, ...updates, updatedAt: new Date() } : w
        ),
        currentWorkflow:
          state.currentWorkflow?.id === id
            ? { ...state.currentWorkflow, ...updates, updatedAt: new Date() }
            : state.currentWorkflow,
      }
    }

    case 'DELETE_WORKFLOW':
      return {
        ...state,
        workflows: state.workflows.filter(w => w.id !== action.payload),
        currentWorkflow:
          state.currentWorkflow?.id === action.payload ? null : state.currentWorkflow,
      }

    case 'ADD_NODE':
      if (!state.currentWorkflow) return state
      return {
        ...state,
        currentWorkflow: {
          ...state.currentWorkflow,
          nodes: [...state.currentWorkflow.nodes, action.payload],
          triggers: action.payload.type.startsWith('trigger-')
            ? [...state.currentWorkflow.triggers, action.payload.id]
            : state.currentWorkflow.triggers,
          updatedAt: new Date(),
        },
      }

    case 'UPDATE_NODE':
      if (!state.currentWorkflow) return state
      return {
        ...state,
        currentWorkflow: {
          ...state.currentWorkflow,
          nodes: state.currentWorkflow.nodes.map(n =>
            n.id === action.payload.id ? { ...n, ...action.payload.updates } : n
          ),
          updatedAt: new Date(),
        },
      }

    case 'DELETE_NODE':
      if (!state.currentWorkflow) return state
      return {
        ...state,
        currentWorkflow: {
          ...state.currentWorkflow,
          nodes: state.currentWorkflow.nodes.filter(n => n.id !== action.payload),
          edges: state.currentWorkflow.edges.filter(
            e => e.source !== action.payload && e.target !== action.payload
          ),
          triggers: state.currentWorkflow.triggers.filter(t => t !== action.payload),
          updatedAt: new Date(),
        },
        selectedNodes: state.selectedNodes.filter(id => id !== action.payload),
      }

    case 'ADD_EDGE':
      if (!state.currentWorkflow) return state
      const edgeExists = state.currentWorkflow.edges.some(
        e =>
          e.source === action.payload.source &&
          e.sourcePort === action.payload.sourcePort &&
          e.target === action.payload.target &&
          e.targetPort === action.payload.targetPort
      )
      if (edgeExists) return state
      return {
        ...state,
        currentWorkflow: {
          ...state.currentWorkflow,
          edges: [...state.currentWorkflow.edges, action.payload],
          updatedAt: new Date(),
        },
      }

    case 'UPDATE_EDGE':
      if (!state.currentWorkflow) return state
      return {
        ...state,
        currentWorkflow: {
          ...state.currentWorkflow,
          edges: state.currentWorkflow.edges.map(e =>
            e.id === action.payload.id ? { ...e, ...action.payload.updates } : e
          ),
        },
      }

    case 'DELETE_EDGE':
      if (!state.currentWorkflow) return state
      return {
        ...state,
        currentWorkflow: {
          ...state.currentWorkflow,
          edges: state.currentWorkflow.edges.filter(e => e.id !== action.payload),
        },
        selectedEdges: state.selectedEdges.filter(id => id !== action.payload),
      }

    case 'SELECT_NODE':
      if (action.payload.addToSelection) {
        return {
          ...state,
          selectedNodes: state.selectedNodes.includes(action.payload.nodeId)
            ? state.selectedNodes
            : [...state.selectedNodes, action.payload.nodeId],
        }
      }
      return { ...state, selectedNodes: [action.payload.nodeId], selectedEdges: [] }

    case 'SELECT_EDGE':
      if (action.payload.addToSelection) {
        return {
          ...state,
          selectedEdges: state.selectedEdges.includes(action.payload.edgeId)
            ? state.selectedEdges
            : [...state.selectedEdges, action.payload.edgeId],
        }
      }
      return { ...state, selectedEdges: [action.payload.edgeId], selectedNodes: [] }

    case 'CLEAR_SELECTION':
      return { ...state, selectedNodes: [], selectedEdges: [] }

    case 'SET_ZOOM':
      return { ...state, zoom: Math.max(0.1, Math.min(2, action.payload)) }

    case 'SET_PAN_OFFSET':
      return { ...state, panOffset: action.payload }

    case 'TOGGLE_DEBUG_MODE':
      return { ...state, isDebugMode: !state.isDebugMode }

    case 'TOGGLE_MINIMAP':
      return { ...state, showMinimap: !state.showMinimap }

    case 'TOGGLE_GRID':
      return { ...state, showGrid: !state.showGrid }

    case 'TOGGLE_SNAP_TO_GRID':
      return { ...state, snapToGrid: !state.snapToGrid }

    case 'TOGGLE_LEFT_PANEL':
      return { ...state, leftPanelOpen: !state.leftPanelOpen }

    case 'TOGGLE_RIGHT_PANEL':
      return { ...state, rightPanelOpen: !state.rightPanelOpen }

    case 'TOGGLE_BOTTOM_PANEL':
      return { ...state, bottomPanelOpen: !state.bottomPanelOpen }

    case 'SET_ACTIVE_LEFT_TAB':
      return { ...state, activeLeftTab: action.payload }

    case 'SET_ACTIVE_RIGHT_TAB':
      return { ...state, activeRightTab: action.payload }

    case 'SET_ACTIVE_BOTTOM_TAB':
      return { ...state, activeBottomTab: action.payload }

    case 'START_EXECUTION':
      return {
        ...state,
        executions: [action.payload, ...state.executions],
        currentExecution: action.payload,
        isExecuting: true,
      }

    case 'UPDATE_EXECUTION': {
      const updatedExecutions = state.executions.map(e =>
        e.id === action.payload.id ? { ...e, ...action.payload.updates } : e
      )
      const updatedCurrent =
        state.currentExecution?.id === action.payload.id
          ? { ...state.currentExecution, ...action.payload.updates }
          : state.currentExecution
      const isStillExecuting =
        action.payload.updates.status &&
        ['completed', 'failed', 'cancelled'].includes(action.payload.updates.status as string)
          ? false
          : state.isExecuting
      return {
        ...state,
        executions: updatedExecutions,
        currentExecution: updatedCurrent,
        isExecuting: isStillExecuting,
      }
    }

    case 'STOP_EXECUTION': {
      const stoppedExecutions = state.executions.map(e =>
        e.id === action.payload
          ? { ...e, status: 'cancelled' as ExecutionStatus, endTime: new Date() }
          : e
      )
      return { ...state, executions: stoppedExecutions, isExecuting: false }
    }

    case 'CLEAR_EXECUTIONS':
      return { ...state, executions: [], currentExecution: null }

    case 'START_CONNECTION':
      return { ...state, isConnecting: true, connectionStart: action.payload }

    case 'END_CONNECTION':
    case 'CANCEL_CONNECTION':
      return { ...state, isConnecting: false, connectionStart: null }

    case 'COPY_SELECTION':
      if (!state.currentWorkflow) return state
      const nodesToCopy = state.currentWorkflow.nodes.filter(n => state.selectedNodes.includes(n.id))
      const edgesToCopy = state.currentWorkflow.edges.filter(
        e => state.selectedNodes.includes(e.source) && state.selectedNodes.includes(e.target)
      )
      return { ...state, clipboard: { nodes: nodesToCopy, edges: edgesToCopy } }

    case 'UNDO':
      if (state.historyIndex <= 0) return state
      return {
        ...state,
        historyIndex: state.historyIndex - 1,
        currentWorkflow: JSON.parse(JSON.stringify(state.history[state.historyIndex - 1])),
      }

    case 'REDO':
      if (state.historyIndex >= state.history.length - 1) return state
      return {
        ...state,
        historyIndex: state.historyIndex + 1,
        currentWorkflow: JSON.parse(JSON.stringify(state.history[state.historyIndex + 1])),
      }

    case 'SAVE_TO_HISTORY':
      if (!state.currentWorkflow) return state
      const newHistory = state.history.slice(0, state.historyIndex + 1)
      newHistory.push(JSON.parse(JSON.stringify(state.currentWorkflow)))
      return {
        ...state,
        history: newHistory.slice(-50),
        historyIndex: Math.min(newHistory.length - 1, 49),
      }

    default:
      return state
  }
}

// ============================================================================
// Context
// ============================================================================

interface WorkflowContextType extends WorkflowState {
  setCurrentWorkflow: (workflow: Workflow | null) => void
  createWorkflow: (partial: Partial<Workflow>) => Workflow
  updateWorkflow: (id: string, updates: Partial<Workflow>) => void
  deleteWorkflow: (id: string) => void
  addNode: (node: Omit<WorkflowNode, 'id'>) => WorkflowNode
  updateNode: (id: string, updates: Partial<WorkflowNode>) => void
  deleteNode: (id: string) => void
  moveNode: (id: string, position: NodePosition) => void
  addEdge: (edge: Omit<WorkflowEdge, 'id'>) => WorkflowEdge
  updateEdge: (id: string, updates: Partial<WorkflowEdge>) => void
  deleteEdge: (id: string) => void
  selectNode: (nodeId: string, addToSelection?: boolean) => void
  selectEdge: (edgeId: string, addToSelection?: boolean) => void
  clearSelection: () => void
  setZoom: (zoom: number) => void
  setPanOffset: (offset: { x: number; y: number }) => void
  toggleDebugMode: () => void
  toggleMinimap: () => void
  toggleGrid: () => void
  toggleSnapToGrid: () => void
  toggleLeftPanel: () => void
  toggleRightPanel: () => void
  toggleBottomPanel: () => void
  setActiveLeftTab: (tab: WorkflowState['activeLeftTab']) => void
  setActiveRightTab: (tab: WorkflowState['activeRightTab']) => void
  setActiveBottomTab: (tab: WorkflowState['activeBottomTab']) => void
  startExecution: (triggeredBy: WorkflowExecution['triggeredBy'], triggerData?: any) => void
  updateExecution: (id: string, updates: Partial<WorkflowExecution>) => void
  stopExecution: (id: string) => void
  clearExecutions: () => void
  startConnection: (nodeId: string, portId: string) => void
  endConnection: (nodeId: string, portId: string) => void
  cancelConnection: () => void
  copySelection: () => void
  pasteClipboard: (offset?: { x: number; y: number }) => void
  undo: () => void
  redo: () => void
  saveToHistory: () => void
}

const WorkflowContext = createContext<WorkflowContextType | null>(null)

// ============================================================================
// Provider
// ============================================================================

export function WorkflowProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(workflowReducer, initialState)

  const setCurrentWorkflow = useCallback((workflow: Workflow | null) => {
    dispatch({ type: 'SET_CURRENT_WORKFLOW', payload: workflow })
  }, [])

  const createWorkflow = useCallback((partial: Partial<Workflow>): Workflow => {
    const workflow: Workflow = {
      id: generateId(),
      name: partial.name || 'Untitled Workflow',
      description: partial.description || '',
      version: '1.0.0',
      status: 'draft',
      nodes: partial.nodes || [],
      edges: partial.edges || [],
      variables: partial.variables || [],
      settings: partial.settings || {
        timeout: 300000,
        retryCount: 3,
        retryDelay: 1000,
        concurrencyLimit: 10,
        errorHandling: 'stop',
        logging: 'normal',
        sandbox: true,
      },
      triggers: partial.triggers || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      ...partial,
    } as Workflow
    dispatch({ type: 'ADD_WORKFLOW', payload: workflow })
    return workflow
  }, [])

  const updateWorkflow = useCallback((id: string, updates: Partial<Workflow>) => {
    dispatch({ type: 'UPDATE_WORKFLOW', payload: { id, updates } })
  }, [])

  const deleteWorkflow = useCallback((id: string) => {
    dispatch({ type: 'DELETE_WORKFLOW', payload: id })
  }, [])

  const addNode = useCallback((node: Omit<WorkflowNode, 'id'>): WorkflowNode => {
    const newNode: WorkflowNode = { ...node, id: generateId() } as WorkflowNode
    dispatch({ type: 'ADD_NODE', payload: newNode })
    dispatch({ type: 'SAVE_TO_HISTORY' })
    return newNode
  }, [])

  const updateNode = useCallback((id: string, updates: Partial<WorkflowNode>) => {
    dispatch({ type: 'UPDATE_NODE', payload: { id, updates } })
  }, [])

  const deleteNode = useCallback((id: string) => {
    dispatch({ type: 'DELETE_NODE', payload: id })
    dispatch({ type: 'SAVE_TO_HISTORY' })
  }, [])

  const moveNode = useCallback((id: string, position: NodePosition) => {
    const snappedPosition = state.snapToGrid
      ? {
          x: Math.round(position.x / state.gridSize) * state.gridSize,
          y: Math.round(position.y / state.gridSize) * state.gridSize,
        }
      : position
    dispatch({ type: 'UPDATE_NODE', payload: { id, updates: { position: snappedPosition } } })
  }, [state.snapToGrid, state.gridSize])

  const addEdge = useCallback((edge: Omit<WorkflowEdge, 'id'>): WorkflowEdge => {
    const newEdge: WorkflowEdge = { ...edge, id: generateId() } as WorkflowEdge
    dispatch({ type: 'ADD_EDGE', payload: newEdge })
    dispatch({ type: 'SAVE_TO_HISTORY' })
    return newEdge
  }, [])

  const updateEdge = useCallback((id: string, updates: Partial<WorkflowEdge>) => {
    dispatch({ type: 'UPDATE_EDGE', payload: { id, updates } })
  }, [])

  const deleteEdge = useCallback((id: string) => {
    dispatch({ type: 'DELETE_EDGE', payload: id })
  }, [])

  const selectNode = useCallback((nodeId: string, addToSelection?: boolean) => {
    dispatch({ type: 'SELECT_NODE', payload: { nodeId, addToSelection } })
  }, [])

  const selectEdge = useCallback((edgeId: string, addToSelection?: boolean) => {
    dispatch({ type: 'SELECT_EDGE', payload: { edgeId, addToSelection } })
  }, [])

  const clearSelection = useCallback(() => dispatch({ type: 'CLEAR_SELECTION' }), [])
  const setZoom = useCallback((zoom: number) => dispatch({ type: 'SET_ZOOM', payload: zoom }), [])
  const setPanOffset = useCallback((offset: { x: number; y: number }) => dispatch({ type: 'SET_PAN_OFFSET', payload: offset }), [])
  const toggleDebugMode = useCallback(() => dispatch({ type: 'TOGGLE_DEBUG_MODE' }), [])
  const toggleMinimap = useCallback(() => dispatch({ type: 'TOGGLE_MINIMAP' }), [])
  const toggleGrid = useCallback(() => dispatch({ type: 'TOGGLE_GRID' }), [])
  const toggleSnapToGrid = useCallback(() => dispatch({ type: 'TOGGLE_SNAP_TO_GRID' }), [])
  const toggleLeftPanel = useCallback(() => dispatch({ type: 'TOGGLE_LEFT_PANEL' }), [])
  const toggleRightPanel = useCallback(() => dispatch({ type: 'TOGGLE_RIGHT_PANEL' }), [])
  const toggleBottomPanel = useCallback(() => dispatch({ type: 'TOGGLE_BOTTOM_PANEL' }), [])
  const setActiveLeftTab = useCallback((tab: WorkflowState['activeLeftTab']) => dispatch({ type: 'SET_ACTIVE_LEFT_TAB', payload: tab }), [])
  const setActiveRightTab = useCallback((tab: WorkflowState['activeRightTab']) => dispatch({ type: 'SET_ACTIVE_RIGHT_TAB', payload: tab }), [])
  const setActiveBottomTab = useCallback((tab: WorkflowState['activeBottomTab']) => dispatch({ type: 'SET_ACTIVE_BOTTOM_TAB', payload: tab }), [])

  const startExecution = useCallback((triggeredBy: WorkflowExecution['triggeredBy'], triggerData?: any) => {
    if (!state.currentWorkflow) return
    const execution: WorkflowExecution = {
      id: generateId(),
      workflowId: state.currentWorkflow.id,
      workflowVersion: state.currentWorkflow.version,
      status: 'running',
      triggeredBy,
      triggerData,
      startTime: new Date(),
      nodeResults: [],
      logs: [],
      variables: {},
    }
    dispatch({ type: 'START_EXECUTION', payload: execution })
  }, [state.currentWorkflow])

  const updateExecution = useCallback((id: string, updates: Partial<WorkflowExecution>) => {
    dispatch({ type: 'UPDATE_EXECUTION', payload: { id, updates } })
  }, [])

  const stopExecution = useCallback((id: string) => dispatch({ type: 'STOP_EXECUTION', payload: id }), [])
  const clearExecutions = useCallback(() => dispatch({ type: 'CLEAR_EXECUTIONS' }), [])

  const startConnection = useCallback((nodeId: string, portId: string) => {
    dispatch({ type: 'START_CONNECTION', payload: { nodeId, portId } })
  }, [])

  const endConnection = useCallback((nodeId: string, portId: string) => {
    if (state.connectionStart && state.connectionStart.nodeId !== nodeId) {
      const newEdge: WorkflowEdge = {
        id: generateId(),
        source: state.connectionStart.nodeId,
        sourcePort: state.connectionStart.portId,
        target: nodeId,
        targetPort: portId,
      }
      dispatch({ type: 'ADD_EDGE', payload: newEdge })
    }
    dispatch({ type: 'END_CONNECTION' })
  }, [state.connectionStart])

  const cancelConnection = useCallback(() => dispatch({ type: 'CANCEL_CONNECTION' }), [])
  const copySelection = useCallback(() => dispatch({ type: 'COPY_SELECTION' }), [])

  const pasteClipboard = useCallback((offset?: { x: number; y: number }) => {
    if (!state.clipboard || !state.currentWorkflow) return
    const idMap: Record<string, string> = {}
    state.clipboard.nodes.forEach(node => {
      const newId = generateId()
      idMap[node.id] = newId
      const newNode: WorkflowNode = {
        ...node,
        id: newId,
        position: { x: node.position.x + (offset?.x || 50), y: node.position.y + (offset?.y || 50) },
      }
      dispatch({ type: 'ADD_NODE', payload: newNode })
    })
    state.clipboard.edges.forEach(edge => {
      const newEdge: WorkflowEdge = { ...edge, id: generateId(), source: idMap[edge.source], target: idMap[edge.target] }
      dispatch({ type: 'ADD_EDGE', payload: newEdge })
    })
  }, [state.clipboard, state.currentWorkflow])

  const undo = useCallback(() => dispatch({ type: 'UNDO' }), [])
  const redo = useCallback(() => dispatch({ type: 'REDO' }), [])
  const saveToHistory = useCallback(() => dispatch({ type: 'SAVE_TO_HISTORY' }), [])

  const value: WorkflowContextType = {
    ...state,
    setCurrentWorkflow, createWorkflow, updateWorkflow, deleteWorkflow,
    addNode, updateNode, deleteNode, moveNode,
    addEdge, updateEdge, deleteEdge,
    selectNode, selectEdge, clearSelection,
    setZoom, setPanOffset,
    toggleDebugMode, toggleMinimap, toggleGrid, toggleSnapToGrid,
    toggleLeftPanel, toggleRightPanel, toggleBottomPanel,
    setActiveLeftTab, setActiveRightTab, setActiveBottomTab,
    startExecution, updateExecution, stopExecution, clearExecutions,
    startConnection, endConnection, cancelConnection,
    copySelection, pasteClipboard, undo, redo, saveToHistory,
  }

  return React.createElement(WorkflowContext.Provider, { value }, children)
}

// ============================================================================
// Hook
// ============================================================================

export function useWorkflowStore(): WorkflowContextType {
  const context = useContext(WorkflowContext)
  if (!context) {
    throw new Error('useWorkflowStore must be used within a WorkflowProvider')
  }
  return context
}
