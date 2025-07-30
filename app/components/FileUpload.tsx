'use client';

import React, { useState } from 'react';
import { Box, Button, Typography, Alert, CircularProgress, Paper, Stack } from '@mui/material';
import { CloudUpload, Description, Download } from '@mui/icons-material';
import { useData } from '../context/DataContext';
import { FileParser } from '../utils/fileParser';
import { DataTransformer } from '../utils/dataTransformer';
import { ExcelTemplateGenerator } from '../utils/excelTemplate';
import { Client, Worker, Task } from '../types';

interface FileUploadProps {
  entityType: 'clients' | 'workers' | 'tasks';
  onUploadComplete?: () => void;
}

export function FileUpload({ entityType, onUploadComplete }: FileUploadProps) {
  const { dispatch } = useData();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Clear specific data handler
  const handleClearData = () => {
    switch (entityType) {
      case 'clients':
        dispatch({ type: 'CLEAR_CLIENTS_DATA' });
        setSuccess('All clients data cleared.');
        break;
      case 'workers':
        dispatch({ type: 'CLEAR_WORKERS_DATA' });
        setSuccess('All workers data cleared.');
        break;
      case 'tasks':
        dispatch({ type: 'CLEAR_TASKS_DATA' });
        setSuccess('All tasks data cleared.');
        break;
    }
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

    console.log('🚀 FileUpload.handleFileUpload started with file:', file.name);
    setIsUploading(true);
    setError(null);
    setSuccess(null);

    try {
      let result;
      let transformedData;
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      console.log('📁 FileUpload: File extension:', fileExtension);
      if (['xlsx', 'xls'].includes(fileExtension || '')) {
        console.log('📊 FileUpload: Processing Excel file with multiple sheets');
        // Parse all sheets and dynamically map by sheet name
        const allSheets = await FileParser.parseExcelMultiSheet(file);
        console.log('📊 FileUpload: Parsed sheets:', Object.keys(allSheets));
        let imported = false;
        Object.entries(allSheets).forEach(([sheetName, sheetData]) => {
          const normalized = sheetName.trim().toLowerCase();
          console.log(`📋 FileUpload: Processing sheet "${sheetName}" (normalized: "${normalized}")`);
          console.log(`📋 FileUpload: Sheet data:`, sheetData);
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
            console.log('📋 FileUpload: Processing as tasks sheet');
            console.log('📋 FileUpload: Raw task data before transformation:', sheetData.data);
            transformedData = DataTransformer.transformTasks(sheetData.data);
            console.log('📋 FileUpload: Transformed task data:', transformedData);
            const { valid, invalid } = DataTransformer.validateAndClean(transformedData, 'task');
            console.log('📋 FileUpload: Validation results - valid:', valid.length, 'invalid:', invalid.length);
            if (valid.length > 0) {
              dispatch({ type: 'SET_TASKS', payload: valid });
              dispatch({ type: 'SET_FILE_UPLOADED', payload: 'tasks' });
              setSuccess((prev) => (prev ? prev + ' ' : '') + `Imported ${valid.length} tasks.`);
              imported = true;
            }
            if (invalid.length > 0) {
              console.log('❌ FileUpload: Invalid tasks:', invalid);
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
            let headers: string[] = [];
            if (result && result.data && result.data[0]) {
              headers = Object.keys(result.data[0]);
            }
            let mapping = null;
            if (headers.length > 0) {
              try {
                const response = await fetch('/api/ai-header-map', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    headers,
                    expected: expectedSchemas[entityType],
                  }),
                });
                
                if (response.ok) {
                  const responseData = await response.json();
                  mapping = responseData.mapping;
                }
              } catch {
                mapping = null;
              }
            }
            // If mapping is present, remap columns
            let remappedData = result.data;
            if (mapping) {
              remappedData = result.data.map((row: any) => {
                const newRow: any = {};
                Object.entries(mapping as Record<string, string>).forEach(([header, mapped]) => {
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
            let headers: string[] = [];
            if (result && result.data && result.data[0]) {
              headers = Object.keys(result.data[0]);
            }
            let mapping = null;
            if (headers.length > 0) {
              try {
                const response = await fetch('/api/ai-header-map', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    headers,
                    expected: expectedSchemas[entityType],
                  }),
                });
                
                if (response.ok) {
                  const responseData = await response.json();
                  mapping = responseData.mapping;
                }
              } catch {
                mapping = null;
              }
            }
            // If mapping is present, remap columns
            let remappedData = result.data;
            if (mapping) {
              remappedData = result.data.map((row: any) => {
                const newRow: any = {};
                Object.entries(mapping as Record<string, string>).forEach(([header, mapped]) => {
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
          console.log('📋 FileUpload: Processing single file as tasks');
          result = await FileParser.parseFile<any>(file);
          console.log('📋 FileUpload: Parse result:', result);
          
          if (result.data.length > 0) {
            console.log('📋 FileUpload: Raw data from file:', result.data);
            // After reading the file and before parsing rows:
            let headers: string[] = [];
            if (result && result.data && result.data[0]) {
              headers = Object.keys(result.data[0]);
            }
            let mapping = null;
            if (headers.length > 0) {
              try {
                const response = await fetch('/api/ai-header-map', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    headers,
                    expected: expectedSchemas[entityType],
                  }),
                });
                if (response.ok) {
                  const responseData = await response.json();
                  mapping = responseData.mapping;
                }
              } catch {
                mapping = null;
              }
            }
            // If mapping is present, remap columns
            let remappedData = result.data;
            if (mapping) {
              remappedData = result.data.map((row: any) => {
                const newRow: any = {};
                Object.entries(mapping as Record<string, string>).forEach(([header, mapped]) => {
                  if (mapped && row[header] !== undefined) newRow[mapped] = row[header];
                });
                return newRow;
              });
            }
            console.log('📋 FileUpload: Data before transformation:', remappedData);
            transformedData = DataTransformer.transformTasks(remappedData);
            console.log('📋 FileUpload: Data after transformation:', transformedData);
            
            const { valid, invalid } = DataTransformer.validateAndClean(transformedData, 'task');
            console.log('📋 FileUpload: Validation results - valid:', valid.length, 'invalid:', invalid.length);
            
            if (valid.length > 0) {
              console.log('📋 FileUpload: Dispatching valid tasks to state:', valid);
              dispatch({ type: 'SET_TASKS', payload: valid });
              dispatch({ type: 'SET_FILE_UPLOADED', payload: 'tasks' });
              setSuccess(`Successfully uploaded ${valid.length} tasks${invalid.length > 0 ? ` (${invalid.length} invalid rows skipped)` : ''}`);
            }
            if (invalid.length > 0) {
              console.log('❌ FileUpload: Invalid tasks:', invalid);
              setError(`Invalid rows: ${invalid.map(i => `Row ${i.index + 1}: ${i.error}`).join(', ')}`);
            }
          }
          break;
      }

      if (result.errors.length > 0) {
        console.log('❌ FileUpload: Parse errors:', result.errors);
        setError(`Parse errors: ${result.errors.join(', ')}`);
      }

      if (result.data.length === 0) {
        console.log('❌ FileUpload: No data found in file');
        setError('No valid data found in the file');
      }

      onUploadComplete?.();
    } catch (err) {
      console.error('❌ FileUpload: Upload failed:', err);
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

  const handleDownloadTemplate = () => {
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
  };

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Stack direction="row" spacing={2} alignItems="center" mb={1}>
        <Button
          variant="contained"
          component="label"
          color="primary"
          startIcon={isUploading ? <CircularProgress size={18} color="inherit" /> : undefined}
          disabled={isUploading}
        >
          {isUploading ? 'Uploading...' : `Upload ${getEntityDisplayName()} File`}
          <input
            type="file"
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            hidden
            onChange={handleFileUpload}
            disabled={isUploading}
          />
        </Button>
        <Button
          variant="outlined"
          color="error"
          onClick={handleClearData}
          disabled={isUploading}
        >
          Clear All {getEntityDisplayName()} Data
        </Button>
      </Stack>
      <Typography variant="body2" color="text.secondary" mb={1}>
        Expected columns: {getExpectedColumns()}
      </Typography>
      <Button
        variant="outlined"
        startIcon={<Download />}
        onClick={handleDownloadTemplate}
        sx={{ mb: 1 }}
      >
        Download Template
      </Button>
      <Box mt={1} mb={1}>
        {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 1 }}>{success}</Alert>}
      </Box>
      <Typography variant="caption" color="text.secondary">
        <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
          <span role="img" aria-label="file">📄</span> Supports CSV and Excel files
        </Box>
      </Typography>
    </Paper>
  );
}