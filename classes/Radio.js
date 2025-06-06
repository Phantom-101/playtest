import GameObject from "./GameObject";
import * as THREE from "three";

export default class Radio extends GameObject {
    constructor(name, threeObj) {
        super(name, threeObj);
        this.radioBB = new THREE.Box3().setFromObject(this.threeObj);
    }

    update() {
        this.radioBB.setFromObject(this.threeObj);
    }

    removeFromScene(scene) {
        if (this.threeObj && scene) {
            scene.remove(this.threeObj);
            this.threeObj = null;
        }
    }
}