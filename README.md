# Explore National Parks in California

## Description
This is a portfolio project that gets data from several APIs and organizes that information on the front-end. Originally built to explore VueJS, it was rebuilt in 2025 using Lit components.

Looking for a hobby project, and as a fan of parks and open spaces, I discovered that the National Park Service has a public API. To control how much data would be handled and stored, I limited the scope of the project to the state of California. I imagined the app as a quick and easy way to check park information before jumping in the car. That guided my decisions to include park alerts and weather conditions. This information is kept in the browser’s localStorage with reasonable expiration dates to ensure users accurate information, while also not having to request all the data every time the app loads.

Park locations are displayed on a map using the Google Maps Javascript API, and I also integrated weather forecasts via the OpenWeather API. Both of these features improved the app’s usefulness as a lightweight trip planning tool. I love being able to load up the app and immediately gain a better understanding of my state’s national parks and monuments.

## Technologies
- Lit

## APIs
- Google Maps
- National Park Service
- OpenWeather
