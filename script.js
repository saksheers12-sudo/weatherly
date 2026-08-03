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

const earthTexture = textureLoader.load(
    "Assets/textures/earth.jpg",
    () => {
        console.log("Texture loaded successfully!");
    },
    undefined,
    (err) => {
        console.error("Texture failed to load:", err);
    }
);

const material = new THREE.MeshStandardMaterial({
    color: 0x63c8ff,
    roughness: 0.95
});

const earth = new THREE.Mesh(geometry, material);

earth.position.y = -3.7;
earth.rotation.z = THREE.MathUtils.degToRad(23.5);

scene.add(earth);

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

function animate() {

    requestAnimationFrame(animate);

    earth.rotation.y += 0.002;

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