import { Client, Worker, Task, ClientInputSchema, WorkerInputSchema, TaskInputSchema, ClientSchema, WorkerSchema, TaskSchema } from '../types';

// --- Normalization helpers ---
function normalizeAttributesJSON(value: any): any {
  if (typeof value === 'object' && value !== null) return value;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return { message: value };
    }
  }
  return { message: String(value) };
}

function expandRangeToArray(value: string): number[] {
  if (!value || !value.trim()) return [];
  let v = value.trim().replace(/\[|\]/g, '');
  // Handle comma-separated values
  if (v.includes(',')) {
    return v.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
  }
  // Handle ranges like '1-2', '3 - 5', '1 -2', '1-4'
  const rangeMatch = v.match(/^(\d+)\s*-\s*(\d+)$/);
  if (rangeMatch) {
    const start = parseInt(rangeMatch[1], 10);
    const end = parseInt(rangeMatch[2], 10);
    if (!isNaN(start) && !isNaN(end) && start <= end) {
      return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    }
  }
  // If it's a single number
  if (/^\d+$/.test(v)) return [parseInt(v, 10)];
  return [];
}

function normalizePreferredPhase(value: any): number[] {
  if (Array.isArray(value) && value.every(v => typeof v === 'number')) return value;
  if (typeof value === 'string') {
    // Try JSON parse first
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed) && parsed.every(v => typeof v === 'number')) return parsed;
    } catch {
      // Not JSON, try to expand range
      return expandRangeToArray(value);
    }
    return expandRangeToArray(value);
  }
  if (typeof value === 'object' && value !== null && 'message' in value) {
    return expandRangeToArray(value.message);
  }
  if (typeof value === 'number') return [value];
  return [];
}

export class DataTransformer {
  // Transform raw Excel data to Client objects
  static transformClients(rawData: any[]): Client[] {
    const transformedClients: Client[] = [];
    
    rawData.forEach((row, index) => {
      try {
        const clientId = row.ClientID || row['Client ID'] || row.clientid || row.client_id;
        const clientName = row.ClientName || row['Client Name'] || row.clientname || row.client_name;
        const priorityLevel = parseInt(row.PriorityLevel || row['Priority Level'] || row.prioritylevel || row.priority_level) || 1;
        // --- STRICT FIX: Parse RequestedTaskIDs robustly ---
        let requestedTaskIds = row.RequestedTaskIDs || row['Requested Task IDs'] || row.requestedtaskids || row.requested_task_ids || '';
        if (typeof requestedTaskIds === 'string') {
          const trimmed = requestedTaskIds.trim();
          if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            try {
              const parsed = JSON.parse(trimmed);
              if (Array.isArray(parsed)) {
                requestedTaskIds = parsed.map((id: any) => String(id).trim());
              } else {
                requestedTaskIds = [];
              }
            } catch {
              requestedTaskIds = trimmed.split(',').map((id: string) => id.trim()).filter((id: string) => id.length > 0);
            }
          } else {
            requestedTaskIds = trimmed.split(',').map((id: string) => id.trim()).filter((id: string) => id.length > 0);
          }
        } else if (!Array.isArray(requestedTaskIds)) {
          requestedTaskIds = [];
        }
        const groupTag = row.GroupTag || row['Group Tag'] || row.grouptag || row.group_tag;
        // --- STRICT FIX: Parse AttributesJSON robustly ---
        let attributesJson = row.AttributesJSON || row['Attributes JSON'] || row.attributesjson || row.attributes_json || '{}';
        attributesJson = normalizeAttributesJSON(attributesJson);
        const clientData = {
          id: clientId || `client_${index}`, // Add unique id for DataGrid
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
          transformedClients.push({ ...result, id: clientData.id });
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
          id: workerId || `worker_${index}`, // Add unique id for DataGrid
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
          transformedWorkers.push({ ...result, id: workerData.id });
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
        preferredPhase = normalizePreferredPhase(preferredPhase);
        const maxConcurrent = parseInt(row.MaxConcurrent || row['Max Concurrent'] || row.maxconcurrent || row.max_concurrent) || 1;
        const taskData = {
          id: taskId || `task_${index}`, // Add unique id for DataGrid
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
          transformedTasks.push({ ...result, id: taskData.id });
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