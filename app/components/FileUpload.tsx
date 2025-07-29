'use client';

import React, { useState } from 'react';
import { Box, Button, Typography, Alert, CircularProgress, Paper, Stack } from '@mui/material';
import { CloudUpload, Description, Download } from '@mui/icons-material';
import { useData } from '../context/DataContext';
import { FileParser } from '../utils/fileParser';
import { DataTransformer } from '../utils/dataTransformer';
import { ExcelTemplateGenerator } from '../utils/excelTemplate';
import { Client, Worker, Task } from '../types';
import axios from 'axios';

interface FileUploadProps {
  entityType: 'clients' | 'workers' | 'tasks';
  onUploadComplete?: () => void;
}

export function FileUpload({ entityType, onUploadComplete }: FileUploadProps) {
  const { dispatch } = useData();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Clear all data handler
  const handleClearAll = () => {
    localStorage.removeItem('dataAlchemistState');
    dispatch({ type: 'CLEAR_ALL_DATA' });
    setSuccess('All data cleared.');
    setError(null);
  };

  const expectedSchemas = {
    clients: ['ClientID', 'ClientName', 'PriorityLevel', 'RequestedTaskIDs', 'GroupTag', 'AttributesJSON'],
    workers: ['WorkerID', 'WorkerName', 'Skills', 'AvailableSlots', 'MaxLoadPerPh', 'WorkerGroup', 'QualificationLevel'],
    tasks: ['TaskID', 'TaskName', 'Category', 'Duration', 'RequiredSkills', 'PreferredPhase', 'MaxConcurrent'],
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    try {
      let result;
      let transformedData;
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (['xlsx', 'xls'].includes(fileExtension || '')) {
        // Parse all sheets and dynamically map by sheet name
        const allSheets = await FileParser.parseExcelMultiSheet(file);
        let imported = false;
        Object.entries(allSheets).forEach(([sheetName, sheetData]) => {
          const normalized = sheetName.trim().toLowerCase();
          if (normalized.includes('client')) {
            transformedData = DataTransformer.transformClients(sheetData.data);
            const { valid } = DataTransformer.validateAndClean(transformedData, 'client');
            if (valid.length > 0) {
              dispatch({ type: 'SET_CLIENTS', payload: valid });
              dispatch({ type: 'SET_FILE_UPLOADED', payload: 'clients' });
              setSuccess((prev) => (prev ? prev + ' ' : '') + `Imported ${valid.length} clients.`);
              imported = true;
            }
          } else if (normalized.includes('worker')) {
            transformedData = DataTransformer.transformWorkers(sheetData.data);
            const { valid } = DataTransformer.validateAndClean(transformedData, 'worker');
            if (valid.length > 0) {
              dispatch({ type: 'SET_WORKERS', payload: valid });
              dispatch({ type: 'SET_FILE_UPLOADED', payload: 'workers' });
              setSuccess((prev) => (prev ? prev + ' ' : '') + `Imported ${valid.length} workers.`);
              imported = true;
            }
          } else if (normalized.includes('task')) {
            transformedData = DataTransformer.transformTasks(sheetData.data);
            const { valid } = DataTransformer.validateAndClean(transformedData, 'task');
            if (valid.length > 0) {
              dispatch({ type: 'SET_TASKS', payload: valid });
              dispatch({ type: 'SET_FILE_UPLOADED', payload: 'tasks' });
              setSuccess((prev) => (prev ? prev + ' ' : '') + `Imported ${valid.length} tasks.`);
              imported = true;
            }
          }
        });
        if (!imported) {
          setError('No valid data found in any sheet (clients, workers, tasks).');
        }
        setIsUploading(false);
        onUploadComplete?.();
        return;
      }
      
      switch (entityType) {
        case 'clients':
          result = await FileParser.parseFile<any>(file);
          if (result.data.length > 0) {
            // After reading the file and before parsing rows:
            let headers = [];
            if (result && result.meta && result.meta.fields) {
              headers = result.meta.fields;
            } else if (result && result.data && result.data[0]) {
              headers = Object.keys(result.data[0]);
            }
            let mapping = null;
            if (headers.length > 0) {
              try {
                const response = await axios.post('/api/ai-header-map', {
                  headers,
                  expected: expectedSchemas[entityType],
                });
                mapping = response.data.mapping;
              } catch {
                mapping = null;
              }
            }
            // If mapping is present, remap columns
            let remappedData = result.data;
            if (mapping) {
              remappedData = result.data.map((row: any) => {
                const newRow: any = {};
                Object.entries(mapping).forEach(([header, mapped]) => {
                  if (mapped && row[header] !== undefined) newRow[mapped] = row[header];
                });
                return newRow;
              });
            }
            transformedData = DataTransformer.transformClients(remappedData);
            const { valid, invalid } = DataTransformer.validateAndClean(transformedData, 'client');
            
            if (valid.length > 0) {
              dispatch({ type: 'SET_CLIENTS', payload: valid });
              dispatch({ type: 'SET_FILE_UPLOADED', payload: 'clients' });
              setSuccess(`Successfully uploaded ${valid.length} clients${invalid.length > 0 ? ` (${invalid.length} invalid rows skipped)` : ''}`);
            }
            
            if (invalid.length > 0) {
              setError(`Invalid rows: ${invalid.map(i => `Row ${i.index + 1}: ${i.error}`).join(', ')}`);
            }
          }
          break;
          
        case 'workers':
          result = await FileParser.parseFile<any>(file);
          if (result.data.length > 0) {
            // After reading the file and before parsing rows:
            let headers = [];
            if (result && result.meta && result.meta.fields) {
              headers = result.meta.fields;
            } else if (result && result.data && result.data[0]) {
              headers = Object.keys(result.data[0]);
            }
            let mapping = null;
            if (headers.length > 0) {
              try {
                const response = await axios.post('/api/ai-header-map', {
                  headers,
                  expected: expectedSchemas[entityType],
                });
                mapping = response.data.mapping;
              } catch {
                mapping = null;
              }
            }
            // If mapping is present, remap columns
            let remappedData = result.data;
            if (mapping) {
              remappedData = result.data.map((row: any) => {
                const newRow: any = {};
                Object.entries(mapping).forEach(([header, mapped]) => {
                  if (mapped && row[header] !== undefined) newRow[mapped] = row[header];
                });
                return newRow;
              });
            }
            transformedData = DataTransformer.transformWorkers(remappedData);
            const { valid, invalid } = DataTransformer.validateAndClean(transformedData, 'worker');
            
            if (valid.length > 0) {
              dispatch({ type: 'SET_WORKERS', payload: valid });
              dispatch({ type: 'SET_FILE_UPLOADED', payload: 'workers' });
              setSuccess(`Successfully uploaded ${valid.length} workers${invalid.length > 0 ? ` (${invalid.length} invalid rows skipped)` : ''}`);
            }
            
            if (invalid.length > 0) {
              setError(`Invalid rows: ${invalid.map(i => `Row ${i.index + 1}: ${i.error}`).join(', ')}`);
            }
          }
          break;
          
        case 'tasks':
          result = await FileParser.parseFile<any>(file);
          if (result.data.length > 0) {
            // After reading the file and before parsing rows:
            let headers = [];
            if (result && result.meta && result.meta.fields) {
              headers = result.meta.fields;
            } else if (result && result.data && result.data[0]) {
              headers = Object.keys(result.data[0]);
            }
            let mapping = null;
            if (headers.length > 0) {
              try {
                const response = await axios.post('/api/ai-header-map', {
                  headers,
                  expected: expectedSchemas[entityType],
                });
                mapping = response.data.mapping;
              } catch {
                mapping = null;
              }
            }
            // If mapping is present, remap columns
            let remappedData = result.data;
            if (mapping) {
              remappedData = result.data.map((row: any) => {
                const newRow: any = {};
                Object.entries(mapping).forEach(([header, mapped]) => {
                  if (mapped && row[header] !== undefined) newRow[mapped] = row[header];
                });
                return newRow;
              });
            }
            transformedData = DataTransformer.transformTasks(remappedData);
            const { valid, invalid } = DataTransformer.validateAndClean(transformedData, 'task');
            
            if (valid.length > 0) {
              dispatch({ type: 'SET_TASKS', payload: valid });
              dispatch({ type: 'SET_FILE_UPLOADED', payload: 'tasks' });
              setSuccess(`Successfully uploaded ${valid.length} tasks${invalid.length > 0 ? ` (${invalid.length} invalid rows skipped)` : ''}`);
            }
            
            if (invalid.length > 0) {
              setError(`Invalid rows: ${invalid.map(i => `Row ${i.index + 1}: ${i.error}`).join(', ')}`);
            }
          }
          break;
      }

      if (result.errors.length > 0) {
        setError(`Parse errors: ${result.errors.join(', ')}`);
      }

      if (result.data.length === 0) {
        setError('No valid data found in the file');
      }

      onUploadComplete?.();
    } catch (err) {
      setError(`Upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const getEntityDisplayName = () => {
    switch (entityType) {
      case 'clients': return 'Clients';
      case 'workers': return 'Workers';
      case 'tasks': return 'Tasks';
    }
  };

  const getExpectedColumns = () => {
    switch (entityType) {
      case 'clients':
        return 'ClientID, ClientName, PriorityLevel, RequestedTaskIDs, GroupTag, AttributesJSON';
      case 'workers':
        return 'WorkerID, WorkerName, Skills, AvailableSlots, MaxLoadPerPh, WorkerGroup, QualificationLevel';
      case 'tasks':
        return 'TaskID, TaskName, Category, Duration, RequiredSkills, PreferredPhase, MaxConcurrent';
    }
  };

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Button
          variant="contained"
          component="label"
          startIcon={<CloudUpload />}
          disabled={isUploading}
        >
          Upload {getEntityDisplayName()} File
          <input
            type="file"
            accept=".csv, .xlsx, .xls"
            hidden
            onChange={handleFileUpload}
          />
        </Button>
        <Button
          variant="outlined"
          color="error"
          onClick={handleClearAll}
          startIcon={<Download />}
        >
          Clear All Data
        </Button>
        {isUploading && <CircularProgress size={24} />}
      </Stack>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Expected columns: {getExpectedColumns()}
      </Typography>

      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        
        <Button
          variant="outlined"
          startIcon={<Download />}
          onClick={() => {
            switch (entityType) {
              case 'clients':
                ExcelTemplateGenerator.generateClientsTemplate();
                break;
              case 'workers':
                ExcelTemplateGenerator.generateWorkersTemplate();
                break;
              case 'tasks':
                ExcelTemplateGenerator.generateTasksTemplate();
                break;
            }
          }}
        >
          Download Template
        </Button>
      </Stack>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
        <Description fontSize="small" />
        <Typography variant="caption">
          Supports CSV and Excel files
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {success}
        </Alert>
      )}
    </Paper>
  );
}