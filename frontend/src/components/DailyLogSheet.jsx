/**
 * DailyLogSheet Component.
 * Renders an FMCSA-compliant 24-hour Driver's Daily Log graph grid using SVG.
 * Displays the 4 duty status rows, 15-minute tick subdivisions, continuous stepped line,
 * daily hours summary, and location remarks.
 */

import React from 'react';
import { Box, Paper, Typography, Table, TableBody, TableCell, TableHead, TableRow, Chip } from '@mui/material';

const STATUS_ROWS = [
  { key: 'OFF_DUTY', label: '1. Off Duty', y: 30 },
  { key: 'SLEEPER', label: '2. Sleeper Berth', y: 70 },
  { key: 'DRIVING', label: '3. Driving', y: 110 },
  { key: 'ON_DUTY', label: '4. On Duty (Not Driving)', y: 150 },
];

const GRID_START_X = 180;
const GRID_WIDTH = 720; // 30px per hour across 24 hours
const TOTAL_COL_X = GRID_START_X + GRID_WIDTH + 15;
const SVG_WIDTH = 980;
const SVG_HEIGHT = 190;

export default function DailyLogSheet({ logData, carrierName = "Spotter Logistics", truckNumber = "TRK-2026" }) {
  if (!logData) return null;

  const { day_number, date, total_miles, totals, segments, remarks } = logData;

  // Converts fractional hour (0.0 - 24.0) into SVG X coordinate
  const hourToX = (hour) => GRID_START_X + (hour / 24.0) * GRID_WIDTH;

  // Build stepped continuous path string across duty status changes
  let pathD = "";
  if (segments && segments.length > 0) {
    segments.forEach((seg, idx) => {
      const rowInfo = STATUS_ROWS.find((r) => r.key === seg.status) || STATUS_ROWS[0];
      const xStart = hourToX(seg.start_hour);
      const xEnd = hourToX(seg.end_hour);
      const y = rowInfo.y;

      if (idx === 0) {
        pathD += `M ${xStart} ${y} L ${xEnd} ${y} `;
      } else {
        // Vertical connector line from previous duty line to current, then horizontal line
        pathD += `L ${xStart} ${y} L ${xEnd} ${y} `;
      }
    });
  }

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 4, bgcolor: '#ffffff', borderRadius: 2 }}>
      {/* Log Header Information */}
      <Box sx={{ borderBottom: '2px solid #000', pb: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
            Driver's Daily Log (24 Hours) - Day {day_number}
          </Typography>
          <Chip label={`Date: ${date}`} color="primary" variant="outlined" sx={{ fontWeight: 'bold' }} />
        </Box>
        <Box sx={{ display: 'flex', gap: 4, mt: 1, flexWrap: 'wrap' }}>
          <Typography variant="body2"><strong>Carrier:</strong> {carrierName}</Typography>
          <Typography variant="body2"><strong>Vehicle / Unit #:</strong> {truckNumber}</Typography>
          <Typography variant="body2"><strong>Total Miles Today:</strong> {total_miles} mi</Typography>
        </Box>
      </Box>

      {/* SVG 24-Hour Graph Grid */}
      <Box sx={{ overflowX: 'auto', py: 1 }}>
        <svg width={SVG_WIDTH} height={SVG_HEIGHT} style={{ fontFamily: 'sans-serif' }}>
          {/* Status Labels & Row Background Guidelines */}
          {STATUS_ROWS.map((row) => (
            <g key={row.key}>
              <text x={10} y={row.y + 4} fontSize="12" fontWeight="600" fill="#333">
                {row.label}
              </text>
              <line
                x1={GRID_START_X}
                y1={row.y}
                x2={GRID_START_X + GRID_WIDTH}
                y2={row.y}
                stroke="#e0e0e0"
                strokeWidth="1"
              />
              {/* Daily total hours on the right side */}
              <text x={TOTAL_COL_X + 20} y={row.y + 5} fontSize="13" fontWeight="bold" fill="#000">
                {totals[row.key] ? totals[row.key].toFixed(2) : "0.00"}
              </text>
            </g>
          ))}

          {/* Column Header: "Total Hours" */}
          <text x={TOTAL_COL_X} y={15} fontSize="11" fontWeight="bold" fill="#666">
            TOTAL
          </text>
          <text x={TOTAL_COL_X} y={26} fontSize="11" fontWeight="bold" fill="#666">
            HOURS
          </text>

          {/* Vertical Hour and Quarter-Hour Grid Lines */}
          {Array.from({ length: 25 }).map((_, h) => {
            const x = GRID_START_X + (h / 24.0) * GRID_WIDTH;
            const hourLabel = h === 0 ? "Mid" : h === 12 ? "Noon" : h === 24 ? "Mid" : h > 12 ? h - 12 : h;

            return (
              <g key={`hour-${h}`}>
                {/* Hour text marker */}
                <text x={x} y={15} fontSize="10" fontWeight="bold" textAnchor="middle" fill="#555">
                  {hourLabel}
                </text>
                {/* Major full hour line */}
                <line x1={x} y1={22} x2={x} y2={165} stroke="#888" strokeWidth={h % 6 === 0 ? "1.5" : "0.75"} />

                {/* 15, 30, 45 minute ticks inside the hour */}
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
                        stroke="#ccc"
                        strokeWidth="0.5"
                      />
                    );
                  })}
              </g>
            );
          })}

          {/* Continuous Stepped Duty Status Path (Blue Line) */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="#1976d2"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </svg>
      </Box>

      {/* Remarks Section */}
      <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #eee' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, textTransform: 'uppercase', color: '#555' }}>
          Remarks / Change of Duty Status
        </Typography>
        {remarks && remarks.length > 0 ? (
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f9f9f9' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Time</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Location</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Activity / Remark</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {remarks.map((r, i) => (
                <TableRow key={i}>
                  <TableCell sx={{ width: '120px', fontFamily: 'monospace' }}>{r.time_str}</TableCell>
                  <TableCell sx={{ width: '280px' }}>{r.location}</TableCell>
                  <TableCell>{r.remark}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No duty status changes recorded for this 24-hour cycle.
          </Typography>
        )}
      </Box>
    </Paper>
  );
}