import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

import RigidBody from './RigidBody';
import GameObject from './GameObject';
import Radio from './Radio';

export default class SewerLevel {
    constructor(scene, playerGO, physicsWorld) {
        this.scene = scene;
        this.playerGO = playerGO;

        this.gltfLoader = new GLTFLoader();
        this.prefabs = {};

        this.startDoors = [];
        this.endDoors = [];

        this.radios = [];
        this.radioPoints = 0;
    }

    initPhysicsForModelsByGroup() {
        if(this.physicsWorld) {
            const mapGroup = this.prefabs["map_noDoors"];
            if(mapGroup) {
                this.makeRBforMap("map_noDoors");
            } else {
                console.warn("map_noDoors group not found!")
            }

            const startDoorGroup = this.prefabs["Start_Doors"];
            if(startDoorGroup) {
                this.makeRBforDoors("Start_Doors");
            } else {
                console.warn("Start_Doors group not found!");
            }

            const endDoorGroup = this.prefabs["End_Doors"];
            if(endDoorGroup) {
                this.makeRBforDoors("End_Doors");
            } else {
                console.warn("End_Doors group not found!");
            }

            const radioGroup = this.prefabs["Radios"];
            if(radioGroup) {
                this.makeBBforRadio("Radios");
            } else {
                console.warn("Radios group not found!");
            }
        }
        else {
            console.error("Do not load Physics Before Assigning to Physics World");
        }
    }
    /* TO USE OR ACCESS A MODEL const group = this.prefabs["map_noDoors"];
        the gets a reference to the group map_noDoors which is the entire map with no doors.
        This is a special case since the mesh is so big i had to vibe code it to work so it won't access the RB
    */
    findDoorMeshGO(meshName) {
        let temp = this.startDoors.find(go => go.threeObj.name == meshName);
        if (!temp)
            temp = this.endDoors.find(go => go.threeObj.name == meshName);
        return temp;
    }







    checkPlayerRadioCollisions(player) {
        for (let i = this.radios.length - 1; i >= 0; i--) {
            const radio = this.radios[i];
            if (player.playerBB.intersectsBox(radio.radioBB)) {
                this.radioPoints++;
                this.prefabs[radio.threeObj.name].visible = false;
                radio.removeFromScene(this.scene);
                this.radios.splice(i, 1); // Remove the radio from the array
                this.checkPlayerScore();                
            }
        }
    }

    checkPlayerScore() {
        switch (this.radioPoints)  {
            case 1:
                console.log("radioPoints: " + this.radioPoints);
                const door1E = this.findDoorMeshGO("Door1End");
                const door2S = this.findDoorMeshGO("Door2Start");
                this.unlockDoor(door1E, "End_Doors");
                this.unlockDoor(door2S, "Start_Doors");
                break;
            case 2:
                console.log("radioPoints: " + this.radioPoints);                
                break;
            case 3:
                console.log("radioPoints: " + this.radioPoints);
                const door2E = this.findDoorMeshGO("Door2End");
                const door3S = this.findDoorMeshGO("Door3Start");
                this.unlockDoor(door2E, "End_Doors");
                this.unlockDoor(door3S, "Start_Doors");
                break;
            case 4:
                console.log("radioPoints: " + this.radioPoints);
                break;
            case 5:
                console.log("radioPoints: " + this.radioPoints);
                break;
            case 6:
                console.log("radioPoints: " + this.radioPoints);
                const door3E = this.findDoorMeshGO("Door3End");
                this.unlockDoor(door3E, "End_Doors");
                break;
        }
    }



    makeBBforRadio(groupName) {
        const group = this.prefabs[groupName];
        if (!group) {
            console.warn(`Group ${groupName} not found!`);
            return;
        }

        group.traverse(child => {
            if (child.isMesh) {
                const go = new Radio(child.name, child);
                this.radios.push(go);
            }
        });
    }

    unlockDoor(go, groupName) {
        this.removeDoorRigidBody(go);
        const mesh = go.threeObj;
        const startRotation = mesh.rotation.y;
        let endRotation = startRotation;
        const duration = 30; // seconds

        if (groupName == "Start_Doors") {
            endRotation -= Math.PI / 2 + Math.PI / 4;
        } else if (groupName == "End_Doors") {
            endRotation += Math.PI / 2 + Math.PI / 4;
        }

        // Prevent double animation
        if (mesh._isAnimatingDoor) return;
        mesh._isAnimatingDoor = true;

        let startTime = null;

        const animate = (now) => {
            if (startTime === null) startTime = now;
            const elapsed = (now - startTime) / 1000;
            const t = Math.min(elapsed / duration, 1);
            mesh.rotation.y = THREE.MathUtils.lerp(startRotation, endRotation, t);
            if (t < 1) {
                requestAnimationFrame(animate);
            } else {
                mesh._isAnimatingDoor = false; // Animation done
            }
        };
        requestAnimationFrame(animate);
    }

    makeRBforDoors(groupName) {
        const group = this.prefabs[groupName];
        if (!group) {
            console.warn(`Group ${groupName} not found!`);
            return;
        }

        //const newDoors = [];

        group.traverse(child => {
            if (child.isMesh) {
                // 1. Create GameObject and dynamic rigid body for the door
                const go = new GameObject(child.name, child);
                go.createRigidBody(this.physicsWorld, null, "mesh"); // mass=1 for dynamic

                if(groupName == "Start_Doors") {
                    this.startDoors.push(go);
                } else if(groupName == "End_Doors") {
                    this.endDoors.push(go);
                }

                //newDoors.push(go);
            }
        });

        /*
        for (const go of newDoors) {
            this.unlockDoor(go, groupName);
        }
        */
    }

    makeRBforMap(groupName) {
        const group = this.prefabs[groupName];
        if (!group) {
            console.warn(`Group ${groupName} not found!`);
            return;
        }

        // Collect all geometries from meshes in the group for physics
        const geometries = [];
        group.traverse(child => {
            if (child.isMesh) {
                const geom = child.geometry.clone();
                geom.applyMatrix4(child.matrixWorld);
                geometries.push(geom);
            }
        });

        if (geometries.length == 0) {
            console.warn(`No meshes found in group "${groupName}" for physics.`);
            return;
        }

        // Merge all geometries into one for physics collider
        const mergedGeometry = BufferGeometryUtils.mergeGeometries(geometries, true);
        const mergedMesh = new THREE.Mesh(mergedGeometry, new THREE.MeshBasicMaterial());
        mergedMesh.visible = false; // Hide the physics mesh

        // Create a single static mesh collider for the whole group
        const go = new GameObject(groupName + "_merged", mergedMesh);
        go.createRigidBody(this.physicsWorld, null, "mesh", 0);
    }

    // Used to load all models/meshes into the world
    loadModels() {
        return new Promise((resolve, reject) => {
            this.gltfLoader.load('models/sewerMapGLTF/scene.gltf', (gltf) => {
                gltf.scene.traverse((child) => {
                    if(child.name) {
                        //console.log(`Prefab: ${child.name} (${child.type})`);
                        this.prefabs[child.name] = child;
                    }
                });
                gltf.scene.position.y = 0.1;
                this.scene.add(gltf.scene);
                resolve();
            }, undefined, reject);
        });
    }

    // Assigns physics world do to rigid bodies in the class
    assignToPhysics(physicsWorld) {
        this.physicsWorld = physicsWorld;
    }

    removeDoorRigidBody(go) {
        if(go.rb && go.rb.body) {
            this.physicsWorld.removeRigidBody(go.rb.body);
            go.rb.body = null;
        }
    }
}