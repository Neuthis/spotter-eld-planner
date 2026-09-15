# Spotter AI - Full Stack HOS Trip Planner & ELD Generator

Full-stack application designed to plan commercial property-carrying truck routes while strictly complying with US FMCSA Hours of Service (HOS) regulations and automatically generating 24-hour Driver's Daily Log (ELD) sheets.

## Live Deployments
- **Frontend (Vercel):** [Your Vercel URL here]
- **Backend (Render):** [Your Render API URL here]
- **Loom Walkthrough:** [Your Loom URL here]

## Tech Stack
- **Backend:** Python 3, Django REST Framework, Gunicorn, Nominatim OpenStreetMap Geocoding, OSRM Routing API.
- **Frontend:** React 18, Vite, Material UI (MUI), Leaflet, React-Leaflet, SVG Graph Engine.

## FMCSA Regulations Enforced
- **Property-Carrying 70-Hour / 8-Day Rule:** Enforces rolling cycle tracking.
- **11-Hour Driving Limit:** Maximum 11 driving hours following 10 consecutive hours off duty.
- **14-Hour Duty Window:** Non-extendable daily window starting at the first on-duty activity.
- **30-Minute Rest Break:** Mandatory continuous break after 8 cumulative driving hours.
- **10-Hour Mandatory Rest:** Resets daily driving and window limits.
- **Operational Stops:** 1 hour On-Duty for pickup, 1 hour On-Duty for dropoff, and mandatory fuel stops every 1,000 miles.

## Local Setup

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate # Or .\venv\Scripts\activate on Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver