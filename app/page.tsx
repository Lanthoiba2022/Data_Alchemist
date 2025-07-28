'use client';

import { Container, Typography, Box, Paper, Tabs, Tab } from '@mui/material';
import { useState } from 'react';
import { DataProvider } from './context/DataContext';
import { FileUpload } from './components/FileUpload';
import { DataGrid } from './components/DataGrid';
import { ValidationSummary } from './components/ValidationSummary';
import { DataProcessingComponent } from './components/DataProcessingComponent';

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

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom align="center">
        🧪 Data Alchemist
      </Typography>
      <Typography variant="h6" component="h2" gutterBottom align="center" color="text.secondary">
        Excel Data Processing & Validation
      </Typography>

      <Box sx={{ mt: 4 }}>
        <Paper elevation={2} sx={{ mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange} centered>
            <Tab label="Data Processing" />
            <Tab label="Upload Files" />
            <Tab label="View Data" />
            <Tab label="Validation" />
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
