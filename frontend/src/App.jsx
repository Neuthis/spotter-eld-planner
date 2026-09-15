/**
 * Main Application Dashboard - Dark Mode Edition.
 * Built with Material UI v5.
 * Features a modern dark cyber-logistics command center aesthetic,
 * quick route presets, KPI stat widgets, dark Leaflet route mapping, and multi-day ELD logs.
 */

import React, { useState } from 'react';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  AppBar,
  Toolbar,
  Chip,
  Stack,
  Divider,
  LinearProgress,
  InputAdornment,
} from '@mui/material';

// Icons
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import RouteIcon from '@mui/icons-material/Route';
import FmdGoodIcon from '@mui/icons-material/FmdGood';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SpeedIcon from '@mui/icons-material/Speed';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import BoltIcon from '@mui/icons-material/Bolt';
import DarkModeIcon from '@mui/icons-material/DarkMode';

import RouteMap from './components/RouteMap';
import DailyLogSheet from './components/DailyLogSheet';

// Advanced Cyber Logistics Dark Theme
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#38bdf8', // Neon Sky Blue
      light: '#7dd3fc',
      dark: '#0284c7',
      contrastText: '#0b0f19',
    },
    secondary: {
      main: '#818cf8', // Electric Indigo
      light: '#a5b4fc',
      dark: '#4f46e5',
    },
    background: {
      default: '#070b12',
      paper: '#0f172a',
    },
    text: {
      primary: '#f8fafc',
      secondary: '#94a3b8',
    },
    divider: 'rgba(148, 163, 184, 0.12)',
    success: {
      main: '#10b981',
    },
    warning: {
      main: '#f59e0b',
    },
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Inter", "Roboto", sans-serif',
    h6: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    subtitle1: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#0f172a',
          backgroundImage: 'radial-gradient(at 0% 0%, rgba(56, 189, 248, 0.03) 0px, transparent 50%)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 700,
          borderRadius: 8,
          letterSpacing: '0.02em',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            '& fieldset': {
              borderColor: 'rgba(148, 163, 184, 0.2)',
            },
            '&:hover fieldset': {
              borderColor: '#38bdf8',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#38bdf8',
              boxShadow: '0 0 0 3px rgba(56, 189, 248, 0.2)',
            },
          },
        },
      },
    },
  },
});

// Quick preset test routes
const PRESETS = [
  {
    label: 'Coast-to-Coast (3-4 Days)',
    current: 'New York, NY',
    pickup: 'Chicago, IL',
    dropoff: 'Los Angeles, CA',
    cycle: '12',
  },
  {
    label: 'Midwest Corridor (2 Days)',
    current: 'Detroit, MI',
    pickup: 'Indianapolis, IN',
    dropoff: 'Dallas, TX',
    cycle: '25',
  },
  {
    label: 'Regional Haul (1 Day)',
    current: 'Philadelphia, PA',
    pickup: 'Baltimore, MD',
    dropoff: 'Richmond, VA',
    cycle: '40',
  },
];

export default function App() {
  const [currentLocation, setCurrentLocation] = useState('New York, NY');
  const [pickupLocation, setPickupLocation] = useState('Chicago, IL');
  const [dropoffLocation, setDropoffLocation] = useState('Los Angeles, CA');
  const [cycleUsedHours, setCycleUsedHours] = useState('10');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [planData, setPlanData] = useState(null);
  const [selectedDayTab, setSelectedDayTab] = useState(0);

  const applyPreset = (p) => {
    setCurrentLocation(p.current);
    setPickupLocation(p.pickup);
    setDropoffLocation(p.dropoff);
    setCycleUsedHours(p.cycle);
  };

  const handlePlanTrip = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
      const response = await fetch(`${apiUrl}/api/plan-trip/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_location: currentLocation,
          pickup_location: pickupLocation,
          dropoff_location: dropoffLocation,
          cycle_used_hours: parseFloat(cycleUsedHours) || 0,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to plan trip. Please check your locations.');
      }

      setPlanData(data);
      setSelectedDayTab(0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const cycleRatio = Math.min(100, ((parseFloat(cycleUsedHours) || 0) / 70) * 100);

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 10 }}>
        {/* Navigation Bar */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
          }}
        >
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  bgcolor: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  p: 0.9,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <LocalShippingIcon sx={{ color: '#38bdf8', fontSize: 26 }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ color: '#f8fafc', lineHeight: 1.1 }}>
                  Spotter AI
                </Typography>
                <Typography variant="caption" sx={{ color: '#38bdf8', fontWeight: 600 }}>
                  HOS ROUTE OPTIMIZER & ELD ENGINE
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                icon={<VerifiedUserIcon sx={{ fontSize: '15px !important', color: '#10b981 !important' }} />}
                label="FMCSA 70h/8d"
                size="small"
                sx={{
                  bgcolor: 'rgba(16, 185, 129, 0.1)',
                  color: '#34d399',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  fontWeight: 600,
                }}
              />
              <Chip
                icon={<DarkModeIcon sx={{ fontSize: '14px !important', color: '#818cf8 !important' }} />}
                label="Night Ops UI"
                size="small"
                sx={{
                  bgcolor: 'rgba(99, 102, 241, 0.1)',
                  color: '#a5b4fc',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  fontWeight: 600,
                  display: { xs: 'none', sm: 'inline-flex' },
                }}
              />
            </Stack>
          </Toolbar>
        </AppBar>

        <Container maxWidth="xl" sx={{ mt: 3 }}>
          {/* Main Top Grid */}
          <Grid container spacing={3}>
            {/* Input Form Card */}
            <Grid item xs={12} lg={4}>
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#f8fafc' }}>
                    <RouteIcon sx={{ color: '#38bdf8' }} /> Dispatch Parameters
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Define locations to calculate compliance routes, stops, and automated log books.
                  </Typography>

                  {/* Preset Fast Selection */}
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Quick Route Presets
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 0.8, mb: 2.5, flexWrap: 'wrap', gap: 0.8 }}>
                    {PRESETS.map((p, idx) => (
                      <Chip
                        key={idx}
                        label={p.label}
                        size="small"
                        icon={<BoltIcon sx={{ fontSize: '14px !important', color: '#38bdf8 !important' }} />}
                        onClick={() => applyPreset(p)}
                        clickable
                        variant="outlined"
                        sx={{
                          borderColor: 'rgba(56, 189, 248, 0.3)',
                          bgcolor: 'rgba(56, 189, 248, 0.05)',
                          color: '#e2e8f0',
                          '&:hover': { bgcolor: 'rgba(56, 189, 248, 0.15)', borderColor: '#38bdf8' },
                        }}
                      />
                    ))}
                  </Stack>

                  <form onSubmit={handlePlanTrip}>
                    <Stack spacing={2}>
                      <TextField
                        fullWidth
                        label="Current Driver Location"
                        value={currentLocation}
                        onChange={(e) => setCurrentLocation(e.target.value)}
                        size="small"
                        required
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <FmdGoodIcon fontSize="small" sx={{ color: '#94a3b8' }} />
                            </InputAdornment>
                          ),
                        }}
                      />

                      <TextField
                        fullWidth
                        label="Pickup Location (1h Loading)"
                        value={pickupLocation}
                        onChange={(e) => setPickupLocation(e.target.value)}
                        size="small"
                        required
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <FmdGoodIcon fontSize="small" sx={{ color: '#38bdf8' }} />
                            </InputAdornment>
                          ),
                        }}
                      />

                      <TextField
                        fullWidth
                        label="Dropoff Location (1h Unloading)"
                        value={dropoffLocation}
                        onChange={(e) => setDropoffLocation(e.target.value)}
                        size="small"
                        required
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <FmdGoodIcon fontSize="small" sx={{ color: '#10b981' }} />
                            </InputAdornment>
                          ),
                        }}
                      />

                      <Box>
                        <TextField
                          fullWidth
                          type="number"
                          label="Current Cycle Used (Hours)"
                          value={cycleUsedHours}
                          onChange={(e) => setCycleUsedHours(e.target.value)}
                          size="small"
                          inputProps={{ min: 0, max: 70, step: 0.5 }}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <AccessTimeIcon fontSize="small" sx={{ color: '#94a3b8' }} />
                              </InputAdornment>
                            ),
                          }}
                        />
                        <Box sx={{ mt: 1, px: 0.5 }}>
                          <Stack direction="row" justifyContent="space-between">
                            <Typography variant="caption" color="text.secondary">
                              Cycle Consumption
                            </Typography>
                            <Typography variant="caption" fontWeight="bold" sx={{ color: cycleRatio > 80 ? '#f87171' : '#38bdf8' }}>
                              {cycleUsedHours}h / 70h
                            </Typography>
                          </Stack>
                          <LinearProgress
                            variant="determinate"
                            value={cycleRatio}
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              mt: 0.5,
                              bgcolor: 'rgba(148, 163, 184, 0.1)',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: cycleRatio > 80 ? '#ef4444' : '#38bdf8',
                              },
                            }}
                          />
                        </Box>
                      </Box>

                      <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        size="large"
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <RouteIcon />}
                        sx={{
                          mt: 1,
                          py: 1.4,
                          bgcolor: '#0284c7',
                          color: '#ffffff',
                          fontWeight: 700,
                          boxShadow: '0 4px 15px rgba(2, 132, 199, 0.4)',
                          '&:hover': {
                            bgcolor: '#0369a1',
                            boxShadow: '0 6px 20px rgba(2, 132, 199, 0.6)',
                          },
                        }}
                      >
                        {loading ? 'Executing HOS Simulation...' : 'Calculate Route & Generate ELD'}
                      </Button>
                    </Stack>
                  </form>
                </CardContent>
              </Card>
            </Grid>

            {/* Metrics and Dark Map Column */}
            <Grid item xs={12} lg={8}>
              <Stack spacing={3}>
                {/* Metric Summary Cards */}
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Card>
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <SpeedIcon sx={{ color: '#38bdf8', fontSize: 18 }} />
                          <Typography variant="caption" color="text.secondary" fontWeight={700}>
                            TOTAL MILES
                          </Typography>
                        </Stack>
                        <Typography variant="h5" fontWeight="bold" sx={{ mt: 0.5, color: '#f8fafc' }}>
                          {planData ? `${planData.summary.total_miles} mi` : '--'}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={6} sm={3}>
                    <Card>
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <CalendarMonthIcon sx={{ color: '#818cf8', fontSize: 18 }} />
                          <Typography variant="caption" color="text.secondary" fontWeight={700}>
                            SCHEDULED DAYS
                          </Typography>
                        </Stack>
                        <Typography variant="h5" fontWeight="bold" sx={{ mt: 0.5, color: '#f8fafc' }}>
                          {planData ? `${planData.summary.total_days} Days` : '--'}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={6} sm={3}>
                    <Card>
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <RouteIcon sx={{ color: '#34d399', fontSize: 18 }} />
                          <Typography variant="caption" color="text.secondary" fontWeight={700}>
                            LOADED HAUL
                          </Typography>
                        </Stack>
                        <Typography variant="h5" fontWeight="bold" sx={{ mt: 0.5, color: '#f8fafc' }}>
                          {planData ? `${planData.summary.leg2_miles} mi` : '--'}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={6} sm={3}>
                    <Card>
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <LocalGasStationIcon sx={{ color: '#fbbf24', fontSize: 18 }} />
                          <Typography variant="caption" color="text.secondary" fontWeight={700}>
                            FUEL RECHARGE
                          </Typography>
                        </Stack>
                        <Typography variant="h5" fontWeight="bold" sx={{ mt: 0.5, color: '#f8fafc' }}>
                          {planData ? `Every 1,000 mi` : '--'}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {error && <Alert severity="error" sx={{ bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5' }}>{error}</Alert>}

                {/* Dark Route Map Container */}
                <RouteMap
                  locations={planData?.locations}
                  routeCoordinates={planData?.route_coordinates}
                />
              </Stack>
            </Grid>
          </Grid>

          {/* ELD Multi-Day Log Section */}
          {planData && planData.daily_logs && planData.daily_logs.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Divider sx={{ mb: 3, borderColor: 'rgba(148, 163, 184, 0.15)' }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                <Box>
                  <Typography variant="h5" fontWeight="bold" sx={{ color: '#f8fafc' }}>
                    Electronic Logging Device (ELD) - Daily Graph Sheets
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Standard 24-hour logs with stepped duty transitions. Every day strictly balances to 24.0 hours.
                  </Typography>
                </Box>
                <Chip
                  label={`${planData.daily_logs.length} Log Sheet(s) Generated`}
                  sx={{
                    bgcolor: 'rgba(56, 189, 248, 0.1)',
                    color: '#38bdf8',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    fontWeight: 700,
                  }}
                />
              </Box>

              {/* Day Selection Tabs */}
              <Box sx={{ borderBottom: 1, borderColor: 'rgba(148, 163, 184, 0.15)', mb: 3 }}>
                <Tabs
                  value={selectedDayTab}
                  onChange={(e, newVal) => setSelectedDayTab(newVal)}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{
                    '& .MuiTabs-indicator': { bgcolor: '#38bdf8', height: 3 },
                    '& .MuiTab-root': {
                      color: '#94a3b8',
                      fontWeight: 600,
                      '&.Mui-selected': { color: '#38bdf8' },
                    },
                  }}
                >
                  {planData.daily_logs.map((log, index) => (
                    <Tab
                      key={index}
                      icon={<CalendarMonthIcon sx={{ fontSize: 18 }} />}
                      iconPosition="start"
                      label={`Day ${log.day_number} (${log.date})`}
                    />
                  ))}
                </Tabs>
              </Box>

              {/* Render Active Daily Log Sheet */}
              <DailyLogSheet logData={planData.daily_logs[selectedDayTab]} />
            </Box>
          )}
        </Container>
      </Box>
    </ThemeProvider>
  );
}