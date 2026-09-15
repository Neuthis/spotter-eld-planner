"""
Main URL Configuration for the core project.
Routes traffic to the Django admin and delegates to the API application.
"""
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
]