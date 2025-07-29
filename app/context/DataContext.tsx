'use client';

import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { Client, Worker, Task, ValidationError, BusinessRule, PriorityWeights, AppState } from '../types';
import { DataValidator } from '../utils/validation';
import { supabase } from '../utils/supabaseClient';

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
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_FILE_UPLOADED'; payload: 'clients' | 'workers' | 'tasks' }
  | { type: 'CLEAR_ALL_DATA' };

// Initial state
const initialState: AppState = {
  clients: [],
  workers: [],
  tasks: [],
  validationErrors: [],
  businessRules: [],
  priorityWeights: {
    clientPriority: 1,
    fulfillment: 1,
    fairness: 1,
    workload: 1,
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
  switch (action.type) {
    case 'SET_CLIENTS':
      return {
        ...state,
        clients: action.payload,
        validationErrors: new DataValidator(action.payload, state.workers, state.tasks).validateAll(),
      };

    case 'SET_WORKERS':
      return {
        ...state,
        workers: action.payload,
        validationErrors: new DataValidator(state.clients, action.payload, state.tasks).validateAll(),
      };

    case 'SET_TASKS':
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
      return {
        ...state,
        uploadedFiles: {
          ...state.uploadedFiles,
          [action.payload]: true,
        },
      };

    case 'CLEAR_ALL_DATA':
      return initialState;

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

  useEffect(() => {
    async function fetchData() {
      const [clients, workers, tasks, rules] = await Promise.all([
        supabase.from('clients').select('*'),
        supabase.from('workers').select('*'),
        supabase.from('tasks').select('*'),
        supabase.from('rules').select('*'),
      ]);
      if (clients.data) dispatch({ type: 'SET_CLIENTS', payload: clients.data });
      if (workers.data) dispatch({ type: 'SET_WORKERS', payload: workers.data });
      if (tasks.data) dispatch({ type: 'SET_TASKS', payload: tasks.data });
      if (rules.data) rules.data.forEach((rule: any) => dispatch({ type: 'ADD_BUSINESS_RULE', payload: rule }));
    }
    fetchData();
  }, []);

  // Sync to Supabase on state change
  useEffect(() => {
    supabase.from('clients').upsert(state.clients);
    supabase.from('workers').upsert(state.workers);
    supabase.from('tasks').upsert(state.tasks);
    supabase.from('rules').upsert(state.businessRules);
  }, [state.clients, state.workers, state.tasks, state.businessRules]);

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