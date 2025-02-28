const apiKey = '5a6a13a79a454a63b2814322252502'; // Replace with your actual API key
const searchApiUrl = `https://api.weatherapi.com/v1/search.json?key=5a6a13a79a454a63b2814322252502&q=`;
const forecastApiUrl = `https://api.weatherapi.com/v1/forecast.json?key=5a6a13a79a454a63b2814322252502&days=3&q=`;

document.getElementById('searchButton').addEventListener('click', () => {
    const city = document.getElementById('cityInput').value;
    if (city) {
        searchCity(city);
    } else {
        alert('Please enter a city name.');
    }
});

async function searchCity(city) {
    try {
        const response = await fetch(searchApiUrl + city);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        if (data.length > 0) {
            const firstCity = data[0].name;
            fetchWeather(firstCity);
        } else {
            alert('City not found. Please try again.');
        }
    } catch (error) {
        console.error('Error searching for city:', error);
        alert('Failed to search for city. Please check your input and try again.');
    }
}

async function fetchWeather(city) {
    try {
        const response = await fetch(forecastApiUrl + city);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        displayWeather(data);
    } catch (error) {
        console.error('Error fetching weather data:', error);
        alert('Failed to fetch weather data. Please try again.');
    }
}

function displayWeather(data) {
    const forecastContainer = document.getElementById('forecast');
    forecastContainer.innerHTML = '';

    data.forecast.forecastday.forEach((day, index) => {
        const date = new Date(day.date);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
        const formattedDate = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        const forecastHtml = `
            <div class="forecast ${index === 0 ? 'today' : ''}">
                <div class="forecast-header">
                    <div class="day">${dayName}</div>
                    ${index === 0 ? `<div class="date">${formattedDate}</div>` : ''}
                </div>
                <div class="forecast-content">
                    ${index === 0 ? `<div class="location">${data.location.name}, ${data.location.country}</div>` : ''}
                    <div class="degree">
                        <div class="num">${day.day.avgtemp_c}<sup>o</sup>C</div>
                        <div class="forecast-icon">
                            <img src="${day.day.condition.icon}" alt="${day.day.condition.text}" width="90">
                        </div>
                    </div>
                    <div class="custom">${day.day.condition.text}</div>
                    <span><img src="images/icon-umberella.png" alt="">${day.day.avghumidity}%</span>
                    <span><img src="images/icon-wind.png" alt="">${day.day.maxwind_kph} km/h</span>
                    <span><img src="images/icon-compass.png" alt="">${day.hour[0].wind_dir}</span>
                </div>
            </div>
        `;
        forecastContainer.innerHTML += forecastHtml;
    });
}