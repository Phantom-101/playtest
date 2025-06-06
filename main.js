import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// This is a modified version of the PointerLockControls from three.js
import { PointerLockControls } from './classes/PointerLockControls.js';
import GameObject from './classes/GameObject.js';
import Player from './classes/Player.js';
import LevelController from './classes/LevelController.js'
import TextController from './classes/TextController.js';
import Radio from './classes/Radio.js';

// Enemy Event Classes
import GazerEvent from './classes/GazerEvent.js';
import RainEvent from './classes/RainEvent.js';

// Map Object Class
import SewerLevel from './classes/SewerLevel.js';

//IDK
//import init from 'three/examples/jsm/offscreen/scene.js';










// Scene Setup
const scene = new THREE.Scene();
const clock = new THREE.Clock();

// Rendering
const renderer = new THREE.WebGLRenderer();
renderer.shadowMap.enabled = true;
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);










// #region Cameras
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.21, 1000);
scene.add(camera);

// Dev Camera
// #region 
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

// Controls and Locking
camera.position.set(0, 5, 10);
const controls = new PointerLockControls( camera, document.body );
const blocker = document.getElementById( 'blocker' );
const instructions = document.getElementById( 'instructions' );

//Event Listeners
// #region
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

// #endregion










// #region Audio Objects
const listener = new THREE.AudioListener();
camera.add(listener);
const audioloader = new THREE.AudioLoader();

const testSound = new THREE.PositionalAudio(listener);
const footstepSound = new THREE.PositionalAudio(listener);
const flashlightSoundOn = new THREE.PositionalAudio(listener);
const flashlightSoundOff = new THREE.PositionalAudio(listener);
// #endregion










// #region GameObjs

// Player
// #region
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

// Sewer Level
let sewerLevel = new SewerLevel(scene, playerGO);
// #endregion










// #region Lights
const ambientLight = new THREE.AmbientLight(0x505050, 0.1);  // Soft white light
scene.add(ambientLight);

// Add a dim hemisphere light for general brightness
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x222233, 0.003); // (skyColor, groundColor, intensity)
scene.add(hemiLight);

// FLASHLIGHT
// #region
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










// #region Physics

// init Physics, Physics Loop, and Physics variables
// #region 
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
}

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
// #endregion

// Initialize Physics Objects (All RBs should be initialized here)
function initPhysicsObjects() {
  const radius = 0.3;
  const height = 1.4;
  const meshY = 0; // The y position of your mesh's feet

  const capsuleY = meshY + (height + 2 * radius) / 2;

  playerGO.createRigidBody(physicsWorld, {radius: 0.2, height: 1.5}, "capsule", 2, 0.1);
  rigidBodies.push({mesh: playerGO.threeObj, rigidBody: playerGO.rb});
  playerGO.rb.body.setAngularFactor(new Ammo.btVector3(0, 1, 0));

  sewerLevel.initPhysicsForModelsByGroup();
}
// #endregion











// #region Other Audio

// Attach Audio to ThreeObj Meshes Here
function attachAudio() {
  footstepSound.position.set(player3Obj.position.x, player3Obj.position.y-2.5, player3Obj.position.z);
  flashlightSoundOn.position.set(player3Obj.position.x, player3Obj.position.y, player3Obj.position.z);
  flashlightSoundOff.position.set(player3Obj.position.x, player3Obj.position.y, player3Obj.position.z);

  player3Obj.add(footstepSound);
  player3Obj.add(flashlightSoundOn);
  player3Obj.add(flashlightSoundOff);
}

// Load Audio Files
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










// #region Text Controller
const textController = new TextController(document);
textController.showText("You awake in an empty, dark hallway.");
// #endregion










// #region Level Controller
const levelController = new LevelController(scene, playerGO,
  [new GazerEvent(scene, playerGO, [[0, 0], [0, -10]]), new RainEvent(scene)],
  textController
);
// #endregion











// #region Loaders
// Runs at the start of the game or when DOMContent is Loaded
async function startGame() {
  await loadAllAssets();
  console.log("All assets loaded");

  await Ammo().then((lib) => {
      Ammo = lib;
      initPhysics();
  });
  console.log("Ammo.js loaded");

  await sewerLevel.assignToPhysics(physicsWorld, rigidBodies);

  await initPhysicsObjects();
  console.log("Initialized Physics Objects");

  renderer.setAnimationLoop(animate);
}

// Use to load all assets/files
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

  await sewerLevel.loadModels();
  console.log("       Sewer Models Loaded");
  console.log("Models Loaded");
}

window.addEventListener('DOMContentLoaded', startGame);
// #endregion











scene.fog = new THREE.FogExp2(0x222222, 0.07);
// #region Main Loop
function animate() {
  const delta = clock.getDelta();
  if(controls.isLocked == true) {
    playerGO.update(delta); // Move the player
    updatePhysics(delta);
    updateFlashlight();
    controls.update(delta);    
    levelController.update(delta);
    for(const radio of sewerLevel.radios) {
      radio.update();
    }
    sewerLevel.checkPlayerRadioCollisions(playerGO);
  }
  
  devControls.update();
  if(useDevCamera) {
    hemiLight.intensity = 1;
  } else {
    hemiLight.intensity = 0.003; // 0.003
  }
	renderer.render(scene, useDevCamera ? devCamera : camera);
}

