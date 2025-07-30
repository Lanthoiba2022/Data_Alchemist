'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Client, Worker, Task, ValidationError, BusinessRule, PriorityWeights, GlobalSettings, AppState } from '../types';
import { DataValidator } from '../utils/validation';

// Action types
type Action =
  | { type: 'SET_CLIENTS'; payload: Client[] }
  | { type: 'SET_WORKERS'; payload: Worker[] }
  | { type: 'SET_TASKS'; payload: Task[] }
  | { type: 'UPDATE_CLIENT'; payload: { index: number; client: Client } }
  | { type: 'UPDATE_WORKER'; payload: { index: number; worker: Worker } }
  | { type: 'UPDATE_TASK'; payload: { index: number; task: Task } }
  | { type: 'SET_VALIDATION_ERRORS'; payload: ValidationError[] }
  | { type: 'ADD_BUSINESS_RULE'; payload: BusinessRule }
  | { type: 'REMOVE_BUSINESS_RULE'; payload: string }
  | { type: 'UPDATE_BUSINESS_RULE'; payload: BusinessRule }
  | { type: 'SET_PRIORITY_WEIGHTS'; payload: PriorityWeights }
  | { type: 'SET_GLOBAL_SETTINGS'; payload: GlobalSettings }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_FILE_UPLOADED'; payload: 'clients' | 'workers' | 'tasks' }
  | { type: 'CLEAR_ALL_DATA' }
  | { type: 'CLEAR_CLIENTS_DATA' }
  | { type: 'CLEAR_WORKERS_DATA' }
  | { type: 'CLEAR_TASKS_DATA' };

// Initial state
const initialState: AppState = {
  clients: [],
  workers: [],
  tasks: [],
  validationErrors: [],
  businessRules: [],
  priorityWeights: {
    clientPriority: 1,
    workerFairness: 1,
    taskUrgency: 1,
    resourceUtilization: 1,
  },
  globalSettings: {
    allowOverrides: true,
    strictValidation: true,
    optimizationGoal: 'balanced',
  },
  isLoading: false,
  searchQuery: '',
  uploadedFiles: {
    clients: false,
    workers: false,
    tasks: false,
  },
};

// Reducer function
function dataReducer(state: AppState, action: Action): AppState {
  console.log('🔄 DataContext reducer called with action:', action.type, 'payload:', 'payload' in action ? action.payload : 'no payload');
  
  switch (action.type) {
    case 'SET_CLIENTS':
      console.log('👥 DataContext: Setting clients:', action.payload);
      return {
        ...state,
        clients: action.payload,
        validationErrors: new DataValidator(action.payload, state.workers, state.tasks).validateAll(),
      };

    case 'SET_WORKERS':
      console.log('👷 DataContext: Setting workers:', action.payload);
      if (action.payload.length > 0) {
        action.payload.forEach((worker, index) => {
          console.log(`👷 DataContext: Worker ${index + 1} MaxLoadPerPh:`, worker.MaxLoadPerPh);
        });
      }
      return {
        ...state,
        workers: action.payload,
        validationErrors: new DataValidator(state.clients, action.payload, state.tasks).validateAll(),
      };

    case 'SET_TASKS':
      console.log('📋 DataContext: Setting tasks:', action.payload);
      if (action.payload.length > 0) {
        action.payload.forEach((task, index) => {
          console.log(`📋 DataContext: Task ${index + 1} PreferredPhase:`, task.PreferredPhase);
          console.log(`📋 DataContext: Task ${index + 1} PreferredPhase type:`, typeof task.PreferredPhase);
          console.log(`📋 DataContext: Task ${index + 1} PreferredPhase is array:`, Array.isArray(task.PreferredPhase));
        });
      }
      return {
        ...state,
        tasks: action.payload,
        validationErrors: new DataValidator(state.clients, state.workers, action.payload).validateAll(),
      };

    case 'UPDATE_CLIENT':
      const updatedClients = [...state.clients];
      updatedClients[action.payload.index] = action.payload.client;
      return {
        ...state,
        clients: updatedClients,
        validationErrors: new DataValidator(updatedClients, state.workers, state.tasks).validateAll(),
      };

    case 'UPDATE_WORKER':
      const updatedWorkers = [...state.workers];
      updatedWorkers[action.payload.index] = action.payload.worker;
      return {
        ...state,
        workers: updatedWorkers,
        validationErrors: new DataValidator(state.clients, updatedWorkers, state.tasks).validateAll(),
      };

    case 'UPDATE_TASK':
      const updatedTasks = [...state.tasks];
      updatedTasks[action.payload.index] = action.payload.task;
      console.log('📋 DataContext: Updated task PreferredPhase:', action.payload.task.PreferredPhase);
      return {
        ...state,
        tasks: updatedTasks,
        validationErrors: new DataValidator(state.clients, state.workers, updatedTasks).validateAll(),
      };

    case 'SET_VALIDATION_ERRORS':
      return {
        ...state,
        validationErrors: action.payload,
      };

    case 'ADD_BUSINESS_RULE':
      return {
        ...state,
        businessRules: [...state.businessRules, action.payload],
      };

    case 'REMOVE_BUSINESS_RULE':
      return {
        ...state,
        businessRules: state.businessRules.filter(rule => rule.id !== action.payload),
      };

    case 'UPDATE_BUSINESS_RULE':
      return {
        ...state,
        businessRules: state.businessRules.map(rule =>
          rule.id === action.payload.id ? action.payload : rule
        ),
      };

    case 'SET_PRIORITY_WEIGHTS':
      return {
        ...state,
        priorityWeights: action.payload,
      };

    case 'SET_GLOBAL_SETTINGS':
      return {
        ...state,
        globalSettings: action.payload,
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'SET_SEARCH_QUERY':
      return {
        ...state,
        searchQuery: action.payload,
      };

    case 'SET_FILE_UPLOADED':
      console.log('📁 DataContext: File uploaded for:', action.payload);
      return {
        ...state,
        uploadedFiles: {
          ...state.uploadedFiles,
          [action.payload]: true,
        },
      };

    case 'CLEAR_ALL_DATA':
      console.log('🗑️ DataContext: Clearing all data');
      return initialState;

    case 'CLEAR_CLIENTS_DATA':
      console.log('🗑️ DataContext: Clearing clients data');
      return {
        ...state,
        clients: [],
        uploadedFiles: {
          ...state.uploadedFiles,
          clients: false,
        },
        validationErrors: new DataValidator([], state.workers, state.tasks).validateAll(),
      };

    case 'CLEAR_WORKERS_DATA':
      console.log('🗑️ DataContext: Clearing workers data');
      return {
        ...state,
        workers: [],
        uploadedFiles: {
          ...state.uploadedFiles,
          workers: false,
        },
        validationErrors: new DataValidator(state.clients, [], state.tasks).validateAll(),
      };

    case 'CLEAR_TASKS_DATA':
      console.log('🗑️ DataContext: Clearing tasks data');
      return {
        ...state,
        tasks: [],
        uploadedFiles: {
          ...state.uploadedFiles,
          tasks: false,
        },
        validationErrors: new DataValidator(state.clients, state.workers, []).validateAll(),
      };

    default:
      return state;
  }
}

// Context
interface DataContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Provider component
export function DataProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(dataReducer, initialState);

  return (
    <DataContext.Provider value={{ state, dispatch }}>
      {children}
    </DataContext.Provider>
  );
}

// Custom hook to use the context
export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
} 