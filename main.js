import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'

const scene = new THREE.Scene();
scene.add(new THREE.AxesHelper(5));

// Rendering

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.shadowMap.enabled = true;
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Controls

const controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(0, 5, 10);
controls.target.set(0, 5, 0);

// Loaders

const fbxLoader = new FBXLoader();
const textureLoader = new THREE.TextureLoader();

// Helpers

function rewrap(texture, repeat) {
  const newTexture = texture.clone();
  newTexture.wrapS = THREE.RepeatWrapping;
  newTexture.wrapT = THREE.RepeatWrapping;
  newTexture.repeat.copy(repeat);
  return newTexture;
}

function apply(object, texture) {
  const material = new THREE.MeshPhongMaterial({ map: texture });
  object.traverse((obj) => {
    if(obj.isMesh) {
      obj.material = material;
    }
  });
}

function castShadow(object) {
  object.traverse((obj) => {
    if(obj.isMesh || obj.isLight) {
      obj.castShadow = true;
    }
  });
}

function receiveShadow(object) {
  object.traverse((obj) => {
    if(obj.isMesh) {
      obj.receiveShadow = true;
    }
  });
}

function setCorners(object, min, max) {
  object.position.copy(min.clone().add(max).divideScalar(2));
  object.scale.copy(max.clone().sub(min));
}

function rad(deg) {
  return deg * Math.PI / 180;
}

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

// Objects

const mapSize = 100;
const spacing = 20;

fbxLoader.load("models/cube.fbx", (model) => {
  textureLoader.load("textures/concrete.jpg", (texture) => {
    const floor = model.clone();
    setCorners(floor, new THREE.Vector3(-mapSize, -1, -mapSize), new THREE.Vector3(mapSize, 0, mapSize));
    apply(floor, rewrap(texture, new THREE.Vector3(mapSize, mapSize)));
    receiveShadow(floor);
    scene.add(floor);

    const ceiling = model.clone();
    setCorners(ceiling, new THREE.Vector3(-mapSize, 20, -mapSize), new THREE.Vector3(mapSize, 21, mapSize));
    apply(ceiling, rewrap(texture, new THREE.Vector3(mapSize, mapSize)));
    receiveShadow(ceiling);
    scene.add(ceiling);

    for(let i = -mapSize; i <= mapSize; i += spacing) {
      for(let j = -mapSize; j <= mapSize; j += spacing) {
        const column = model.clone();
        setCorners(column, new THREE.Vector3(i - 1, 0, j - 1), new THREE.Vector3(i + 1, 20, j + 1));
        apply(column, rewrap(texture, new THREE.Vector3(20, 2)));
        castShadow(column);
        scene.add(column);
      }
    }
  });
});

// Lights

const ambientLight = new THREE.AmbientLight(0x505050, 0.1);  // Soft white light
scene.add(ambientLight);

const lightFrequency = 0.05;
const maxLights = 12;

let curLights = 0;
for(let i = -mapSize + spacing / 2; i <= mapSize; i += spacing) {
  for(let j = -mapSize + spacing / 2; j <= mapSize; j += spacing) {
    if(curLights < maxLights && Math.random() <= lightFrequency) {
      const pointLight = new THREE.PointLight(0xffffff, rand(50, 100), 100);
      pointLight.position.set(i, rand(5, 15), j); // Position the light
      castShadow(pointLight);
      scene.add(pointLight);
      curLights++;
    }
  }
}


//const directionalLight = new THREE.DirectionalLight(0xffffff, 0.2);
//directionalLight.position.set(0.5, .0, 1.0).normalize();
//scene.add(directionalLight);

//const phong_material = new THREE.MeshPhongMaterial({
//  color: 0x00ff00, // Green color
//  shininess: 100   // Shininess of the material
//});

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
