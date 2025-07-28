// Test data that matches the Excel structure from the images
export const testClientData = [
  {
    ClientID: "C1",
    ClientName: "Acme Corp",
    PriorityLevel: 3,
    RequestedTaskIDs: "T17,T27,T33",
    GroupTag: "GroupA",
    AttributesJSON: '{"location":"New York", "budget":100000}'
  },
  {
    ClientID: "C2",
    ClientName: "Globex Inc",
    PriorityLevel: 4,
    RequestedTaskIDs: "T5,T12,T19",
    GroupTag: "GroupB",
    AttributesJSON: '{"sla":"24h","vip":true}'
  },
  {
    ClientID: "C3",
    ClientName: "Initech",
    PriorityLevel: 2,
    RequestedTaskIDs: "T8,T15,T22",
    GroupTag: "GroupC",
    AttributesJSON: '{"notes":"rush order", "budget":200000}'
  }
];

export const testWorkerData = [
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

export const testTaskData = [
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