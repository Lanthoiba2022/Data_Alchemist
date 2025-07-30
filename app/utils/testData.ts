import { Client, Worker, Task } from '../types';

export const testClients: Client[] = [
  {
    id: 'client_1',
    ClientID: 'C1',
    ClientName: 'Acme Corp',
    PriorityLevel: 3,
    RequestedTaskIDs: ['T17', 'T27', 'T33', 'T31', 'T20', 'T3', 'T32', 'T26'],
    GroupTag: 'GroupA',
    AttributesJSON: { location: 'New York', budget: 100000 }
  },
  {
    id: 'client_2',
    ClientID: 'C2',
    ClientName: 'Globex Inc',
    PriorityLevel: 1,
    RequestedTaskIDs: ['T35', 'T39', 'T10', 'T17', 'T46'],
    GroupTag: 'GroupB',
    AttributesJSON: { value: 'ensure deliverables align with project scope' }
  },
  {
    id: 'client_3',
    ClientID: 'C3',
    ClientName: 'Initech',
    PriorityLevel: 4,
    RequestedTaskIDs: ['T28', 'T7', 'T23', 'T40', 'T41', 'T31', 'T36', 'T21'],
    GroupTag: 'GroupA',
    AttributesJSON: { sla: '24h', vip: true }
  }
];

export const testWorkers: Worker[] = [
  {
    id: 'worker_1',
    WorkerID: 'W1',
    WorkerName: 'Worker1',
    Skills: ['data', 'analysis'],
    AvailableSlots: [1, 2, 3],
    MaxLoadPerPh: 2,
    WorkerGroup: 'GroupA',
    QualificationLevel: 4
  },
  {
    id: 'worker_2',
    WorkerID: 'W2',
    WorkerName: 'Worker2',
    Skills: ['coding', 'ml'],
    AvailableSlots: [2, 4, 5],
    MaxLoadPerPh: 1,
    WorkerGroup: 'GroupB',
    QualificationLevel: 5
  },
  {
    id: 'worker_3',
    WorkerID: 'W3',
    WorkerName: 'Worker3',
    Skills: ['testing', 'ui/ux'],
    AvailableSlots: [1, 4],
    MaxLoadPerPh: 3,
    WorkerGroup: 'GroupC',
    QualificationLevel: 3
  }
];

export const testTasks: Task[] = [
  {
    id: 'task_1',
    TaskID: 'T1',
    TaskName: 'Data Cleanup',
    Category: 'ETL',
    Duration: 2,
    RequiredSkills: ['coding'],
    PreferredPhase: [1, 2],
    MaxConcurrent: 3
  },
  {
    id: 'task_2',
    TaskID: 'T2',
    TaskName: 'Report General Analytics',
    Category: '',
    Duration: 1,
    RequiredSkills: ['analysis', 'reporting'],
    PreferredPhase: [2, 3, 4],
    MaxConcurrent: 2
  },
  {
    id: 'task_3',
    TaskID: 'T3',
    TaskName: 'Model Training',
    Category: 'ML',
    Duration: 3,
    RequiredSkills: ['ml', 'coding'],
    PreferredPhase: [3, 4, 5],
    MaxConcurrent: 1
  }
]; 