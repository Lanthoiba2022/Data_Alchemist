'use client';

import React from 'react';
import { DataGrid as MuiDataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { Box, Chip, Typography } from '@mui/material';
import { useData } from '../context/DataContext';
import { Client, Worker, Task } from '../types';

interface DataGridProps {
  entityType: 'clients' | 'workers' | 'tasks';
}

export function DataGrid({ entityType }: DataGridProps) {
  const { state, dispatch } = useData();

  const getData = () => {
    switch (entityType) {
      case 'clients': return state.clients;
      case 'workers': return state.workers;
      case 'tasks': return state.tasks;
    }
  };

  const getValidationErrors = () => {
    const entityMap = { clients: 'client', workers: 'worker', tasks: 'task' } as const;
    return state.validationErrors.filter(error => error.entity === entityMap[entityType]);
  };

  const getErrorForCell = (rowIndex: number, field: string) => {
    return getValidationErrors().find(error => 
      error.rowIndex === rowIndex && error.field === field
    );
  };

  const handleCellEditCommit = (params: any) => {
    const { id, field, value } = params;
    const data = getData();
    const rowIndex = data.findIndex((item: any) => item.id === id);
    
    if (rowIndex === -1) return;

    const updatedItem = { ...data[rowIndex], [field]: value };
    
    switch (entityType) {
      case 'clients':
        dispatch({ type: 'UPDATE_CLIENT', payload: { index: rowIndex, client: updatedItem as Client } });
        break;
      case 'workers':
        dispatch({ type: 'UPDATE_WORKER', payload: { index: rowIndex, worker: updatedItem as Worker } });
        break;
      case 'tasks':
        dispatch({ type: 'UPDATE_TASK', payload: { index: rowIndex, task: updatedItem as Task } });
        break;
    }
  };

  const renderArrayCell = (params: GridRenderCellParams) => {
    const error = getErrorForCell(params.row.id, params.field);
    const values = Array.isArray(params.value) ? params.value : [];
    
    return (
      <Box
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 0.5,
          backgroundColor: error ? 'error.light' : 'transparent',
          border: error ? '1px solid error.main' : 'none',
          borderRadius: 1,
          px: 1,
        }}
      >
        {values.map((value, index) => (
          <Chip key={index} label={value} size="small" />
        ))}
        {error && (
          <Typography variant="caption" color="error" sx={{ ml: 1 }}>
            {error.message}
          </Typography>
        )}
      </Box>
    );
  };

  const renderJsonCell = (params: GridRenderCellParams) => {
    const error = getErrorForCell(params.row.id, params.field);
    const jsonValue = typeof params.value === 'string' ? params.value : JSON.stringify(params.value);
    
    return (
      <Box
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          backgroundColor: error ? 'error.light' : 'transparent',
          border: error ? '1px solid error.main' : 'none',
          borderRadius: 1,
          px: 1,
        }}
      >
        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
          {jsonValue}
        </Typography>
        {error && (
          <Typography variant="caption" color="error" sx={{ ml: 1 }}>
            {error.message}
          </Typography>
        )}
      </Box>
    );
  };

  const getColumns = (): GridColDef[] => {
    switch (entityType) {
      case 'clients':
        return [
          { field: 'ClientID', headerName: 'Client ID', width: 120, editable: true },
          { field: 'ClientName', headerName: 'Client Name', width: 200, editable: true },
          { 
            field: 'PriorityLevel', 
            headerName: 'Priority Level', 
            width: 130, 
            type: 'number',
            editable: true,
          },
          { 
            field: 'RequestedTaskIDs', 
            headerName: 'Requested Task IDs', 
            width: 200,
            editable: true,
            renderCell: renderArrayCell,
          },
          { field: 'GroupTag', headerName: 'Group Tag', width: 120, editable: true },
          { 
            field: 'AttributesJSON', 
            headerName: 'Attributes JSON', 
            width: 200,
            editable: true,
            renderCell: renderJsonCell,
          },
        ];

      case 'workers':
        return [
          { field: 'WorkerID', headerName: 'Worker ID', width: 120, editable: true },
          { field: 'WorkerName', headerName: 'Worker Name', width: 200, editable: true },
          { 
            field: 'Skills', 
            headerName: 'Skills', 
            width: 200,
            editable: true,
            renderCell: renderArrayCell,
          },
          { 
            field: 'AvailableSlots', 
            headerName: 'Available Slots', 
            width: 150,
            editable: true,
            renderCell: renderArrayCell,
          },
          { 
            field: 'MaxLoadPerPh', 
            headerName: 'Max Load Per Ph', 
            width: 150,
            type: 'number',
            editable: true,
          },
          { field: 'WorkerGroup', headerName: 'Worker Group', width: 120, editable: true },
          { 
            field: 'QualificationLevel', 
            headerName: 'Qualification Level', 
            width: 150,
            type: 'number',
            editable: true,
          },
        ];

      case 'tasks':
        return [
          { field: 'TaskID', headerName: 'Task ID', width: 120, editable: true },
          { field: 'TaskName', headerName: 'Task Name', width: 200, editable: true },
          { field: 'Category', headerName: 'Category', width: 120, editable: true },
          { 
            field: 'Duration', 
            headerName: 'Duration', 
            width: 100,
            type: 'number',
            editable: true,
          },
          { 
            field: 'RequiredSkills', 
            headerName: 'Required Skills', 
            width: 200,
            editable: true,
            renderCell: renderArrayCell,
          },
          { 
            field: 'PreferredPhase', 
            headerName: 'Preferred Phase', 
            width: 150,
            editable: true,
            renderCell: renderArrayCell,
          },
          { 
            field: 'MaxConcurrent', 
            headerName: 'Max Concurrent', 
            width: 130,
            type: 'number',
            editable: true,
          },
        ];

      default:
        return [];
    }
  };

  const data = getData().map((item, index) => ({
    ...item,
    id: index, // Add id for DataGrid
  }));

  return (
    <Box sx={{ height: 400, width: '100%' }}>
      <MuiDataGrid
        rows={data}
        columns={getColumns()}
        pageSizeOptions={[5, 10, 25]}
        initialState={{
          pagination: {
            paginationModel: { page: 0, pageSize: 10 },
          },
        }}
        disableRowSelectionOnClick
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
  );
} 