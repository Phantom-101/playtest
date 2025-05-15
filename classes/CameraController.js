import * as THREE from 'three';

export default class CameraController {
    constructor(camera, document) {
        this.camera = camera;
        this.document = document;
        this.sensitivity = 5;
        

        this.current = {mouseX:0, mouseY:0};
        this.previous = null;
        this.onMouseMove = this.onMouseMove.bind(this);
        this.document.addEventListener('mousemove', this.onMouseMove, false);

        this.rotation = new THREE.Quaternion();
        this.phi = 0;
        this.theta = 0;
    }

    onMouseMove(event) {
        this.current.mouseX = event.pageX - window.innerWidth / 2;
        this.current.mouseY = event.pageY - window.innerHeight / 2;

        if(this.previous == null) {
            this.previous = {... this.current};
        }

        this.current.mouseXDelta = this.current.mouseX - this.previous.mouseX;
        this.current.mouseYDelta = this.current.mouseY - this.previous.mouseY;
    }

    updateMouseMove(delta) {
        if(this.previous != null) {
            this.current.mouseXDelta = this.current.mouseX - this.previous.mouseX;
            this.current.mouseYDelta = this.current.mouseY - this.previous.mouseY;
            this.previous = {... this.current};
        }
    }

    updateCamera(delta) {
        this.camera.quaternion.copy(this.rotation);
        //const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.rotation);
    }

    updateRotation(delta) {
        const xh = this.current.mouseXDelta / window.innerWidth;
        const yh = this.current.mouseYDelta / window.innerHeight;
        
        this.phi += -xh * this.sensitivity;
        this.theta = clamp(this.theta + -yh * this.sensitivity, -Math.PI / 3, Math.PI / 3);

        const qx = new THREE.Quaternion();
        qx.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.phi);
        const qz = new THREE.Quaternion();
        qz.setFromAxisAngle(new THREE.Vector3(1, 0, 0), this.theta);

        const q = new THREE.Quaternion();
        q.multiply(qx);
        q.multiply(qz);

        this.rotation.copy(q);
    }

    update(delta) {
        this.updateMouseMove(delta);
        this.updateRotation(delta);
        this.updateCamera(delta);
    }    
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}