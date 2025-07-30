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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress
} from '@mui/material';
import { Error as ErrorIcon, Warning, CheckCircle, ExpandMore } from '@mui/icons-material';
import { useData } from '../context/DataContext';
import { ValidationError } from '../types';
import { useState } from 'react';
import dynamic from 'next/dynamic';
const ReactJson = dynamic(() => import('react-json-view'), { ssr: false });

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
    return <ErrorIcon color="error" />;
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
      const response = await fetch('/api/ai-suggest-fix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error,
          row,
          entityType: entity,
        }),
      });
      
      if (!response.ok) {
        throw new Error('AI suggestion failed');
      }
      
      const responseData = await response.json();
      setSuggestedFixes((prev) => ({ ...prev, [entity + error.rowIndex + error.field]: responseData.fixedRow }));
    } catch (e: any) {
      setSuggestError((prev) => ({ ...prev, [entity + error.rowIndex + error.field]: e?.message || 'AI suggestion failed.' }));
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
              icon={<ErrorIcon />} 
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
                    <ErrorIcon color="error" />
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
                            <React.Fragment>
                              <Typography variant="body2" color="error" sx={{ display: 'inline' }}>
                                {error.message.split(';').map((msg, i) => (
                                  <span key={i}>{msg.trim()}{i < error.message.split(';').length - 1 ? ', ' : ''}</span>
                                ))}
                              </Typography>
                              {/* Show the full row details for this error */}
                              <Box sx={{ mt: 1, mb: 1, p: 1, background: '#f9f9f9', borderRadius: 1 }}>
                                <Typography variant="caption" color="text.secondary">Row Data:</Typography>
                                <ReactJson
                                  src={
                                    entity === 'client' ? state.clients[error.rowIndex] :
                                    entity === 'worker' ? state.workers[error.rowIndex] :
                                    state.tasks[error.rowIndex]
                                  }
                                  name={false}
                                  collapsed={false}
                                  enableClipboard={false}
                                  displayDataTypes={false}
                                  style={{ fontSize: '0.8em', background: 'none' }}
                                />
                              </Box>
                            </React.Fragment>
                          }
                          secondary={
                            error.value && (
                              <Typography variant="caption" color="text.secondary">
                                Value: {Array.isArray(error.value) ? error.value.join(', ') : String(error.value)}
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
                            sx={{ 
                              mr: 1,
                              minWidth: 120,
                              position: 'relative',
                              ...(suggesting[entity + error.rowIndex + error.field] && {
                                borderColor: '#ff9800',
                                background: 'rgba(255, 152, 0, 0.04)',
                                animation: 'pulse 1.5s ease-in-out infinite',
                                '@keyframes pulse': {
                                  '0%': { opacity: 1 },
                                  '50%': { opacity: 0.7 },
                                  '100%': { opacity: 1 },
                                },
                              })
                            }}
                          >
                            {suggesting[entity + error.rowIndex + error.field] && (
                              <CircularProgress 
                                size={14} 
                                sx={{ 
                                  color: '#ff9800', 
                                  mr: 1,
                                  position: 'absolute',
                                  left: '50%',
                                  top: '50%',
                                  transform: 'translate(-50%, -50%)',
                                  zIndex: 1
                                }} 
                              />
                            )}
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 1,
                              opacity: suggesting[entity + error.rowIndex + error.field] ? 0 : 1,
                              transition: 'opacity 0.3s'
                            }}>
                              {suggesting[entity + error.rowIndex + error.field] ? 'Suggesting...' : 'Suggest Fix'}
                            </Box>
                          </Button>
                          {suggestError[entity + error.rowIndex + error.field] && (
                            <Typography color="error" variant="caption">{suggestError[entity + error.rowIndex + error.field]}</Typography>
                          )}
                          {suggestedFixes[entity + error.rowIndex + error.field] && (
                            <Box sx={{ mt: 1, mb: 1, p: 1, background: '#f5f5f5', borderRadius: 1 }}>
                              <Typography variant="caption" color="primary">Suggested Fix:</Typography>
                              <ReactJson
                                src={suggestedFixes[entity + error.rowIndex + error.field]}
                                name={false}
                                collapsed={false}
                                enableClipboard={false}
                                displayDataTypes={false}
                                style={{ fontSize: '0.8em', background: 'none' }}
                              />
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                sx={{ mt: 1 }}
                                onClick={() => handleApplyFix(entity, error.rowIndex, suggestedFixes[entity + error.rowIndex + error.field])}
                              >
                                Apply Fix
                              </Button>
                            </Box>
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