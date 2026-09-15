/**
 * Main Application Component.
 * Provides user input controls for trip planning, requests backend HOS simulation,
 * and presents summary statistics, map, and daily ELD log sheets.
 */

import React, { useState } from 'react';
import {
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
} from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import RouteIcon from '@mui/icons-material/Route';

import RouteMap from './components/RouteMap';
import DailyLogSheet from './components/DailyLogSheet';

export default function App() {
  const [currentLocation, setCurrentLocation] = useState('New York, NY');
  const [pickupLocation, setPickupLocation] = useState('Chicago, IL');
  const [dropoffLocation, setDropoffLocation] = useState('Los Angeles, CA');
  const [cycleUsedHours, setCycleUsedHours] = useState('10');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [planData, setPlanData] = useState(null);
  const [selectedDayTab, setSelectedDayTab] = useState(0);

  const handlePlanTrip = async (e) => {
    e.preventDefault();
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

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f4f6f8', pb: 8 }}>
      {/* Top Navigation Bar */}
      <AppBar position="static" sx={{ bgcolor: '#0f172a' }}>
        <Toolbar>
          <LocalShippingIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Spotter AI - HOS Trip Planner & ELD Generator
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        {/* Form and Metrics Section */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={5}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Trip Parameters
                </Typography>
                <form onSubmit={handlePlanTrip}>
                  <TextField
                    fullWidth
                    label="Current Location"
                    value={currentLocation}
                    onChange={(e) => setCurrentLocation(e.target.value)}
                    margin="normal"
                    size="small"
                    required
                  />
                  <TextField
                    fullWidth
                    label="Pickup Location"
                    value={pickupLocation}
                    onChange={(e) => setPickupLocation(e.target.value)}
                    margin="normal"
                    size="small"
                    required
                  />
                  <TextField
                    fullWidth
                    label="Dropoff Location"
                    value={dropoffLocation}
                    onChange={(e) => setDropoffLocation(e.target.value)}
                    margin="normal"
                    size="small"
                    required
                  />
                  <TextField
                    fullWidth
                    type="number"
                    label="Current Cycle Used (Hours)"
                    value={cycleUsedHours}
                    onChange={(e) => setCycleUsedHours(e.target.value)}
                    margin="normal"
                    size="small"
                    inputProps={{ min: 0, max: 70, step: 0.5 }}
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    size="large"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <RouteIcon />}
                    sx={{ mt: 2, bgcolor: '#1976d2', py: 1.2 }}
                  >
                    {loading ? 'Calculating Route & HOS...' : 'Generate Trip Plan & Logs'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </Grid>

          {/* Quick Metrics Card */}
          <Grid item xs={12} md={7}>
            <Card elevation={2} sx={{ height: '100%', display: 'flex', alignItems: 'center' }}>
              <CardContent sx={{ width: '100%' }}>
                {planData ? (
                  <Box>
                    <Typography variant="h6" fontWeight="bold" gutterBottom color="primary">
                      Trip Overview & Regulations Summary
                    </Typography>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="text.secondary">Total Distance</Typography>
                        <Typography variant="h6" fontWeight="bold">{planData.summary.total_miles} mi</Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="text.secondary">Days Required</Typography>
                        <Typography variant="h6" fontWeight="bold">{planData.summary.total_days} Days</Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="text.secondary">Deadhead Leg</Typography>
                        <Typography variant="h6" fontWeight="bold">{planData.summary.leg1_miles} mi</Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="text.secondary">Loaded Leg</Typography>
                        <Typography variant="h6" fontWeight="bold">{planData.summary.leg2_miles} mi</Typography>
                      </Grid>
                    </Grid>
                    <Alert severity="info" sx={{ mt: 2 }}>
                      Compliance applied: 70h/8-day rule, 11h driving limit, 14h duty window, mandatory 30m break, and 1,000-mile fueling intervals.
                    </Alert>
                  </Box>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary">
                      Fill out the parameters and click "Generate Trip Plan" to preview the route and daily ELD logs.
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {error && (
          <Alert severity="error" sx={{ mt: 3 }}>
            {error}
          </Alert>
        )}

        {/* Map Visualization */}
        <Box sx={{ mt: 4 }}>
          <RouteMap
            locations={planData?.locations}
            routeCoordinates={planData?.route_coordinates}
          />
        </Box>

        {/* ELD Daily Log Sheets Section */}
        {planData && planData.daily_logs && planData.daily_logs.length > 0 && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Electronic Logging Device (ELD) - Daily Sheets
            </Typography>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs
                value={selectedDayTab}
                onChange={(e, newVal) => setSelectedDayTab(newVal)}
                variant="scrollable"
                scrollButtons="auto"
              >
                {planData.daily_logs.map((log, index) => (
                  <Tab key={index} label={`Day ${log.day_number} (${log.date})`} />
                ))}
              </Tabs>
            </Box>

            {/* Render active day log */}
            <DailyLogSheet logData={planData.daily_logs[selectedDayTab]} />
          </Box>
        )}
      </Container>
    </Box>
  );
}