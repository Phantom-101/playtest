import GameObject from "./GameObject";
import * as THREE from "three";
import { PointerLockControls  } from "./PointerLockControls";

export default class Player extends GameObject {
    constructor(name, threeObj, document, controls,
        footStepSound,
        flashlighSoundOn,
        flashlightSoundOff,
        sewerAmbient,
        scene
    ) {
        super(name, threeObj);
        this.initializeControls(document);
        this.moveSpeed = 0.05;
        this.pressedKeys = new Set();
        this.controls = controls;
        this.camera = controls.object;

        this.bobBool = false;
        this.bobTime = 0;
        this.bobAmount = 0.06;
        this.bobSpeed = 6;

        this.footStepSound = footStepSound;
        this.flashlightSoundOn = flashlighSoundOn;
        this.flashlightSoundOff = flashlightSoundOff;
        this.sewerAmbient = sewerAmbient;

        this.flashlightEnabled = true;

        this.playerBB = new THREE.Box3().setFromObject(this.threeObj);
        this.threeObj.visible = false;
        this.scene = scene;
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
        if(event.key == 'f') {
            this.flashlightEnabled = !this.flashlightEnabled;
            if (this.flashlightEnabled && this.flashlightSoundOn) {
                this.flashlightSoundOn.playbackRate = Math.random() * 0.2 + 0.9;
                this.flashlightSoundOn.play();
                this.flashlightSoundOff.stop();
            } else if (!this.flashlightEnabled && this.flashlightSoundOff) {
                this.flashlightSoundOff.playbackRate = Math.random() * 0.2 + 0.9;
                this.flashlightSoundOff.play();
                this.flashlightSoundOn.stop();
            }
        }
    }

    onKeyUp(event) {
        this.pressedKeys.delete(event.which); // Remove the key from the pressed keys set
        this.updateVelocity();
    }






    resetPosition() {
        const transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(new Ammo.btVector3(0, 3, 0));
        this.rb.body.setWorldTransform(transform);
        this.rb.body.getMotionState().setWorldTransform(transform);
        Ammo.destroy(transform);
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
        
        this.camera.position.copy(this.threeObj.position).add(new THREE.Vector3(0, 0.72, 0)); // Update the camera position to match the player

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
        this.playerBB.setFromObject(this.threeObj);
        if(this.threeObj.position.x > 130) {
            this.gameEnd();
        }
        // In your update or animate loop
        const x = this.threeObj.position.x; // or playerGO.threeObj.position.x
        const fadeStart = -130;
        const fadeEnd = -116;

        // Clamp t between 0 (full fog) and 1 (no fog)
        let t = (x - fadeStart) / (fadeEnd - fadeStart);
        t = Math.max(0, Math.min(1, t));

        if(!this.scene.fogOverride) {
            // Lerp between your normal fog density and 0
            const normalDensity = 0.1;
            this.scene.fog.density = normalDensity * (1 - t);
        }

        if (this.sewerAmbient && this.sewerAmbient.setVolume) {
            // Fade out as t goes from 0 to 1, clamp to [0,1]
            const volume = Math.max(0, Math.min(1,t));
            this.sewerAmbient.setVolume(volume);
        }
    }
}