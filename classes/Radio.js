import GameObject from "./GameObject";
import * as THREE from "three";

export default class Radio extends GameObject {
    constructor(name, threeObj) {
        super(name, threeObj);
        this.radioBB = new THREE.Box3().setFromObject(this.threeObj);
        this.createLight();
        this.threeObj.castShadow = false;
        this.threeObj.receiveShadow = false;
        this.audio = null;
    }

    update() {
        this.radioBB.setFromObject(this.threeObj);
    }

    removeFromScene(scene) {
        if (this.threeObj && scene) {
            // Remove the light from the mesh first
            if (this.light && this.threeObj.children.includes(this.light)) {
                this.threeObj.remove(this.light);
            }
            scene.remove(this.threeObj);
            this.threeObj = null;
            this.light = null;
            this.audio.stop();
            this.audio = null;
        }
    }

    createLight() {
        this.light = new THREE.PointLight(0x990000, 0.5, 0.3);
        this.light.castShadow = false;
        this.light.receiveShadow = false;
        this.light.position.set(0,0,0);
        this.threeObj.add(this.light);
    }
}