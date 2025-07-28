'use client';

import React from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon, 
  Paper,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { Error, Warning, CheckCircle } from '@mui/icons-material';
import { useData } from '../context/DataContext';
import { ValidationError } from '../types';

export function ValidationSummary() {
  const { state } = useData();
  const { validationErrors } = state;

  const getErrorCount = () => validationErrors.length;
  const getWarningCount = () => 0; // For future warning types
  const getSuccessCount = () => {
    const totalRows = state.clients.length + state.workers.length + state.tasks.length;
    return totalRows - getErrorCount();
  };

  const groupErrorsByEntity = () => {
    const grouped = {
      client: validationErrors.filter(e => e.entity === 'client'),
      worker: validationErrors.filter(e => e.entity === 'worker'),
      task: validationErrors.filter(e => e.entity === 'task'),
    };
    return grouped;
  };

  const getEntityDisplayName = (entity: string) => {
    switch (entity) {
      case 'client': return 'Clients';
      case 'worker': return 'Workers';
      case 'task': return 'Tasks';
      default: return entity;
    }
  };

  const getErrorIcon = (error: ValidationError) => {
    return <Error color="error" />;
  };

  const getErrorSeverity = (error: ValidationError) => {
    // Determine severity based on error type
    if (error.field.includes('ID') && error.message.includes('Duplicate')) {
      return 'error';
    }
    if (error.field.includes('Required') || error.message.includes('required')) {
      return 'error';
    }
    return 'warning';
  };

  if (validationErrors.length === 0 && state.clients.length + state.workers.length + state.tasks.length === 0) {
    return (
      <Paper elevation={2} sx={{ p: 3, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Validation Summary
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No data uploaded yet. Please upload CSV or Excel files to see validation results.
        </Typography>
      </Paper>
    );
  }

  const groupedErrors = groupErrorsByEntity();

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Typography variant="h6">
          Validation Summary
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {getErrorCount() > 0 && (
            <Chip 
              icon={<Error />} 
              label={`${getErrorCount()} Errors`} 
              color="error" 
              size="small" 
            />
          )}
          {getWarningCount() > 0 && (
            <Chip 
              icon={<Warning />} 
              label={`${getWarningCount()} Warnings`} 
              color="warning" 
              size="small" 
            />
          )}
          {getSuccessCount() > 0 && (
            <Chip 
              icon={<CheckCircle />} 
              label={`${getSuccessCount()} Valid`} 
              color="success" 
              size="small" 
            />
          )}
        </Box>
      </Box>

      {validationErrors.length === 0 ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'success.main' }}>
          <CheckCircle />
          <Typography variant="body2">
            All data is valid! No validation errors found.
          </Typography>
        </Box>
      ) : (
        <Box>
          {Object.entries(groupedErrors).map(([entity, errors]) => {
            if (errors.length === 0) return null;
            
            return (
              <Accordion key={entity} defaultExpanded>
                <AccordionSummary>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Error color="error" />
                    <Typography variant="subtitle1">
                      {getEntityDisplayName(entity)} ({errors.length} errors)
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <List dense>
                    {errors.map((error, index) => (
                      <ListItem key={index} sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          {getErrorIcon(error)}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="body2">
                              Row {error.rowIndex + 1}, {error.field}: {error.message}
                            </Typography>
                          }
                          secondary={
                            error.value && (
                              <Typography variant="caption" color="text.secondary">
                                Value: {String(error.value)}
                              </Typography>
                            )
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Box>
      )}

      {validationErrors.length > 0 && (
        <Box sx={{ mt: 2, p: 2, backgroundColor: 'error.light', borderRadius: 1 }}>
          <Typography variant="body2" color="error">
            Please fix the validation errors above before proceeding. The data may not be exported correctly until all errors are resolved.
          </Typography>
        </Box>
      )}
    </Paper>
  );
} 