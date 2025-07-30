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
  
  // Handle comma-separated values first
  if (v.includes(',')) {
    return v.split(',').map(s => {
      const trimmed = s.trim();
      // Check if this individual item is a range
      const rangeMatch = trimmed.match(/^(\d+)\s*-\s*(\d+)$/);
      if (rangeMatch) {
        const start = parseInt(rangeMatch[1], 10);
        const end = parseInt(rangeMatch[2], 10);
        if (!isNaN(start) && !isNaN(end) && start <= end) {
          return Array.from({ length: end - start + 1 }, (_, i) => start + i);
        }
      }
      // Otherwise treat as single number
      const num = parseInt(trimmed, 10);
      return !isNaN(num) ? [num] : [];
    }).flat().filter(n => typeof n === 'number' && !isNaN(n));
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

export function normalizePreferredPhase(value: any): number[] {
  console.log('🔍 normalizePreferredPhase called with value:', value, 'type:', typeof value);
  
  // Handle null, undefined, or empty values
  if (value === null || value === undefined || value === '' || value === 'null' || value === 'undefined') {
    console.log('📝 normalizePreferredPhase: Empty/null value, returning empty array');
    return [];
  }
  
  // If already an array of numbers, return as is
  if (Array.isArray(value) && value.every(v => typeof v === 'number')) {
    console.log('✅ normalizePreferredPhase: Already valid array of numbers:', value);
    return value;
  }

  // If it's a string, process it
  if (typeof value === 'string') {
    console.log('📝 normalizePreferredPhase: Processing string value:', value);
    let processedValue = value.trim();
    
    // Remove brackets if present (e.g., [2-4] -> 2-4)
    if (processedValue.startsWith('[') && processedValue.endsWith(']')) {
      processedValue = processedValue.slice(1, -1).trim();
      console.log('📦 normalizePreferredPhase: Removed brackets, now:', processedValue);
    }
    
    // Split on commas and process each part
    const result = processedValue
      .split(',')
      .flatMap(part => {
        const trimmed = part.trim();
        console.log('🔧 normalizePreferredPhase: Processing part:', trimmed);
        
        // Handle range format like "2-4" or "1-3"
        const rangeMatch = trimmed.match(/^(\d+)\s*-\s*(\d+)$/);
        if (rangeMatch) {
          const start = parseInt(rangeMatch[1], 10);
          const end = parseInt(rangeMatch[2], 10);
          console.log('📊 normalizePreferredPhase: Found range:', start, 'to', end);
          if (!isNaN(start) && !isNaN(end) && start <= end) {
            const rangeArray = Array.from({ length: end - start + 1 }, (_, i) => start + i);
            console.log('📈 normalizePreferredPhase: Expanded range to:', rangeArray);
            return rangeArray;
          }
        }
        
        // Handle single number
        const num = parseInt(trimmed, 10);
        console.log('🔢 normalizePreferredPhase: Parsed number:', num, 'isNaN:', isNaN(num));
        return !isNaN(num) ? [num] : [];
      })
      .filter(n => typeof n === 'number' && !isNaN(n));
    
    console.log('✅ normalizePreferredPhase: Final result from string processing:', result);
    return result;
  }

  // If it's an array, flatten and normalize each element
  if (Array.isArray(value)) {
    console.log('📋 normalizePreferredPhase: Processing array:', value);
    const result = value.flatMap(v => normalizePreferredPhase(v)).filter(n => typeof n === 'number' && !isNaN(n));
    console.log('✅ normalizePreferredPhase: Final result from array processing:', result);
    return result;
  }

  // If it's an object with a message key, treat as string
  if (typeof value === 'object' && value !== null && 'message' in value) {
    console.log('💬 normalizePreferredPhase: Processing object with message:', value.message);
    return normalizePreferredPhase(value.message);
  }

  // If it's a number, wrap in array
  if (typeof value === 'number') {
    console.log('🔢 normalizePreferredPhase: Wrapping number in array:', [value]);
    return [value];
  }

  // For any other type (e.g., plain 1-2 from Excel), convert to string and process
  if (value !== undefined && value !== null) {
    console.log('🔄 normalizePreferredPhase: Converting to string and reprocessing:', String(value));
    return normalizePreferredPhase(String(value));
  }

  console.log('❌ normalizePreferredPhase: No valid value found, returning empty array');
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
        const priorityLevelRaw = row.PriorityLevel || row['Priority Level'] || row.prioritylevel || row.priority_level;
        const priorityLevel = priorityLevelRaw !== null && priorityLevelRaw !== undefined && priorityLevelRaw !== '' 
          ? parseInt(priorityLevelRaw) || 1 
          : 1;
        
        // --- STRICT FIX: Parse RequestedTaskIDs robustly ---
        let requestedTaskIdsRaw = row.RequestedTaskIDs || row['Requested Task IDs'] || row.requestedtaskids || row.requested_task_ids;
        let requestedTaskIds: string[] = [];
        
        if (requestedTaskIdsRaw !== null && requestedTaskIdsRaw !== undefined && requestedTaskIdsRaw !== '') {
          if (typeof requestedTaskIdsRaw === 'string') {
            const trimmed = requestedTaskIdsRaw.trim();
            if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
              try {
                const parsed = JSON.parse(trimmed);
                if (Array.isArray(parsed)) {
                  requestedTaskIds = parsed.map((id: any) => String(id).trim());
                }
              } catch {
                requestedTaskIds = trimmed.slice(1, -1).split(',').map((id: string) => id.trim()).filter((id: string) => id.length > 0);
              }
            } else {
              requestedTaskIds = trimmed.split(',').map((id: string) => id.trim()).filter((id: string) => id.length > 0);
            }
          } else if (Array.isArray(requestedTaskIdsRaw)) {
            requestedTaskIds = requestedTaskIdsRaw.map((id: any) => String(id).trim()).filter((id: string) => id.length > 0);
          }
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
        let skillsRaw = row.Skills || row.skills;
        let skills: string[] = [];
        
        if (skillsRaw !== null && skillsRaw !== undefined && skillsRaw !== '') {
          if (typeof skillsRaw === 'string') {
            skills = skillsRaw.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
          } else if (Array.isArray(skillsRaw)) {
            skills = skillsRaw.map((s: any) => String(s).trim()).filter((s: string) => s.length > 0);
          }
        }
        
        // --- ENHANCED FIX: Parse AvailableSlots to array with better error handling ---
        let availableSlotsRaw = row.AvailableSlots || row['Available Slots'] || row.availableslots || row.available_slots;
        let availableSlots: number[] = [];
        
        if (availableSlotsRaw !== null && availableSlotsRaw !== undefined && availableSlotsRaw !== '') {
          if (typeof availableSlotsRaw === 'string') {
            try {
              const parsed = JSON.parse(availableSlotsRaw);
              if (Array.isArray(parsed)) {
                availableSlots = parsed.filter(slot => typeof slot === 'number' && !isNaN(slot));
              }
            } catch {
              // If JSON parsing fails, try to parse as comma-separated numbers
              availableSlots = availableSlotsRaw.split(',')
                .map((s: string) => parseInt(s.trim(), 10))
                .filter((n: number) => !isNaN(n));
            }
          } else if (Array.isArray(availableSlotsRaw)) {
            availableSlots = availableSlotsRaw.filter(slot => typeof slot === 'number' && !isNaN(slot));
          }
        }
        
        const maxLoadPerPhRaw = row.MaxLoadPerPh || row['Max Load Per Ph'] || row.maxloadperph || row.max_load_per_ph;
        const maxLoadPerPh = maxLoadPerPhRaw !== null && maxLoadPerPhRaw !== undefined && maxLoadPerPhRaw !== '' 
          ? parseInt(maxLoadPerPhRaw) || 1 
          : 1;
        const workerGroup = row.WorkerGroup || row['Worker Group'] || row.workergroup || row.worker_group;
        const qualificationLevelRaw = row.QualificationLevel || row['Qualification Level'] || row.qualificationlevel || row.qualification_level;
        const qualificationLevel = qualificationLevelRaw !== null && qualificationLevelRaw !== undefined && qualificationLevelRaw !== '' 
          ? parseInt(qualificationLevelRaw) || 1 
          : 1;
        
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
    
    console.log('🚀 transformTasks called with rawData:', rawData);
    console.log('📊 transformTasks: Number of rows to process:', rawData.length);
    
    rawData.forEach((row, index) => {
      console.log(`\n📋 Processing row ${index + 1}:`, row);
      try {
        const taskId = row.TaskID || row['Task ID'] || row.taskid || row.task_id;
        const taskName = row.TaskName || row['Task Name'] || row.taskname || row.task_name;
        const category = row.Category || row.category || '';
        const durationRaw = row.Duration || row.duration;
        const duration = durationRaw !== null && durationRaw !== undefined && durationRaw !== '' 
          ? parseInt(durationRaw) || 1 
          : 1;
        
        // --- FIX: Always parse RequiredSkills to array ---
        let requiredSkillsRaw = row.RequiredSkills || row['Required Skills'] || row.requiredskills || row.required_skills;
        let requiredSkills: string[] = [];
        
        if (requiredSkillsRaw !== null && requiredSkillsRaw !== undefined && requiredSkillsRaw !== '') {
          if (typeof requiredSkillsRaw === 'string') {
            requiredSkills = requiredSkillsRaw.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
          } else if (Array.isArray(requiredSkillsRaw)) {
            requiredSkills = requiredSkillsRaw.map((s: any) => String(s).trim()).filter((s: string) => s.length > 0);
          }
        }
        
        // --- ENHANCED FIX: Parse PreferredPhase to array using improved normalization ---
        let preferredPhaseRaw = row.PreferredPhase || row['Preferred Phase'] || row.preferredphase || row.preferred_phase;
        
        console.log(`🔍 Row ${index + 1} PreferredPhase raw value:`, preferredPhaseRaw);
        console.log(`🔍 Row ${index + 1} PreferredPhase raw value type:`, typeof preferredPhaseRaw);
        console.log(`🔍 Row ${index + 1} PreferredPhase raw value constructor:`, preferredPhaseRaw?.constructor?.name);
        console.log(`🔍 Row ${index + 1} Full row data:`, row);
        
        // Use the enhanced normalizePreferredPhase function
        let preferredPhase = normalizePreferredPhase(preferredPhaseRaw);
        
        console.log(`✅ Row ${index + 1} PreferredPhase normalized:`, preferredPhase);
        console.log(`✅ Row ${index + 1} PreferredPhase normalized type:`, typeof preferredPhase);
        console.log(`✅ Row ${index + 1} PreferredPhase is array:`, Array.isArray(preferredPhase));
        
        // Ensure we have a valid array and remove duplicates, sort for consistency
        preferredPhase = ([...new Set(preferredPhase)] as number[]).sort((a, b) => a - b);
        
        console.log(`🎯 Row ${index + 1} PreferredPhase final:`, preferredPhase);
        
        const maxConcurrentRaw = row.MaxConcurrent || row['Max Concurrent'] || row.maxconcurrent || row.max_concurrent;
        const maxConcurrent = maxConcurrentRaw !== null && maxConcurrentRaw !== undefined && maxConcurrentRaw !== '' 
          ? parseInt(maxConcurrentRaw) || 1 
          : 1;
        
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
        
        console.log(`📝 Row ${index + 1} taskData before validation:`, taskData);
        
        const inputResult = TaskInputSchema.safeParse(taskData);
        if (inputResult.success) {
          const result = TaskSchema.parse(inputResult.data);
          console.log(`✅ Row ${index + 1} validation successful, final task:`, result);
          transformedTasks.push({ ...result, id: taskData.id });
        } else {
          console.log(`❌ Row ${index + 1} validation failed:`, inputResult.error);
        }
      } catch (error) {
        console.warn(`❌ Failed to transform task at row ${index + 1}:`, error);
      }
    });
    
    console.log('🎉 transformTasks completed. Total transformed tasks:', transformedTasks.length);
    console.log('📊 Final transformed tasks:', transformedTasks);
    
    return transformedTasks;
  }

  // Enhanced validation and cleaning with better PreferredPhase validation
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
            // Validate AvailableSlots is array of numbers
            if (worker.AvailableSlots && !Array.isArray(worker.AvailableSlots)) {
              invalid.push({ index, error: 'AvailableSlots must be an array' });
              return;
            }
            if (worker.AvailableSlots && Array.isArray(worker.AvailableSlots)) {
              const hasInvalidSlot = worker.AvailableSlots.some((slot: any) => typeof slot !== 'number' || isNaN(slot));
              if (hasInvalidSlot) {
                invalid.push({ index, error: 'AvailableSlots must contain only valid numbers' });
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
            // Validate PreferredPhase is array of numbers
            if (task.PreferredPhase && !Array.isArray(task.PreferredPhase)) {
              invalid.push({ index, error: 'PreferredPhase must be an array' });
              return;
            }
            if (task.PreferredPhase && Array.isArray(task.PreferredPhase)) {
              const hasInvalidPhase = task.PreferredPhase.some((phase: any) => typeof phase !== 'number' || isNaN(phase));
              if (hasInvalidPhase) {
                invalid.push({ index, error: 'PreferredPhase must contain only valid numbers' });
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