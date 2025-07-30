'use client';

import React, { useRef, useMemo, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { useData } from '../context/DataContext';
import { normalizePreferredPhase } from '../utils/dataTransformer';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

// TypeScript interfaces for AG Grid editors
interface ICellEditorParams {
  value: any;
  api: any;
  column: any;
  colDef: any;
  node: any;
  data: any;
  field: string;
}

interface ICellEditor {
  init(params: ICellEditorParams): void;
  getGui(): HTMLElement;
  afterGuiAttached?(): void;
  getValue(): any;
  destroy?(): void;
  isPopup?(): boolean;
}

// Custom Array Editor for comma-separated values
class ArrayEditor implements ICellEditor {
  private value: string = '';
  private params!: ICellEditorParams;
  private input!: HTMLInputElement;

  init(params: ICellEditorParams): void {
    this.value = Array.isArray(params.value) ? params.value.join(', ') : (params.value || '');
    this.params = params;
  }

  getGui(): HTMLElement {
    this.input = document.createElement('input');
    this.input.style.width = '100%';
    this.input.style.height = '100%';
    this.input.style.border = 'none';
    this.input.style.outline = 'none';
    this.input.style.padding = '4px';
    this.input.value = this.value;
    
    this.input.addEventListener('input', (e: Event) => {
      const target = e.target as HTMLInputElement;
      this.value = target.value;
    });
    
    this.input.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        this.params.api.stopEditing();
      }
    });
    
    return this.input;
  }

  afterGuiAttached(): void {
    this.input.focus();
    this.input.select();
  }

  getValue(): any {
    return this.value
      ? this.value.split(',').map((v: string) => v.trim()).filter(Boolean)
      : [];
  }

  destroy(): void {
    // cleanup if needed
  }

  isPopup(): boolean {
    return false;
  }
}

// Custom PreferredPhase Editor that handles ranges and comma-separated values
class PreferredPhaseEditor implements ICellEditor {
  private value: string = '';
  private params!: ICellEditorParams;
  private input!: HTMLInputElement;

  init(params: ICellEditorParams): void {
    console.log('🔧 PreferredPhaseEditor.init called with params:', params);
    console.log('🔧 PreferredPhaseEditor.init params.value:', params.value);
    console.log('🔧 PreferredPhaseEditor.init params.value type:', typeof params.value);
    console.log('🔧 PreferredPhaseEditor.init params.value is array:', Array.isArray(params.value));
    
    // Convert array to display format
    if (Array.isArray(params.value) && params.value.every((v: any) => typeof v === 'number')) {
      this.value = params.value.join(', ');
      console.log('✅ PreferredPhaseEditor.init: Converted array to string:', this.value);
    } else {
      this.value = params.value || '';
      console.log('📝 PreferredPhaseEditor.init: Using raw value:', this.value);
    }
    this.params = params;
  }

  getGui(): HTMLElement {
    console.log('🔧 PreferredPhaseEditor.getGui called, current value:', this.value);
    this.input = document.createElement('input');
    this.input.style.width = '100%';
    this.input.style.height = '100%';
    this.input.style.border = 'none';
    this.input.style.outline = 'none';
    this.input.style.padding = '4px';
    this.input.placeholder = 'e.g., 1-3, 5, 7-9 or [2-4]';
    this.input.value = this.value;
    
    this.input.addEventListener('input', (e: Event) => {
      const target = e.target as HTMLInputElement;
      this.value = target.value;
      console.log('📝 PreferredPhaseEditor.input event, new value:', this.value);
    });
    
    this.input.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        console.log('↵ PreferredPhaseEditor.Enter key pressed, stopping edit');
        this.params.api.stopEditing();
      }
    });
    
    return this.input;
  }

  afterGuiAttached(): void {
    console.log('🔧 PreferredPhaseEditor.afterGuiAttached called');
    this.input.focus();
    this.input.select();
  }

  getValue(): any {
    console.log('🔧 PreferredPhaseEditor.getValue called, current value:', this.value);
    // Use normalizePreferredPhase to convert the input to an array of numbers
    const result = normalizePreferredPhase(this.value);
    console.log('✅ PreferredPhaseEditor.getValue returning:', result);
    return result;
  }

  destroy(): void {
    console.log('🔧 PreferredPhaseEditor.destroy called');
    // cleanup if needed
  }

  isPopup(): boolean {
    return false;
  }
}

// Custom JSON Editor for JSON objects
class JsonEditor implements ICellEditor {
  private value: string = '';
  private params!: ICellEditorParams;
  private textarea!: HTMLTextAreaElement;

  init(params: ICellEditorParams): void {
    // If value is an object, stringify. If it's a valid JSON string, keep as-is. Otherwise, use the raw value (not '{}').
    if (typeof params.value === 'object' && params.value !== null) {
      this.value = JSON.stringify(params.value, null, 2);
    } else if (typeof params.value === 'string') {
      try {
        JSON.parse(params.value);
        this.value = params.value;
      } catch {
        this.value = params.value;
      }
    } else {
      this.value = '';
    }
    this.params = params;
  }

  getGui(): HTMLElement {
    this.textarea = document.createElement('textarea');
    this.textarea.style.width = '100%';
    this.textarea.style.height = '100%';
    this.textarea.style.border = 'none';
    this.textarea.style.outline = 'none';
    this.textarea.style.padding = '4px';
    this.textarea.style.resize = 'none';
    this.textarea.style.fontFamily = 'monospace';
    this.textarea.value = this.value;
    
    this.textarea.addEventListener('input', (e: Event) => {
      const target = e.target as HTMLTextAreaElement;
      this.value = target.value;
    });
    
    this.textarea.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' && e.ctrlKey) {
        this.params.api.stopEditing();
      }
    });
    
    return this.textarea;
  }

  afterGuiAttached(): void {
    this.textarea.focus();
    this.textarea.select();
  }

  getValue(): any {
    try {
      return JSON.parse(this.value);
    } catch {
      // Return as { message: ... } if not valid JSON and not empty
      return this.value && this.value.trim() ? { message: this.value.trim() } : {};
    }
  }

  destroy(): void {
    // cleanup if needed
  }

  isPopup(): boolean {
    return false;
  }
}

// Add a helper to format JSON for display
function formatJsonForDisplay(value: any): string {
  if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
    return '-';
  }
  if (typeof value === 'object' && value !== null) {
    // Special case: { message: "..." }
    if (
      Object.keys(value).length === 1 &&
      Object.prototype.hasOwnProperty.call(value, 'message') &&
      typeof value.message === 'string'
    ) {
      return `{message: "${value.message}"}`;
    }
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return '[object Object]';
    }
  }
  if (typeof value === 'string') {
    // If it's a valid JSON string, pretty print it
    try {
      const parsed = JSON.parse(value);
      return JSON.stringify(parsed, null, 2);
    } catch {
      // Show plain sentence as-is
      return value.trim() || '-';
    }
  }
  return '-';
}

// Add a helper to expand ranges like '2-3' to '2,3', '1-4' to '1,2,3,4'
function expandRange(value: string): string {
  if (!value || !value.trim()) return '-';
  // Remove brackets if present
  let v = value.trim().replace(/\[|\]/g, '');
  // Handle comma-separated values
  if (v.includes(',')) {
    return v.split(',').map(s => s.trim()).join(',');
  }
  // Handle ranges like '1-2', '3 - 5', '1 -2', '1-4'
  const rangeMatch = v.match(/^(\d+)\s*-\s*(\d+)$/);
  if (rangeMatch) {
    const start = parseInt(rangeMatch[1], 10);
    const end = parseInt(rangeMatch[2], 10);
    if (!isNaN(start) && !isNaN(end) && start <= end) {
      return Array.from({ length: end - start + 1 }, (_, i) => (start + i).toString()).join(',');
    }
  }
  // If it's a single number
  if (/^\d+$/.test(v)) return v;
  // If nothing matches, show a dash
  return v || '-';
}

export function DataGrid({ entityType }: { entityType: 'clients' | 'workers' | 'tasks' }) {
  const { state, dispatch } = useData();
  const gridRef = useRef<any>(null);

  const getRowData = useCallback((): any[] => {
    const data = (() => {
      switch (entityType) {
        case 'clients': return state.clients || [];
        case 'workers': return state.workers || [];
        case 'tasks': return state.tasks || [];
        default: return [];
      }
    })();
    
    console.log(`📊 DataGrid.getRowData for ${entityType}:`, data);
    if (entityType === 'tasks') {
      data.forEach((task: any, index) => {
        console.log(`📋 Task ${index + 1} PreferredPhase in getRowData:`, task.PreferredPhase);
        console.log(`📋 Task ${index + 1} PreferredPhase type:`, typeof task.PreferredPhase);
        console.log(`📋 Task ${index + 1} PreferredPhase is array:`, Array.isArray(task.PreferredPhase));
        console.log(`📋 Task ${index + 1} Full task data:`, task);
      });
    }
    return data;
  }, [entityType, state]);

  const setRowData = useCallback((data: any[]) => {
    console.log(`📝 DataGrid.setRowData called for ${entityType} with data:`, data);
    
    // Normalize all rows before setting
    const normalizedData = data.map((row, index) => {
      const newRow = { ...row };
      if ('PreferredPhase' in newRow) {
        console.log(`🔧 Normalizing PreferredPhase for row ${index + 1}:`, newRow.PreferredPhase);
        newRow.PreferredPhase = normalizePreferredPhase(newRow.PreferredPhase);
        console.log(`✅ Normalized PreferredPhase for row ${index + 1}:`, newRow.PreferredPhase);
      }
      if ('AttributesJSON' in newRow) {
        newRow.AttributesJSON = normalizeAttributesJSON(newRow.AttributesJSON);
      }
      return newRow;
    });
    
    console.log(`📊 DataGrid.setRowData normalized data:`, normalizedData);
    
    switch (entityType) {
      case 'clients': dispatch({ type: 'SET_CLIENTS', payload: normalizedData }); break;
      case 'workers': dispatch({ type: 'SET_WORKERS', payload: normalizedData }); break;
      case 'tasks': dispatch({ type: 'SET_TASKS', payload: normalizedData }); break;
      default: break;
    }
  }, [entityType, dispatch]);

  const columns = useMemo((): any[] => {
    console.log(`🔧 DataGrid.columns useMemo called for ${entityType}`);
    
    if (entityType === 'clients') {
      return [
        { field: 'ClientID', headerName: 'Client ID', editable: true, width: 120 },
        { field: 'ClientName', headerName: 'Client Name', editable: true, width: 200 },
        { 
          field: 'PriorityLevel', 
          headerName: 'Priority Level', 
          editable: true, 
          width: 130, 
          valueParser: (params: any) => {
            const parsed = parseInt(params.newValue);
            return isNaN(parsed) ? params.oldValue : parsed;
          }
        },
        { 
          field: 'RequestedTaskIDs', 
          headerName: 'Requested Task IDs', 
          editable: true, 
          cellEditor: ArrayEditor, 
          width: 200,
          valueFormatter: (params: any) => {
            if (params.value === null || params.value === undefined || params.value === '') {
              return '-';
            }
            if (Array.isArray(params.value)) {
              return params.value.join(', ');
            }
            return String(params.value);
          }
        },
        { field: 'GroupTag', headerName: 'Group Tag', editable: true, width: 120 },
        {
          field: 'AttributesJSON',
          headerName: 'Attributes JSON',
          editable: true,
          cellEditor: JsonEditor,
          width: 200,
          valueFormatter: (params: any) => formatJsonForDisplay(params.value),
        },
      ];
    } else if (entityType === 'workers') {
      return [
        { field: 'WorkerID', headerName: 'Worker ID', editable: true, width: 120 },
        { field: 'WorkerName', headerName: 'Worker Name', editable: true, width: 200 },
        { 
          field: 'Skills', 
          headerName: 'Skills', 
          editable: true, 
          cellEditor: ArrayEditor, 
          width: 200,
          valueFormatter: (params: any) => {
            if (params.value === null || params.value === undefined || params.value === '') {
              return '-';
            }
            if (Array.isArray(params.value)) {
              return params.value.join(', ');
            }
            return String(params.value);
          }
        },
        { 
          field: 'AvailableSlots', 
          headerName: 'Available Slots', 
          editable: true, 
          cellEditor: JsonEditor, 
          width: 150,
          valueFormatter: (params: any) => {
            if (params.value === null || params.value === undefined || params.value === '') {
              return '-';
            }
            if (Array.isArray(params.value)) {
              return params.value.join(', ');
            }
            return formatJsonForDisplay(params.value);
          }
        },
        { 
          field: 'MaxLoadPerPh', 
          headerName: 'Max Load Per Ph', 
          editable: true, 
          width: 150, 
          valueParser: (params: any) => {
            const parsed = parseInt(params.newValue);
            return isNaN(parsed) ? params.oldValue : parsed;
          }
        },
        { field: 'WorkerGroup', headerName: 'Worker Group', editable: true, width: 120 },
        { 
          field: 'QualificationLevel', 
          headerName: 'Qualification Level', 
          editable: true, 
          width: 150, 
          valueParser: (params: any) => {
            const parsed = parseInt(params.newValue);
            return isNaN(parsed) ? params.oldValue : parsed;
          }
        },
      ];
    } else if (entityType === 'tasks') {
      return [
        { field: 'TaskID', headerName: 'Task ID', editable: true, width: 120 },
        { field: 'TaskName', headerName: 'Task Name', editable: true, width: 200 },
        { field: 'Category', headerName: 'Category', editable: true, width: 120 },
        { 
          field: 'Duration', 
          headerName: 'Duration', 
          editable: true, 
          width: 100, 
          valueParser: (params: any) => {
            const parsed = parseInt(params.newValue);
            return isNaN(parsed) ? params.oldValue : parsed;
          }
        },
        { 
          field: 'RequiredSkills', 
          headerName: 'Required Skills', 
          editable: true, 
          cellEditor: ArrayEditor, 
          width: 200,
          valueFormatter: (params: any) => {
            if (params.value === null || params.value === undefined || params.value === '') {
              return '-';
            }
            if (Array.isArray(params.value)) {
              return params.value.join(', ');
            }
            return String(params.value);
          }
        },
        {
          field: 'PreferredPhase',
          headerName: 'Preferred Phase',
          editable: true,
          cellEditor: PreferredPhaseEditor,
          width: 150,
          valueFormatter: (params: any) => {
            console.log('🔧 PreferredPhase valueFormatter called with params:', params);
            console.log('🔧 PreferredPhase valueFormatter params.value:', params.value);
            console.log('🔧 PreferredPhase valueFormatter params.value type:', typeof params.value);
            console.log('🔧 PreferredPhase valueFormatter full row data:', params.data);
            
            // Handle null, undefined, or empty values
            if (params.value === null || params.value === undefined || params.value === '') {
              console.log('📝 PreferredPhase valueFormatter: Empty value, returning "-"');
              return '-';
            }
            
            // Ensure we have a valid array for display
            let arr: number[];
            if (Array.isArray(params.value) && params.value.every((v: any) => typeof v === 'number')) {
              arr = params.value;
              console.log('✅ PreferredPhase valueFormatter: Using existing array:', arr);
            } else {
              arr = normalizePreferredPhase(params.value);
              console.log('🔄 PreferredPhase valueFormatter: Normalized to array:', arr);
            }
            
            // If array is empty after normalization, show "-"
            if (arr.length === 0) {
              console.log('📝 PreferredPhase valueFormatter: Empty array after normalization, returning "-"');
              return '-';
            }
            
            const result = arr.join(', ');
            console.log('📝 PreferredPhase valueFormatter returning:', result);
            return result;
          },
        },
        { 
          field: 'MaxConcurrent', 
          headerName: 'Max Concurrent', 
          editable: true, 
          width: 130, 
          valueParser: (params: any) => {
            const parsed = parseInt(params.newValue);
            return isNaN(parsed) ? params.oldValue : parsed;
          }
        },
      ];
    }
    return [];
  }, [entityType]);

  const normalizeAttributesJSON = (value: any): any => {
    if (typeof value === 'object' && value !== null) return value;
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return { message: value };
      }
    }
    return { message: String(value) };
  };

  const onCellValueChanged = useCallback((params: any) => {
    console.log('🔧 DataGrid.onCellValueChanged called with params:', params);
    console.log('🔧 DataGrid.onCellValueChanged field:', params.colDef.field);
    console.log('🔧 DataGrid.onCellValueChanged old value:', params.oldValue);
    console.log('🔧 DataGrid.onCellValueChanged new value:', params.newValue);
    
    const updatedData = [...getRowData()];
    const idx = updatedData.findIndex((row: any) => row.id === params.data.id);
    if (idx !== -1) {
      const newRow = { ...updatedData[idx], ...params.data };
      // Normalize PreferredPhase and AttributesJSON if present
      if ('PreferredPhase' in newRow) {
        console.log('🔧 onCellValueChanged: Normalizing PreferredPhase:', newRow.PreferredPhase);
        newRow.PreferredPhase = normalizePreferredPhase(newRow.PreferredPhase);
        console.log('✅ onCellValueChanged: Normalized PreferredPhase:', newRow.PreferredPhase);
      }
      if ('AttributesJSON' in newRow) {
        newRow.AttributesJSON = normalizeAttributesJSON(newRow.AttributesJSON);
      }
      updatedData[idx] = newRow;
      setRowData(updatedData);
    }
  }, [getRowData, setRowData]);

  const defaultColDef = useMemo(() => ({
    flex: 1,
    minWidth: 100,
    resizable: true,
    sortable: true,
    filter: true,
    editable: true,
  }), []);

  const rowData = getRowData();
  
  console.log(`📊 DataGrid render for ${entityType}, rowData length:`, rowData.length);
  if (entityType === 'tasks') {
    rowData.forEach((task, index) => {
      console.log(`📋 Task ${index + 1} in render:`, {
        id: task.id,
        TaskID: task.TaskID,
        PreferredPhase: task.PreferredPhase,
        PreferredPhaseType: typeof task.PreferredPhase,
        PreferredPhaseIsArray: Array.isArray(task.PreferredPhase)
      });
    });
  }

  return (
    <div className="ag-theme-alpine" style={{ width: '100%', height: 600 }}>
      <AgGridReact
        ref={gridRef}
        rowData={rowData}
        columnDefs={columns}
        defaultColDef={defaultColDef}
        stopEditingWhenCellsLoseFocus={true}
        onCellValueChanged={onCellValueChanged}
        domLayout="autoHeight"
        suppressClickEdit={false}
        singleClickEdit={true}
        enableCellTextSelection={true}
        suppressCellFocus={false}
      />
    </div>
  );
}