<<<<<<< HEAD
// ─── Open-Meteo API (no API key required) ───────────────────────────────────
const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
=======
const apiKey = '4740d90631714cdd94584740261501'; // Replace with your actual API key
const searchApiUrl = `https://api.weatherapi.com/v1/search.json?key=5a6a13a79a454a63b2814322252502&q=`;
const forecastApiUrl = `https://api.weatherapi.com/v1/forecast.json?key=5a6a13a79a454a63b2814322252502&days=3&q=`;
>>>>>>> a04c63413faca10ddb1ed785b0b5d06fd93e9a10

// ─── WMO Weather Interpretation Codes → label + emoji icon ──────────────────
// https://open-meteo.com/en/docs#weathervariables
const WMO_CODES = {
    0: { label: 'Clear Sky', icon: '☀️' },
    1: { label: 'Mainly Clear', icon: '🌤️' },
    2: { label: 'Partly Cloudy', icon: '⛅' },
    3: { label: 'Overcast', icon: '☁️' },
    45: { label: 'Foggy', icon: '🌫️' },
    48: { label: 'Depositing Rime Fog', icon: '🌫️' },
    51: { label: 'Light Drizzle', icon: '🌦️' },
    53: { label: 'Moderate Drizzle', icon: '🌦️' },
    55: { label: 'Dense Drizzle', icon: '🌧️' },
    61: { label: 'Slight Rain', icon: '🌧️' },
    63: { label: 'Moderate Rain', icon: '🌧️' },
    65: { label: 'Heavy Rain', icon: '🌧️' },
    71: { label: 'Slight Snow', icon: '🌨️' },
    73: { label: 'Moderate Snow', icon: '🌨️' },
    75: { label: 'Heavy Snow', icon: '❄️' },
    77: { label: 'Snow Grains', icon: '🌨️' },
    80: { label: 'Slight Showers', icon: '🌦️' },
    81: { label: 'Moderate Showers', icon: '🌧️' },
    82: { label: 'Violent Showers', icon: '⛈️' },
    85: { label: 'Slight Snow Showers', icon: '🌨️' },
    86: { label: 'Heavy Snow Showers', icon: '❄️' },
    95: { label: 'Thunderstorm', icon: '⛈️' },
    96: { label: 'Thunderstorm w/ Hail', icon: '⛈️' },
    99: { label: 'Thunderstorm w/ Heavy Hail', icon: '⛈️' },
};

function getWmo(code) {
    return WMO_CODES[code] ?? { label: 'Unknown', icon: '🌡️' };
}

// Wind direction degrees → compass abbreviation
function degToCompass(deg) {
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return dirs[Math.round(deg / 45) % 8];
}

// ─── DOM refs ────────────────────────────────────────────────────────────────
const searchForm = document.getElementById('searchForm');
const cityInput = document.getElementById('cityInput');
const forecastEl = document.getElementById('forecast');
const placeholder = document.getElementById('forecast-placeholder');
const quickCityBtns = document.querySelectorAll('.quick-city');
const hamburger = document.getElementById('hamburger');
const mainNav = document.querySelector('.main-navigation');

// ─── Hamburger toggle ────────────────────────────────────────────────────────
hamburger.addEventListener('click', () => {
    mainNav.classList.toggle('is-open');
});

// ─── Quick city buttons ──────────────────────────────────────────────────────
quickCityBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const city = btn.dataset.city;
        cityInput.value = city;
        searchCity(city);
        document.getElementById('forecastSection').scrollIntoView({ behavior: 'smooth' });
    });
});

// ─── Search form ─────────────────────────────────────────────────────────────
searchForm.addEventListener('submit', e => {
    e.preventDefault();
    const city = cityInput.value.trim();
    if (city) {
        searchCity(city);
        document.getElementById('forecastSection').scrollIntoView({ behavior: 'smooth' });
    } else {
        showError('Please enter a city name.');
    }
});

// ─── Step 1: Geocode city name → lat/lon ─────────────────────────────────────
async function searchCity(cityName) {
    showLoading();
    try {
        const url = `${GEO_URL}?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Geocoding HTTP ${res.status}`);
        const data = await res.json();

        if (!data.results || data.results.length === 0) {
            showError('City not found. Please try a different name.');
            return;
        }

        const { latitude, longitude, name, country } = data.results[0];
        fetchWeather(latitude, longitude, name, country);
    } catch (err) {
        console.error('Geocoding error:', err);
        showError('Could not find that city. Please check your spelling and try again.');
    }
}

// ─── Step 2: Fetch 3-day daily forecast ──────────────────────────────────────
async function fetchWeather(lat, lon, cityName, country) {
    try {
        const params = new URLSearchParams({
            latitude: lat,
            longitude: lon,
            daily: [
                'temperature_2m_max',
                'temperature_2m_min',
                'precipitation_sum',
                'windspeed_10m_max',
                'winddirection_10m_dominant',
                'weathercode',
                'relative_humidity_2m_max',
            ].join(','),
            forecast_days: 3,
            timezone: 'auto',
        });

        const res = await fetch(`${FORECAST_URL}?${params}`);
        if (!res.ok) throw new Error(`Forecast HTTP ${res.status}`);
        const data = await res.json();

        displayWeather(data, cityName, country);
    } catch (err) {
        console.error('Forecast error:', err);
        showError('Failed to fetch weather data. Please try again.');
    }
}

// ─── Step 3: Render forecast cards ───────────────────────────────────────────
function displayWeather(data, cityName, country) {
    forecastEl.innerHTML = '';
    placeholder.style.display = 'none';

    const days = data.daily;

    for (let i = 0; i < days.time.length; i++) {
        const isToday = i === 0;
        const date = new Date(days.time[i] + 'T12:00:00'); // noon to avoid DST edge
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
        const formatted = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        const wmo = getWmo(days.weathercode[i]);
        const maxTemp = Math.round(days.temperature_2m_max[i]);
        const minTemp = Math.round(days.temperature_2m_min[i]);
        const avgTemp = Math.round((maxTemp + minTemp) / 2);
        const humidity = days.relative_humidity_2m_max[i] ?? '—';
        const wind = Math.round(days.windspeed_10m_max[i]);
        const windDeg = days.winddirection_10m_dominant[i];
        const windDir = degToCompass(windDeg);
        const precip = days.precipitation_sum[i];

        const delay = i * 120;

        const card = document.createElement('div');
        card.className = `forecast ${isToday ? 'today' : ''}`;
        card.style.animationDelay = `${delay}ms`;

        card.innerHTML = `
            <div class="forecast-header">
                <div class="day">${isToday ? 'Today' : dayName}</div>
                ${isToday ? `<div class="date">${formatted}</div>` : ''}
            </div>
            <div class="forecast-content">
                ${isToday
                ? `<div class="location">
                           <i class="fa-solid fa-location-dot" style="color:var(--color-primary);margin-right:6px;font-size:16px;"></i>
                           ${cityName}, ${country}
                       </div>`
                : ''}
                <div class="wmo-icon">${wmo.icon}</div>
                <div class="degree">
                    <div class="num">${isToday ? avgTemp : maxTemp}<sup>°C</sup></div>
                    ${!isToday
                ? `<div style="font-size:12px;color:var(--color-muted);margin-top:4px;">↑${maxTemp}° ↓${minTemp}°</div>`
                : `<div style="font-size:13px;color:var(--color-muted);margin-top:6px;">High: ${maxTemp}° · Low: ${minTemp}°</div>`
            }
                </div>
                <div class="custom">${wmo.label}</div>
                <div class="weather-stats">
                    <div class="stat-chip">
                        <i class="fa-solid fa-droplet"></i>
                        <span>${humidity}%</span>
                    </div>
                    <div class="stat-chip">
                        <i class="fa-solid fa-wind"></i>
                        <span>${wind} km/h</span>
                    </div>
                    <div class="stat-chip">
                        <i class="fa-solid fa-compass"></i>
                        <span>${windDir}</span>
                    </div>
                    ${precip > 0
                ? `<div class="stat-chip">
                               <i class="fa-solid fa-cloud-rain"></i>
                               <span>${precip} mm</span>
                           </div>`
                : ''}
                </div>
            </div>
        `;
<<<<<<< HEAD

        forecastEl.appendChild(card);
    }
}

// ─── UI helpers ──────────────────────────────────────────────────────────────
function showLoading() {
    forecastEl.innerHTML = `
        <div class="loading-indicator" style="grid-column:1/-1;">
            <div class="spinner"></div>
            <p>Fetching weather data…</p>
        </div>`;
    placeholder.style.display = 'none';
}

function showError(msg) {
    forecastEl.innerHTML = `
        <div class="loading-indicator" style="grid-column:1/-1;">
            <p style="color:#f87171;">
                <i class="fa-solid fa-triangle-exclamation" style="margin-right:8px;"></i>${msg}
            </p>
        </div>`;
    placeholder.style.display = 'none';
}
=======
        forecastContainer.innerHTML += forecastHtml;
    });
}
>>>>>>> a04c63413faca10ddb1ed785b0b5d06fd93e9a10
