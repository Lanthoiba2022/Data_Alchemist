'use client';

import React, { useRef, useMemo, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { useData } from '../context/DataContext';

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
    switch (entityType) {
      case 'clients': return state.clients || [];
      case 'workers': return state.workers || [];
      case 'tasks': return state.tasks || [];
      default: return [];
    }
  }, [entityType, state]);

  const setRowData = useCallback((data: any[]) => {
    // Normalize all rows before setting
    const normalizedData = data.map(row => {
      const newRow = { ...row };
      if ('PreferredPhase' in newRow) {
        newRow.PreferredPhase = normalizePreferredPhase(newRow.PreferredPhase);
      }
      if ('AttributesJSON' in newRow) {
        newRow.AttributesJSON = normalizeAttributesJSON(newRow.AttributesJSON);
      }
      return newRow;
    });
    switch (entityType) {
      case 'clients': dispatch({ type: 'SET_CLIENTS', payload: normalizedData }); break;
      case 'workers': dispatch({ type: 'SET_WORKERS', payload: normalizedData }); break;
      case 'tasks': dispatch({ type: 'SET_TASKS', payload: normalizedData }); break;
      default: break;
    }
  }, [entityType, dispatch]);

  const columns = useMemo((): any[] => {
    if (entityType === 'clients') {
      return [
        { field: 'ClientID', headerName: 'Client ID', editable: true, width: 120 },
        { field: 'ClientName', headerName: 'Client Name', editable: true, width: 200 },
        { field: 'PriorityLevel', headerName: 'Priority Level', editable: true, type: 'number', width: 130 },
        { field: 'RequestedTaskIDs', headerName: 'Requested Task IDs', editable: true, cellEditor: ArrayEditor, width: 200 },
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
        { field: 'Skills', headerName: 'Skills', editable: true, cellEditor: ArrayEditor, width: 200 },
        { field: 'AvailableSlots', headerName: 'Available Slots', editable: true, cellEditor: JsonEditor, width: 150 },
        { field: 'MaxLoadPerPh', headerName: 'Max Load Per Ph', editable: true, type: 'number', width: 150 },
        { field: 'WorkerGroup', headerName: 'Worker Group', editable: true, width: 120 },
        { field: 'QualificationLevel', headerName: 'Qualification Level', editable: true, type: 'number', width: 150 },
      ];
    } else if (entityType === 'tasks') {
      return [
        { field: 'TaskID', headerName: 'Task ID', editable: true, width: 120 },
        { field: 'TaskName', headerName: 'Task Name', editable: true, width: 200 },
        { field: 'Category', headerName: 'Category', editable: true, width: 120 },
        { field: 'Duration', headerName: 'Duration', editable: true, type: 'number', width: 100 },
        { field: 'RequiredSkills', headerName: 'Required Skills', editable: true, cellEditor: ArrayEditor, width: 200 },
        {
          field: 'PreferredPhase',
          headerName: 'Preferred Phase',
          editable: true,
          cellEditor: JsonEditor,
          width: 150,
          valueFormatter: (params: any) => {
            const v = params.value;
            if (Array.isArray(v)) {
              return v.length > 0 ? v.join(',') : '-';
            }
            if (typeof v === 'object' && v !== null && Object.prototype.hasOwnProperty.call(v, 'message')) {
              // If it's { message: "..." }, try to expand and show as array
              const arr = normalizePreferredPhase(v.message);
              return arr.length > 0 ? arr.join(',') : '-';
            }
            if (typeof v === 'string') {
              const arr = normalizePreferredPhase(v);
              return arr.length > 0 ? arr.join(',') : '-';
            }
            if (typeof v === 'number') {
              return v.toString();
            }
            return '-';
          },
        },
        { field: 'MaxConcurrent', headerName: 'Max Concurrent', editable: true, type: 'number', width: 130 },
      ];
    }
    return [];
  }, [entityType]);

  const normalizePreferredPhase = (value: any): number[] => {
    // If already an array of numbers, return as is
    if (Array.isArray(value) && value.every(v => typeof v === 'number')) return value;
    // If string or object with message, expand and parse
    let str = '';
    if (typeof value === 'string') str = value;
    else if (typeof value === 'object' && value !== null && 'message' in value) str = value.message;
    else if (typeof value === 'number') return [value];
    else return [];
    // Use expandRange to get comma-separated string, then parse numbers
    const expanded = expandRange(str);
    return expanded.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
  };

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
    const updatedData = [...getRowData()];
    const idx = updatedData.findIndex((row: any) => row.id === params.data.id);
    if (idx !== -1) {
      const newRow = { ...updatedData[idx], ...params.data };
      // Normalize PreferredPhase and AttributesJSON if present
      if ('PreferredPhase' in newRow) {
        newRow.PreferredPhase = normalizePreferredPhase(newRow.PreferredPhase);
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
        suppressRowClickSelection={true}
        suppressCellFocus={false}
      />
    </div>
  );
}