"""
API Views for Trip Planning and HOS generation.
Handles geocoding (Nominatim / OSRM) and triggers the HOS simulation engine.
"""

import requests
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .services.hos_simulator import HOSSimulator, split_timeline_into_daily_logs


def geocode_place(query: str):
    """
    Geocodes an address or city using OpenStreetMap Nominatim API.
    Returns dict with lat, lon, display_name or None if not found.
    """
    url = "https://nominatim.openstreetmap.org/search"
    headers = {"User-Agent": "SpotterELDPlannerAssessment/1.0"}
    params = {"q": query, "format": "json", "limit": 1}

    try:
        res = requests.get(url, params=params, headers=headers, timeout=10)
        data = res.json()
        if data and len(data) > 0:
            return {
                "lat": float(data[0]["lat"]),
                "lon": float(data[0]["lon"]),
                "display_name": data[0]["display_name"]
            }
    except Exception:
        pass
    return None


def get_osrm_route(coords: list):
    """
    Fetches driving distance and polyline geometry from public OSRM service.
    coords: list of tuples [(lon1, lat1), (lon2, lat2), ...]
    Returns distance in miles and coordinate points for mapping.
    """
    coord_str = ";".join([f"{lon},{lat}" for lon, lat in coords])
    url = f"https://router.project-osrm.org/route/v1/driving/{coord_str}?overview=full&geometries=geojson"

    try:
        res = requests.get(url, timeout=15)
        data = res.json()
        if data.get("code") == "Ok" and len(data.get("routes", [])) > 0:
            route = data["routes"][0]
            meters = route["distance"]
            miles = meters * 0.000621371
            geometry = route["geometry"]["coordinates"]
            latlngs = [[pt[1], pt[0]] for pt in geometry]
            return {"miles": miles, "coordinates": latlngs}
    except Exception:
        pass

    return None


class TripPlanningView(APIView):
    """
    Endpoint: POST /api/plan-trip/
    Accepts trip parameters, runs HOS simulation, and returns daily logs and route coordinates.
    """

    def post(self, request):
        current_loc_str = request.data.get("current_location", "").strip()
        pickup_loc_str = request.data.get("pickup_location", "").strip()
        dropoff_loc_str = request.data.get("dropoff_location", "").strip()

        try:
            cycle_used_hours = float(request.data.get("cycle_used_hours", 0.0))
        except (ValueError, TypeError):
            cycle_used_hours = 0.0

        if not current_loc_str or not pickup_loc_str or not dropoff_loc_str:
            return Response(
                {"error": "current_location, pickup_location, and dropoff_location are all required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Geocode input locations
        loc_current = geocode_place(current_loc_str)
        loc_pickup = geocode_place(pickup_loc_str)
        loc_dropoff = geocode_place(dropoff_loc_str)

        if not loc_current or not loc_pickup or not loc_dropoff:
            return Response(
                {"error": "Could not geocode one or more of the specified locations."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Leg 1: Current to Pickup
        leg1 = get_osrm_route([
            (loc_current["lon"], loc_current["lat"]),
            (loc_pickup["lon"], loc_pickup["lat"])
        ])
        leg1_miles = leg1["miles"] if leg1 else 100.0

        # Leg 2: Pickup to Dropoff
        leg2 = get_osrm_route([
            (loc_pickup["lon"], loc_pickup["lat"]),
            (loc_dropoff["lon"], loc_dropoff["lat"])
        ])
        leg2_miles = leg2["miles"] if leg2 else 1500.0

        total_trip_miles = leg1_miles + leg2_miles

        # Run HOS simulation
        simulator = HOSSimulator(current_cycle_used_hours=cycle_used_hours)
        timeline = simulator.run_trip(
            current_to_pickup_miles=leg1_miles,
            pickup_to_dropoff_miles=leg2_miles,
            current_loc_name=current_loc_str,
            pickup_loc_name=pickup_loc_str,
            dropoff_loc_name=dropoff_loc_str
        )

        daily_logs = split_timeline_into_daily_logs(timeline)

        # Merge route polylines for the Leaflet map
        route_coords = []
        if leg1 and "coordinates" in leg1:
            route_coords.extend(leg1["coordinates"])
        if leg2 and "coordinates" in leg2:
            route_coords.extend(leg2["coordinates"])

        return Response({
            "summary": {
                "total_miles": round(total_trip_miles, 2),
                "leg1_miles": round(leg1_miles, 2),
                "leg2_miles": round(leg2_miles, 2),
                "total_days": len(daily_logs),
                "initial_cycle_used_hours": cycle_used_hours,
            },
            "locations": {
                "current": loc_current,
                "pickup": loc_pickup,
                "dropoff": loc_dropoff
            },
            "route_coordinates": route_coords,
            "daily_logs": daily_logs
        }, status=status.HTTP_200_OK)