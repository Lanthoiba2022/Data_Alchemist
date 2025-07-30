import React from 'react';
import { Typography, Slider, Paper, Box, Tooltip } from '@mui/material';
import { useData } from '../context/DataContext';
import type { PriorityWeights } from '../types';

const WEIGHT_FIELDS: { key: keyof PriorityWeights; label: string; tip: string }[] = [
  { key: 'clientPriority', label: 'Client Priority', tip: 'How much to prioritize client preferences' },
  { key: 'workerFairness', label: 'Worker Fairness', tip: 'How much to balance assignments fairly among workers' },
  { key: 'taskUrgency', label: 'Task Urgency', tip: 'How much to prioritize urgent tasks' },
  { key: 'resourceUtilization', label: 'Resource Utilization', tip: 'How much to maximize resource efficiency' },
];

export function PriorityWeights() {
  const { state, dispatch } = useData();

  const handleChange = (key: keyof PriorityWeights, value: number) => {
    dispatch({
      type: 'SET_PRIORITY_WEIGHTS',
      payload: {
        ...state.priorityWeights,
        [key]: value,
      },
    });
  };

  return (
    <Paper variant="outlined" sx={{ p: 3, mb: 2 }}>
      <Typography variant="h5" gutterBottom>
        Priority & Weight Settings
      </Typography>
      <Box display="flex" flexWrap="wrap" gap={4}>
        {WEIGHT_FIELDS.map(field => (
          <Box key={field.key} flex="1 1 300px" minWidth={250} maxWidth={400}>
            <Tooltip title={field.tip}>
              <Box>
                <Typography gutterBottom>{field.label}</Typography>
                <Slider
                  value={state.priorityWeights[field.key]}
                  min={0}
                  max={10}
                  step={1}
                  marks
                  valueLabelDisplay="auto"
                  onChange={(_, value) => handleChange(field.key, value as number)}
                  aria-label={field.label}
                />
              </Box>
            </Tooltip>
          </Box>
        ))}
      </Box>
    </Paper>
  );
} 