import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
//import Ammo from 'ammo.js';

// This is a modified version of the PointerLockControls from three.js
import { PointerLockControls } from './classes/PointerLockControls.js';
import GameObject from './classes/GameObject.js';
import Player from './classes/Player.js';
import LevelController from './classes/LevelController.js'
import GazerEvent from './classes/GazerEvent.js';
import { update } from 'three/examples/jsm/libs/tween.module.js';
import { buffer } from 'three/tsl';
import RainEvent from './classes/RainEvent.js';

const scene = new THREE.Scene();
const clock = new THREE.Clock();

// Rendering
const renderer = new THREE.WebGLRenderer();
renderer.shadowMap.enabled = true;
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Cameras
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
scene.add(camera);

// Audio
const listener = new THREE.AudioListener();
camera.add(listener);

const sound = new THREE.PositionalAudio(listener);
const footstepSound = new THREE.PositionalAudio(listener);
const audioloader = new THREE.AudioLoader();


// #region Dev Camera
// Create a dev camera
const devCamera = new THREE.PerspectiveCamera(110, window.innerWidth / window.innerHeight, 0.1, 1000);
devCamera.position.set(0, 1, 0);
scene.add(devCamera);

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
// #endregion

// #region Controls and Locking
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
// #endregion

// #region Helper Functions
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
// #endregion

// #region Objects
// Models
const fbxLoader = new FBXLoader();
const textureLoader = new THREE.TextureLoader();

// #region Game Objects

// #region Map
const mapSize = 100;
const mapHeight = 5;
const walls_data = [
  [-1, -2, -1, 10, 0.1],
  [1, -15, 1, 8, 0.1],
  [-1, 10, 10, 10, 0.1],
  [10, 10, 10, 0, 0.1],
  [10, 0, 1, 0, 0.1],
  [-1, -2, -8, -2, 0.1],
  [-8, -4, -8, -10, 0.1],
  [-8, -10, -1, -10, 0.1],
  [-10, -2, -10, 5, 0.1],
  [-10, 5, -1, 5, 0.1],
  [-15, -4, -8, -4, 0.1],
  [-15, -4, -15, 0, 0.1],
  [-15, 0, -10, 0, 0.1],
  [-1, -10, -1, -17, 0.1],
  [-1, -17, 6, -17, 0.1],
  [1, -15, 6, -15, 0.1],
  [6, -15, 6, -17, 0.1],
];

let floor;
let ceiling;
let walls = [];

let floorGO;
let ceilingGO;
let wallsGO = [];

fbxLoader.load("models/cube.fbx", (model) => {
  textureLoader.load("textures/concrete.jpg", (texture) => {
    floor = model.clone();
    setCorners(floor, new THREE.Vector3(-mapSize, -1, -mapSize), new THREE.Vector3(mapSize, 0, mapSize));
    apply(floor, rewrap(texture, new THREE.Vector3(mapSize, mapSize)));
    receiveShadow(floor);

    ceiling = model.clone();
    setCorners(ceiling, new THREE.Vector3(-mapSize, mapHeight, -mapSize), new THREE.Vector3(mapSize, mapHeight + 1, mapSize));
    apply(ceiling, rewrap(texture, new THREE.Vector3(mapSize, mapSize)));
    receiveShadow(ceiling);

    for(const wall_data of walls_data) {
      const x1 = Math.min(wall_data[0], wall_data[2]);
      const z1 = Math.min(wall_data[1], wall_data[3]);
      const x2 = Math.max(wall_data[0], wall_data[2]);
      const z2 = Math.max(wall_data[1], wall_data[3]);
      const expand = wall_data[4];
      const wall = model.clone();
      setCorners(wall, new THREE.Vector3(x1 - expand, 0, z1 - expand), new THREE.Vector3(x2 + expand, mapHeight, z2 + expand));
      apply(wall, rewrap(texture, new THREE.Vector3(mapHeight, Math.max(x2 - x1, z2 - z1))));
      castShadow(wall);
      walls.push(wall);
    }

    // Create Map Game Objects
    floorGO = new GameObject('Floor', floor);
    floorGO.addToScene(scene);
    ceilingGO = new GameObject('Ceiling', ceiling);
    ceilingGO.addToScene(scene);
    walls.forEach((wall) => {
      const wallGO = new GameObject('Wall', wall);
      wallGO.addToScene(scene);
      wallsGO.push(wallGO);
    });

    if(ammoLoaded == true) {
      initPhysicsObjects();
    }
  });
});
// #endregion

// #region Player
const playerGeometry = new THREE.BoxGeometry( 1, 5, 1 );
const playerMaterial = new THREE.MeshBasicMaterial( { color: 0xff0000 } );
const player3Obj = new THREE.Mesh( playerGeometry, playerMaterial );
const playerGO = new Player('Player', player3Obj, document, controls, footstepSound);
playerGO.threeObj.position.set(0,1,0);
playerGO.addToScene(scene);
// #endregion

// #endregion

// #region Lights
const ambientLight = new THREE.AmbientLight(0x505050, 0.1);  // Soft white light
scene.add(ambientLight);

// Add a dim hemisphere light for general brightness
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x222233, 0.003); // (skyColor, groundColor, intensity)
scene.add(hemiLight);

const lightFrequency = 0.05;
const maxLights = 12;

/*
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
  */

// #region Flashlight
const flashlightIntensity = 3;
const flashlight = new THREE.SpotLight(0xffffff, flashlightIntensity, 15, Math.PI / 7, 0.5);
flashlight.position.set(0, 0, 0);
flashlight.target.position.set(0, 0, -1);
let flashlightTarget = new THREE.Vector3();

camera.add(flashlight);
scene.add(flashlight.target);

function updateFlashlight() {
  // Get camera's world position and direction
  const camWorldPos = new THREE.Vector3();
  camera.getWorldPosition(camWorldPos);

  const camDir = new THREE.Vector3();
  camera.getWorldDirection(camDir);

  // Desired target position (10 units ahead)
  const desiredTarget = camWorldPos.clone().add(camDir.multiplyScalar(10));

  // Lerp the flashlightTarget vector toward the desired target
  flashlightTarget.lerp(desiredTarget, 0.1);

  // Set the flashlight's target position
  flashlight.target.position.copy(flashlightTarget);

  flashlight.intensity = playerGO.flashlightEnabled ? flashlightIntensity : 0;
}
// #endregion
// #endregion


// Test
const test1geo = new THREE.BoxGeometry( 1, 1, 1 );
const test1mat = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
const test1obj = new THREE.Mesh( test1geo, test1mat );
const test1go = new GameObject('Test1', test1obj);
test1go.threeObj.position.set(10,20,-10);
test1go.addToScene(scene);

// #endregion

// #region Physics
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
let physObjsLoaded = false;

const rigidBodies = [];
const margin = 0.05;

// Load Ammo
window.addEventListener('DOMContentLoaded', async () => {
  Ammo().then((lib) => {
      Ammo = lib;
      initPhysics();
      initAudio();
  });
});

// Init Physics
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
  ammoLoaded = true;
}

// Init Physics Objects
function initPhysicsObjects() {
  playerGO.createRigidBody(physicsWorld, null, "BB", 5, 0.1);
  rigidBodies.push({mesh: playerGO.threeObj, rigidBody: playerGO.rb});
  playerGO.rb.body.setAngularFactor(new Ammo.btVector3(0, 1, 0));

  
  test1go.createRigidBody(physicsWorld, {x: 1, y: 1, z: 1}, "box", 1);
  rigidBodies.push({mesh: test1go.threeObj, rigidBody: test1go.rb});
  

  floorGO.createRigidBody(physicsWorld, null, "BB", 0);
  rigidBodies.push({mesh: floorGO.threeObj, rigidBody: floorGO.rb});

  wallsGO.forEach((wallGO) => {
    wallGO.createRigidBody(physicsWorld, null, "BB", 0);
    rigidBodies.push({mesh: wallGO.threeObj, rigidBody: wallGO.rb});
  });

  physObjsLoaded = true;
}
// #endregion

// #region Audio
// Footstep Audio: https://youtu.be/f58nbbOZd9A
function initAudio() {
  audioloader.load('sounds/testAudio.mp3', (buffer) => {
    sound.setBuffer(buffer);
    sound.setVolume(1);
    sound.setRefDistance(1);
  });

  audioloader.load('sounds/footStep.mp3', (buffer) => { 
    footstepSound.setBuffer(buffer);
    footstepSound.setVolume(1);
    footstepSound.setRefDistance(1);
  });

  test1obj.add(sound);

  footstepSound.position.set(0, -2.5, 0);
  player3Obj.add(footstepSound);
}


// #region Level Controller
const levelController = new LevelController(scene, [
  new GazerEvent(scene, playerGO, [[0, 0], [0, -10]]),
  new RainEvent(scene),
]);
levelController.levelDone();
// #endregion

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
  const delta = clock.getDelta();
  if(controls.isLocked == true) {
    playerGO.update(delta); // Move the player
    if(ammoLoaded == true && physObjsLoaded == true) {
      updatePhysics(delta);
    }
    updateFlashlight();
    controls.update(delta);
    
    levelController.update(delta);
  }
  
  devControls.update();
  if(useDevCamera) {
    hemiLight.intensity = 1;
  } else {
    hemiLight.intensity = 0.003;
  }
	renderer.render(scene, useDevCamera ? devCamera : camera);
}

renderer.setAnimationLoop(animate);