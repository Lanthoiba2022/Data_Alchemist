'use client';

import React, { useState, useEffect } from 'react';
import { DataGrid as MuiDataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { Box, Chip, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, Alert } from '@mui/material';
import { Download, Warning } from '@mui/icons-material';
import { useData } from '../context/DataContext';
import { Client, Worker, Task } from '../types';
import { FileParser } from '../utils/fileParser';
import { DataTransformer } from '../utils/dataTransformer';
import { sampleClients, sampleWorkers, sampleTasks } from '../utils/sampleData';
import TextField from '@mui/material/TextField';
import axios from 'axios';
import Tooltip from '@mui/material/Tooltip';

interface DataGridProps {
  entityType: 'clients' | 'workers' | 'tasks';
}

export function DataGrid({ entityType }: DataGridProps) {
  const { state, dispatch } = useData();
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
  const [nlQuery, setNlQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [filteredRows, setFilteredRows] = useState<any[] | null>(null);

  // Define getValidationErrors first
  const getValidationErrors = () => {
    const entityMap = { clients: 'client', workers: 'worker', tasks: 'task' } as const;
    return state.validationErrors.filter(error => error.entity === entityMap[entityType]);
  };

  // Then getErrorForCell
  const getErrorForCell = (rowIndex: number, field: string) => {
    return getValidationErrors().find(error => 
      error.rowIndex === rowIndex && error.field === field
    );
  };

  // Then renderArrayCell
  const renderArrayCell = (params: GridRenderCellParams) => {
    const error = getErrorForCell(params.row.id, params.field);
    let values: string[] = [];
    const val = params.row[params.field];
    if (Array.isArray(val)) {
      values = val.map((v: any) => String(v));
    } else if (typeof val === 'string') {
      values = val.split(',').map((v: string) => v.trim()).filter((v: string) => v.length > 0);
    } else if (val !== undefined && val !== null) {
      values = [String(val)];
    }
    return (
      <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.5, backgroundColor: error ? 'error.light' : 'transparent', border: error ? '1px solid error.main' : 'none', borderRadius: 1, px: 1 }}>
        {values.map((value, index) => (
          <Chip key={index} label={value} size="small" />
        ))}
        {error && (
          <Typography variant="caption" color="error" sx={{ ml: 1 }}>{error.message}</Typography>
        )}
      </Box>
    );
  };

  // Then renderJsonCell
  const renderJsonCell = (params: GridRenderCellParams) => {
    const error = getErrorForCell(params.row.id, params.field);
    let displayValue = '';
    const val = params.row[params.field];
    if (typeof val === 'object' && val !== null) {
      displayValue = JSON.stringify(val, null, 2);
    } else if (typeof val === 'string') {
      try {
        displayValue = JSON.stringify(JSON.parse(val), null, 2);
      } catch {
        displayValue = val;
      }
    } else if (val === null || val === undefined) {
      displayValue = '{}';
    } else {
      displayValue = String(val);
    }
    return (
      <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', backgroundColor: error ? 'error.light' : 'transparent', border: error ? '1px solid error.main' : 'none', borderRadius: 1, px: 1 }}>
        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{displayValue}</Typography>
        {error && (
          <Typography variant="caption" color="error" sx={{ ml: 1 }}>{error.message}</Typography>
        )}
      </Box>
    );
  };

  // Then getColumns
  const getColumns = (): GridColDef[] => {
    switch (entityType) {
      case 'clients':
        return [
          { field: 'ClientID', headerName: 'Client ID', width: 120, editable: true },
          { field: 'ClientName', headerName: 'Client Name', width: 200, editable: true },
          { field: 'PriorityLevel', headerName: 'Priority Level', width: 130, type: 'number', editable: true },
          { field: 'RequestedTaskIDs', headerName: 'Requested Task IDs', width: 200, editable: true,
            renderCell: renderArrayCell,
            valueGetter: (params: any) => {
              const val = params.row?.RequestedTaskIDs;
              if (Array.isArray(val)) return val.join(',');
              if (typeof val === 'string') return val;
              return '';
            },
            valueFormatter: (params: any) => {
              const val = params.value;
              if (Array.isArray(val)) return val.join(',');
              if (typeof val === 'string') return val;
              return '';
            },
            renderEditCell: (params: any) => {
              // Always use the row value for editing
              let value = params.row?.RequestedTaskIDs;
              if (Array.isArray(value)) value = value.join(',');
              if (typeof value !== 'string') value = '';
              return (
                <input
                  type="text"
                  defaultValue={value}
                  onBlur={e => params.api.setEditCellValue({ id: params.id, field: params.field, value: e.target.value }, e)}
                  autoFocus
                  style={{ width: '100%' }}
                />
              );
            }
          },
          { field: 'GroupTag', headerName: 'Group Tag', width: 120, editable: true },
          { field: 'AttributesJSON', headerName: 'Attributes JSON', width: 200, editable: true,
            renderCell: renderJsonCell,
            valueFormatter: (params: any) => {
              if (typeof params.value === 'object' && params.value !== null) return JSON.stringify(params.value, null, 2);
              if (typeof params.value === 'string') {
                try { return JSON.stringify(JSON.parse(params.value), null, 2); } catch { return params.value; }
              }
              return '{}';
            },
            renderEditCell: (params: any) => <input type="text" defaultValue={typeof params.value === 'object' ? JSON.stringify(params.value) : (params.value || '')} onBlur={e => params.api.setEditCellValue({ id: params.id, field: params.field, value: e.target.value }, e)} autoFocus style={{ width: '100%' }} />
          },
        ];
      case 'workers':
        return [
          { field: 'WorkerID', headerName: 'Worker ID', width: 120, editable: true },
          { field: 'WorkerName', headerName: 'Worker Name', width: 200, editable: true },
          { field: 'Skills', headerName: 'Skills', width: 200, editable: true,
            renderCell: renderArrayCell,
            valueGetter: (params: any) => Array.isArray(params.row?.Skills) ? params.row.Skills.join(',') : (params.row?.Skills || ''),
            valueFormatter: (params: any) => Array.isArray(params.value) ? params.value.join(',') : (params.value || ''),
            renderEditCell: (params: any) => <input type="text" defaultValue={Array.isArray(params.value) ? params.value.join(',') : (params.value || '')} onBlur={e => params.api.setEditCellValue({ id: params.id, field: params.field, value: e.target.value }, e)} autoFocus style={{ width: '100%' }} />
          },
          { field: 'AvailableSlots', headerName: 'Available Slots', width: 150, editable: true,
            renderCell: renderJsonCell,
            valueGetter: (params: any) => Array.isArray(params.row?.AvailableSlots) ? JSON.stringify(params.row.AvailableSlots) : (params.row?.AvailableSlots || '[]'),
            valueFormatter: (params: any) => Array.isArray(params.value) ? JSON.stringify(params.value) : (params.value || '[]'),
            renderEditCell: (params: any) => <input type="text" defaultValue={Array.isArray(params.value) ? JSON.stringify(params.value) : (params.value || '[]')} onBlur={e => params.api.setEditCellValue({ id: params.id, field: params.field, value: e.target.value }, e)} autoFocus style={{ width: '100%' }} />
          },
          { field: 'MaxLoadPerPh', headerName: 'Max Load Per Ph', width: 150, type: 'number', editable: true },
          { field: 'WorkerGroup', headerName: 'Worker Group', width: 120, editable: true },
          { field: 'QualificationLevel', headerName: 'Qualification Level', width: 150, type: 'number', editable: true },
        ];
      case 'tasks':
        return [
          { field: 'TaskID', headerName: 'Task ID', width: 120, editable: true },
          { field: 'TaskName', headerName: 'Task Name', width: 200, editable: true },
          { field: 'Category', headerName: 'Category', width: 120, editable: true },
          { field: 'Duration', headerName: 'Duration', width: 100, type: 'number', editable: true },
          { field: 'RequiredSkills', headerName: 'Required Skills', width: 200, editable: true,
            renderCell: renderArrayCell,
            valueGetter: (params: any) => Array.isArray(params.row?.RequiredSkills) ? params.row.RequiredSkills.join(',') : (params.row?.RequiredSkills || ''),
            valueFormatter: (params: any) => Array.isArray(params.value) ? params.value.join(',') : (params.value || ''),
            renderEditCell: (params: any) => <input type="text" defaultValue={Array.isArray(params.value) ? params.value.join(',') : (params.value || '')} onBlur={e => params.api.setEditCellValue({ id: params.id, field: params.field, value: e.target.value }, e)} autoFocus style={{ width: '100%' }} />
          },
          { field: 'PreferredPhase', headerName: 'Preferred Phase', width: 150, editable: true,
            renderCell: renderJsonCell,
            valueGetter: (params: any) => Array.isArray(params.row?.PreferredPhase) ? JSON.stringify(params.row.PreferredPhase) : (params.row?.PreferredPhase || '[]'),
            valueFormatter: (params: any) => Array.isArray(params.value) ? JSON.stringify(params.value) : (params.value || '[]'),
            renderEditCell: (params: any) => <input type="text" defaultValue={Array.isArray(params.value) ? JSON.stringify(params.value) : (params.value || '[]')} onBlur={e => params.api.setEditCellValue({ id: params.id, field: params.field, value: e.target.value }, e)} autoFocus style={{ width: '100%' }} />
          },
          { field: 'MaxConcurrent', headerName: 'Max Concurrent', width: 130, type: 'number', editable: true },
        ];
      default:
        return [];
    }
  };

  const schema = getColumns().map(col => ({ field: col.field, type: col.type || 'string' }));

  const handleNLSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nlQuery.trim()) return;
    setIsSearching(true);
    try {
      const data = getData();
      const response = await axios.post('/api/nl-search', { query: nlQuery, schema });
      const { filterBody } = response.data;
      // eslint-disable-next-line no-new-func
      const filterFn = new Function('row', filterBody);
      const filtered = data.filter((row: any) => {
        try {
          return filterFn(row);
        } catch {
          return false;
        }
      });
      setFilteredRows(filtered);
    } catch {
      setFilteredRows([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Remove the useEffect that loads sample data automatically

  const getData = () => {
    switch (entityType) {
      case 'clients': return state.clients;
      case 'workers': return state.workers;
      case 'tasks': return state.tasks;
    }
  };

  // Remove handleCellEditCommit and use only processRowUpdate for real-time editing

  // Fix RequestedTaskIDs editing: always show the current value
  const processRowUpdate = (newRow: any, oldRow: any) => {
    const data = getData();
    const rowIndex = data.findIndex((item: any) => item.id === oldRow.id);
    if (rowIndex === -1) return oldRow;
    // Validate JSON for AttributesJSON
    if ('AttributesJSON' in newRow) {
      let val = newRow.AttributesJSON;
      if (typeof val === 'string') {
        try {
          newRow.AttributesJSON = JSON.stringify(JSON.parse(val));
        } catch {
          // keep as string if invalid
        }
      }
    }
    // Ensure blank fields are editable and persist
    Object.keys(newRow).forEach((key) => {
      if (newRow[key] === undefined) newRow[key] = '';
    });
    // Special handling for RequestedTaskIDs: always store as array, but edit as string
    if ('RequestedTaskIDs' in newRow) {
      if (typeof newRow.RequestedTaskIDs === 'string') {
        newRow.RequestedTaskIDs = newRow.RequestedTaskIDs.split(',').map((id: string) => id.trim()).filter((id: string) => id.length > 0);
      } else if (!Array.isArray(newRow.RequestedTaskIDs)) {
        newRow.RequestedTaskIDs = [];
      }
    }
    switch (entityType) {
      case 'clients': {
        const updated = [...state.clients];
        updated[rowIndex] = { ...updated[rowIndex], ...newRow };
        dispatch({ type: 'SET_CLIENTS', payload: updated });
        break;
      }
      case 'workers': {
        const updated = [...state.workers];
        updated[rowIndex] = { ...updated[rowIndex], ...newRow };
        dispatch({ type: 'SET_WORKERS', payload: updated });
        break;
      }
      case 'tasks': {
        const updated = [...state.tasks];
        updated[rowIndex] = { ...updated[rowIndex], ...newRow };
        dispatch({ type: 'SET_TASKS', payload: updated });
        break;
      }
    }
    return newRow;
  };

  const data = getData().map((item, index) => {
    if (entityType === 'clients') return { ...item, id: (item as Client).ClientID || index };
    if (entityType === 'workers') return { ...item, id: (item as Worker).WorkerID || index };
    if (entityType === 'tasks') return { ...item, id: (item as Task).TaskID || index };
    return { ...item, id: index };
  });

  const errors = getValidationErrors();
  const hasErrors = errors.length > 0;

  return (
    <Box>
      {/* NL Search Bar */}
      <form onSubmit={handleNLSearch} style={{ marginBottom: 16 }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Tooltip title="Type a plain English query to filter the table (e.g. 'Tasks longer than 1 phase')">
            <input
              type="text"
              placeholder="Search with natural language (e.g. Tasks longer than 1 phase)"
              value={nlQuery}
              onChange={e => setNlQuery(e.target.value)}
              style={{ flex: 1, padding: 8, fontSize: 16 }}
              disabled={isSearching}
              aria-label="Natural Language Search"
            />
          </Tooltip>
          <Tooltip title="Use AI to filter the table based on your query">
            <span>
              <Button type="submit" variant="outlined" disabled={isSearching || !nlQuery.trim()} aria-label="NL Search">
                {isSearching ? 'Searching...' : 'NL Search'}
              </Button>
            </span>
          </Tooltip>
          {filteredRows && (
            <Button variant="text" color="secondary" onClick={() => { setFilteredRows(null); setNlQuery(''); }} aria-label="Clear NL Search">Clear</Button>
          )}
        </Box>
      </form>
      {/* Data Grid */}
      <Box sx={{ height: 400, width: '100%' }}>
        <MuiDataGrid
          rows={filteredRows !== null ? filteredRows : data}
          columns={getColumns()}
          pageSizeOptions={[5, 10, 25]}
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: 10 },
            },
          }}
          disableRowSelectionOnClick
          processRowUpdate={processRowUpdate}
          // Remove onCellEditStop for consistency
          sx={{
            '& .MuiDataGrid-cell': {
              borderBottom: '1px solid #e0e0e0',
            },
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: '#f5f5f5',
              borderBottom: '2px solid #e0e0e0',
            },
          }}
        />
      </Box>

      {/* Download Confirmation Dialog */}
      <Dialog open={downloadDialogOpen} onClose={() => setDownloadDialogOpen(false)}>
        <DialogTitle>Download with Validation Errors</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            There are {errors.length} validation errors in the data. 
            This may cause issues when importing the data elsewhere.
          </Alert>
          <Typography variant="body2" color="text.secondary">
            Do you want to continue with the download?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDownloadDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={() => {
              const data = getData();
              const filename = `${entityType}-with-errors.csv`;
              FileParser.exportToCSV(data as any[], filename);
              setDownloadDialogOpen(false);
            }} 
            variant="contained" 
            color="error"
          >
            Download Anyway
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 