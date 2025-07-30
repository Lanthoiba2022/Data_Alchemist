import { Client, Worker, Task, ValidationError } from '../types';
import { ClientSchema, WorkerSchema, TaskSchema, ClientInputSchema, WorkerInputSchema, TaskInputSchema } from '../types';

export class DataValidator {
  private clients: Client[] = [];
  private workers: Worker[] = [];
  private tasks: Task[] = [];

  constructor(clients: Client[], workers: Worker[], tasks: Task[]) {
    this.clients = clients;
    this.workers = workers;
    this.tasks = tasks;
  }

  // Validate all data and return errors
  validateAll(): ValidationError[] {
    const errors: ValidationError[] = [];
    
    // Validate individual entities
    errors.push(...this.validateClients());
    errors.push(...this.validateWorkers());
    errors.push(...this.validateTasks());
    
    // Validate cross-entity relationships
    errors.push(...this.validateCrossEntityRelationships());
    
    // After collecting all errors, group by rowIndex and field
    const grouped: { [key: string]: ValidationError } = {};
    for (const err of errors) {
      const key = `${err.entity}-${err.rowIndex}-${err.field}`;
      if (!grouped[key]) {
        grouped[key] = { ...err, message: err.message };
      } else {
        grouped[key].message += `; ${err.message}`;
        if (Array.isArray(grouped[key].value)) {
          grouped[key].value.push(err.value);
        } else if (grouped[key].value !== undefined) {
          grouped[key].value = [grouped[key].value, err.value];
        } else {
          grouped[key].value = err.value;
        }
      }
    }
    return Object.values(grouped);
  }

  private validateClients(): ValidationError[] {
    const errors: ValidationError[] = [];

    this.clients.forEach((client, index) => {
      // Defensive copy
      let c = { ...client };
      // Fix RequestedTaskIDs
      if (typeof c.RequestedTaskIDs === 'string') {
        const val = c.RequestedTaskIDs.trim();
        if (val.startsWith('[') && val.endsWith(']')) {
          try {
            c.RequestedTaskIDs = JSON.parse(val);
          } catch {
            c.RequestedTaskIDs = val.slice(1, -1).split(',').map((id: string) => id.replace(/['\"]+/g, '').trim()).filter((id: string) => id.length > 0);
          }
        } else {
          c.RequestedTaskIDs = val.split(',').map((id: string) => id.trim()).filter((id: string) => id.length > 0);
        }
      }
      if (!Array.isArray(c.RequestedTaskIDs)) {
        errors.push({
          entity: 'client',
          rowIndex: index,
          field: 'RequestedTaskIDs',
          message: 'RequestedTaskIDs must be an array of strings',
          value: c.RequestedTaskIDs
        });
        c.RequestedTaskIDs = [];
      }
      // Fix PriorityLevel
      if (typeof c.PriorityLevel !== 'number') {
        const num = Number(c.PriorityLevel);
        if (!isNaN(num)) c.PriorityLevel = num;
      }
      if (typeof c.PriorityLevel !== 'number' || c.PriorityLevel < 1 || c.PriorityLevel > 5) {
        errors.push({
          entity: 'client',
          rowIndex: index,
          field: 'PriorityLevel',
          message: 'PriorityLevel must be a number between 1 and 5',
          value: c.PriorityLevel
        });
      }
      // Fix AttributesJSON
      if (typeof c.AttributesJSON === 'string') {
        try {
          c.AttributesJSON = JSON.parse(c.AttributesJSON);
        } catch {
          errors.push({
            entity: 'client',
            rowIndex: index,
            field: 'AttributesJSON',
            message: 'AttributesJSON must be valid JSON',
            value: c.AttributesJSON
          });
        }
      }
      // Validate with schema
      const inputResult = ClientInputSchema.safeParse(c);
      if (!inputResult.success) {
        inputResult.error.issues.forEach(issue => {
          errors.push({
            entity: 'client',
            rowIndex: index,
            field: issue.path.join('.'),
            message: issue.message,
            value: c[issue.path[0] as keyof Client]
          });
        });
      }
      const result = ClientSchema.safeParse(c);
      if (!result.success) {
        result.error.issues.forEach(issue => {
          errors.push({
            entity: 'client',
            rowIndex: index,
            field: issue.path.join('.'),
            message: issue.message,
            value: c[issue.path[0] as keyof Client]
          });
        });
      }
    });

    // Check for duplicate ClientIDs
    const clientIds = this.clients.map(c => c.ClientID);
    const duplicateIds = clientIds.filter((id, index) => clientIds.indexOf(id) !== index);
    
    duplicateIds.forEach(id => {
      this.clients.forEach((client, index) => {
        if (client.ClientID === id) {
          errors.push({
            entity: 'client',
            rowIndex: index,
            field: 'ClientID',
            message: `Duplicate Client ID: ${id}`,
            value: id
          });
        }
      });
    });

    return errors;
  }

  private validateWorkers(): ValidationError[] {
    const errors: ValidationError[] = [];
    
    this.workers.forEach((worker, index) => {
      // First validate with input schema to catch basic format issues
      const inputResult = WorkerInputSchema.safeParse(worker);
      if (!inputResult.success) {
        inputResult.error.issues.forEach(issue => {
          let message = issue.message;
          let value = worker[issue.path[0] as keyof Worker];
          
          // Provide more specific error messages for JSON fields
          if (issue.path[0] === 'AvailableSlots') {
            if (typeof value === 'string') {
              try {
                const parsed = JSON.parse(value);
                if (!Array.isArray(parsed)) {
                  message = 'AvailableSlots must be a JSON array of numbers';
                }
              } catch {
                message = 'Invalid JSON format for AvailableSlots';
              }
            } else if (!Array.isArray(value)) {
              message = 'AvailableSlots must be an array of numbers';
            }
          }
          
          errors.push({
            entity: 'worker',
            rowIndex: index,
            field: issue.path.join('.'),
            message,
            value
          });
        });
        return;
      }

      // Then validate with full schema for transformation issues
      const result = WorkerSchema.safeParse(worker);
      if (!result.success) {
        result.error.issues.forEach(issue => {
          errors.push({
            entity: 'worker',
            rowIndex: index,
            field: issue.path.join('.'),
            message: issue.message,
            value: worker[issue.path[0] as keyof Worker]
          });
        });
      }
    });

    // Check for duplicate WorkerIDs
    const workerIds = this.workers.map(w => w.WorkerID);
    const duplicateIds = workerIds.filter((id, index) => workerIds.indexOf(id) !== index);
    
    duplicateIds.forEach(id => {
      this.workers.forEach((worker, index) => {
        if (worker.WorkerID === id) {
          errors.push({
            entity: 'worker',
            rowIndex: index,
            field: 'WorkerID',
            message: `Duplicate Worker ID: ${id}`,
            value: id
          });
        }
      });
    });

    return errors;
  }

  private validateTasks(): ValidationError[] {
    const errors: ValidationError[] = [];
    
    this.tasks.forEach((task, index) => {
      // First validate with input schema to catch basic format issues
      const inputResult = TaskInputSchema.safeParse(task);
      if (!inputResult.success) {
        inputResult.error.issues.forEach(issue => {
          let message = issue.message;
          let value = task[issue.path[0] as keyof Task];
          
          // Provide more specific error messages for JSON fields
          if (issue.path[0] === 'PreferredPhase') {
            if (typeof value === 'string') {
              try {
                const parsed = JSON.parse(value);
                if (!Array.isArray(parsed)) {
                  message = 'PreferredPhase must be a JSON array of numbers';
                }
              } catch {
                message = 'Invalid JSON format for PreferredPhase';
              }
            } else if (!Array.isArray(value)) {
              message = 'PreferredPhase must be an array of numbers';
            }
          }
          
          errors.push({
            entity: 'task',
            rowIndex: index,
            field: issue.path.join('.'),
            message,
            value
          });
        });
        return;
      }

      // Then validate with full schema for transformation issues
      const result = TaskSchema.safeParse(task);
      if (!result.success) {
        result.error.issues.forEach(issue => {
          errors.push({
            entity: 'task',
            rowIndex: index,
            field: issue.path.join('.'),
            message: issue.message,
            value: task[issue.path[0] as keyof Task]
          });
        });
      }
    });

    // Check for duplicate TaskIDs
    const taskIds = this.tasks.map(t => t.TaskID);
    const duplicateIds = taskIds.filter((id, index) => taskIds.indexOf(id) !== index);
    
    duplicateIds.forEach(id => {
      this.tasks.forEach((task, index) => {
        if (task.TaskID === id) {
          errors.push({
            entity: 'task',
            rowIndex: index,
            field: 'TaskID',
            message: `Duplicate Task ID: ${id}`,
            value: id
          });
        }
      });
    });

    return errors;
  }

  private validateCrossEntityRelationships(): ValidationError[] {
    const errors: ValidationError[] = [];
    
    // Get all valid task IDs
    const validTaskIds = new Set(this.tasks.map(t => t.TaskID));
    const allSkills = new Set(this.workers.flatMap(w => w.Skills));
    
    // Validate client requested tasks exist
    this.clients.forEach((client: any, clientIndex) => {
      // Handle both string and array formats for RequestedTaskIDs
      let requestedTaskIds: string[] = [];
      if (typeof client.RequestedTaskIDs === 'string') {
        const val = client.RequestedTaskIDs.trim();
        if (val.startsWith('[') && val.endsWith(']')) {
          try {
            requestedTaskIds = JSON.parse(val);
          } catch {
            // fallback to split if JSON parse fails
            requestedTaskIds = val.slice(1, -1).split(',').map((id: string) => id.replace(/['\"]+/g, '').trim()).filter((id: string) => id.length > 0);
          }
        } else {
          requestedTaskIds = val.split(',').map((id: string) => id.trim()).filter((id: string) => id.length > 0);
        }
      } else if (Array.isArray(client.RequestedTaskIDs)) {
        requestedTaskIds = client.RequestedTaskIDs as string[];
      }
      
      requestedTaskIds.forEach((taskId: string) => {
        if (!validTaskIds.has(taskId)) {
          errors.push({
            entity: 'client',
            rowIndex: clientIndex,
            field: 'RequestedTaskIDs',
            message: `Requested task ID "${taskId}" does not exist`,
            value: taskId
          });
        }
      });
    });

    // Validate task required skills are covered by workers
    this.tasks.forEach((task: any, taskIndex) => {
      // Handle both string and array formats for RequiredSkills
      let requiredSkills: string[] = [];
      if (typeof task.RequiredSkills === 'string') {
        requiredSkills = task.RequiredSkills.split(',').map((skill: string) => skill.trim()).filter((skill: string) => skill.length > 0);
      } else if (Array.isArray(task.RequiredSkills)) {
        requiredSkills = task.RequiredSkills as string[];
      }
      
      requiredSkills.forEach((skill: string) => {
        if (!allSkills.has(skill)) {
          errors.push({
            entity: 'task',
            rowIndex: taskIndex,
            field: 'RequiredSkills',
            message: `Required skill "${skill}" is not available in any worker`,
            value: skill
          });
        }
      });
    });

    // Validate worker slot availability vs load limits
    this.workers.forEach((worker: any, workerIndex) => {
      // Handle both string and array formats for AvailableSlots
      let availableSlots: number[] = [];
      if (typeof worker.AvailableSlots === 'string') {
        try {
          availableSlots = JSON.parse(worker.AvailableSlots);
        } catch {
          availableSlots = [];
        }
      } else if (Array.isArray(worker.AvailableSlots)) {
        availableSlots = worker.AvailableSlots as number[];
      }
      
      const totalSlots = availableSlots.length;
      if (totalSlots < worker.MaxLoadPerPh) {
        errors.push({
          entity: 'worker',
          rowIndex: workerIndex,
          field: 'MaxLoadPerPh',
          message: `Max load (${worker.MaxLoadPerPh}) exceeds available slots (${totalSlots})`,
          value: worker.MaxLoadPerPh
        });
      }
    });

    // Validate phase-slot saturation
    this.validatePhaseSlotSaturation(errors);
    
    // Validate max-concurrency feasibility
    this.validateMaxConcurrencyFeasibility(errors);

    return errors;
  }

  // Validate phase-slot saturation
  private validatePhaseSlotSaturation(errors: ValidationError[]): void {
    // Get all phases from worker available slots
    const allPhases = new Set<number>();
    this.workers.forEach(worker => {
      if (Array.isArray(worker.AvailableSlots)) {
        worker.AvailableSlots.forEach(slot => allPhases.add(slot));
      }
    });

    // Check if any task duration exceeds total available slots in any phase
    this.tasks.forEach((task, taskIndex) => {
      if (task.Duration > allPhases.size) {
        errors.push({
          entity: 'task',
          rowIndex: taskIndex,
          field: 'Duration',
          message: `Task duration (${task.Duration}) exceeds total available phases (${allPhases.size})`,
          value: task.Duration
        });
      }
    });
  }

  // Validate max-concurrency feasibility
  private validateMaxConcurrencyFeasibility(errors: ValidationError[]): void {
    this.tasks.forEach((task, taskIndex) => {
      // Count workers with required skills
      const qualifiedWorkers = this.workers.filter(worker => {
        if (!Array.isArray(worker.Skills) || !Array.isArray(task.RequiredSkills)) {
          return false;
        }
        return task.RequiredSkills.every(skill => 
          worker.Skills.includes(skill)
        );
      });

      if (qualifiedWorkers.length < task.MaxConcurrent) {
        errors.push({
          entity: 'task',
          rowIndex: taskIndex,
          field: 'MaxConcurrent',
          message: `Max concurrent (${task.MaxConcurrent}) exceeds qualified workers (${qualifiedWorkers.length})`,
          value: task.MaxConcurrent
        });
      }
    });
  }

  // Validate a single entity (for inline editing)
  validateEntity(entity: 'client' | 'worker' | 'task', data: any, rowIndex: number): ValidationError[] {
    const errors: ValidationError[] = [];
    
    switch (entity) {
      case 'client':
        // First validate with input schema
        const clientInputResult = ClientInputSchema.safeParse(data);
        if (!clientInputResult.success) {
          clientInputResult.error.issues.forEach(issue => {
            let message = issue.message;
            let value = data[issue.path[0] as keyof Client];
            
            // Provide more specific error messages for JSON fields
            if (issue.path[0] === 'AttributesJSON') {
              if (typeof value === 'string') {
                try {
                  JSON.parse(value);
                } catch {
                  message = 'Invalid JSON format';
                }
              } else if (typeof value === 'object' && value !== null) {
                // Object is valid, no error
                return;
              }
            }
            
            errors.push({
              entity: 'client',
              rowIndex,
              field: issue.path.join('.'),
              message,
              value
            });
          });
        } else {
          // Then validate with full schema
          const clientResult = ClientSchema.safeParse(data);
          if (!clientResult.success) {
            clientResult.error.issues.forEach(issue => {
              errors.push({
                entity: 'client',
                rowIndex,
                field: issue.path.join('.'),
                message: issue.message,
                value: data[issue.path[0] as keyof Client]
              });
            });
          }
        }
        break;
        
      case 'worker':
        // First validate with input schema
        const workerInputResult = WorkerInputSchema.safeParse(data);
        if (!workerInputResult.success) {
          workerInputResult.error.issues.forEach(issue => {
            let message = issue.message;
            let value = data[issue.path[0] as keyof Worker];
            
            // Provide more specific error messages for JSON fields
            if (issue.path[0] === 'AvailableSlots') {
              if (typeof value === 'string') {
                try {
                  const parsed = JSON.parse(value);
                  if (!Array.isArray(parsed)) {
                    message = 'AvailableSlots must be a JSON array of numbers';
                  }
                } catch {
                  message = 'Invalid JSON format for AvailableSlots';
                }
              } else if (!Array.isArray(value)) {
                message = 'AvailableSlots must be an array of numbers';
              }
            }
            
            errors.push({
              entity: 'worker',
              rowIndex,
              field: issue.path.join('.'),
              message,
              value
            });
          });
        } else {
          // Then validate with full schema
          const workerResult = WorkerSchema.safeParse(data);
          if (!workerResult.success) {
            workerResult.error.issues.forEach(issue => {
              errors.push({
                entity: 'worker',
                rowIndex,
                field: issue.path.join('.'),
                message: issue.message,
                value: data[issue.path[0] as keyof Worker]
              });
            });
          }
        }
        break;
        
      case 'task':
        // First validate with input schema
        const taskInputResult = TaskInputSchema.safeParse(data);
        if (!taskInputResult.success) {
          taskInputResult.error.issues.forEach(issue => {
            let message = issue.message;
            let value = data[issue.path[0] as keyof Task];
            
            // Provide more specific error messages for JSON fields
            if (issue.path[0] === 'PreferredPhase') {
              if (typeof value === 'string') {
                try {
                  const parsed = JSON.parse(value);
                  if (!Array.isArray(parsed)) {
                    message = 'PreferredPhase must be a JSON array of numbers';
                  }
                } catch {
                  message = 'Invalid JSON format for PreferredPhase';
                }
              } else if (!Array.isArray(value)) {
                message = 'PreferredPhase must be an array of numbers';
              }
            }
            
            errors.push({
              entity: 'task',
              rowIndex,
              field: issue.path.join('.'),
              message,
              value
            });
          });
        } else {
          // Then validate with full schema
          const taskResult = TaskSchema.safeParse(data);
          if (!taskResult.success) {
            taskResult.error.issues.forEach(issue => {
              errors.push({
                entity: 'task',
                rowIndex,
                field: issue.path.join('.'),
                message: issue.message,
                value: data[issue.path[0] as keyof Task]
              });
            });
          }
        }
        break;
    }
    
    return errors;
  }
} 