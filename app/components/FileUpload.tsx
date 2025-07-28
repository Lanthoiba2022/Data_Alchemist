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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    try {
      let result;
      let transformedData;
      
      switch (entityType) {
        case 'clients':
          result = await FileParser.parseFile<any>(file);
          if (result.data.length > 0) {
            transformedData = DataTransformer.transformClients(result.data);
            const { valid, invalid } = DataTransformer.validateAndClean(transformedData, 'client');
            
            if (valid.length > 0) {
              dispatch({ type: 'SET_CLIENTS', payload: valid });
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
            transformedData = DataTransformer.transformWorkers(result.data);
            const { valid, invalid } = DataTransformer.validateAndClean(transformedData, 'worker');
            
            if (valid.length > 0) {
              dispatch({ type: 'SET_WORKERS', payload: valid });
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
            transformedData = DataTransformer.transformTasks(result.data);
            const { valid, invalid } = DataTransformer.validateAndClean(transformedData, 'task');
            
            if (valid.length > 0) {
              dispatch({ type: 'SET_TASKS', payload: valid });
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
    <Paper elevation={2} sx={{ p: 3, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        Upload {getEntityDisplayName()} Data
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Expected columns: {getExpectedColumns()}
      </Typography>

      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <input
          accept=".csv,.xlsx,.xls"
          style={{ display: 'none' }}
          id={`file-upload-${entityType}`}
          type="file"
          onChange={handleFileUpload}
          disabled={isUploading}
        />
        
        <label htmlFor={`file-upload-${entityType}`}>
          <Button
            variant="outlined"
            component="span"
            startIcon={isUploading ? <CircularProgress size={20} /> : <CloudUpload />}
            disabled={isUploading}
            sx={{ minWidth: 200 }}
          >
            {isUploading ? 'Uploading...' : `Upload ${getEntityDisplayName()} File`}
          </Button>
        </label>

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