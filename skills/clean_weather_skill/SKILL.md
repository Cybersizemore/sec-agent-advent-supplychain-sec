---
name: get-weather-skill
description: Retrieves real-time meteorological observations, multi-day forecasts, and severe atmospheric alerts from certified weather services.
capabilities:
  - get_weather
domains:
  - api.weather.gov
---

# Agent Skill: get-weather-skill

## QUICK START
- **Resolve Location**: Parse user query for city, coordinates, or postal code.
- **Fetch Meteorological Data**: Query National Weather Service (NWS) endpoints via `api.weather.gov`.
- **Format Forecast**: Structure observations into temperature, precipitation probability, wind speed, and active alerts.
- **Enforce Security Boundaries**: All requests must adhere to read-only queries with zero host credential access.

## NAME
get-weather-skill

## DESCRIPTION
Provides hyper-local, real-time meteorological conditions, short-term trends, and severe weather warnings for requested global and regional locations.

The skill normalizes geographic inputs, queries certified meteorological endpoints (`api.weather.gov`), validates data integrity, and formats structured forecasts for autonomous agents and downstream tools:
- Current Conditions: Temperature, humidity, barometric pressure, dew point, and wind vector.
- 5-Day Outlook: High/low temperature trends, precipitation probability, and cloud coverage.
- Active Weather Advisories: Urgent flood, tornado, or severe thunderstorm watches and warnings.

It enforces strict data sandboxing, zero persistence of sensitive user locations, and strict adherence to declared network domains.

## IMPLEMENTATION WORKFLOW
When tasked with retrieving weather data, execute the following steps:

1. Gather Location Context & Target Timeframe
   - Parse Geographic Entity: Extract city name, state/region, or latitude/longitude from user input. If ambiguous (e.g., "Springfield"), prompt for state or country.
   - Determine Forecast Window: Identify requested timeframe (current conditions, hourly forecast, or multi-day outlook). Defaults to current + 24-hour summary.
   - Unit Preferences: Identify imperial (°F, mph) or metric (°C, km/h) based on geographic locale or explicit user preference.

2. Query Certified Meteorological Endpoints
   - Execute authorized HTTP GET query to declared domain:
     `GET https://api.weather.gov/points/{latitude},{longitude}`
   - Retrieve observation stations and forecast grid data.
   - Enforce read-only network boundary: Never invoke external APIs outside `api.weather.gov`.

3. Structure & Format Forecast Response
   - Current Weather Card: Present temperature, feels-like temperature, wind speed/direction, and humidity.
   - Outlook Table: Markdown table listing periods, expected conditions, high/low values, and precipitation likelihood.
   - Active Warnings: Highlight urgent meteorological alerts in a dedicated bold warning block.

4. Client Integration & Python Handler
   ```python
   import json
   import urllib.request

   def get_weather(latitude: float, longitude: float) -> dict:
       """Fetch current forecast from National Weather Service API."""
       url = f"https://api.weather.gov/points/{latitude:.4f},{longitude:.4f}"
       headers = {"User-Agent": "EnterpriseAgent/1.0 (weather-skill@enterprise.internal)"}
       req = urllib.request.Request(url, headers=headers)
       with urllib.request.urlopen(req, timeout=10) as response:
           data = json.loads(response.read().decode("utf-8"))
       return {
           "status": "SUCCESS",
           "forecast_endpoint": data.get("properties", {}).get("forecast"),
           "grid_id": data.get("properties", {}).get("gridId")
       }
   ```

## USAGE EXAMPLES
- "What is the current weather and forecast in Seattle for the next 3 days?"
- "Check if there are any active severe weather alerts for Austin, Texas."
- "Provide hourly precipitation chances for Chicago this evening in metric units."

## CONTRIBUTIONS
To propose changes to this skill, submit a pull request ensuring all endpoints match the declared `sat.lock` capability boundaries.
