import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'

const scene = new THREE.Scene();
scene.add(new THREE.AxesHelper(5));

// Rendering

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lights

const pointLight = new THREE.PointLight(0xffffff, 50, 100);
pointLight.position.set(5, 5, 5); // Position the light
scene.add(pointLight);

//const directionalLight = new THREE.DirectionalLight(0xffffff, 0.2);
//directionalLight.position.set(0.5, .0, 1.0).normalize();
//scene.add(directionalLight);

//const ambientLight = new THREE.AmbientLight(0x505050, 0.1);  // Soft white light
//scene.add(ambientLight);

// Controls

const controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(0, 5, 10);
controls.target.set(0, 5, 0);

// Models

const fbxLoader = new FBXLoader();
const textureLoader = new THREE.TextureLoader();

function load(modelPath, texturePath, callback) {
  fbxLoader.load(modelPath, (object) => {
    textureLoader.load(texturePath, (texture) => {
      const material = new THREE.MeshPhongMaterial({ map: texture });
      object.traverse((obj) => {
        if(obj.isMesh) {
          obj.material = material;
        }
      });
      callback(object);
    });
  });
}

// Helpers

function rad(deg) {
  return deg * Math.PI / 180;
}

load("models/wall.fbx", "textures/wall.jpg", (object) => {
  const leftWall = object.clone();
  leftWall.position.set(-1, 0, 0);
  leftWall.rotation.set(0, rad(90), 0);
  scene.add(leftWall);

  const rightWall = object.clone();
  rightWall.position.set(1, 0, 0);
  rightWall.rotation.set(0, rad(90), 0);
  scene.add(rightWall);

  const floor = object.clone();
  floor.position.set(0, -1, 0);
  floor.rotation.set(rad(90), 0, 0);
  scene.add(floor);

  const ceiling = object.clone();
  ceiling.position.set(0, 1, 0);
  ceiling.rotation.set(rad(90), 0, 0);
  scene.add(ceiling);
});

const phong_material = new THREE.MeshPhongMaterial({
  color: 0x00ff00, // Green color
  shininess: 100   // Shininess of the material
});

// const custom_cube_geometry = new THREE.BufferGeometry();
// custom_cube_geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
// custom_cube_geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
// custom_cube_geometry.setIndex(new THREE.BufferAttribute(new Uint16Array(indices), 1));

// let cube = new THREE.Mesh(custom_cube_geometry, phong_material);
// scene.add(cube);

// Game loop

function updatePhysics() {
  
}

function animate() {
  updatePhysics();
  controls.update();
	renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);
