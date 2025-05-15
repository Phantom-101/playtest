import GameObject from "./GameObject";
import * as THREE from "three";

export default class Player extends GameObject {
    constructor(name, geometry, document) {
        super(name, geometry);
        this.initializeControls(document);
        this.moveSpeed = 0.1;
        this.pressedKeys = new Set();
    }

    /*
    * Initialize event listeners for keyboard controls
    */
    initializeControls(document) {
        
        this.onKeyDown = this.onKeyDown.bind(this);
        document.addEventListener("keydown", this.onKeyDown, false);

        this.onKeyUp = this.onKeyUp.bind(this);        
        document.addEventListener("keyup", this.onKeyUp, false);
        
    }

    onKeyDown(event) {
        this.pressedKeys.add(event.which); // Add the key to the pressed keys set
        this.updateVelocity();
    }

    onKeyUp(event) {
        this.pressedKeys.delete(event.which); // Remove the key from the pressed keys set
        this.updateVelocity();
    }

    updateVelocity() {
        // Reset velocity
        this.velocity.set(0, 0, 0);

        // Update velocity based on currently pressed keys
        if (this.pressedKeys.has(65)) { // 'A' key
            this.velocity.x -= this.moveSpeed;
        }
        if (this.pressedKeys.has(68)) { // 'D' key
            this.velocity.x += this.moveSpeed;
        }
        if (this.pressedKeys.has(87)) { // 'W' key
            this.velocity.z += this.moveSpeed;
        }
        if (this.pressedKeys.has(83)) { // 'S' key
            this.velocity.z -= this.moveSpeed;
        }

        // Normalize velocity for consistent diagonal speed
        if (this.velocity.length() > 0) {
            this.velocity.normalize().multiplyScalar(this.moveSpeed);
        }

        if(this.pressedKeys == null) {
            this.velocity.set(0, 0, 0); // Stop the player if no keys are pressed
        }
    }

    /*
    * Camera
    */

    attachCamera(camera) {
        this.camera = camera;
        this.cameraOffset = new THREE.Vector3(0, 0, 0); // Offset from the player
    }

    updateCamera() {
        if(this.camera) {
            this.camera.position.copy(this.geometry.position).add(this.cameraOffset);
        }
    }

    move() {
        super.move();
        this.updateCamera();
        //console.log(`Player ${this.name} speed: ${this.velocity.length()}`);
    }
}