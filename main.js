import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
//import Ammo from 'ammo.js';

// This is a modified version of the PointerLockControls from three.js
import { PointerLockControls } from './classes/PointerLockControls.js';
import GameObject from './classes/GameObject.js';
import Player from './classes/Player.js';

const scene = new THREE.Scene();
const Clock = new THREE.Clock();

// Rendering
const renderer = new THREE.WebGLRenderer();
renderer.shadowMap.enabled = true;
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Cameras
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
scene.add(camera);

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
const playerGO = new Player('Player', player3Obj, document, controls);
playerGO.threeObj.position.set(0,1,0);
playerGO.addToScene(scene);
// #endregion

// #endregion

// #region Lights
const ambientLight = new THREE.AmbientLight(0x505050, 0.1);  // Soft white light
scene.add(ambientLight);

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

const flashlight = new THREE.SpotLight(0xffffff, 5, 50, Math.PI / 4, 0.5);
flashlight.position.set(0, 0, 0);
flashlight.target.position.set(0, 0, -1);
camera.add(flashlight);
camera.add(flashlight.target);
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
  playerGO.move(); // Move the player
  if(ammoLoaded == true && physObjsLoaded == true) {
    updatePhysics(delta);
  }  
  controls.update(delta);
  devControls.update();
	renderer.render(scene, useDevCamera ? devCamera : camera);
}

renderer.setAnimationLoop(animate);