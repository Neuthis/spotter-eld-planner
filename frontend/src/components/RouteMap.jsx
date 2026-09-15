/**
 * RouteMap Component - Dark Mode Edition (Clean Tiles).
 * Uses official OpenStreetMap tiles with an inverted dark CSS filter.
 * Eliminates third-party API key watermarks while maintaining a sleek command-center look.
 */

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Box, Paper, Typography } from '@mui/material';

// Fix marker icon asset resolution in bundled environments
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Auto-focuses the map viewport around bounding coordinates
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
      <Paper
        elevation={2}
        sx={{
          p: 4,
          textAlign: 'center',
          height: '420px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#0f172a',
          border: '1px solid rgba(148, 163, 184, 0.12)',
        }}
      >
        <Typography color="text.secondary">
          Configure parameters above and click "Calculate Route" to render the live dark map.
        </Typography>
      </Paper>
    );
  }

  const { current, pickup, dropoff } = locations;
  const currentPos = [current.lat, current.lon];
  const pickupPos = [pickup.lat, pickup.lon];
  const dropoffPos = [dropoff.lat, dropoff.lon];

  const allPoints = [currentPos, pickupPos, dropoffPos];
  if (routeCoordinates && routeCoordinates.length > 0) {
    allPoints.push(...routeCoordinates);
  }

  return (
    <Paper
      elevation={3}
      sx={{
        borderRadius: 3,
        overflow: 'hidden',
        border: '1px solid rgba(148, 163, 184, 0.15)',
        bgcolor: '#0f172a',
      }}
    >
      <Box sx={{ p: 2, bgcolor: '#0b1120', borderBottom: '1px solid rgba(148, 163, 184, 0.12)' }}>
        <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#f8fafc' }}>
          Interactive Highway Corridor Map
        </Typography>
      </Box>

      {/* Map viewport with custom CSS filter to make official OSM tiles dark */}
      <Box
        sx={{
          height: '420px',
          width: '100%',
          '& .leaflet-tile-pane': {
            filter: 'brightness(0.6) invert(1) contrast(3) hue-rotate(200deg) saturate(0.25) brightness(0.7)',
          },
        }}
      >
        <MapContainer center={currentPos} zoom={5} style={{ height: '100%', width: '100%' }}>
          <ChangeView bounds={allPoints} />

          {/* Official, unlimited, unwatermarked OpenStreetMap tiles */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Current / Start Marker */}
          <Marker position={currentPos}>
            <Popup>
              <strong>Current Location:</strong><br />
              {current.display_name}
            </Popup>
          </Marker>

          {/* Pickup Marker */}
          <Marker position={pickupPos}>
            <Popup>
              <strong>Pickup Location:</strong><br />
              {pickup.display_name}
            </Popup>
          </Marker>

          {/* Dropoff Marker */}
          <Marker position={dropoffPos}>
            <Popup>
              <strong>Dropoff Location:</strong><br />
              {dropoff.display_name}
            </Popup>
          </Marker>

          {/* High-visibility Neon Cyan Route Corridor */}
          {routeCoordinates && routeCoordinates.length > 0 && (
            <Polyline
              positions={routeCoordinates}
              color="#00f0ff"
              weight={5}
              opacity={0.9}
            />
          )}
        </MapContainer>
      </Box>
    </Paper>
  );
}