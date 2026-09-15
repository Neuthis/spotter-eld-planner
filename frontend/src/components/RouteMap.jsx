/**
 * RouteMap Component.
 * Displays interactive Leaflet map with calculated route polyline,
 * start/pickup/dropoff markers, and automatic viewport centering.
 */

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Box, Paper, Typography } from '@mui/material';

// Fix default marker icon issues with bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Helper component to auto-fit map view bounds around coordinates
function ChangeView({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, map]);
  return null;
}

export default function RouteMap({ locations, routeCoordinates }) {
  if (!locations || !locations.current) {
    return (
      <Paper elevation={2} sx={{ p: 4, textAlign: 'center', height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography color="text.secondary">Submit the trip details to render the route on the map.</Typography>
      </Paper>
    );
  }

  const { current, pickup, dropoff } = locations;
  const currentPos = [current.lat, current.lon];
  const pickupPos = [pickup.lat, pickup.lon];
  const dropoffPos = [dropoff.lat, dropoff.lon];

  // Collect all points for map boundary calculation
  const allPoints = [currentPos, pickupPos, dropoffPos];
  if (routeCoordinates && routeCoordinates.length > 0) {
    allPoints.push(...routeCoordinates);
  }

  return (
    <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden', mb: 4 }}>
      <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
        <Typography variant="subtitle1" fontWeight="bold">
          Interactive Trip Route
        </Typography>
      </Box>
      <Box sx={{ height: '450px', width: '100%' }}>
        <MapContainer center={currentPos} zoom={5} style={{ height: '100%', width: '100%' }}>
          <ChangeView bounds={allPoints} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Start Point Marker */}
          <Marker position={currentPos}>
            <Popup>
              <strong>Start / Current Location:</strong><br />
              {current.display_name}
            </Popup>
          </Marker>

          {/* Pickup Point Marker */}
          <Marker position={pickupPos}>
            <Popup>
              <strong>Pickup Location:</strong><br />
              {pickup.display_name}
            </Popup>
          </Marker>

          {/* Dropoff Point Marker */}
          <Marker position={dropoffPos}>
            <Popup>
              <strong>Dropoff Location:</strong><br />
              {dropoff.display_name}
            </Popup>
          </Marker>

          {/* Route Polyline */}
          {routeCoordinates && routeCoordinates.length > 0 && (
            <Polyline positions={routeCoordinates} color="#1976d2" weight={5} opacity={0.75} />
          )}
        </MapContainer>
      </Box>
    </Paper>
  );
}