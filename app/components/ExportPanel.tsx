import React from 'react';
import { Button, Box, Typography, Tooltip } from '@mui/material';
import { useData } from '../context/DataContext';
import Papa from 'papaparse';
import { saveAs } from 'file-saver';

function toCSV(data: any[], filename: string) {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, filename);
}

function toJSONFile(data: any, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  saveAs(blob, filename);
}

export function ExportPanel() {
  const { state } = useData();

  const handleExport = () => {
    // Export cleaned data
    toCSV(state.clients, 'clients.csv');
    toCSV(state.workers, 'workers.csv');
    toCSV(state.tasks, 'tasks.csv');
    // Export rules.json
    const rulesConfig = {
      businessRules: state.businessRules,
      priorityWeights: state.priorityWeights,
    };
    toJSONFile(rulesConfig, 'rules.json');
  };

  return (
    <Box mb={3}>
      <Typography variant="h6" gutterBottom>
        Export Cleaned Data & Rules
      </Typography>
      <Tooltip title="Download cleaned CSVs for clients, workers, tasks, and a rules.json file with all business rules and weights">
        <span>
          <Button variant="contained" color="primary" onClick={handleExport} aria-label="Export All">
            Export All
          </Button>
        </span>
      </Tooltip>
    </Box>
  );
} 