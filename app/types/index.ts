import { z } from 'zod';

// Input schemas (before transformation)
export const ClientInputSchema = z.object({
  id: z.string().optional(), // Add id field for DataGrid compatibility
  ClientID: z.string().min(1, "Client ID is required"),
  ClientName: z.string().min(1, "Client name is required"),
  PriorityLevel: z.number().min(1).max(5, "Priority must be between 1-5"),
  RequestedTaskIDs: z.union([
    z.string(),
    z.array(z.string())
  ]),
  GroupTag: z.string().optional(),
  AttributesJSON: z.union([
    z.string(),
    z.object({}).passthrough()
  ]).optional(),
});

export const WorkerInputSchema = z.object({
  id: z.string().optional(), // Add id field for DataGrid compatibility
  WorkerID: z.string().min(1, "Worker ID is required"),
  WorkerName: z.string().min(1, "Worker name is required"),
  Skills: z.union([
    z.string(),
    z.array(z.string())
  ]),
  AvailableSlots: z.union([
    z.string(),
    z.array(z.number())
  ]),
  MaxLoadPerPh: z.number().min(1, "Max load must be at least 1"),
  WorkerGroup: z.string().optional(),
  QualificationLevel: z.number().min(1).max(5, "Qualification must be between 1-5"),
});

export const TaskInputSchema = z.object({
  id: z.string().optional(), // Add id field for DataGrid compatibility
  TaskID: z.string().min(1, "Task ID is required"),
  TaskName: z.string().min(1, "Task name is required"),
  Category: z.string().min(1, "Category is required"),
  Duration: z.number().min(1, "Duration must be at least 1"),
  RequiredSkills: z.union([
    z.string(),
    z.array(z.string())
  ]),
  PreferredPhase: z.union([
    z.string(),
    z.array(z.number())
  ]),
  MaxConcurrent: z.number().min(1, "Max concurrent must be at least 1"),
});

// Base schemas for validation (with transformations)
export const ClientSchema = z.object({
  id: z.string().optional(), // Add id field for DataGrid compatibility
  ClientID: z.string().min(1, "Client ID is required"),
  ClientName: z.string().min(1, "Client name is required"),
  PriorityLevel: z.number().min(1).max(5, "Priority must be between 1-5"),
  RequestedTaskIDs: z.union([
    z.string().transform((str) => 
      str.split(',').map(id => id.trim()).filter(id => id.length > 0)
    ),
    z.array(z.string())
  ]),
  GroupTag: z.string().optional(),
  AttributesJSON: z.union([
    z.string().transform((str) => {
      try {
        return JSON.parse(str);
      } catch {
        return {};
      }
    }),
    z.object({}).passthrough()
  ]).optional(),
});

export const WorkerSchema = z.object({
  id: z.string().optional(), // Add id field for DataGrid compatibility
  WorkerID: z.string().min(1, "Worker ID is required"),
  WorkerName: z.string().min(1, "Worker name is required"),
  Skills: z.union([
    z.string().transform((str) => 
      str.split(',').map(skill => skill.trim()).filter(skill => skill.length > 0)
    ),
    z.array(z.string())
  ]),
  AvailableSlots: z.union([
    z.string().transform((str) => {
      try {
        return JSON.parse(str);
      } catch {
        return [];
      }
    }),
    z.array(z.number())
  ]),
  MaxLoadPerPh: z.number().min(1, "Max load must be at least 1"),
  WorkerGroup: z.string().optional(),
  QualificationLevel: z.number().min(1).max(5, "Qualification must be between 1-5"),
});

export const TaskSchema = z.object({
  id: z.string().optional(), // Add id field for DataGrid compatibility
  TaskID: z.string().min(1, "Task ID is required"),
  TaskName: z.string().min(1, "Task name is required"),
  Category: z.string().min(1, "Category is required"),
  Duration: z.number().min(1, "Duration must be at least 1"),
  RequiredSkills: z.union([
    z.string().transform((str) => 
      str.split(',').map(skill => skill.trim()).filter(skill => skill.length > 0)
    ),
    z.array(z.string())
  ]),
  PreferredPhase: z.array(z.number()),
  MaxConcurrent: z.number().min(1, "Max concurrent must be at least 1"),
});

// TypeScript types derived from schemas
export type ClientInput = z.infer<typeof ClientInputSchema>;
export type WorkerInput = z.infer<typeof WorkerInputSchema>;
export type TaskInput = z.infer<typeof TaskInputSchema>;

export type Client = z.infer<typeof ClientSchema>;
export type Worker = z.infer<typeof WorkerSchema>;
export type Task = z.infer<typeof TaskSchema>;

// Validation error type
export interface ValidationError {
  entity: 'client' | 'worker' | 'task';
  rowIndex: number;
  field: string;
  message: string;
  value?: any;
}

// Business rule types with proper structure
export interface CoRunRule {
  type: 'coRun';
  tasks: string[];
  description: string;
}

export interface SlotRestrictionRule {
  type: 'slotRestriction';
  targetGroup: string;
  groupType: 'worker' | 'client';
  minCommonSlots: number;
  description: string;
}

export interface LoadLimitRule {
  type: 'loadLimit';
  workerGroup: string;
  maxSlotsPerPhase: number;
  description: string;
}

export interface PhaseWindowRule {
  type: 'phaseWindow';
  taskId: string;
  allowedPhases: number[];
  description: string;
}

export interface PatternMatchRule {
  type: 'patternMatch';
  regex: string;
  template: string;
  parameters?: Record<string, any>;
  description: string;
}

export type BusinessRule = {
  id: string;
  priority?: number;
} & (CoRunRule | SlotRestrictionRule | LoadLimitRule | PhaseWindowRule | PatternMatchRule);

// Priority weights with proper structure
export interface PriorityWeights {
  clientPriority: number;
  workerFairness: number;
  taskUrgency: number;
  resourceUtilization: number;
}

// Global settings for rules
export interface GlobalSettings {
  allowOverrides: boolean;
  strictValidation: boolean;
  optimizationGoal: 'balanced' | 'fulfillment' | 'fairness' | 'efficiency';
}

// Complete rules configuration
export interface RulesConfiguration {
  metadata: {
    version: string;
    createdAt: string;
    totalRules: number;
  };
  businessRules: BusinessRule[];
  prioritizationWeights: PriorityWeights;
  globalSettings: GlobalSettings;
}

// Application state
export interface AppState {
  clients: Client[];
  workers: Worker[];
  tasks: Task[];
  validationErrors: ValidationError[];
  businessRules: BusinessRule[];
  priorityWeights: PriorityWeights;
  globalSettings: GlobalSettings;
  isLoading: boolean;
  searchQuery: string;
  uploadedFiles: {
    clients: boolean;
    workers: boolean;
    tasks: boolean;
  };
} 