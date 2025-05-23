import * as THREE from 'three';
import RigidBody from './RigidBody';

export default class GameObject {
    constructor(name, threeObj) {
        this.name = name;
        this.threeObj = threeObj; // Geometry of the object
        this.velocity = new THREE.Vector3(0, 0, 0); // Initialize velocity to zero
        this.acceleration = new THREE.Vector3(0, 0, 0); // Initialize acceleration to zero

        if(threeObj.position == undefined)
            this.threeObj.position.set(0, 0, 0);
        if(threeObj.quaternion == undefined)
            this.threeObj.quaternion.set(0, 0, 0, 1);
    }

    move() {
        // Update the position of the object based on its acceleration
        this.velocity.x += this.acceleration.x;
        this.velocity.y += this.acceleration.y;
        this.velocity.z += this.acceleration.z;

        // Update the position of the object based on its velocity
        this.threeObj.position.x += this.velocity.x;
        this.threeObj.position.y += this.velocity.y;
        this.threeObj.position.z += this.velocity.z;
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

    createRigidBody(physicsWorld, size, shape, mass = 0, friction = 0.5, restitution = 0) {
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
            default:
                console.error("Unknown shape type: " + shape);
                break;
        }

        this.rb.setFriction(friction);
        this.rb.setBounciness(restitution);
    }
}