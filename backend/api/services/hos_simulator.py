"""
HOS (Hours of Service) Simulator Engine.
Implements US FMCSA regulations for property-carrying commercial drivers:
- Property-carrying 70h/8-day rule
- 11-hour driving limit
- 14-hour on-duty window
- 30-minute rest break after 8 hours of cumulative driving
- 10 consecutive hours off-duty/sleeper reset
- Mandatory fueling every 1,000 miles (30 min On-Duty)
- 1 hour On-Duty for pickup and 1 hour On-Duty for dropoff
"""

from datetime import datetime, timedelta
from typing import List, Dict, Any


class DutyStatus:
    OFF_DUTY = "OFF_DUTY"          # Line 1
    SLEEPER = "SLEEPER"            # Line 2
    DRIVING = "DRIVING"            # Line 3
    ON_DUTY = "ON_DUTY"            # Line 4


class HOSSimulator:
    AVERAGE_SPEED_MPH = 55.0
    FUEL_INTERVAL_MILES = 1000.0

    def __init__(self, current_cycle_used_hours: float = 0.0, start_datetime: datetime = None):
        self.cycle_used_minutes = int(current_cycle_used_hours * 60)
        self.current_time = start_datetime or datetime(2026, 10, 1, 6, 0)

        # Active shift tracking counters (reset after 10 consecutive hours off-duty)
        self.shift_driving_minutes = 0       # Limit: 11 hours = 660 mins
        self.shift_window_minutes = 0        # Limit: 14 hours = 840 mins
        self.driving_since_break_minutes = 0 # Limit: 8 hours = 480 mins
        self.miles_since_fuel = 0.0

        # Continuous trip timeline
        self.timeline: List[Dict[str, Any]] = []

    def _add_event(self, status: str, duration_minutes: int, location: str, remark: str, miles: float = 0.0):
        if duration_minutes <= 0:
            return

        start_time = self.current_time
        end_time = start_time + timedelta(minutes=duration_minutes)

        self.timeline.append({
            "status": status,
            "start_time": start_time,
            "end_time": end_time,
            "duration_minutes": duration_minutes,
            "duration_hours": round(duration_minutes / 60.0, 2),
            "location": location,
            "remark": remark,
            "miles": round(miles, 2)
        })

        self.current_time = end_time

        if status == DutyStatus.DRIVING:
            self.shift_driving_minutes += duration_minutes
            self.shift_window_minutes += duration_minutes
            self.driving_since_break_minutes += duration_minutes
            self.cycle_used_minutes += duration_minutes
            self.miles_since_fuel += miles

        elif status == DutyStatus.ON_DUTY:
            self.shift_window_minutes += duration_minutes
            self.cycle_used_minutes += duration_minutes
            # A 30+ minute consecutive non-driving period resets the 8-hour driving break requirement
            if duration_minutes >= 30:
                self.driving_since_break_minutes = 0

        elif status in (DutyStatus.OFF_DUTY, DutyStatus.SLEEPER):
            self.shift_window_minutes += duration_minutes
            if duration_minutes >= 30:
                self.driving_since_break_minutes = 0

            # 10 or more consecutive hours off duty completely restarts 11-hour and 14-hour clocks
            if duration_minutes >= 600:
                self.shift_driving_minutes = 0
                self.shift_window_minutes = 0
                self.driving_since_break_minutes = 0

    def _take_mandatory_10h_rest(self, location: str):
        self._add_event(
            status=DutyStatus.SLEEPER,
            duration_minutes=600,
            location=location,
            remark="10-Hour Mandatory Rest Break"
        )

    def _take_30min_break(self, location: str):
        self._add_event(
            status=DutyStatus.OFF_DUTY,
            duration_minutes=30,
            location=location,
            remark="30-Minute Rest Break"
        )

    def _take_fuel_stop(self, location: str):
        self._add_event(
            status=DutyStatus.ON_DUTY,
            duration_minutes=30,
            location=location,
            remark="Fueling (1,000 miles interval)"
        )
        self.miles_since_fuel = 0.0

    def simulate_driving_leg(self, total_leg_miles: float, start_loc: str, end_loc: str):
        """
        Simulates a driving leg, splitting into chunks based on HOS limits,
        rest requirements, and fueling intervals.
        """
        remaining_miles = total_leg_miles

        while remaining_miles > 0.01:
            # Check 11-hour driving and 14-hour duty window limits
            if self.shift_driving_minutes >= 660 or self.shift_window_minutes >= 840:
                self._take_mandatory_10h_rest(location=start_loc)
                continue

            # Check mandatory 30-minute break after 8 cumulative driving hours
            if self.driving_since_break_minutes >= 480:
                self._take_30min_break(location=start_loc)
                continue

            # Calculate allowed driving duration before hitting the next restriction
            max_drive_for_11h = 660 - self.shift_driving_minutes
            max_drive_for_14h = 840 - self.shift_window_minutes
            max_drive_for_break = 480 - self.driving_since_break_minutes

            allowed_drive_minutes = min(max_drive_for_11h, max_drive_for_14h, max_drive_for_break)

            # Check fuel limits
            miles_to_fuel = max(0.0, self.FUEL_INTERVAL_MILES - self.miles_since_fuel)
            if miles_to_fuel <= 0.01:
                self._take_fuel_stop(location=start_loc)
                continue

            max_miles_before_fuel = miles_to_fuel
            miles_possible = (allowed_drive_minutes / 60.0) * self.AVERAGE_SPEED_MPH

            # Drive the safe chunk
            chunk_miles = min(remaining_miles, max_miles_before_fuel, miles_possible)
            chunk_minutes = max(1, int(round((chunk_miles / self.AVERAGE_SPEED_MPH) * 60)))

            self._add_event(
                status=DutyStatus.DRIVING,
                duration_minutes=chunk_minutes,
                location=f"En route to {end_loc}",
                remark="Driving",
                miles=chunk_miles
            )

            remaining_miles -= chunk_miles

    def run_trip(self, current_to_pickup_miles: float, pickup_to_dropoff_miles: float,
                 current_loc_name: str, pickup_loc_name: str, dropoff_loc_name: str) -> List[Dict[str, Any]]:
        """
        Executes the entire trip simulation sequence including inspections,
        deadhead travel, loading, transport, and unloading.
        """
        # 1. Pre-trip inspection (15 minutes On-Duty)
        self._add_event(
            status=DutyStatus.ON_DUTY,
            duration_minutes=15,
            location=current_loc_name,
            remark="Pre-Trip Inspection"
        )

        # 2. Deadhead leg to pickup location if distance > 0
        if current_to_pickup_miles > 0:
            self.simulate_driving_leg(current_to_pickup_miles, current_loc_name, pickup_loc_name)

        # 3. Loading at pickup (1 hour On-Duty required)
        self._add_event(
            status=DutyStatus.ON_DUTY,
            duration_minutes=60,
            location=pickup_loc_name,
            remark="Loading / Pickup Operations"
        )

        # 4. Main transit leg to dropoff location
        self.simulate_driving_leg(pickup_to_dropoff_miles, pickup_loc_name, dropoff_loc_name)

        # 5. Unloading and post-trip inspection (1 hour On-Duty required)
        self._add_event(
            status=DutyStatus.ON_DUTY,
            duration_minutes=60,
            location=dropoff_loc_name,
            remark="Unloading / Dropoff & Post-Trip Inspection"
        )

        return self.timeline


def split_timeline_into_daily_logs(timeline: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Splits continuous trip timeline into distinct 24-hour calendar days (00:00 to 24:00).
    Guarantees every day sums up to exactly 24.0 hours for the ELD graph grid.
    """
    if not timeline:
        return []

    trip_start_date = timeline[0]["start_time"].date()
    trip_end_date = timeline[-1]["end_time"].date()

    daily_logs = []
    current_date = trip_start_date
    timeline_idx = 0
    total_events = len(timeline)
    day_number = 1

    while current_date <= trip_end_date:
        day_start = datetime.combine(current_date, datetime.min.time())
        day_end = day_start + timedelta(days=1)

        day_segments = []
        day_remarks = []
        day_miles = 0.0
        current_cursor = day_start

        # Pad initial gap before first event with Off-Duty
        if day_number == 1 and timeline[0]["start_time"] > day_start:
            gap_minutes = int((timeline[0]["start_time"] - day_start).total_seconds() // 60)
            if gap_minutes > 0:
                day_segments.append({
                    "status": DutyStatus.OFF_DUTY,
                    "start_hour": 0.0,
                    "end_hour": round(gap_minutes / 60.0, 2),
                    "duration_hours": round(gap_minutes / 60.0, 2),
                    "location": timeline[0]["location"],
                    "remark": "Off Duty Prior to Shift Start"
                })
                current_cursor = timeline[0]["start_time"]

        while timeline_idx < total_events:
            ev = timeline[timeline_idx]
            ev_start = max(ev["start_time"], day_start)
            ev_end = min(ev["end_time"], day_end)

            if ev_start < ev_end:
                duration_m = int((ev_end - ev_start).total_seconds() // 60)
                start_h = round((ev_start - day_start).total_seconds() / 3600.0, 2)
                end_h = round((ev_end - day_start).total_seconds() / 3600.0, 2)
                dur_h = round(duration_m / 60.0, 2)

                # Prorate miles if driving event spans across midnight
                ev_total_m = (ev["end_time"] - ev["start_time"]).total_seconds() // 60
                ratio = duration_m / ev_total_m if ev_total_m > 0 else 1.0
                seg_miles = round(ev["miles"] * ratio, 2)
                day_miles += seg_miles

                day_segments.append({
                    "status": ev["status"],
                    "start_hour": start_h,
                    "end_hour": end_h,
                    "duration_hours": dur_h,
                    "location": ev["location"],
                    "remark": ev["remark"]
                })

                if ev["remark"] and ev["location"]:
                    day_remarks.append({
                        "time_str": ev_start.strftime("%H:%M"),
                        "location": ev["location"],
                        "remark": ev["remark"]
                    })

                current_cursor = ev_end

            if ev["end_time"] > day_end:
                break
            else:
                timeline_idx += 1

        # Pad remaining day time up to 24:00 with Off-Duty
        if current_cursor < day_end:
            gap_minutes = int((day_end - current_cursor).total_seconds() // 60)
            start_h = round((current_cursor - day_start).total_seconds() / 3600.0, 2)
            end_h = 24.0
            day_segments.append({
                "status": DutyStatus.OFF_DUTY,
                "start_hour": start_h,
                "end_hour": end_h,
                "duration_hours": round(gap_minutes / 60.0, 2),
                "location": day_segments[-1]["location"] if day_segments else "Terminal",
                "remark": "Off Duty"
            })

        # Calculate daily status totals
        totals = {
            DutyStatus.OFF_DUTY: 0.0,
            DutyStatus.SLEEPER: 0.0,
            DutyStatus.DRIVING: 0.0,
            DutyStatus.ON_DUTY: 0.0,
        }
        for s in day_segments:
            totals[s["status"]] = round(totals[s["status"]] + s["duration_hours"], 2)

        daily_logs.append({
            "day_number": day_number,
            "date": current_date.strftime("%Y-%m-%d"),
            "total_miles": round(day_miles, 2),
            "totals": totals,
            "total_hours": round(sum(totals.values()), 2),
            "segments": day_segments,
            "remarks": day_remarks
        })

        current_date += timedelta(days=1)
        day_number += 1

    return daily_logs