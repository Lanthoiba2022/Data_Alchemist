'use client';

import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Alert, Stack } from '@mui/material';
import { CheckCircle, Error, Warning } from '@mui/icons-material';
import { useData } from '../context/DataContext';

export function DataProcessingComponent() {
  const { state } = useData();
  const [validationResults, setValidationResults] = useState<{
    clients: { success: boolean; message: string; errorCount: number };
    workers: { success: boolean; message: string; errorCount: number };
    tasks: { success: boolean; message: string; errorCount: number };
  }>({
    clients: { success: false, message: '', errorCount: 0 },
    workers: { success: false, message: '', errorCount: 0 },
    tasks: { success: false, message: '', errorCount: 0 }
  });

  // Function to validate data and update results
  const validateData = () => {
    const results = {
      clients: { success: false, message: '', errorCount: 0 },
      workers: { success: false, message: '', errorCount: 0 },
      tasks: { success: false, message: '', errorCount: 0 }
    };

    // Validate clients
    if (state.uploadedFiles.clients && state.clients.length > 0) {
      const validClients = state.clients.filter((item: any) => 
        item && 
        item.ClientID && 
        item.ClientName && 
        typeof item.PriorityLevel === 'number' &&
        Array.isArray(item.RequestedTaskIDs)
      );
      
      const clientErrors = state.clients.length - validClients.length;
      results.clients = {
        success: validClients.length > 0,
        message: validClients.length > 0 
          ? `✅ Successfully processed ${validClients.length} clients${clientErrors > 0 ? ` (${clientErrors} errors found)` : ''}`
          : '❌ No valid client data found',
        errorCount: clientErrors
      };
    } else if (state.uploadedFiles.clients) {
      results.clients = {
        success: false,
        message: '❌ No client data available',
        errorCount: 0
      };
    }

    // Validate workers
    if (state.uploadedFiles.workers && state.workers.length > 0) {
      const validWorkers = state.workers.filter((item: any) => 
        item && 
        item.WorkerID && 
        item.WorkerName && 
        Array.isArray(item.Skills) &&
        Array.isArray(item.AvailableSlots) &&
        typeof item.MaxLoadPerPh === 'number' &&
        typeof item.QualificationLevel === 'number'
      );
      
      const workerErrors = state.workers.length - validWorkers.length;
      results.workers = {
        success: validWorkers.length > 0,
        message: validWorkers.length > 0 
          ? `✅ Successfully processed ${validWorkers.length} workers${workerErrors > 0 ? ` (${workerErrors} errors found)` : ''}`
          : '❌ No valid worker data found',
        errorCount: workerErrors
      };
    } else if (state.uploadedFiles.workers) {
      results.workers = {
        success: false,
        message: '❌ No worker data available',
        errorCount: 0
      };
    }

    // Validate tasks
    if (state.uploadedFiles.tasks && state.tasks.length > 0) {
      const validTasks = state.tasks.filter((item: any) => 
        item && 
        item.TaskID && 
        item.TaskName && 
        item.Category &&
        typeof item.Duration === 'number' &&
        Array.isArray(item.RequiredSkills) &&
        Array.isArray(item.PreferredPhase) &&
        typeof item.MaxConcurrent === 'number'
      );
      
      const taskErrors = state.tasks.length - validTasks.length;
      results.tasks = {
        success: validTasks.length > 0,
        message: validTasks.length > 0 
          ? `✅ Successfully processed ${validTasks.length} tasks${taskErrors > 0 ? ` (${taskErrors} errors found)` : ''}`
          : '❌ No valid task data found',
        errorCount: taskErrors
      };
    } else if (state.uploadedFiles.tasks) {
      results.tasks = {
        success: false,
        message: '❌ No task data available',
        errorCount: 0
      };
    }

    setValidationResults(results);
  };

  // Run validation whenever data changes
  useEffect(() => {
    validateData();
  }, [state.clients, state.workers, state.tasks, state.uploadedFiles]);

  const getUploadStatus = () => {
    const status = [];
    if (state.uploadedFiles.clients) status.push('✅ Clients');
    else status.push('❌ Clients');
    
    if (state.uploadedFiles.workers) status.push('✅ Workers');
    else status.push('❌ Workers');
    
    if (state.uploadedFiles.tasks) status.push('✅ Tasks');
    else status.push('❌ Tasks');
    
    return status.join(' | ');
  };

  const getTotalErrorCount = () => {
    return validationResults.clients.errorCount + 
           validationResults.workers.errorCount + 
           validationResults.tasks.errorCount;
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        🧪 Data Processing & Validation
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Automatic validation runs whenever files are uploaded or data changes. Results are updated in real-time.
      </Typography>

      <Alert severity="info" sx={{ mb: 2 }}>
        <Typography variant="body2">
          <strong>File Upload Status:</strong> {getUploadStatus()}
        </Typography>
      </Alert>

      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom>Validation Results:</Typography>
        
        {Object.entries(validationResults).map(([entity, result]) => (
          <Alert 
            key={entity}
            severity={result.success ? 'success' : 'error'}
            sx={{ mb: 1 }}
            icon={result.success ? <CheckCircle /> : <Error />}
          >
            <Typography variant="body2">
              <strong>{entity.charAt(0).toUpperCase() + entity.slice(1)}:</strong> {result.message}
            </Typography>
          </Alert>
        ))}
      </Box>

      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom>Current Data Count:</Typography>
        <Typography variant="body2">
          Clients: {state.clients.length} | Workers: {state.workers.length} | Tasks: {state.tasks.length}
        </Typography>
        
        {state.validationErrors.length > 0 && (
          <Alert severity="warning" sx={{ mt: 1 }}>
            <Typography variant="body2">
              <strong>Cross-Entity Validation Errors:</strong> {state.validationErrors.length} issues found
            </Typography>
          </Alert>
        )}

        {getTotalErrorCount() > 0 && (
          <Alert severity="error" sx={{ mt: 1 }}>
            <Typography variant="body2">
              <strong>Data Structure Errors:</strong> {getTotalErrorCount()} issues found across all files
            </Typography>
          </Alert>
        )}
      </Box>
    </Paper>
  );
} 