import { Client, Worker, Task, ClientSchema, WorkerSchema, TaskSchema } from '../types';

export class DataTransformer {
  // Transform raw Excel data to Client objects
  static transformClients(rawData: any[]): Client[] {
    const transformedClients: Client[] = [];
    
    rawData.forEach((row, index) => {
      try {
        // Handle different possible column names
        const clientId = row.ClientID || row['Client ID'] || row.clientid || row.client_id;
        const clientName = row.ClientName || row['Client Name'] || row.clientname || row.client_name;
        const priorityLevel = parseInt(row.PriorityLevel || row['Priority Level'] || row.prioritylevel || row.priority_level) || 1;
        const requestedTaskIds = row.RequestedTaskIDs || row['Requested Task IDs'] || row.requestedtaskids || row.requested_task_ids || '';
        const groupTag = row.GroupTag || row['Group Tag'] || row.grouptag || row.group_tag;
        const attributesJson = row.AttributesJSON || row['Attributes JSON'] || row.attributesjson || row.attributes_json || '{}';

        const clientData = {
          ClientID: clientId,
          ClientName: clientName,
          PriorityLevel: priorityLevel,
          RequestedTaskIDs: requestedTaskIds,
          GroupTag: groupTag,
          AttributesJSON: attributesJson
        };

        // Validate using Zod schema
        const result = ClientSchema.safeParse(clientData);
        if (result.success) {
          transformedClients.push(result.data);
        }
      } catch (error) {
        console.warn(`Failed to transform client at row ${index + 1}:`, error);
      }
    });
    
    return transformedClients;
  }

  // Transform raw Excel data to Worker objects
  static transformWorkers(rawData: any[]): Worker[] {
    const transformedWorkers: Worker[] = [];
    
    rawData.forEach((row, index) => {
      try {
        const workerId = row.WorkerID || row['Worker ID'] || row.workerid || row.worker_id;
        const workerName = row.WorkerName || row['Worker Name'] || row.workername || row.worker_name;
        const skills = row.Skills || row.skills || '';
        const availableSlots = row.AvailableSlots || row['Available Slots'] || row.availableslots || row.available_slots || '[]';
        const maxLoadPerPh = parseInt(row.MaxLoadPerPh || row['Max Load Per Ph'] || row.maxloadperph || row.max_load_per_ph) || 1;
        const workerGroup = row.WorkerGroup || row['Worker Group'] || row.workergroup || row.worker_group;
        const qualificationLevel = parseInt(row.QualificationLevel || row['Qualification Level'] || row.qualificationlevel || row.qualification_level) || 1;

        const workerData = {
          WorkerID: workerId,
          WorkerName: workerName,
          Skills: skills,
          AvailableSlots: availableSlots,
          MaxLoadPerPh: maxLoadPerPh,
          WorkerGroup: workerGroup,
          QualificationLevel: qualificationLevel
        };

        // Validate using Zod schema
        const result = WorkerSchema.safeParse(workerData);
        if (result.success) {
          transformedWorkers.push(result.data);
        }
      } catch (error) {
        console.warn(`Failed to transform worker at row ${index + 1}:`, error);
      }
    });
    
    return transformedWorkers;
  }

  // Transform raw Excel data to Task objects
  static transformTasks(rawData: any[]): Task[] {
    const transformedTasks: Task[] = [];
    
    rawData.forEach((row, index) => {
      try {
        const taskId = row.TaskID || row['Task ID'] || row.taskid || row.task_id;
        const taskName = row.TaskName || row['Task Name'] || row.taskname || row.task_name;
        const category = row.Category || row.category;
        const duration = parseInt(row.Duration || row.duration) || 1;
        const requiredSkills = row.RequiredSkills || row['Required Skills'] || row.requiredskills || row.required_skills || '';
        const preferredPhase = row.PreferredPhase || row['Preferred Phase'] || row.preferredphase || row.preferred_phase || '[]';
        const maxConcurrent = parseInt(row.MaxConcurrent || row['Max Concurrent'] || row.maxconcurrent || row.max_concurrent) || 1;

        const taskData = {
          TaskID: taskId,
          TaskName: taskName,
          Category: category,
          Duration: duration,
          RequiredSkills: requiredSkills,
          PreferredPhase: preferredPhase,
          MaxConcurrent: maxConcurrent
        };

        // Validate using Zod schema
        const result = TaskSchema.safeParse(taskData);
        if (result.success) {
          transformedTasks.push(result.data);
        }
      } catch (error) {
        console.warn(`Failed to transform task at row ${index + 1}:`, error);
      }
    });
    
    return transformedTasks;
  }

  // Validate and clean data
  static validateAndClean<T>(data: T[], entityType: 'client' | 'worker' | 'task'): { valid: T[], invalid: { index: number; error: string }[] } {
    const valid: T[] = [];
    const invalid: { index: number; error: string }[] = [];

    data.forEach((item, index) => {
      try {
        // Basic validation based on entity type
        switch (entityType) {
          case 'client':
            const client = item as any;
            if (!client.ClientID || !client.ClientName) {
              invalid.push({ index, error: 'Missing required ClientID or ClientName' });
              return;
            }
            break;
          case 'worker':
            const worker = item as any;
            if (!worker.WorkerID || !worker.WorkerName) {
              invalid.push({ index, error: 'Missing required WorkerID or WorkerName' });
              return;
            }
            break;
          case 'task':
            const task = item as any;
            if (!task.TaskID || !task.TaskName) {
              invalid.push({ index, error: 'Missing required TaskID or TaskName' });
              return;
            }
            break;
        }
        valid.push(item);
      } catch (error) {
        invalid.push({ index, error: `Validation error: ${error}` });
      }
    });

    return { valid, invalid };
  }
} 