import * as THREE from 'three';

export default class GameObject {
    constructor(name, geometry) {
        this.name = name;
        this.geometry = geometry; // Geometry of the object
        this.boundingBox = new THREE.Box3().setFromObject(geometry); // Bounding box for collision detection

        geometry.position.set(0, 0, 0); // Initialize position to origin
        this.velocity = new THREE.Vector3(0, 0, 0); // Initialize velocity to zero
        this.acceleration = new THREE.Vector3(0, 0, 0); // Initialize acceleration to zero
    }

    move() {
        // Update the position of the object based on its acceleration
        this.velocity.x += this.acceleration.x;
        this.velocity.y += this.acceleration.y;
        this.velocity.z += this.acceleration.z;

        // Update the position of the object based on its velocity
        this.geometry.position.x += this.velocity.x;
        this.geometry.position.y += this.velocity.y;
        this.geometry.position.z += this.velocity.z;

        // Update the bounding box to match the new position
        this.boundingBox.setFromObject(this.geometry);
    }

    addToScene(scene) {
        // Add the object to the scene
        scene.add(this.geometry);
        this.boundingBox.setFromObject(this.geometry); // Update bounding box after adding to scene
    }

    removeFromScene(scene) {
        // Remove the object from the scene
        scene.remove(this.geometry);
        this.boundingBox = null;
    }

    displayInfo() {
        console.log(`Name: ${this.name}, Position: ${JSON.stringify(this.position)}`);
    }
}