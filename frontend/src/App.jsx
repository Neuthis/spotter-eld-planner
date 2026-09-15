/**
 * Main Application Dashboard.
 * Built with Material UI v5.
 * Features a modern logistics dashboard theme, preset test routes,
 * KPI summary metrics, interactive Leaflet route map, and multi-day ELD log viewers.
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

import RouteMap from './components/RouteMap';
import DailyLogSheet from './components/DailyLogSheet';

// Modern Logistics Material UI Theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0f172a', // Deep slate navy
      light: '#334155',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#2563eb', // Vivid Royal Blue
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    success: {
      main: '#10b981',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h6: {
      fontWeight: 700,
    },
    subtitle1: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
          border: '1px solid #e2e8f0',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
        },
      },
    },
  },
});

// Quick preset routes for recruiter testing
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
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 8 }}>
        {/* Navigation Bar */}
        <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'primary.main', borderBottom: '1px solid #1e293b' }}>
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  bgcolor: 'secondary.main',
                  p: 0.8,
                  borderRadius: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <LocalShippingIcon sx={{ color: '#fff', fontSize: 24 }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ color: '#fff', lineHeight: 1.1 }}>
                  Spotter AI
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  HOS Route Planner & Automated ELD Engine
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1} sx={{ display: { xs: 'none', sm: 'flex' } }}>
              <Chip
                icon={<VerifiedUserIcon sx={{ fontSize: '16px !important', color: '#10b981 !important' }} />}
                label="FMCSA 70h/8d Compliant"
                size="small"
                sx={{ bgcolor: '#1e293b', color: '#cbd5e1', fontWeight: 500 }}
              />
              <Chip
                label="49 CFR § 395"
                size="small"
                sx={{ bgcolor: '#1e293b', color: '#94a3b8', fontWeight: 500 }}
              />
            </Stack>
          </Toolbar>
        </AppBar>

        <Container maxWidth="xl" sx={{ mt: 3 }}>
          {/* Main Layout Grid */}
          <Grid container spacing={3}>
            {/* Input & Parameters Card */}
            <Grid item xs={12} lg={4}>
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <RouteIcon color="primary" /> Trip Dispatch Configuration
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Configure the origin, freight transfer points, and driver cycle balance.
                  </Typography>

                  {/* Preset Buttons for Quick Testing */}
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                    Quick Route Presets
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 0.8, mb: 2.5, flexWrap: 'wrap', gap: 0.5 }}>
                    {PRESETS.map((p, idx) => (
                      <Chip
                        key={idx}
                        label={p.label}
                        size="small"
                        icon={<BoltIcon sx={{ fontSize: '14px !important' }} />}
                        onClick={() => applyPreset(p)}
                        clickable
                        variant="outlined"
                        color="secondary"
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
                              <FmdGoodIcon fontSize="small" sx={{ color: '#64748b' }} />
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
                              <FmdGoodIcon fontSize="small" sx={{ color: '#0284c7' }} />
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
                                <AccessTimeIcon fontSize="small" sx={{ color: '#64748b' }} />
                              </InputAdornment>
                            ),
                          }}
                        />
                        <Box sx={{ mt: 1, px: 0.5 }}>
                          <Stack direction="row" justifyContent="space-between">
                            <Typography variant="caption" color="text.secondary">
                              Cycle Consumption
                            </Typography>
                            <Typography variant="caption" fontWeight="bold">
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
                              bgcolor: '#e2e8f0',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: cycleRatio > 80 ? '#ef4444' : '#2563eb',
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
                          py: 1.3,
                          bgcolor: 'secondary.main',
                          '&:hover': { bgcolor: '#1d4ed8' },
                        }}
                      >
                        {loading ? 'Simulating HOS & Route...' : 'Generate Route & ELD Logs'}
                      </Button>
                    </Stack>
                  </form>
                </CardContent>
              </Card>
            </Grid>

            {/* Metrics & Interactive Map Card */}
            <Grid item xs={12} lg={8}>
              <Stack spacing={3}>
                {/* Metric Summary Cards */}
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Card sx={{ bgcolor: '#ffffff' }}>
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <SpeedIcon color="primary" fontSize="small" />
                          <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            TOTAL DISTANCE
                          </Typography>
                        </Stack>
                        <Typography variant="h5" fontWeight="bold" sx={{ mt: 0.5 }}>
                          {planData ? `${planData.summary.total_miles} mi` : '--'}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={6} sm={3}>
                    <Card sx={{ bgcolor: '#ffffff' }}>
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <CalendarMonthIcon color="secondary" fontSize="small" />
                          <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            TRANSIT DAYS
                          </Typography>
                        </Stack>
                        <Typography variant="h5" fontWeight="bold" sx={{ mt: 0.5 }}>
                          {planData ? `${planData.summary.total_days} Days` : '--'}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={6} sm={3}>
                    <Card sx={{ bgcolor: '#ffffff' }}>
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <RouteIcon sx={{ color: '#0284c7' }} fontSize="small" />
                          <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            LOADED HAUL
                          </Typography>
                        </Stack>
                        <Typography variant="h5" fontWeight="bold" sx={{ mt: 0.5 }}>
                          {planData ? `${planData.summary.leg2_miles} mi` : '--'}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={6} sm={3}>
                    <Card sx={{ bgcolor: '#ffffff' }}>
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <LocalGasStationIcon sx={{ color: '#f59e0b' }} fontSize="small" />
                          <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            FUEL INTERVALS
                          </Typography>
                        </Stack>
                        <Typography variant="h5" fontWeight="bold" sx={{ mt: 0.5 }}>
                          {planData ? `Every 1,000 mi` : '--'}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {error && <Alert severity="error">{error}</Alert>}

                {/* Map Display */}
                <RouteMap
                  locations={planData?.locations}
                  routeCoordinates={planData?.route_coordinates}
                />
              </Stack>
            </Grid>
          </Grid>

          {/* ELD Logs Section */}
          {planData && planData.daily_logs && planData.daily_logs.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Divider sx={{ mb: 3 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    Electronic Logging Device (ELD) - Daily Sheets
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Official FMCSA 24-hour graph grid. Each daily log sums up to exactly 24.0 hours.
                  </Typography>
                </Box>
                <Chip
                  label={`${planData.daily_logs.length} Log Sheet(s) Generated`}
                  color="primary"
                  variant="outlined"
                  sx={{ fontWeight: 'bold' }}
                />
              </Box>

              {/* Day Tabs */}
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3, bgcolor: '#ffffff', borderRadius: 2 }}>
                <Tabs
                  value={selectedDayTab}
                  onChange={(e, newVal) => setSelectedDayTab(newVal)}
                  variant="scrollable"
                  scrollButtons="auto"
                >
                  {planData.daily_logs.map((log, index) => (
                    <Tab
                      key={index}
                      icon={<CalendarMonthIcon sx={{ fontSize: 18 }} />}
                      iconPosition="start"
                      label={`Day ${log.day_number} (${log.date})`}
                      sx={{ fontWeight: 600 }}
                    />
                  ))}
                </Tabs>
              </Box>

              {/* Active Day Log Component */}
              <DailyLogSheet logData={planData.daily_logs[selectedDayTab]} />
            </Box>
          )}
        </Container>
      </Box>
    </ThemeProvider>
  );
}