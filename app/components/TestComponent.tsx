'use client';

import React, { useState } from 'react';
import { Box, Button, Typography, Paper, Alert, Stack } from '@mui/material';
import { PlayArrow, CheckCircle, Error } from '@mui/icons-material';
import { useData } from '../context/DataContext';
import { DataTransformer } from '../utils/dataTransformer';
import { testClientData, testWorkerData, testTaskData } from '../utils/testData';

export function TestComponent() {
  const { dispatch, state } = useData();
  const [testResults, setTestResults] = useState<{
    clients: { success: boolean; message: string };
    workers: { success: boolean; message: string };
    tasks: { success: boolean; message: string };
  }>({
    clients: { success: false, message: '' },
    workers: { success: false, message: '' },
    tasks: { success: false, message: '' }
  });

  const runTest = (entityType: 'clients' | 'workers' | 'tasks') => {
    try {
      let testData;
      let transformedData;
      
      switch (entityType) {
        case 'clients':
          testData = testClientData;
          transformedData = DataTransformer.transformClients(testData);
          const { valid: validClients, invalid: invalidClients } = DataTransformer.validateAndClean(transformedData, 'client');
          
          if (validClients.length > 0) {
            dispatch({ type: 'SET_CLIENTS', payload: validClients });
            setTestResults(prev => ({
              ...prev,
              clients: { 
                success: true, 
                message: `✅ Successfully processed ${validClients.length} clients${invalidClients.length > 0 ? ` (${invalidClients.length} invalid skipped)` : ''}` 
              }
            }));
          } else {
            setTestResults(prev => ({
              ...prev,
              clients: { success: false, message: '❌ No valid client data found' }
            }));
          }
          break;
          
        case 'workers':
          testData = testWorkerData;
          transformedData = DataTransformer.transformWorkers(testData);
          const { valid: validWorkers, invalid: invalidWorkers } = DataTransformer.validateAndClean(transformedData, 'worker');
          
          if (validWorkers.length > 0) {
            dispatch({ type: 'SET_WORKERS', payload: validWorkers });
            setTestResults(prev => ({
              ...prev,
              workers: { 
                success: true, 
                message: `✅ Successfully processed ${validWorkers.length} workers${invalidWorkers.length > 0 ? ` (${invalidWorkers.length} invalid skipped)` : ''}` 
              }
            }));
          } else {
            setTestResults(prev => ({
              ...prev,
              workers: { success: false, message: '❌ No valid worker data found' }
            }));
          }
          break;
          
        case 'tasks':
          testData = testTaskData;
          transformedData = DataTransformer.transformTasks(testData);
          const { valid: validTasks, invalid: invalidTasks } = DataTransformer.validateAndClean(transformedData, 'task');
          
          if (validTasks.length > 0) {
            dispatch({ type: 'SET_TASKS', payload: validTasks });
            setTestResults(prev => ({
              ...prev,
              tasks: { 
                success: true, 
                message: `✅ Successfully processed ${validTasks.length} tasks${invalidTasks.length > 0 ? ` (${invalidTasks.length} invalid skipped)` : ''}` 
              }
            }));
          } else {
            setTestResults(prev => ({
              ...prev,
              tasks: { success: false, message: '❌ No valid task data found' }
            }));
          }
          break;
      }
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [entityType]: { success: false, message: `❌ Error: ${error}` }
      }));
    }
  };

  const runAllTests = () => {
    runTest('clients');
    runTest('workers');
    runTest('tasks');
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        🧪 Test Data Processing
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Test the data processing functionality with sample data that matches your Excel structure.
      </Typography>

      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<PlayArrow />}
          onClick={runAllTests}
        >
          Run All Tests
        </Button>
        
        <Button
          variant="outlined"
          onClick={() => runTest('clients')}
        >
          Test Clients
        </Button>
        
        <Button
          variant="outlined"
          onClick={() => runTest('workers')}
        >
          Test Workers
        </Button>
        
        <Button
          variant="outlined"
          onClick={() => runTest('tasks')}
        >
          Test Tasks
        </Button>
      </Stack>

      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom>Test Results:</Typography>
        
        {Object.entries(testResults).map(([entity, result]) => (
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
              <strong>Validation Errors:</strong> {state.validationErrors.length} issues found
            </Typography>
          </Alert>
        )}
      </Box>
    </Paper>
  );
} 