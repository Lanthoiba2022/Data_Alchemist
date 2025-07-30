import * as XLSX from 'xlsx';
import { testClients, testWorkers, testTasks } from './testData';

export class ExcelTemplateGenerator {
  // Generate a template workbook with all three sheets
  static generateTemplate(): void {
    const workbook = XLSX.utils.book_new();
    
    // Create Clients sheet
    const clientsWorksheet = XLSX.utils.json_to_sheet(testClients);
    XLSX.utils.book_append_sheet(workbook, clientsWorksheet, 'Clients');
    
    // Create Workers sheet
    const workersWorksheet = XLSX.utils.json_to_sheet(testWorkers);
    XLSX.utils.book_append_sheet(workbook, workersWorksheet, 'Workers');
    
    // Create Tasks sheet
    const tasksWorksheet = XLSX.utils.json_to_sheet(testTasks);
    XLSX.utils.book_append_sheet(workbook, tasksWorksheet, 'Tasks');
    
    // Generate and download the file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'data-alchemist-template.xlsx';
    link.click();
    
    URL.revokeObjectURL(url);
  }

  // Generate individual template sheets
  static generateClientsTemplate(): void {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(testClients);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Clients');
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'clients-template.xlsx';
    link.click();
    
    URL.revokeObjectURL(url);
  }

  static generateWorkersTemplate(): void {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(testWorkers);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Workers');
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'workers-template.xlsx';
    link.click();
    
    URL.revokeObjectURL(url);
  }

  static generateTasksTemplate(): void {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(testTasks);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tasks');
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'tasks-template.xlsx';
    link.click();
    
    URL.revokeObjectURL(url);
  }

  // Get column descriptions for help text
  static getColumnDescriptions(entityType: 'clients' | 'workers' | 'tasks'): Record<string, string> {
    switch (entityType) {
      case 'clients':
        return {
          ClientID: 'Unique client identifier (e.g., "C1", "C2")',
          ClientName: 'Client name (e.g., "Acme Corp", "Globex Inc")',
          PriorityLevel: 'Priority level 1-5',
          RequestedTaskIDs: 'Comma-separated task IDs (e.g., "T1,T2,T3")',
          GroupTag: 'Group classification (e.g., "GroupA", "GroupB", "GroupC")',
          AttributesJSON: 'JSON string with additional attributes'
        };
      case 'workers':
        return {
          WorkerID: 'Unique worker identifier (e.g., "W1", "W2")',
          WorkerName: 'Worker name (e.g., "Worker1", "Worker2")',
          Skills: 'Comma-separated skills (e.g., "data,analysis", "coding,ml")',
          AvailableSlots: 'JSON array of available time slots (e.g., "[1,2,3]")',
          MaxLoadPerPh: 'Maximum load per phase (integer)',
          WorkerGroup: 'Group classification (e.g., "GroupA", "GroupB", "GroupC")',
          QualificationLevel: 'Qualification level 1-5'
        };
      case 'tasks':
        return {
          TaskID: 'Unique task identifier (e.g., "T1", "T2")',
          TaskName: 'Task name (e.g., "Data Cleanup", "Report Generation")',
          Category: 'Task category (e.g., "ETL", "Analytics", "ML")',
          Duration: 'Task duration (integer)',
          RequiredSkills: 'Comma-separated required skills',
          PreferredPhase: 'JSON array of preferred phases (e.g., "[1,2]", "[2,3,4]")',
          MaxConcurrent: 'Maximum concurrent instances (integer)'
        };
    }
  }
} 