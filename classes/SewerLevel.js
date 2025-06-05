import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

import RigidBody from './RigidBody';
import GameObject from './GameObject';

export default class SewerLevel {
    constructor(scene, playerGO, physicsWorld) {
        this.scene = scene;
        this.playerGO = playerGO;

        this.gltfLoader = new GLTFLoader();
        this.prefabs = {};
    }

    initPhysicsForModelsByGroup() {
        if(this.physicsWorld) {
            const mapGroup = this.prefabs["map_noDoors"];
            if(mapGroup) {
                this.createRigidBodiesForGroup("map_noDoors");
            } else {
                console.warn("map_noDoors group not found!")
            }
        }
        else {
            console.error("Do not load Physics Before Assigning to Physics World");
        }
    }

    createRigidBodiesForGroup(groupName) {
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


    /* TO USE OR ACCESS A MODEL const group = this.prefabs["map_noDoors"];
        the gets a reference to the group map_noDoors which is the entire map with no doors.
        This is a special case since the mesh is so big i had to vibe code it to work so it won't access the RB
    */

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

    assignToPhysics(physicsWorld) {
        this.physicsWorld = physicsWorld;
    }
}