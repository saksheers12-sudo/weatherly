import * as THREE from "three";

// ======================
// Scene
// ======================

const scene = new THREE.Scene();

// ======================
// Camera
// ======================

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

camera.position.set(0, 1.0, 5.5);

// ======================
// Renderer
// ======================

const canvas = document.querySelector("#bg");

const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true
});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

// ======================
// Earth
// ======================

const geometry = new THREE.SphereGeometry(5.5, 256, 256);

const textureLoader = new THREE.TextureLoader();

const earthTexture = textureLoader.load("Assets/textures/earth.png");

const cloudTexture = textureLoader.load(
    "Assets/textures/clouds.png"
);

cloudTexture.colorSpace = THREE.SRGBColorSpace;

cloudTexture.anisotropy =
    renderer.capabilities.getMaxAnisotropy();

earthTexture.colorSpace = THREE.SRGBColorSpace;

earthTexture.anisotropy=renderer.capabilities.getMaxAnisotropy();

const material = new THREE.MeshStandardMaterial({

    map: earthTexture,

    roughness: 0.85,

    metalness: 0.02

});

const earth = new THREE.Mesh(geometry, material);

earth.position.y = -3.7;
earth.rotation.z = THREE.MathUtils.degToRad(23.5);

scene.add(earth);

const cloudGeometry = new THREE.SphereGeometry(
    5.52,
    256,
    256
);

const cloudMaterial = new THREE.MeshStandardMaterial({

    map: cloudTexture,

    transparent: true,

    opacity: 0.35,

    depthWrite: false

});

const clouds = new THREE.Mesh(
    cloudGeometry,
    cloudMaterial
);

clouds.position.copy(earth.position);
clouds.rotation.copy(earth.rotation);

scene.add(clouds);


// ======================
// Atmosphere
// ======================

const atmosphereGeometry = new THREE.SphereGeometry(
    5.65,
    256,
    256
);

const atmosphereMaterial = new THREE.MeshBasicMaterial({

    color: 0x6fdcff,

    transparent: true,

    opacity: 0.18,

    side: THREE.BackSide

});

const atmosphere = new THREE.Mesh(
    atmosphereGeometry,
    atmosphereMaterial
);

atmosphere.position.copy(earth.position);

scene.add(atmosphere);

// ======================
// Lights
// ======================

const directionalLight = new THREE.DirectionalLight(
    0xffffff,
    4.5
);

directionalLight.position.set(
    10,
    8,
    8
);

scene.add(directionalLight);

const ambientLight = new THREE.AmbientLight(
    0xbfdfff,
    1.1
);

scene.add(ambientLight);

// ======================
// Stars
// ======================

const starsGeometry = new THREE.BufferGeometry();

const starCount = 4000;
const starVertices = [];

for (let i = 0; i < starCount; i++) {

    const x = (Math.random() - 0.5) * 300;
    const y = (Math.random() - 0.5) * 300;
    const z = (Math.random() - 0.5) * 300;

    starVertices.push(x, y, z);

}

starsGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(starVertices, 3)
);

const starsMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.3
});

const stars = new THREE.Points(starsGeometry, starsMaterial);

scene.add(stars);

// ======================
// Animation
// ======================

const clock = new THREE.Clock();

function animate() {

    requestAnimationFrame(animate);

    // Gentle continuous Earth rotation
    earth.rotation.y += 0.0008;

    // Keep atmosphere aligned with Earth
    atmosphere.rotation.y = earth.rotation.y;

    // Clouds rotate slightly faster
    if (typeof clouds !== "undefined") {
        clouds.rotation.y += 0.001;
    }

    renderer.render(scene, camera);

}


animate();

// ======================
// Responsive
// ======================

window.addEventListener("resize", () => {

    camera.aspect = window.innerWidth / window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

});

// ======================
// Weather Search
// ======================

const weatherEffects =
    document.querySelector("#weather-effects");
    let rainDrops = [];
    let snowFlakes = [];

const cityInput = document.querySelector("#city-input");
const searchButton = document.querySelector("#search-btn");
const weatherCard = document.querySelector(".weather-card");
const sun = document.querySelector(".sun");
const cityName = document.querySelector("#city-name");
const temperature = document.querySelector("#temperature");
const condition = document.querySelector("#condition");
const wind = document.querySelector("#wind");

searchButton.addEventListener("click", async () => {

    const city = cityInput.value.trim();

    if (!city) {
        cityInput.focus();
        return;
    }

    cityName.textContent = "Looking up...";
    temperature.textContent = "--°";
    condition.textContent = "Finding your city...";
    wind.textContent = "Wind: -- km/h";

    try {

        // Find the city's coordinates
        const locationResponse = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
        );

        const locationData = await locationResponse.json();

        if (!locationData.results) {
            throw new Error("City not found");
        }

        const location = locationData.results[0];

        // Get weather for those coordinates
        const weatherResponse = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,weather_code,wind_speed_10m&temperature_unit=celsius&wind_speed_unit=kmh&timezone=auto`
        );

        const weatherData = await weatherResponse.json();

        const current = weatherData.current;

        updateWeatherEnvironment(current.weather_code);

        cityName.textContent =
            `${location.name}, ${location.country}`;

            weatherCard.classList.add("show");

rotateEarthToLocation(
    location.latitude,
    location.longitude
);

fadeClouds();

descendToEarth();
            

        temperature.textContent =
            `${Math.round(current.temperature_2m)}°`;

        wind.textContent =
            `Wind: ${Math.round(current.wind_speed_10m)} km/h`;

        condition.textContent =
            getWeatherCondition(current.weather_code);

    } catch (error) {

        console.error(error);

        cityName.textContent = "Couldn't find that city";
        temperature.textContent = "--°";
        condition.textContent = "Try another search";
        wind.textContent = "Wind: -- km/h";

    }

});


// Convert Open-Meteo weather codes into words

function getWeatherCondition(code) {

    const conditions = {

        0: "Clear sky",

        1: "Mainly clear",
        2: "Partly cloudy",
        3: "Overcast",

        45: "Fog",
        48: "Depositing rime fog",

        51: "Light drizzle",
        53: "Moderate drizzle",
        55: "Dense drizzle",

        61: "Slight rain",
        63: "Moderate rain",
        65: "Heavy rain",

        71: "Slight snow",
        73: "Moderate snow",
        75: "Heavy snow",

        80: "Slight rain showers",
        81: "Moderate rain showers",
        82: "Violent rain showers",

        95: "Thunderstorm",
        96: "Thunderstorm with hail",
        99: "Thunderstorm with heavy hail"

    };

    
}
// ======================
// Rotate Earth to Location
// ======================

function rotateEarthToLocation(latitude, longitude) {

    const targetRotation =
        THREE.MathUtils.degToRad(longitude);

    const startRotation = earth.rotation.y;

    let progress = 0;

    function rotate() {

        progress += 0.02;

        if (progress > 1) {
            progress = 1;
        }

        // Smooth easing
        const eased =
            progress * progress * (3 - 2 * progress);

        earth.rotation.y =
            startRotation +
            (targetRotation - startRotation) * eased;

        atmosphere.rotation.y = earth.rotation.y;

        if (typeof clouds !== "undefined") {
            clouds.rotation.y = earth.rotation.y;
        }

        if (progress < 1) {
            requestAnimationFrame(rotate);
        }
    }

    rotate();
}

// ======================
// Atmospheric Descent
// ======================

function fadeClouds() {

    if (typeof clouds === "undefined") {
        return;
    }

    const startOpacity = cloudMaterial.opacity;

    let progress = 0;

    function fade() {

        progress += 0.015;

        if (progress > 1) {
            progress = 1;
        }

        // Smooth easing
        const eased =
            progress * progress * (3 - 2 * progress);

        cloudMaterial.opacity =
            startOpacity * (1 - eased);

        if (progress < 1) {
            requestAnimationFrame(fade);
        }
    }

    fade();
}

// ======================
// Camera Descent
// ======================

function descendToEarth() {

    const startZ = camera.position.z;
    const startY = camera.position.y;

    const targetZ = 4.6;
    const targetY = 0.45
    ;

    let progress = 0;

    function descend() {

        progress += 0.012;

        if (progress > 1) {
            progress = 1;
        }

        // Smooth cinematic easing
        const eased =
            progress * progress * (3 - 2 * progress);

        camera.position.z =
            startZ + (targetZ - startZ) * eased;

        camera.position.y =
            startY + (targetY - startY) * eased;

        if (progress < 1) {
            requestAnimationFrame(descend);
        }
    }

    descend();
}

// ======================
// Weather Atmosphere
// ======================

function updateWeatherEnvironment(code) {

    weatherEffects.className = "";

    clearTimeout(lightningTimer);

rainDrops.forEach(drop => drop.remove());
rainDrops = [];

snowFlakes.forEach(flake => flake.remove());
snowFlakes = [];

    // Clear
if (code === 0 || code === 1) {

    weatherEffects.classList.add("sunshine");

    sun.classList.add("sunny");

}


    // Cloudy
    else if (code === 2 || code === 3) {

        weatherEffects.classList.add("cloudy");

    }

    // Rain
    else if (code >= 51 && code <= 67) {

         weatherEffects.classList.add("rain");

    createRain();

    }

    // Snow
    else if (code >= 71 && code <= 77) {

         weatherEffects.classList.add("snow");

    createSnow();

    }

    // Showers / storms
   else if (code >= 80 && code <= 99) {

    weatherEffects.classList.add("storm");

    createRain();

    startLightning();

}
}

// ======================
// Realistic Rain System
// ======================

function createRain() {

    // Remove previous rain
    rainDrops.forEach(drop => drop.remove());

    rainDrops = [];

    const dropCount =
    weatherEffects.classList.contains("storm")
        ? 420
        : 180;

    for (let i = 0; i < dropCount; i++) {

        const drop = document.createElement("div");

        drop.className = "rain-drop";

        // Random horizontal position
        drop.style.left =
            Math.random() * 100 + "vw";

        // Random length
        const length =
            12 + Math.random() * 28;

        drop.style.height =
            length + "px";

        // Random thickness
        drop.style.width =
            (0.8 + Math.random() * 1.4) + "px";

        // Random opacity
        drop.style.opacity =
            0.25 + Math.random() * 0.65;

        // Random speed
        drop.style.animationDuration =
            (0.45 + Math.random() * 0.7) + "s";

        // Random delay
        drop.style.animationDelay =
            -(Math.random() * 2) + "s";

        weatherEffects.appendChild(drop);

        rainDrops.push(drop);
    }
}
// ======================
// Realistic Snow System
// ======================

function createSnow() {

    // Remove previous snow
    snowFlakes.forEach(flake => flake.remove());

    snowFlakes = [];

    const flakeCount = 100;

    for (let i = 0; i < flakeCount; i++) {

        const flake = document.createElement("div");

        flake.className = "snow-flake";

        // Random horizontal position
        flake.style.left =
            Math.random() * 100 + "vw";

        // Different snowflake sizes
        const size =
            3 + Math.random() * 8;

        flake.style.width =
            size + "px";

        flake.style.height =
            size + "px";

        // Different speeds
        flake.style.animationDuration =
            (5 + Math.random() * 7) + "s";

        // Start at different moments
        flake.style.animationDelay =
            -(Math.random() * 10) + "s";

        // Different opacity
        flake.style.opacity =
            0.35 + Math.random() * 0.65;

        weatherEffects.appendChild(flake);

        snowFlakes.push(flake);
    }
}

// ======================
// Lightning
// ======================

let lightningTimer;

function startLightning() {

    clearTimeout(lightningTimer);

    function flash() {

        if (!weatherEffects.classList.contains("storm")) {
            return;
        }

        weatherEffects.classList.add("lightning");

        setTimeout(() => {

            weatherEffects.classList.remove("lightning");

        }, 100);

        lightningTimer = setTimeout(
            flash,
            4000 + Math.random() * 7000
        );
    }

    lightningTimer = setTimeout(
        flash,
        3000 + Math.random() * 5000
    );
}

