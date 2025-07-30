import React from 'react';
import { Button, Box, Typography, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Alert } from '@mui/material';
import { useData } from '../context/DataContext';
import Papa from 'papaparse';
import { saveAs } from 'file-saver';
import { FileParser } from '../utils/fileParser';
import { RulesConfiguration } from '../types';

function toCSV(data: any[], filename: string) {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, filename);
}

function toJSONFile(data: any, filename: string) {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export function ExportPanel() {
  const { state } = useData();
  const [dialogOpen, setDialogOpen] = React.useState<null | 'clients' | 'workers' | 'tasks'>(null);
  const [pendingExport, setPendingExport] = React.useState<null | 'clients' | 'workers' | 'tasks'>(null);

  // Helper to get errors for each entity
  const getEntityErrors = (entity: 'clients' | 'workers' | 'tasks') => {
    const entityMap = { clients: 'client', workers: 'worker', tasks: 'task' } as const;
    return state.validationErrors.filter(e => e.entity === entityMap[entity]);
  };

  // Export handlers
  const handleExport = (entity: 'clients' | 'workers' | 'tasks') => {
    const errors = getEntityErrors(entity);
    if (errors.length > 0) {
      setDialogOpen(entity);
      setPendingExport(entity);
    } else {
      doExport(entity);
    }
  };

  const doExport = (entity: 'clients' | 'workers' | 'tasks') => {
    let data: any[] = [];
    let filename = '';
    switch (entity) {
      case 'clients':
        data = state.clients;
        filename = 'clients.csv';
        break;
      case 'workers':
        data = state.workers;
        filename = 'workers.csv';
        break;
      case 'tasks':
        data = state.tasks;
        filename = 'tasks.csv';
        break;
    }
    FileParser.exportToCSV(data, filename);
    setDialogOpen(null);
    setPendingExport(null);
  };

  // Export rules.json with proper structure
  const handleExportRules = () => {
    const rulesConfig: RulesConfiguration = {
      metadata: {
        version: "1.0",
        createdAt: new Date().toISOString(),
        totalRules: state.businessRules.length,
      },
      businessRules: state.businessRules,
      prioritizationWeights: state.priorityWeights,
      globalSettings: state.globalSettings,
    };
    FileParser.exportToJSON(rulesConfig, 'rules.json');
  };

  // Button color logic
  const getButtonColor = (entity: 'clients' | 'workers' | 'tasks') => {
    return getEntityErrors(entity).length === 0 ? 'success' : 'error';
  };

  // Button disabled logic
  const isExportDisabled = (entity: 'clients' | 'workers' | 'tasks') => {
    switch (entity) {
      case 'clients': return !state.clients || state.clients.length === 0;
      case 'workers': return !state.workers || state.workers.length === 0;
      case 'tasks': return !state.tasks || state.tasks.length === 0;
      default: return true;
    }
  };

  return (
    <Box mb={3}>
      <Typography variant="h6" gutterBottom>
        Export Cleaned Data & Rules
      </Typography>
      <Box display="flex" gap={2}>
        <Tooltip title="Export Clients CSV">
          <span>
            <Button
              variant="contained"
              color={getButtonColor('clients') as any}
              onClick={() => handleExport('clients')}
              aria-label="Export Clients"
              disabled={isExportDisabled('clients')}
            >
              Export Clients
            </Button>
          </span>
        </Tooltip>
        <Tooltip title="Export Workers CSV">
          <span>
            <Button
              variant="contained"
              color={getButtonColor('workers') as any}
              onClick={() => handleExport('workers')}
              aria-label="Export Workers"
              disabled={isExportDisabled('workers')}
            >
              Export Workers
            </Button>
          </span>
        </Tooltip>
        <Tooltip title="Export Tasks CSV">
          <span>
            <Button
              variant="contained"
              color={getButtonColor('tasks') as any}
              onClick={() => handleExport('tasks')}
              aria-label="Export Tasks"
              disabled={isExportDisabled('tasks')}
            >
              Export Tasks
            </Button>
          </span>
        </Tooltip>
        <Tooltip title="Export Rules JSON">
          <span>
            <Button
              variant="contained"
              color="primary"
              onClick={handleExportRules}
              aria-label="Export Rules"
            >
              Export Rules
            </Button>
          </span>
        </Tooltip>
      </Box>
      {/* Warning Dialog */}
      <Dialog open={!!dialogOpen} onClose={() => setDialogOpen(null)}>
        <DialogTitle>Download with Validation Errors</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            There are {pendingExport ? getEntityErrors(pendingExport).length : 0} validation errors in the data.<br />
            This may cause issues when importing the data elsewhere.
          </Alert>
          <Typography variant="body2" color="text.secondary">
            Do you want to continue with the download?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(null)}>Cancel</Button>
          <Button
            onClick={() => pendingExport && doExport(pendingExport)}
            variant="contained"
            color="error"
          >
            Download Anyway
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 