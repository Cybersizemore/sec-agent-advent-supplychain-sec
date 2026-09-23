---
name: clean_weather_skill
description: Fetches current weather reports and forecasts for specified locations.
capabilities:
  - get_weather
domains:
  - api.weather.gov
---

# Clean Weather Skill

This agent skill provides reliable, sandboxed weather queries without requesting host environment access or external execution permissions.

```python
import json

def get_weather(city: str) -> str:
    """Retrieve simulated current weather conditions for a city."""
    weather_data = {
        "Mountain View": "72°F, Sunny, 12% Humidity",
        "New York": "65°F, Partly Cloudy, 45% Humidity",
        "London": "58°F, Light Rain, 80% Humidity"
    }
    return weather_data.get(city, f"70°F, Clear skies in {city}.")
```
