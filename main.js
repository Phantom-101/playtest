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
import SewerLevel from './classes/SewerLevel.js'; 
import init from 'three/examples/jsm/offscreen/scene.js';
import TextController from './classes/TextController.js';
import SewerLevel from './classes/SewerLevel.js'; 
import init from 'three/examples/jsm/offscreen/scene.js';

const scene = new THREE.Scene();
const clock = new THREE.Clock();

// Rendering
const renderer = new THREE.WebGLRenderer();
renderer.shadowMap.enabled = true;
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Cameras
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.21, 1000);
scene.add(camera);

// Audio
const listener = new THREE.AudioListener();
camera.add(listener);
const audioloader = new THREE.AudioLoader();

const testSound = new THREE.PositionalAudio(listener);
const footstepSound = new THREE.PositionalAudio(listener);
const flashlightSoundOn = new THREE.PositionalAudio(listener);
const flashlightSoundOff = new THREE.PositionalAudio(listener);

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

// #region Player
const radius = 0.3;
const length = 1.4;
const playerGeometry = new THREE.CapsuleGeometry(radius, length, 8, 16);
playerGeometry.translate(0, 0, 0);
const playerMaterial = new THREE.MeshBasicMaterial( { color: 0xff0000 } );
const player3Obj = new THREE.Mesh( playerGeometry, playerMaterial );
const playerGO = new Player('Player', player3Obj, document, controls,
  footstepSound,
  flashlightSoundOn,
  flashlightSoundOff
);
playerGO.threeObj.position.set(0,3,0);
playerGO.addToScene(scene);
// #endregion

// #region Text Controller
const textController = new TextController(document);
textController.showText("You awake in an empty, dark hallway.");
// #endregion

// #region Objects
// #region Map
const mapSize = 100;

let floor;

let floorGO;

function loadMap() {
  return new Promise((resolve, reject) => {
    fbxLoader.load("models/cube.fbx", (model) => {
      textureLoader.load("textures/concrete.jpg", (texture) => {
        floor = model.clone();
        setCorners(floor, new THREE.Vector3(-mapSize, -1, -mapSize), new THREE.Vector3(mapSize, 0, mapSize));
        apply(floor, rewrap(texture, new THREE.Vector3(mapSize, mapSize)));
        receiveShadow(floor);

        // Create Map Game Objects
        floorGO = new GameObject('Floor', floor);
        floorGO.addToScene(scene);

        resolve(); // <-- Only resolve after floorGO is ready
      }, undefined, reject);
    }, undefined, reject);
  });
}
  



// #endregion

let sewerLevel = new SewerLevel(scene, playerGO);
// #endregion

// #region Lights
const ambientLight = new THREE.AmbientLight(0x505050, 0.1);  // Soft white light
scene.add(ambientLight);

// Add a dim hemisphere light for general brightness
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x222233, 0.003); // (skyColor, groundColor, intensity)
scene.add(hemiLight);

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

// #endregion

// #region Physics
// #region init Physics and Physics variables
const gravityConstant = - 9.8;
let transformAux1;
let tmpTransform;

let physicsWorld;

let physObjsLoaded = false;

const rigidBodies = [];
const margin = 0.05;

// Init Physics
function initPhysics() {
  let collisionConfiguration;
  let dispatcher;
  let broadphase;
  let solver;
  let softBodySolver;  

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
// #endregion

// Initialize Physics Objects
function initPhysicsObjects() {
  const radius = 0.3;
  const height = 1.4;
  const meshY = 0; // The y position of your mesh's feet

  const capsuleY = meshY + (height + 2 * radius) / 2;

  playerGO.createRigidBody(physicsWorld, {radius: 0.2, height: 1.5}, "capsule", 2, 0.1);
  rigidBodies.push({mesh: playerGO.threeObj, rigidBody: playerGO.rb});
  playerGO.rb.body.setAngularFactor(new Ammo.btVector3(0, 1, 0));

  floorGO.createRigidBody(physicsWorld, null, "BB", 0);
  rigidBodies.push({mesh: floorGO.threeObj, rigidBody: floorGO.rb});

  sewerLevel.initPhysicsForModelsByGroup();
}
// #endregion

// #region Audio
function attachAudio() { 
  test1obj.add(testSound);

  footstepSound.position.set(player3Obj.position.x, player3Obj.position.y-2.5, player3Obj.position.z);
  flashlightSoundOn.position.set(player3Obj.position.x, player3Obj.position.y, player3Obj.position.z);
  flashlightSoundOff.position.set(player3Obj.position.x, player3Obj.position.y, player3Obj.position.z);

  player3Obj.add(footstepSound);
  player3Obj.add(flashlightSoundOn);
  player3Obj.add(flashlightSoundOff);
}

function loadAudio(filename, posAudio_obj, volume = 1) {
  return new Promise((resolve, reject) => {
    audioloader.load(filename, (buffer) => {
      posAudio_obj.setBuffer(buffer);
      posAudio_obj.setVolume(volume);
      posAudio_obj.setRefDistance(1);
      resolve();
      console.log("       Audio Loaded: " + filename);
    }, undefined, reject);
  });
}
// #endregion

// #region Level Controller
const levelController = new LevelController(scene, [
  new GazerEvent(scene, playerGO, [[0, 0], [0, -10]]),
  new RainEvent(scene),
]);
levelController.levelDone();
// #endregion

// #region Loaders
async function startGame() {
  await loadAllAssets();
  console.log("All assets loaded");

  await Ammo().then((lib) => {
      Ammo = lib;
      initPhysics();
  });
  console.log("Ammo.js loaded");

  await sewerLevel.assignToPhysics(physicsWorld);

  await initPhysicsObjects();
  console.log("Initialized Physics Objects");

  renderer.setAnimationLoop(animate);
}

async function loadAllAssets() {
  console.log("Loading Audio");
  await loadAudio('sounds/testAudio.mp3', testSound);  
  await loadAudio('sounds/footstep.mp3', footstepSound);
  await loadAudio('sounds/flashlightOn.mp3', flashlightSoundOn, 0.5);
  await loadAudio('sounds/flashlightOff.mp3', flashlightSoundOff, 0.5);
  console.log("       Audio Files Loaded");
  await attachAudio();
  console.log("       Audio Attached");
  console.log("Audio Loaded");
  
  console.log("Loading Models");
  await loadMap();
  console.log("       Map Loaded");

  await sewerLevel.loadModels();
  console.log("       Sewer Models Loaded");
  console.log("Models Loaded");
}

window.addEventListener('DOMContentLoaded', startGame);
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
    updatePhysics(delta);
    updateFlashlight();
    controls.update(delta);    
    levelController.update(delta);
  }
  
  devControls.update();
  if(useDevCamera) {
    hemiLight.intensity = 1;
  } else {
    hemiLight.intensity = 0.003; // 0.003
  }
	renderer.render(scene, useDevCamera ? devCamera : camera);
}

