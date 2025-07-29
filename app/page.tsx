'use client';

import { Container, Typography, Box, Paper, Tabs, Tab, Button } from '@mui/material';
import { useState } from 'react';
import { DataProvider } from './context/DataContext';
import { FileUpload } from './components/FileUpload';
import { DataGrid } from './components/DataGrid';
import { ValidationSummary } from './components/ValidationSummary';
import { DataProcessingComponent } from './components/DataProcessingComponent';
import { RuleBuilder } from './components/RuleBuilder';
import { PriorityWeights } from './components/PriorityWeights';
import { ExportPanel } from './components/ExportPanel';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

function DataGridWrapper() {
  const [activeDataTab, setActiveDataTab] = useState(0);

  const handleDataTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveDataTab(newValue);
  };

  return (
    <Box>
      <Paper elevation={2} sx={{ mb: 2 }}>
        <Tabs value={activeDataTab} onChange={handleDataTabChange} centered>
          <Tab label="Clients" />
          <Tab label="Workers" />
          <Tab label="Tasks" />
        </Tabs>
      </Paper>

      {activeDataTab === 0 && <DataGrid entityType="clients" />}
      {activeDataTab === 1 && <DataGrid entityType="workers" />}
      {activeDataTab === 2 && <DataGrid entityType="tasks" />}
    </Box>
  );
}

function DataAlchemistApp() {
  const [activeTab, setActiveTab] = useState(0);
  const [helpOpen, setHelpOpen] = useState(false);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h3" component="h1" gutterBottom align="center">
            🧪 Data Alchemist
          </Typography>
          <Typography variant="h6" component="h2" gutterBottom align="center" color="text.secondary">
            Excel Data Processing & Validation
          </Typography>
        </Box>
        <Box>
          <Button startIcon={<HelpOutlineIcon />} onClick={() => setHelpOpen(true)} aria-label="Help" sx={{ mt: 2 }}>
            Help
          </Button>
        </Box>
      </Box>
      <Dialog open={helpOpen} onClose={() => setHelpOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>How to Use Data Alchemist</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle1" gutterBottom>1. Upload Data</Typography>
          <Typography variant="body2" gutterBottom>
            Upload your clients, workers, and tasks files in the Upload Files tab. Supported formats: CSV, XLSX.
          </Typography>
          <Typography variant="subtitle1" gutterBottom>2. View & Edit Data</Typography>
          <Typography variant="body2" gutterBottom>
            Use the View Data tab to review and edit your data in a spreadsheet-like grid. Errors are highlighted.
          </Typography>
          <Typography variant="subtitle1" gutterBottom>3. Natural Language Search</Typography>
          <Typography variant="body2" gutterBottom>
            Use the search bar above each data grid to filter rows using plain English (e.g., "Tasks longer than 1 phase").
          </Typography>
          <Typography variant="subtitle1" gutterBottom>4. Business Rules</Typography>
          <Typography variant="body2" gutterBottom>
            In the Business Rules tab, add rules manually or describe them in English. You can also get AI suggestions for rules.
          </Typography>
          <Typography variant="subtitle1" gutterBottom>5. Priority Weights</Typography>
          <Typography variant="body2" gutterBottom>
            Adjust the importance of different criteria using sliders in the Business Rules tab.
          </Typography>
          <Typography variant="subtitle1" gutterBottom>6. Export</Typography>
          <Typography variant="body2" gutterBottom>
            Export cleaned data and rules using the Export button in the Business Rules tab.
          </Typography>
          <Typography variant="subtitle1" gutterBottom>Tips</Typography>
          <Typography variant="body2" gutterBottom>
            - Hover over buttons and fields for tooltips.
            - Use the Validation tab to see all detected issues.
            - All AI features require an internet connection and a valid OpenAI API key.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHelpOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Box sx={{ mt: 4 }}>
        <Paper elevation={2} sx={{ mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange} centered>
            <Tab label="Data Processing" />
            <Tab label="Upload Files" />
            <Tab label="View Data" />
            <Tab label="Validation" />
            <Tab label="Business Rules" />
          </Tabs>
        </Paper>

        {activeTab === 0 && (
          <DataProcessingComponent />
        )}

        {activeTab === 1 && (
          <Box>
            <FileUpload entityType="clients" />
            <FileUpload entityType="workers" />
            <FileUpload entityType="tasks" />
          </Box>
        )}

        {activeTab === 2 && (
          <DataGridWrapper />
        )}

        {activeTab === 3 && (
          <ValidationSummary />
        )}
        {activeTab === 4 && (
          <>
            <ExportPanel />
            <PriorityWeights />
            <RuleBuilder />
          </>
        )}
      </Box>
    </Container>
  );
}

export default function Home() {
  return (
    <DataProvider>
      <DataAlchemistApp />
    </DataProvider>
  );
}
