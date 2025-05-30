import GameObject from "./GameObject";
import * as THREE from "three";
import { PointerLockControls  } from "./PointerLockControls";

export default class Player extends GameObject {
    constructor(name, threeObj, document, controls) {
        super(name, threeObj);
        this.initializeControls(document);
        this.moveSpeed = 0.1;
        this.pressedKeys = new Set();
        this.controls = controls;
        this.camera = controls.object;
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
    }

    move() {
        const cameraDir = this.controls.getDirection(new THREE.Vector3());
        cameraDir.y = 0; // Ignore vertical direction
        cameraDir.normalize(); // Normalize the direction vector

        const cameraRight = new THREE.Vector3().crossVectors(cameraDir, new THREE.Vector3(0, 1, 0)).normalize();
        
        const moveDir = new THREE.Vector3();
        moveDir.addScaledVector(cameraDir, this.velocity.z);
        moveDir.addScaledVector(cameraRight, this.velocity.x);

        if (moveDir.length() > 0) {
            moveDir.normalize().multiplyScalar(this.moveSpeed);
        }

        //this.threeObj.position.add(moveDir); // Update the position of the player
        if(this.rb && this.rb.body) {
            console.log('moveDir: ' + moveDir.x + ', ' + moveDir.y + ', ' + moveDir.z);
            const currentVelocity = this.rb.body.getLinearVelocity();
            this.rb.body.setLinearVelocity(new Ammo.btVector3(
                moveDir.x * 50,
                currentVelocity.y(),
                moveDir.z * 50
            ));
        }
        
        this.camera.position.copy(this.threeObj.position).add(new THREE.Vector3(0, 0, 0)); // Update the camera position to match the player

        //console.log(`Player ${this.name} speed: ${this.velocity.length()}`);
    }
}