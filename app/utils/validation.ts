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
    
    return errors;
  }

  private validateClients(): ValidationError[] {
    const errors: ValidationError[] = [];
    
    this.clients.forEach((client, index) => {
      // First validate with input schema to catch basic format issues
      const inputResult = ClientInputSchema.safeParse(client);
      if (!inputResult.success) {
        inputResult.error.issues.forEach(issue => {
          let message = issue.message;
          let value = client[issue.path[0] as keyof Client];
          
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
            rowIndex: index,
            field: issue.path.join('.'),
            message,
            value
          });
        });
        return;
      }

      // Then validate with full schema for transformation issues
      const result = ClientSchema.safeParse(client);
      if (!result.success) {
        result.error.issues.forEach(issue => {
          errors.push({
            entity: 'client',
            rowIndex: index,
            field: issue.path.join('.'),
            message: issue.message,
            value: client[issue.path[0] as keyof Client]
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
        requestedTaskIds = client.RequestedTaskIDs.split(',').map((id: string) => id.trim()).filter((id: string) => id.length > 0);
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

    return errors;
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