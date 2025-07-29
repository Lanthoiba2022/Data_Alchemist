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
  AccordionDetails,
  Button
} from '@mui/material';
import { Error, Warning, CheckCircle, ExpandMore } from '@mui/icons-material';
import { useData } from '../context/DataContext';
import { ValidationError } from '../types';
import axios from 'axios';
import { useState } from 'react';

export function ValidationSummary() {
  const { state, dispatch } = useData();
  const { validationErrors } = state;

  const [suggesting, setSuggesting] = useState<{ [key: string]: boolean }>({});
  const [suggestedFixes, setSuggestedFixes] = useState<{ [key: string]: any }>({});
  const [suggestError, setSuggestError] = useState<{ [key: string]: string }>({});

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

  const handleSuggestFix = async (entity: string, error: ValidationError, row: any) => {
    setSuggesting((prev) => ({ ...prev, [entity + error.rowIndex + error.field]: true }));
    setSuggestError((prev) => ({ ...prev, [entity + error.rowIndex + error.field]: '' }));
    try {
      const response = await axios.post('/api/ai-suggest-fix', {
        error,
        row,
        entityType: entity,
      });
      setSuggestedFixes((prev) => ({ ...prev, [entity + error.rowIndex + error.field]: response.data.fixedRow }));
    } catch {
      setSuggestError((prev) => ({ ...prev, [entity + error.rowIndex + error.field]: 'AI suggestion failed.' }));
    } finally {
      setSuggesting((prev) => ({ ...prev, [entity + error.rowIndex + error.field]: false }));
    }
  };
  const handleApplyFix = (entity: string, rowIndex: number, fixedRow: any) => {
    switch (entity) {
      case 'client': {
        const updated = [...state.clients];
        updated[rowIndex] = { ...updated[rowIndex], ...fixedRow };
        dispatch({ type: 'SET_CLIENTS', payload: updated });
        break;
      }
      case 'worker': {
        const updated = [...state.workers];
        updated[rowIndex] = { ...updated[rowIndex], ...fixedRow };
        dispatch({ type: 'SET_WORKERS', payload: updated });
        break;
      }
      case 'task': {
        const updated = [...state.tasks];
        updated[rowIndex] = { ...updated[rowIndex], ...fixedRow };
        dispatch({ type: 'SET_TASKS', payload: updated });
        break;
      }
    }
    setSuggestedFixes((prev) => {
      const copy = { ...prev };
      Object.keys(copy).forEach((k) => { if (k.startsWith(entity + rowIndex)) delete copy[k]; });
      return copy;
    });
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
              <Accordion key={entity} defaultExpanded={false} sx={{ mb: 1 }}>
                <AccordionSummary
                  expandIcon={<ExpandMore />}
                  sx={{
                    backgroundColor: 'grey.50',
                    '&:hover': {
                      backgroundColor: 'grey.100',
                    },
                    borderRadius: 1,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                    <Error color="error" />
                    <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                      {getEntityDisplayName(entity)} ({errors.length} errors)
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 1 }}>
                  <List dense sx={{ py: 0 }}>
                    {errors.map((error, index) => (
                      <ListItem key={index} sx={{ py: 0.5, px: 0 }}>
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
                        <Box>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleSuggestFix(entity, error, (entity === 'client' ? state.clients : entity === 'worker' ? state.workers : state.tasks)[error.rowIndex])}
                            disabled={suggesting[entity + error.rowIndex + error.field]}
                            sx={{ mr: 1 }}
                          >
                            {suggesting[entity + error.rowIndex + error.field] ? 'Suggesting...' : 'Suggest Fix'}
                          </Button>
                          {suggestError[entity + error.rowIndex + error.field] && (
                            <Typography color="error" variant="caption">{suggestError[entity + error.rowIndex + error.field]}</Typography>
                          )}
                          {suggestedFixes[entity + error.rowIndex + error.field] && (
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              onClick={() => handleApplyFix(entity, error.rowIndex, suggestedFixes[entity + error.rowIndex + error.field])}
                            >
                              Apply Fix
                            </Button>
                          )}
                        </Box>
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