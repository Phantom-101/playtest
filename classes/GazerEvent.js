import * as THREE from 'three';

export default class GazerEvent {
    static SPAWN = 0;
    static LINGER = 1;
    static DESPAWN = 2;
    static END = 3;

    constructor(scene, playerGO, positions) {
        this.scene = scene;
        this.playerGO = playerGO;
        this.positions = positions;
        this.spawn_duration = 5;
        this.linger_duration = 15;
        this.despawn_duration = 5;
        this.base_y = -5;
    }

    start(level) {
        console.log("Gazer start");
        this.level = level;
        this.state = GazerEvent.SPAWN;
        this.timer = this.spawn_duration;
        const map = new THREE.TextureLoader().load('textures/gazer.png');
        map.minFilter = THREE.NearestFilter;
        map.magFilter = THREE.NearestFilter;
        const material = new THREE.SpriteMaterial({ map: map });
        this.sprite = new THREE.Sprite(material);
        this.threeObj = new THREE.Group();
        this.threeObj.add(this.sprite);
        this.sprite.position.set(0, 2, 0);
        this.sprite.scale.set(1.5, 3, 1.5);
        const pos = this.positions[Math.floor(Math.random() * this.positions.length)];
        this.x = pos[0];
        this.z = pos[1];
        this.threeObj.position.set(this.x, this.base_y, this.z);
        this.scene.add(this.threeObj);
    }

    update(delta) {
        this.sprite.position.set(Math.random() * 0.1, 2 + Math.random() * 0.1, Math.random() * 0.1);
        if(this.state == GazerEvent.SPAWN) {
            this.timer -= delta;
            this.threeObj.position.set(this.x, this.base_y * this.timer / this.spawn_duration, this.z);
            if(this.timer <= 0) {
                console.log("Gazer linger");
                this.timer = this.linger_duration;
                this.state = GazerEvent.LINGER;
            }
        } else if (this.state == GazerEvent.LINGER) {
            this.timer -= delta;
            const dist = Math.sqrt((this.x - this.playerGO.threeObj.position.x)**2 + (this.z - this.playerGO.threeObj.position.z)**2);
            if(dist <= 2 && this.playerGO.flashlightEnabled) {
                this.level.levelFailed();
                // TODO send death message
            }
            if(this.timer <= 0) {
                console.log("Gazer despawn");
                this.timer = this.despawn_duration;
                this.state = GazerEvent.DESPAWN;
            }
        } else if (this.state == GazerEvent.DESPAWN) {
            this.timer -= delta;
            this.threeObj.position.set(this.x, this.base_y * (1 - this.timer / this.despawn_duration), this.z);
            if(this.timer <= 0) {
                this.state = GazerEvent.END;
            }
        }
    }

    isDone() {
        return this.state == GazerEvent.END;
    }

    end() {
        console.log("Gazer end");
        this.scene.remove(this.threeObj);
        this.sprite.geometry.dispose();
        this.sprite.material.dispose();
        this.sprite = null;
        this.threeObj = null;
    }
}