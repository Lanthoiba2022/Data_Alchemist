import React, { useState } from 'react';
import { Box, Button, Typography, Paper, List, ListItem, ListItemText, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Select, FormControl, InputLabel, Tooltip } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import { useData } from '../context/DataContext';
import { BusinessRule, CoRunRule, SlotRestrictionRule, LoadLimitRule, PhaseWindowRule, PatternMatchRule } from '../types';
import { v4 as uuidv4 } from 'uuid';

const RULE_TYPES = [
  { value: 'coRun', label: 'Co-Run Tasks' },
  { value: 'slotRestriction', label: 'Slot Restriction' },
  { value: 'loadLimit', label: 'Load Limit' },
  { value: 'phaseWindow', label: 'Phase Window' },
  { value: 'patternMatch', label: 'Pattern Match' },
];

function getDefaultRule(type: string): Partial<BusinessRule> {
  switch (type) {
    case 'coRun':
      return { type: 'coRun', tasks: [], description: '' } as CoRunRule;
    case 'slotRestriction':
      return { type: 'slotRestriction', targetGroup: '', groupType: 'worker', minCommonSlots: 1, description: '' } as SlotRestrictionRule;
    case 'loadLimit':
      return { type: 'loadLimit', workerGroup: '', maxSlotsPerPhase: 1, description: '' } as LoadLimitRule;
    case 'phaseWindow':
      return { type: 'phaseWindow', taskId: '', allowedPhases: [], description: '' } as PhaseWindowRule;
    case 'patternMatch':
      return { type: 'patternMatch', regex: '', template: '', description: '' } as PatternMatchRule;
    default:
      return { type: 'coRun', tasks: [], description: '' } as CoRunRule;
  }
}

export function RuleBuilder() {
  const { state, dispatch } = useData();
  const [open, setOpen] = useState(false);
  const [editRule, setEditRule] = useState<BusinessRule | null>(null);
  const [type, setType] = useState('coRun');
  const [description, setDescription] = useState('');
  const [ruleData, setRuleData] = useState<any>(getDefaultRule('coRun'));
  const [nlRule, setNlRule] = useState('');
  const [nlLoading, setNlLoading] = useState(false);
  const [nlError, setNlError] = useState<string | null>(null);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<BusinessRule[] | null>(null);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  // Rotating placeholders for NL rule input
  const placeholders = [
    "e.g. Any task that can be co-run",
    "e.g. Any task that can only run in phases",
    "e.g. Any task that cannot exceed a load limit per phase",
    "e.g. Any task that needs common slots with other tasks",
    "e.g. Any task that needs to match a pattern",
    "e.g. Any task that needs to be restricted to a slot"
  ];

  // Rotate placeholders every 3 seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [placeholders.length]);

  const handleOpen = (rule?: BusinessRule) => {
    if (rule) {
      setEditRule(rule);
      setType(rule.type);
      setDescription(rule.description);
      setRuleData(rule);
    } else {
      setEditRule(null);
      setType('coRun');
      setDescription('');
      setRuleData(getDefaultRule('coRun'));
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditRule(null);
    setType('coRun');
    setDescription('');
    setRuleData(getDefaultRule('coRun'));
  };

  const handleSave = () => {
    const rule: BusinessRule = {
      id: editRule ? editRule.id : uuidv4(),
      ...ruleData,
      description,
    } as BusinessRule;
    
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
      const response = await fetch('/api/nl-rule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: nlRule,
          clients: state.clients,
          workers: state.workers,
          tasks: state.tasks,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to parse rule');
      }
      const responseData = await response.json();
      const rule: BusinessRule = responseData.rule;
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
      const response = await fetch('/api/suggest-rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clients: state.clients,
          workers: state.workers,
          tasks: state.tasks,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get suggestions');
      }
      
      const responseData = await response.json();
      setSuggestions(responseData.rules);
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

  // Dynamic rule fields based on rule type
  const renderRuleFields = () => {
    switch (type) {
      case 'coRun':
        return (
          <TextField
            label="Task IDs (comma-separated)"
            fullWidth
            value={Array.isArray(ruleData.tasks) ? ruleData.tasks.join(',') : ''}
            onChange={e => setRuleData({ ...ruleData, tasks: e.target.value.split(',').map((t: string) => t.trim()).filter((t: string) => t) })}
            margin="normal"
          />
        );
      case 'slotRestriction':
        return (
          <>
            <TextField
              label="Target Group"
              fullWidth
              value={ruleData.targetGroup || ''}
              onChange={e => setRuleData({ ...ruleData, targetGroup: e.target.value })}
              margin="normal"
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Group Type</InputLabel>
              <Select
                value={ruleData.groupType || 'worker'}
                label="Group Type"
                onChange={e => setRuleData({ ...ruleData, groupType: e.target.value })}
              >
                <MenuItem value="worker">Worker</MenuItem>
                <MenuItem value="client">Client</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Min Common Slots"
              type="number"
              fullWidth
              value={ruleData.minCommonSlots || 1}
              onChange={e => setRuleData({ ...ruleData, minCommonSlots: Number(e.target.value) })}
              margin="normal"
            />
          </>
        );
      case 'loadLimit':
        return (
          <>
            <TextField
              label="Worker Group"
              fullWidth
              value={ruleData.workerGroup || ''}
              onChange={e => setRuleData({ ...ruleData, workerGroup: e.target.value })}
              margin="normal"
            />
            <TextField
              label="Max Slots Per Phase"
              type="number"
              fullWidth
              value={ruleData.maxSlotsPerPhase || 1}
              onChange={e => setRuleData({ ...ruleData, maxSlotsPerPhase: Number(e.target.value) })}
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
              value={ruleData.taskId || ''}
              onChange={e => setRuleData({ ...ruleData, taskId: e.target.value })}
              margin="normal"
            />
            <TextField
              label="Allowed Phases (comma-separated)"
              fullWidth
              value={Array.isArray(ruleData.allowedPhases) ? ruleData.allowedPhases.join(',') : ''}
              onChange={e => setRuleData({ ...ruleData, allowedPhases: e.target.value.split(',').map((p: string) => Number(p.trim())).filter((p: number) => !isNaN(p)) })}
              margin="normal"
            />
          </>
        );
      case 'patternMatch':
        return (
          <>
            <TextField
              label="Regex Pattern"
              fullWidth
              value={ruleData.regex || ''}
              onChange={e => setRuleData({ ...ruleData, regex: e.target.value })}
              margin="normal"
            />
            <TextField
              label="Template"
              fullWidth
              value={ruleData.template || ''}
              onChange={e => setRuleData({ ...ruleData, template: e.target.value })}
              margin="normal"
            />
            <TextField
              label="Parameters (JSON)"
              fullWidth
              value={ruleData.parameters ? JSON.stringify(ruleData.parameters) : '{}'}
              onChange={e => {
                try {
                  const params = JSON.parse(e.target.value);
                  setRuleData({ ...ruleData, parameters: params });
                } catch {
                  // Keep as string if invalid JSON
                }
              }}
              margin="normal"
            />
          </>
        );
      default:
        return null;
    }
  };

  const getRuleDisplayText = (rule: BusinessRule) => {
    switch (rule.type) {
      case 'coRun':
        return `Co-Run: ${rule.tasks.join(', ')}`;
      case 'slotRestriction':
        return `Slot Restriction: ${rule.targetGroup} (${rule.groupType}) - min ${rule.minCommonSlots} slots`;
      case 'loadLimit':
        return `Load Limit: ${rule.workerGroup} - max ${rule.maxSlotsPerPhase} slots/phase`;
      case 'phaseWindow':
        return `Phase Window: ${rule.taskId} - phases ${rule.allowedPhases.join(', ')}`;
      case 'patternMatch':
        return `Pattern Match: ${rule.regex} → ${rule.template}`;
      default:
        return (rule as any).description || 'Unknown rule type';
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
                <Typography variant="subtitle1">{getRuleDisplayText(rule)}</Typography>
                <Typography variant="body2" color="text.secondary">{rule.description}</Typography>
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
                placeholder={placeholders[placeholderIndex]}
                rows={1}
                style={{
                  flex: 1,
                  fontSize: 18,
                  padding: 14,
                  border: '2px solid #1976d2',
                  borderRadius: 8,
                  background: '#f5faff',
                  boxShadow: '0 2px 8px rgba(25, 118, 210, 0.08)',
                  outline: 'none',
                  resize: 'vertical',
                  color: '#222',
                  transition: 'border 0.2s',
                  maxHeight: 48,
                  minHeight: 32,
                }}
                disabled={nlLoading}
                aria-label="Natural Language Rule Input"
                onFocus={e => (e.target.style.border = '2px solid #1565c0')}
                onBlur={e => (e.target.style.border = '2px solid #1976d2')}
              />
            </Tooltip>
            <Tooltip title="Use AI to convert your description into a structured rule">
              <span>
                <Button type="submit" variant="outlined" disabled={nlLoading || !nlRule.trim()} aria-label="Add NL Rule">
                  {nlLoading ? 'Adding...' : 'Add NL Rule'}
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
                primary={getRuleDisplayText(rule)}
                secondary={rule.description}
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
                setRuleData(getDefaultRule(e.target.value));
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
          {renderRuleFields()}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">{editRule ? 'Update' : 'Add'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 