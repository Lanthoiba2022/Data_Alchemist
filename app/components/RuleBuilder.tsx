import React, { useState } from 'react';
import { Box, Button, Typography, Paper, List, ListItem, ListItemText, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Select, FormControl, InputLabel, Tooltip } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import { useData } from '../context/DataContext';
import { BusinessRule } from '../types';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

const RULE_TYPES = [
  { value: 'coRun', label: 'Co-Run Tasks' },
  { value: 'slotRestriction', label: 'Slot Restriction' },
  { value: 'loadLimit', label: 'Load Limit' },
  { value: 'phaseWindow', label: 'Phase Window' },
  { value: 'patternMatch', label: 'Pattern Match' },
];

function getDefaultConfig(type: string) {
  switch (type) {
    case 'coRun':
      return { tasks: [] };
    case 'slotRestriction':
      return { group: '', minSlots: 1 };
    case 'loadLimit':
      return { group: '', maxLoad: 1 };
    case 'phaseWindow':
      return { task: '', allowedPhases: [] };
    case 'patternMatch':
      return { regex: '', template: '' };
    default:
      return {};
  }
}

export function RuleBuilder() {
  const { state, dispatch } = useData();
  const [open, setOpen] = useState(false);
  const [editRule, setEditRule] = useState<BusinessRule | null>(null);
  const [type, setType] = useState('coRun');
  const [description, setDescription] = useState('');
  const [config, setConfig] = useState<any>(getDefaultConfig('coRun'));
  const [nlRule, setNlRule] = useState('');
  const [nlLoading, setNlLoading] = useState(false);
  const [nlError, setNlError] = useState<string | null>(null);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<BusinessRule[] | null>(null);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const [suggestOpen, setSuggestOpen] = useState(false);

  const handleOpen = (rule?: BusinessRule) => {
    if (rule) {
      setEditRule(rule);
      setType(rule.type);
      setDescription(rule.description);
      setConfig(rule.config);
    } else {
      setEditRule(null);
      setType('coRun');
      setDescription('');
      setConfig(getDefaultConfig('coRun'));
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditRule(null);
    setType('coRun');
    setDescription('');
    setConfig(getDefaultConfig('coRun'));
  };

  const handleSave = () => {
    const rule: BusinessRule = {
      id: editRule ? editRule.id : uuidv4(),
      type: type as any,
      description,
      config,
    };
    if (editRule) {
      dispatch({ type: 'UPDATE_BUSINESS_RULE', payload: rule });
    } else {
      dispatch({ type: 'ADD_BUSINESS_RULE', payload: rule });
    }
    handleClose();
  };

  const handleDelete = (id: string) => {
    dispatch({ type: 'REMOVE_BUSINESS_RULE', payload: id });
  };

  const handleNLRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nlRule.trim()) return;
    setNlLoading(true);
    setNlError(null);
    try {
      const response = await axios.post('/api/nl-rule', { description: nlRule });
      const rule: BusinessRule = response.data.rule;
      dispatch({ type: 'ADD_BUSINESS_RULE', payload: rule });
      setNlRule('');
    } catch (err: any) {
      setNlError('Failed to parse rule. Try rephrasing.');
    } finally {
      setNlLoading(false);
    }
  };

  const handleSuggestRules = async () => {
    setSuggestLoading(true);
    setSuggestError(null);
    try {
      const response = await axios.post('/api/suggest-rules', {
        clients: state.clients,
        workers: state.workers,
        tasks: state.tasks,
      });
      setSuggestions(response.data.rules);
      setSuggestOpen(true);
    } catch (err: any) {
      setSuggestError('Failed to get suggestions.');
    } finally {
      setSuggestLoading(false);
    }
  };

  const handleAcceptSuggestion = (rule: BusinessRule) => {
    dispatch({ type: 'ADD_BUSINESS_RULE', payload: rule });
    setSuggestions(suggestions?.filter(r => r.id !== rule.id) || null);
  };

  // Dynamic config fields based on rule type
  const renderConfigFields = () => {
    switch (type) {
      case 'coRun':
        return (
          <TextField
            label="Task IDs (comma-separated)"
            fullWidth
            value={config.tasks?.join(',') || ''}
            onChange={e => setConfig({ ...config, tasks: e.target.value.split(',').map((t: string) => t.trim()).filter((t: string) => t) })}
            margin="normal"
          />
        );
      case 'slotRestriction':
        return (
          <>
            <TextField
              label="Group"
              fullWidth
              value={config.group || ''}
              onChange={e => setConfig({ ...config, group: e.target.value })}
              margin="normal"
            />
            <TextField
              label="Min Slots"
              type="number"
              fullWidth
              value={config.minSlots || 1}
              onChange={e => setConfig({ ...config, minSlots: Number(e.target.value) })}
              margin="normal"
            />
          </>
        );
      case 'loadLimit':
        return (
          <>
            <TextField
              label="Group"
              fullWidth
              value={config.group || ''}
              onChange={e => setConfig({ ...config, group: e.target.value })}
              margin="normal"
            />
            <TextField
              label="Max Load"
              type="number"
              fullWidth
              value={config.maxLoad || 1}
              onChange={e => setConfig({ ...config, maxLoad: Number(e.target.value) })}
              margin="normal"
            />
          </>
        );
      case 'phaseWindow':
        return (
          <>
            <TextField
              label="Task ID"
              fullWidth
              value={config.task || ''}
              onChange={e => setConfig({ ...config, task: e.target.value })}
              margin="normal"
            />
            <TextField
              label="Allowed Phases (comma-separated)"
              fullWidth
              value={config.allowedPhases?.join(',') || ''}
              onChange={e => setConfig({ ...config, allowedPhases: e.target.value.split(',').map((p: string) => p.trim()).filter((p: string) => p) })}
              margin="normal"
            />
          </>
        );
      case 'patternMatch':
        return (
          <>
            <TextField
              label="Regex"
              fullWidth
              value={config.regex || ''}
              onChange={e => setConfig({ ...config, regex: e.target.value })}
              margin="normal"
            />
            <TextField
              label="Template"
              fullWidth
              value={config.template || ''}
              onChange={e => setConfig({ ...config, template: e.target.value })}
              margin="normal"
            />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Box>
      {/* Suggest Rules Button */}
      <Box mb={2} display="flex" alignItems="center" gap={2}>
        <Tooltip title="Let AI analyze your data and suggest useful business rules">
          <span>
            <Button variant="contained" color="secondary" onClick={handleSuggestRules} disabled={suggestLoading} aria-label="Suggest Rules">
              {suggestLoading ? 'Suggesting...' : 'Suggest Rules'}
            </Button>
          </span>
        </Tooltip>
        {suggestError && <Typography color="error" variant="body2">{suggestError}</Typography>}
      </Box>
      {/* Suggestions Modal */}
      <Dialog open={suggestOpen} onClose={() => setSuggestOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>AI Rule Suggestions</DialogTitle>
        <DialogContent>
          {suggestions && suggestions.length > 0 ? (
            suggestions.map(rule => (
              <Box key={rule.id} mb={2} p={2} border={1} borderRadius={2} borderColor="grey.300">
                <Typography variant="subtitle1">{rule.type}: {rule.description}</Typography>
                <Typography variant="body2" color="text.secondary">{JSON.stringify(rule.config)}</Typography>
                <Box mt={1} display="flex" gap={1}>
                  <Tooltip title="Add this suggested rule to your rules list">
                    <Button size="small" variant="contained" onClick={() => handleAcceptSuggestion(rule)} aria-label="Accept Suggested Rule">Accept</Button>
                  </Tooltip>
                  <Tooltip title="Dismiss this suggestion">
                    <Button size="small" variant="outlined" color="secondary" onClick={() => setSuggestions(suggestions.filter(r => r.id !== rule.id))} aria-label="Reject Suggested Rule">Reject</Button>
                  </Tooltip>
                </Box>
              </Box>
            ))
          ) : (
            <Typography>No suggestions available.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSuggestOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      {/* NL Rule Input */}
      <Box mb={2}>
        <form onSubmit={handleNLRule}>
          <Typography variant="subtitle1" gutterBottom>
            Add Rule by Description (Natural Language)
          </Typography>
          <Box display="flex" gap={2} alignItems="center">
            <Tooltip title="Describe a rule in plain English (e.g. 'Task T1 and T3 must co-run')">
              <textarea
                value={nlRule}
                onChange={e => setNlRule(e.target.value)}
                placeholder="e.g. Task T1 and T3 must co-run"
                rows={2}
                style={{ flex: 1, fontSize: 16, padding: 8 }}
                disabled={nlLoading}
                aria-label="Natural Language Rule Input"
              />
            </Tooltip>
            <Tooltip title="Use AI to convert your description into a structured rule">
              <span>
                <Button type="submit" variant="outlined" disabled={nlLoading || !nlRule.trim()} aria-label="Add NL Rule">
                  {nlLoading ? 'Parsing...' : 'Add NL Rule'}
                </Button>
              </span>
            </Tooltip>
          </Box>
          {nlError && <Typography color="error" variant="body2">{nlError}</Typography>}
        </form>
      </Box>
      {/* Existing Rule Builder UI */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h5">Business Rules</Typography>
        <Tooltip title="Add a new business rule manually">
          <span>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()} aria-label="Add Rule">Add Rule</Button>
          </span>
        </Tooltip>
      </Box>
      <Paper variant="outlined">
        <List>
          {state.businessRules.length === 0 && (
            <ListItem>
              <ListItemText primary="No business rules defined yet." />
            </ListItem>
          )}
          {state.businessRules.map(rule => (
            <ListItem key={rule.id} secondaryAction={
              <>
                <Tooltip title="Edit this rule">
                  <IconButton edge="end" aria-label="edit" onClick={() => handleOpen(rule)}><EditIcon /></IconButton>
                </Tooltip>
                <Tooltip title="Delete this rule">
                  <IconButton edge="end" aria-label="delete" onClick={() => handleDelete(rule.id)}><DeleteIcon /></IconButton>
                </Tooltip>
              </>
            }>
              <ListItemText
                primary={`${RULE_TYPES.find(r => r.value === rule.type)?.label || rule.type}: ${rule.description}`}
                secondary={JSON.stringify(rule.config)}
              />
            </ListItem>
          ))}
        </List>
      </Paper>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editRule ? 'Edit Rule' : 'Add Rule'}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Rule Type</InputLabel>
            <Select
              value={type}
              label="Rule Type"
              onChange={e => {
                setType(e.target.value);
                setConfig(getDefaultConfig(e.target.value));
              }}
              disabled={!!editRule}
            >
              {RULE_TYPES.map(rt => (
                <MenuItem key={rt.value} value={rt.value}>{rt.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Description"
            fullWidth
            value={description}
            onChange={e => setDescription(e.target.value)}
            margin="normal"
          />
          {renderConfigFields()}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">{editRule ? 'Update' : 'Add'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 