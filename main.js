import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
//import Ammo from 'ammo.js';

// This is a modified version of the PointerLockControls from three.js
import { PointerLockControls } from './classes/PointerLockControls.js';
import GameObject from './classes/GameObject.js';
import Player from './classes/Player.js';

const scene = new THREE.Scene();
scene.add(new THREE.AxesHelper(5));
const Clock = new THREE.Clock();

// Rendering
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.shadowMap.enabled = true;
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);



// Dev Camera
// Create a dev camera
const devCamera = new THREE.PerspectiveCamera(110, window.innerWidth / window.innerHeight, 0.1, 1000);
devCamera.position.set(20, 20, 20);

// OrbitControls for dev camera
const devControls = new OrbitControls(devCamera, renderer.domElement);
devControls.enableDamping = true;
devControls.dampingFactor = 0.05;

let useDevCamera = false;
window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyC') { // Press 'C' to toggle cameras
    useDevCamera = !useDevCamera;
    if (useDevCamera) {
      controls.unlock(); // Unlock pointer when switching to dev camera
      blocker.style.display = 'none';
      instructions.style.display = 'none';
    } else {
      // Show blocker/instructions when switching back to pointer lock camera
      blocker.style.display = 'block';
      instructions.style.display = '';
    }
  }
});

// Lights
/*
const light = new THREE.HemisphereLight( 0xeeeeff, 0x777788, 2.5 );
light.position.set( 0.5, 1, 0.75 );
scene.add( light );
*/


const pointLight = new THREE.PointLight(0xffffff, 50, 100);
pointLight.position.set(5, 5, 5); // Position the light
scene.add(pointLight);


//const directionalLight = new THREE.DirectionalLight(0xffffff, 0.2);
//directionalLight.position.set(0.5, .0, 1.0).normalize();
//scene.add(directionalLight);

//const ambientLight = new THREE.AmbientLight(0x505050, 0.1);  // Soft white light
//scene.add(ambientLight);

// Controls and Locking
camera.position.set(0, 5, 10);
const controls = new PointerLockControls( camera, document.body );
const blocker = document.getElementById( 'blocker' );
const instructions = document.getElementById( 'instructions' );


instructions.addEventListener( 'click', function () {
  if (!useDevCamera) {
    controls.lock();
  }  
});

controls.addEventListener( 'lock', function () {
  instructions.style.display = 'none';
  blocker.style.display = 'none';
});

controls.addEventListener( 'unlock', function () {
  if(!useDevCamera) {
    blocker.style.display = 'block';
    instructions.style.display = '';
  }
});




// Models

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

const redCubeGeometry = new THREE.BoxGeometry( 1, 10, 1 );
const redCubeMaterial = new THREE.MeshBasicMaterial( { color: 0xff0000 } );
const redCube = new THREE.Mesh( redCubeGeometry, redCubeMaterial );

const redCubeGO = new Player('RedCube', redCube, document, controls);
redCubeGO.addToScene(scene); // Add the red cube to the scene

//console.log("Window (viewport) size: ", window.innerWidth + "x" + window.innerHeight);

// Physics variables
const gravityConstant = - 9.8;
let collisionConfiguration;
let dispatcher;
let broadphase;
let solver;
let softBodySolver;
let physicsWorld;
let transformAux1;
let tmpTransform;

let ammoLoaded = false;

const rigidBodies = [];
const margin = 0.05;

// Init Physics

window.addEventListener('DOMContentLoaded', async () => {
  Ammo().then((lib) => {
      Ammo = lib;
      initPhysics();
      initPhysicsObjects();
      ammoLoaded = true;
  });
});

function initPhysics() {
  collisionConfiguration = new Ammo.btSoftBodyRigidBodyCollisionConfiguration();
  dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
  broadphase = new Ammo.btDbvtBroadphase();
  solver = new Ammo.btSequentialImpulseConstraintSolver();
  softBodySolver = new Ammo.btDefaultSoftBodySolver();
  physicsWorld = new Ammo.btSoftRigidDynamicsWorld( dispatcher, broadphase, solver, collisionConfiguration, softBodySolver );
  physicsWorld.setGravity( new Ammo.btVector3( 0, gravityConstant, 0 ) );
  physicsWorld.getWorldInfo().set_m_gravity( new Ammo.btVector3( 0, gravityConstant, 0 ) );
  transformAux1 = new Ammo.btTransform();
  tmpTransform = new Ammo.btTransform();
}

// Init Physics Objects
function initPhysicsObjects() {
  redCubeGO.createRigidBody(physicsWorld, {height: 10, radius: 5}, "capsule", 100);
  rigidBodies.push({mesh: redCubeGO.threeObj, rigidBody: redCubeGO.rb});
}


// Game loop

function updatePhysics(delta) {
  physicsWorld.stepSimulation(delta, 10);

  // Update Rigid Bodies
  for (let i = 0; i < rigidBodies.length; ++i) {
    rigidBodies[i].rigidBody.motionState.getWorldTransform(tmpTransform);
    const pos = tmpTransform.getOrigin();
    const quat = tmpTransform.getRotation();
    const pos3 = new THREE.Vector3(pos.x(), pos.y(), pos.z());
    const quat3 = new THREE.Quaternion(quat.x(), quat.y(), quat.z(), quat.w());

    rigidBodies[i].mesh.position.copy(pos3);
    rigidBodies[i].mesh.quaternion.copy(quat3);
  }
}

function animate() {
  const delta = Clock.getDelta();
  redCubeGO.move(); // Move the player
  if(ammoLoaded == true) {
    updatePhysics(delta);
  }  
  controls.update(delta);
  devControls.update();
	renderer.render(scene, useDevCamera ? devCamera : camera);
}

renderer.setAnimationLoop(animate);
