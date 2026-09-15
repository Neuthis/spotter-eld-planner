/**
 * DailyLogSheet Component - Dark Modern Edition.
 * Renders an FMCSA-compliant 24-hour Driver's Daily Log graph grid.
 * Adapted with a dark canvas background, high-contrast cyan duty path,
 * clean quarter-hour ticks, and dark remarks table.
 */

import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  Grid,
  Stack,
} from '@mui/material';

const STATUS_ROWS = [
  { key: 'OFF_DUTY', label: '1. Off Duty', y: 32 },
  { key: 'SLEEPER', label: '2. Sleeper Berth', y: 72 },
  { key: 'DRIVING', label: '3. Driving', y: 112 },
  { key: 'ON_DUTY', label: '4. On Duty (Not Driving)', y: 152 },
];

const GRID_START_X = 180;
const GRID_WIDTH = 720;
const TOTAL_COL_X = GRID_START_X + GRID_WIDTH + 15;
const SVG_WIDTH = 980;
const SVG_HEIGHT = 190;

export default function DailyLogSheet({
  logData,
  carrierName = 'Spotter AI Autonomous Fleet',
  truckNumber = 'US-ELD-902',
}) {
  if (!logData) return null;

  const { day_number, date, total_miles, totals, segments, remarks } = logData;

  const hourToX = (hour) => GRID_START_X + (hour / 24.0) * GRID_WIDTH;

  // Build the continuous stepped SVG path
  let pathD = '';
  if (segments && segments.length > 0) {
    segments.forEach((seg, idx) => {
      const rowInfo = STATUS_ROWS.find((r) => r.key === seg.status) || STATUS_ROWS[0];
      const xStart = hourToX(seg.start_hour);
      const xEnd = hourToX(seg.end_hour);
      const y = rowInfo.y;

      if (idx === 0) {
        pathD += `M ${xStart} ${y} L ${xEnd} ${y} `;
      } else {
        pathD += `L ${xStart} ${y} L ${xEnd} ${y} `;
      }
    });
  }

  return (
    <Paper
      elevation={2}
      sx={{
        p: { xs: 2, sm: 3 },
        bgcolor: '#0b1120',
        border: '1px solid rgba(56, 189, 248, 0.2)',
        borderRadius: 3,
        boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
      }}
    >
      {/* Official Form Header */}
      <Box sx={{ borderBottom: '1px solid rgba(148, 163, 184, 0.2)', pb: 2, mb: 2 }}>
        <Grid container alignItems="center" justifyContent="space-between" spacing={1}>
          <Grid item>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                textTransform: 'uppercase',
                color: '#f8fafc',
                letterSpacing: 0.5,
              }}
            >
              Driver's Daily Log (One Calendar Day — 24 Hours)
            </Typography>
            <Typography variant="caption" sx={{ color: '#38bdf8' }}>
              Compliant with 49 CFR Part 395 regulations
            </Typography>
          </Grid>
          <Grid item>
            <Stack direction="row" spacing={1}>
              <Chip
                label={`Day ${day_number}`}
                sx={{
                  bgcolor: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  fontWeight: 700,
                }}
              />
              <Chip
                label={date}
                variant="outlined"
                sx={{ borderColor: 'rgba(148, 163, 184, 0.3)', color: '#cbd5e1', fontWeight: 600 }}
              />
            </Stack>
          </Grid>
        </Grid>

        <Grid container spacing={2} sx={{ mt: 1.5 }}>
          <Grid item xs={12} sm={4}>
            <Typography variant="caption" color="text.secondary" display="block">CARRIER</Typography>
            <Typography variant="body2" fontWeight={600} color="#f8fafc">{carrierName}</Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="caption" color="text.secondary" display="block">VEHICLE NUMBER</Typography>
            <Typography variant="body2" fontWeight={600} color="#f8fafc">{truckNumber}</Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="caption" color="text.secondary" display="block">TOTAL MILES TODAY</Typography>
            <Typography variant="body2" fontWeight={600} color="#38bdf8">{total_miles} mi</Typography>
          </Grid>
        </Grid>
      </Box>

      {/* SVG 24-Hour Graph Grid Container */}
      <Box
        sx={{
          overflowX: 'auto',
          py: 2,
          px: 1,
          bgcolor: '#070c18',
          borderRadius: 2,
          border: '1px solid rgba(148, 163, 184, 0.1)',
        }}
      >
        <svg width={SVG_WIDTH} height={SVG_HEIGHT} style={{ fontFamily: 'sans-serif' }}>
          {/* Horizontal Status Lanes */}
          {STATUS_ROWS.map((row) => (
            <g key={row.key}>
              <text x={10} y={row.y + 4} fontSize="12" fontWeight="600" fill="#94a3b8">
                {row.label}
              </text>
              <line
                x1={GRID_START_X}
                y1={row.y}
                x2={GRID_START_X + GRID_WIDTH}
                y2={row.y}
                stroke="rgba(148, 163, 184, 0.15)"
                strokeWidth="1.5"
              />
              {/* Daily Total Hours on the right */}
              <text x={TOTAL_COL_X + 22} y={row.y + 5} fontSize="13" fontWeight="bold" fill="#38bdf8">
                {totals[row.key] ? totals[row.key].toFixed(2) : '0.00'}
              </text>
            </g>
          ))}

          {/* Column Header: TOTAL HOURS */}
          <text x={TOTAL_COL_X} y={14} fontSize="11" fontWeight="800" fill="#64748b">
            TOTAL
          </text>
          <text x={TOTAL_COL_X} y={25} fontSize="11" fontWeight="800" fill="#64748b">
            HOURS
          </text>

          {/* Vertical Hour Lines and Subdivision Ticks */}
          {Array.from({ length: 25 }).map((_, h) => {
            const x = GRID_START_X + (h / 24.0) * GRID_WIDTH;
            const hourLabel = h === 0 ? 'Mid' : h === 12 ? 'Noon' : h === 24 ? 'Mid' : h > 12 ? h - 12 : h;

            return (
              <g key={`hour-${h}`}>
                <text x={x} y={15} fontSize="10" fontWeight="bold" textAnchor="middle" fill="#64748b">
                  {hourLabel}
                </text>
                {/* Major Full-Hour Line */}
                <line
                  x1={x}
                  y1={22}
                  x2={x}
                  y2={165}
                  stroke="rgba(148, 163, 184, 0.35)"
                  strokeWidth={h % 6 === 0 ? '1.5' : '0.8'}
                />

                {/* 15, 30, 45 Minute Subdivision Ticks */}
                {h < 24 &&
                  [0.25, 0.5, 0.75].map((fraction) => {
                    const subX = x + (fraction / 24.0) * GRID_WIDTH;
                    const tickHeight = fraction === 0.5 ? 165 : 155;
                    return (
                      <line
                        key={`tick-${h}-${fraction}`}
                        x1={subX}
                        y1={25}
                        x2={subX}
                        y2={tickHeight}
                        stroke="rgba(148, 163, 184, 0.15)"
                        strokeWidth="0.5"
                      />
                    );
                  })}
              </g>
            );
          })}

          {/* Continuous Stepped Log Path (Neon Cyan with subtle glow) */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="#00f0ff"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ filter: 'drop-shadow(0 0 4px rgba(0, 240, 255, 0.5))' }}
            />
          )}
        </svg>
      </Box>

      {/* Remarks Section */}
      <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid rgba(148, 163, 184, 0.15)' }}>
        <Typography
          variant="subtitle2"
          sx={{ fontWeight: 700, mb: 1.5, color: '#f8fafc', textTransform: 'uppercase' }}
        >
          Remarks & Duty Status Changes
        </Typography>
        {remarks && remarks.length > 0 ? (
          <Table
            size="small"
            sx={{
              border: '1px solid rgba(148, 163, 184, 0.15)',
              '& td, & th': { borderColor: 'rgba(148, 163, 184, 0.12)' },
            }}
          >
            <TableHead>
              <TableRow sx={{ bgcolor: 'rgba(15, 23, 42, 0.6)' }}>
                <TableCell sx={{ fontWeight: 700, width: '120px', color: '#94a3b8' }}>Time</TableCell>
                <TableCell sx={{ fontWeight: 700, width: '280px', color: '#94a3b8' }}>Location</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#94a3b8' }}>Activity / Remark</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {remarks.map((r, i) => (
                <TableRow
                  key={i}
                  sx={{
                    '&:nth-of-type(even)': { bgcolor: 'rgba(15, 23, 42, 0.3)' },
                    '&:hover': { bgcolor: 'rgba(56, 189, 248, 0.05)' },
                  }}
                >
                  <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600, color: '#38bdf8' }}>
                    {r.time_str}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 500, color: '#e2e8f0' }}>{r.location}</TableCell>
                  <TableCell sx={{ color: '#cbd5e1' }}>{r.remark}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Continuous off-duty period. No duty changes recorded for this day.
          </Typography>
        )}
      </Box>
    </Paper>
  );
}