import * as THREE from 'three';
import RigidBody from './RigidBody';

export default class GameObject {
    constructor(name, threeObj) {
        this.name = name;
        this.threeObj = threeObj; // Geometry of the object
        this.velocity = new THREE.Vector3(0, 0, 0); // Initialize velocity to zero
        this.acceleration = new THREE.Vector3(0, 0, 0); // Initialize acceleration to zero
        this.audio = null;
        
        if(threeObj.position == undefined)
            this.threeObj.position.set(0, 0, 0);
        if(threeObj.quaternion == undefined)
            this.threeObj.quaternion.set(0, 0, 0, 1);
    }

    move() {
    }

    addToScene(scene) {
        // Add the object to the scene
        scene.add(this.threeObj);
    }

    removeFromScene(scene) {
        // Remove the object from the scene
        scene.remove(this.threeObj);
    }

    addToPhysicsWorld(physicsWorld) {        
        physicsWorld.addRigidBody(rb.body); // Add the rigid body to the physics world
    }

    removeFromPhysicsWorld(physicsWorld) {
        physicsWorld.removeRigidBody(rb.body);
    }

    displayInfo() {
        console.log(`Name: ${this.name}, Position: ${JSON.stringify(this.position)}`);
    }

    createRigidBody(physicsWorld, size, shape, mass = 0, friction = 0, restitution = 0) {
        this.rb = new RigidBody(physicsWorld);
        switch (shape) {
            case "box":
                //Ex: size = {x: 1, y: 1, z: 1};
                this.rb.createBox(mass, this.threeObj.position, this.threeObj.quaternion, size);
                break;
            case "capsule":
                //Ex: size = {radius: 0.5, height: 1};
                this.rb.createCapsule(mass, this.threeObj.position, this.threeObj.quaternion, size);
                break;
            case "BB":
                const bbox = new THREE.Box3().setFromObject(this.threeObj);
                const bbsize = new THREE.Vector3();
                bbox.getSize(bbsize);
                const bbcenter = new THREE.Vector3();
                bbox.getCenter(bbcenter);


                this.threeObj.position.copy(bbcenter);
                this.rb.createBox(mass, bbcenter, this.threeObj.quaternion, bbsize);
                break;
            case "mesh":
                this.rb.createMesh(this.threeObj.position, this.threeObj.quaternion, this.threeObj);
                break;
            default:
                console.error("Unknown shape type: " + shape);
                break;
        }

        this.rb.setFriction(friction);
        this.rb.setBounciness(restitution);
    }
}