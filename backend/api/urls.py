"""
API application routing.
Maps the plan-trip endpoint to TripPlanningView.
"""
from django.urls import path
from .views import TripPlanningView

urlpatterns = [
    path('plan-trip/', TripPlanningView.as_view(), name='plan-trip'),
]