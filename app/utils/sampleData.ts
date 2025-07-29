import { ClientInput, WorkerInput, TaskInput } from '../types';

export const sampleClients: ClientInput[] = [
  {
    ClientID: "C1",
    ClientName: "Acme Corp",
    PriorityLevel: 3,
    RequestedTaskIDs: "T1,T2,T3",
    GroupTag: "GroupA",
    AttributesJSON: '{"location":"New York", "budget":100000}'
  },
  {
    ClientID: "C2",
    ClientName: "Globex Inc",
    PriorityLevel: 4,
    RequestedTaskIDs: "T4,T5",
    GroupTag: "GroupB",
    AttributesJSON: '{"sla":"24h","vip":true}'
  },
  {
    ClientID: "C3",
    ClientName: "Initech",
    PriorityLevel: 2,
    RequestedTaskIDs: "T6,T7,T8",
    GroupTag: "GroupC",
    AttributesJSON: '{"notes":"rush order", "budget":200000}'
  }
];

export const sampleWorkers: WorkerInput[] = [
  {
    WorkerID: "W1",
    WorkerName: "Worker1",
    Skills: "data,analysis",
    AvailableSlots: "[1,2,3]",
    MaxLoadPerPh: 2,
    WorkerGroup: "GroupA",
    QualificationLevel: 4
  },
  {
    WorkerID: "W2",
    WorkerName: "Worker2",
    Skills: "coding,ml",
    AvailableSlots: "[2,4,5]",
    MaxLoadPerPh: 1,
    WorkerGroup: "GroupB",
    QualificationLevel: 5
  },
  {
    WorkerID: "W3",
    WorkerName: "Worker3",
    Skills: "testing,ui/ux",
    AvailableSlots: "[1,4]",
    MaxLoadPerPh: 3,
    WorkerGroup: "GroupC",
    QualificationLevel: 3
  }
];

export const sampleTasks: TaskInput[] = [
  {
    TaskID: "T1",
    TaskName: "Data Cleanup",
    Category: "ETL",
    Duration: 2,
    RequiredSkills: "data",
    PreferredPhase: "[1,2]",
    MaxConcurrent: 2
  },
  {
    TaskID: "T2",
    TaskName: "Report Generation",
    Category: "Analytics",
    Duration: 3,
    RequiredSkills: "analysis,reporting",
    PreferredPhase: "[2,3]",
    MaxConcurrent: 1
  },
  {
    TaskID: "T3",
    TaskName: "Model Training",
    Category: "ML",
    Duration: 4,
    RequiredSkills: "ml,coding",
    PreferredPhase: "[3,4,5]",
    MaxConcurrent: 2
  }
]; 