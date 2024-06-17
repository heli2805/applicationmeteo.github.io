// Sélection des éléments DOM
const cityInput = document.querySelector(".city-input");
const searchButton = document.querySelector(".search-btn");
const locationButton = document.querySelector(".location-btn");
const currentWeatherDiv = document.querySelector(".current-weather");
const weatherCardsDiv = document.querySelector(".weather-cards");

// Clé API pour OpenWeatherMap API
const OPENWEATHER_API_KEY = "d1f2f624e0507fa07b7cb27f19f754a9";
// Clé API pour TimezoneDB
const TIMEZONEDB_API_KEY = "5PNN0OQUYS1C";



// Fonction pour obtenir la traduction française des descriptions de météo
const getWeatherDescriptionFrench = (englishDescription) => {
    const descriptions = {
        "Clear": "Dégagé",
        "Clouds": "Nuageux",
        "Drizzle": "Bruine",
        "Rain": "Pluie",
        "Thunderstorm": "Orages",
        "Snow": "Neige",
        "Mist": "Brume",
        "Smoke": "Fumée",
        "Haze": "Brume de sable",
        "Dust": "Poussière",
        "Fog": "Brouillard",
        "Sand": "Sable",
        "Ash": "Cendres volcaniques",
        "Squall": "Rafales de vent",
        "Tornado": "Tornade"
        // Ajoutez d'autres traductions si nécessaire
    };

    return descriptions[englishDescription] || englishDescription;
};


const createWeatherCard = (cityName, weatherItem, index, localDateTime) => {
    const temperatureCelsius = (weatherItem.main.temp - 273.15).toFixed(2);
    const advice = getWeatherAdvice(temperatureCelsius); // Génération de conseils
    const weatherDescription = getWeatherDescriptionFrench(weatherItem.weather[0].main);

    if (index === 0) { // HTML pour la carte météo principale
        return `<div class="details">
                    <h2>${cityName} (${formatLocalDateTime(localDateTime)})</h2>
                    <h6>Température: ${temperatureCelsius}°C</h6>
                    <h6>Vent: ${weatherItem.wind.speed} M/S</h6>
                    <h6>Humidité: ${weatherItem.main.humidity}%</h6>
                    <h6>Conseil: ${advice}</h6> <!-- Ajout de conseils -->
                </div>
                <div class="icon">
                    <img src="https://openweathermap.org/img/wn/${weatherItem.weather[0].icon}.png" alt="${weatherItem.weather[0].description}">
                    <h6>${weatherDescription}</h6>
                </div>`;
    } else { // HTML pour les autres cartes de prévisions sur cinq jours
        return `<li class="card">
                    <h3>${formatLocalDateTime(localDateTime)}</h3>
                    <img src="https://openweathermap.org/img/wn/${weatherItem.weather[0].icon}.png" alt="${weatherItem.weather[0].description}">
                    <h6>Temp: ${temperatureCelsius}°C</h6>
                    <h6>Vent: ${weatherItem.wind.speed} M/S</h6>
                    <h6>Humidité: ${weatherItem.main.humidity}%</h6>
                    <h6>Conseil: ${advice}</h6> <!-- Ajout de conseils -->
                </li>`;
    }
};



// Fonction pour formater la date et l'heure locales
const formatLocalDateTime = (dateTime) => {
    return `${dateTime.toLocaleDateString()} ${dateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

// Fonction pour générer des conseils basés sur la température
const getWeatherAdvice = (temperatureCelsius) => {
    if (temperatureCelsius > 30) {
        return "Il fait très chaud. Buvez beaucoup d'eau et évitez l'exposition directe au soleil.";
    } else if (temperatureCelsius > 20) {
        return "Le temps est chaud. Portez des vêtements légers.";
    } else if (temperatureCelsius > 10) {
        return "Le temps est frais. Une veste légère est recommandée.";
    } else if (temperatureCelsius > 0) {
        return "Il fait froid. Portez des vêtements chauds.";
    } else {
        return "Il fait très froid. Restez au chaud et évitez de sortir si possible.";
    }
}

// Fonction pour obtenir les détails météo d'une ville
const getWeatherDetails = (cityName, latitude, longitude) => {
    // URL de l'API OpenWeatherMap pour obtenir les prévisions météo
    const WEATHER_API_URL = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}`;

    fetch(WEATHER_API_URL)
        .then(response => response.json())
        .then(data => {
            // Filtrer les prévisions pour obtenir une prévision par jour
            const uniqueForecastDays = [];
            const fiveDaysForecast = data.list.filter(forecast => {
                const forecastDate = new Date(forecast.dt_txt).getDate();
                if (!uniqueForecastDays.includes(forecastDate)) {
                    return uniqueForecastDays.push(forecastDate);
                }
            });

            // Obtenir le fuseau horaire de la ville à partir de la réponse de l'API OpenWeatherMap
            const timeZoneOffset = data.city.timezone;

            // Effacer les données météo précédentes
            cityInput.value = "";
            currentWeatherDiv.innerHTML = "";
            weatherCardsDiv.innerHTML = "";

            // Obtenir l'heure locale à partir de TimezoneDB API
            const TIMEZONEDB_API_URL = `http://api.timezonedb.com/v2.1/get-time-zone?key=${TIMEZONEDB_API_KEY}&format=json&by=position&lat=${latitude}&lng=${longitude}`;

            fetch(TIMEZONEDB_API_URL)
                .then(response => response.json())
                .then(timezoneData => {
                    const localDateTime = new Date(timezoneData.formatted);

                    // Créer les cartes météo et les ajouter au DOM
                    fiveDaysForecast.forEach((weatherItem, index) => {
                        const html = createWeatherCard(cityName, weatherItem, index, localDateTime);
                        if (index === 0) {
                            currentWeatherDiv.insertAdjacentHTML("beforeend", html);
                        } else {
                            weatherCardsDiv.insertAdjacentHTML("beforeend", html);
                        }
                    });
                })
                .catch(() => {
                    alert("Une erreur s'est produite lors de la récupération de l'heure locale !");
                });

        })
        .catch(() => {
            alert("Une erreur s'est produite lors de la récupération des prévisions météo !");
        });
}

// Fonction pour obtenir les coordonnées d'une ville
const getCityCoordinates = () => {
    const cityName = cityInput.value.trim();
    if (cityName === "") return;
    const GEO_API_URL = `https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${OPENWEATHER_API_KEY}`;

    // Obtenir les coordonnées de la ville saisie (latitude, longitude et nom) à partir de l'API OpenWeatherMap
    fetch(GEO_API_URL)
        .then(response => response.json())
        .then(data => {
            if (!data.length) return alert(`Aucune coordonnée trouvée pour ${cityName}`);
            const { lat, lon, name } = data[0];
            getWeatherDetails(name, lat, lon);
        })
        .catch(() => {
            alert("Une erreur s'est produite lors de la récupération des coordonnées !");
        });
}

// Fonction pour obtenir les coordonnées de l'utilisateur
const getUserCoordinates = () => {
    navigator.geolocation.getCurrentPosition(
        position => {
            const { latitude, longitude } = position.coords; // Obtenir les coordonnées de la position de l'utilisateur
            // Obtenir le nom de la ville à partir des coordonnées en utilisant l'API de géocodage inverse
            const GEO_REVERSE_API_URL = `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${OPENWEATHER_API_KEY}`;
            fetch(GEO_REVERSE_API_URL)
                .then(response => response.json())
                .then(data => {
                    const { name } = data[0];
                    getWeatherDetails(name, latitude, longitude);
                })
                .catch(() => {
                    alert("Une erreur s'est produite lors de la récupération du nom de la ville !");
                });
        },
        error => { // Afficher une alerte si l'utilisateur a refusé l'autorisation de localisation
            if (error.code === error.PERMISSION_DENIED) {
                alert("Demande de géolocalisation refusée. Veuillez réinitialiser la permission de localisation pour accorder l'accès à nouveau.");
            } else {
                alert("Erreur de demande de géolocalisation. Veuillez réinitialiser la permission de localisation.");
            }
        });
}

// Ajout des écouteurs d'événements aux boutons et à l'entrée de texte
locationButton.addEventListener("click", getUserCoordinates);
searchButton.addEventListener("click", getCityCoordinates);
cityInput.addEventListener("keyup", e => e.key === "Enter" && getCityCoordinates());
