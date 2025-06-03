import GameObject from "./GameObject";
import * as THREE from "three";
import { PointerLockControls  } from "./PointerLockControls";

export default class Player extends GameObject {
    constructor(name, threeObj, document, controls, footStepSound) {
        super(name, threeObj);
        this.initializeControls(document);
        this.moveSpeed = 0.04;
        this.pressedKeys = new Set();
        this.controls = controls;
        this.camera = controls.object;

        this.bobBool = false;
        this.bobTime = 0;
        this.bobAmount = 0.08;
        this.bobSpeed = 6;

        this.footStepSound = footStepSound;
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
            this.bobBool = true;
            moveDir.normalize().multiplyScalar(this.moveSpeed);
        }

        //this.threeObj.position.add(moveDir); // Update the position of the player
        if(this.rb && this.rb.body) {
            //console.log('moveDir: ' + moveDir.x + ', ' + moveDir.y + ', ' + moveDir.z);
            const currentVelocity = this.rb.body.getLinearVelocity();
            this.rb.body.activate();
            this.rb.body.setLinearVelocity(new Ammo.btVector3(
                moveDir.x * 50,
                currentVelocity.y(),
                moveDir.z * 50
            ));
        }
        
        this.camera.position.copy(this.threeObj.position).add(new THREE.Vector3(0, 0, 0)); // Update the camera position to match the player


        

        //console.log(`Player ${this.name} speed: ${this.velocity.length()}`);
    }

    // Slightly modified from https://youtu.be/oqKzxPMLWxo?si=718ahK_HPU8CZtEx
    updateHeadBob(delta) {
        if(this.bobBool) {
            const wavelength = Math.PI;
            const nextStep = 1 + Math.floor(((this.bobTime + 0.000001) * this.bobSpeed * 0.5)/ wavelength);
            const nextStepTime = nextStep * wavelength / (this.bobSpeed * 0.5);
            this.bobTime = Math.min(this.bobTime + delta, nextStepTime);

            if(this.bobTime == nextStepTime && this.footStepSound && this.velocity.length() > 0) {
                this.footStepSound.playbackRate = Math.random() * 0.4 + 0.75;

                if(!this.footStepSound.isPlaying) {
                    this.footStepSound.play();
                } else {
                    this.footStepSound.stop();
                    this.footStepSound.play();
                }
            }

            if(this.bobTime == nextStepTime) {
                this.bobBool = false;
            }
        }

        this.camera.position.y += Math.abs(Math.sin(this.bobTime * this.bobSpeed * 0.5)) * this.bobAmount;
    }

    update(delta) {
        this.move();
        this.updateHeadBob(delta);
    }
}