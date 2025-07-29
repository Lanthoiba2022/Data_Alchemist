import { Client, Worker, Task, ClientInputSchema, WorkerInputSchema, TaskInputSchema, ClientSchema, WorkerSchema, TaskSchema } from '../types';

export class DataTransformer {
  // Transform raw Excel data to Client objects
  static transformClients(rawData: any[]): Client[] {
    const transformedClients: Client[] = [];
    
    rawData.forEach((row, index) => {
      try {
        const clientId = row.ClientID || row['Client ID'] || row.clientid || row.client_id;
        const clientName = row.ClientName || row['Client Name'] || row.clientname || row.client_name;
        const priorityLevel = parseInt(row.PriorityLevel || row['Priority Level'] || row.prioritylevel || row.priority_level) || 1;
        // --- FIX: Always parse RequestedTaskIDs to array ---
        let requestedTaskIds = row.RequestedTaskIDs || row['Requested Task IDs'] || row.requestedtaskids || row.requested_task_ids || '';
        if (typeof requestedTaskIds === 'string') {
          requestedTaskIds = requestedTaskIds.split(',').map((id: string) => id.trim()).filter((id: string) => id.length > 0);
        } else if (!Array.isArray(requestedTaskIds)) {
          requestedTaskIds = [];
        }
        const groupTag = row.GroupTag || row['Group Tag'] || row.grouptag || row.group_tag;
        // --- FIX: Always parse AttributesJSON to object ---
        let attributesJson = row.AttributesJSON || row['Attributes JSON'] || row.attributesjson || row.attributes_json || '{}';
        if (typeof attributesJson === 'string') {
          try {
            attributesJson = JSON.parse(attributesJson);
          } catch {
            attributesJson = {};
          }
        } else if (typeof attributesJson !== 'object' || attributesJson === null) {
          attributesJson = {};
        }
        const clientData = {
          ClientID: clientId,
          ClientName: clientName,
          PriorityLevel: priorityLevel,
          RequestedTaskIDs: requestedTaskIds,
          GroupTag: groupTag,
          AttributesJSON: attributesJson
        };
        const inputResult = ClientInputSchema.safeParse(clientData);
        if (inputResult.success) {
          const result = ClientSchema.parse(inputResult.data);
          transformedClients.push(result);
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
        // --- FIX: Always parse Skills to array ---
        let skills = row.Skills || row.skills || '';
        if (typeof skills === 'string') {
          skills = skills.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
        } else if (!Array.isArray(skills)) {
          skills = [];
        }
        // --- FIX: Always parse AvailableSlots to array ---
        let availableSlots = row.AvailableSlots || row['Available Slots'] || row.availableslots || row.available_slots || '[]';
        if (typeof availableSlots === 'string') {
          try {
            availableSlots = JSON.parse(availableSlots);
            if (!Array.isArray(availableSlots)) availableSlots = [];
          } catch {
            availableSlots = [];
          }
        } else if (!Array.isArray(availableSlots)) {
          availableSlots = [];
        }
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
        const inputResult = WorkerInputSchema.safeParse(workerData);
        if (inputResult.success) {
          const result = WorkerSchema.parse(inputResult.data);
          transformedWorkers.push(result);
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
        const category = row.Category || row.category || '';
        const duration = parseInt(row.Duration || row.duration) || 1;
        // --- FIX: Always parse RequiredSkills to array ---
        let requiredSkills = row.RequiredSkills || row['Required Skills'] || row.requiredskills || row.required_skills || '';
        if (typeof requiredSkills === 'string') {
          requiredSkills = requiredSkills.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
        } else if (!Array.isArray(requiredSkills)) {
          requiredSkills = [];
        }
        // --- FIX: Always parse PreferredPhase to array ---
        let preferredPhase = row.PreferredPhase || row['Preferred Phase'] || row.preferredphase || row.preferred_phase || '[]';
        if (typeof preferredPhase === 'string') {
          try {
            preferredPhase = JSON.parse(preferredPhase);
            if (!Array.isArray(preferredPhase)) preferredPhase = [];
          } catch {
            preferredPhase = [];
          }
        } else if (!Array.isArray(preferredPhase)) {
          preferredPhase = [];
        }
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
        const inputResult = TaskInputSchema.safeParse(taskData);
        if (inputResult.success) {
          const result = TaskSchema.parse(inputResult.data);
          transformedTasks.push(result);
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
            // Validate JSON fields
            if (client.AttributesJSON) {
              try {
                if (typeof client.AttributesJSON === 'string') {
                  JSON.parse(client.AttributesJSON);
                }
              } catch {
                invalid.push({ index, error: 'Invalid JSON format in AttributesJSON' });
                return;
              }
            }
            break;
          case 'worker':
            const worker = item as any;
            if (!worker.WorkerID || !worker.WorkerName) {
              invalid.push({ index, error: 'Missing required WorkerID or WorkerName' });
              return;
            }
            // Validate JSON fields
            if (worker.AvailableSlots) {
              try {
                if (typeof worker.AvailableSlots === 'string') {
                  const parsed = JSON.parse(worker.AvailableSlots);
                  if (!Array.isArray(parsed)) {
                    invalid.push({ index, error: 'AvailableSlots must be a JSON array' });
                    return;
                  }
                }
              } catch {
                invalid.push({ index, error: 'Invalid JSON format in AvailableSlots' });
                return;
              }
            }
            break;
          case 'task':
            const task = item as any;
            if (!task.TaskID || !task.TaskName) {
              invalid.push({ index, error: 'Missing required TaskID or TaskName' });
              return;
            }
            // Validate JSON fields
            if (task.PreferredPhase) {
              try {
                if (typeof task.PreferredPhase === 'string') {
                  const parsed = JSON.parse(task.PreferredPhase);
                  if (!Array.isArray(parsed)) {
                    invalid.push({ index, error: 'PreferredPhase must be a JSON array' });
                    return;
                  }
                }
              } catch {
                invalid.push({ index, error: 'Invalid JSON format in PreferredPhase' });
                return;
              }
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