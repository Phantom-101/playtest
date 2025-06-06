import * as THREE from 'three';

export default class GazerEvent {
    static SPAWN = 0;
    static LINGER = 1;
    static DESPAWN = 2;
    static END = 3;

    constructor() {
        this.min_spawn_radius = 20;
        this.max_spawn_radius = 50;
        this.spawn_duration = 5;
        this.linger_duration = 30;
        this.despawn_duration = 5;
        this.base_y = -5;
        this.speed = 2;
    }

    start(level) {
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
        this.sprite.position.set(0, 3, 0);
        this.sprite.scale.set(2, 4, 2);
        let attempts = 5;
        while(attempts > 0) {
            const result = this.level.navMeshQuery.findRandomPointAroundCircle(this.level.playerGO.threeObj.position, this.max_spawn_radius);
            if(!result.success) {
                console.log(`Gazer spawn failed: ${result.status}`);
                this.state = GazerEvent.END;
                return;
            }
            const dist = Math.sqrt((result.randomPoint.x - this.level.playerGO.threeObj.position.x)**2 + (result.randomPoint.z - this.level.playerGO.threeObj.position.z)**2);
            if(dist >= this.min_spawn_radius) {
                this.threeObj.position.set(result.randomPoint.x, this.base_y, result.randomPoint.z);
                break;
            } else {
                attempts -= 1;
            }
        }
        if(attempts == 0) {
            console.log(`Gazer spawn failed: insufficient attempts remaining`);
            this.state = GazerEvent.END;
            return;
        }
        this.level.scene.add(this.threeObj);
        this.level.audioLoader.load('sounds/gazerSpawn.mp3', function (audio) {
            const sound = new THREE.PositionalAudio(this.level.listener);
            this.threeObj.add(sound);
            sound.setBuffer(audio);
            sound.setRefDistance(30);
            sound.play();
        }.bind(this));
        this.level.textController.showText("A mysterious entity arises from the ground.");
        this.level.textController.showUnique("GAZER_LORE", "You sense that it dislikes light, but otherwise is content to observe from afar.");
    }

    update(delta) {
        if(this.state == GazerEvent.END) {
            return;
        }
        this.sprite.position.set(Math.random() * 0.1, 2 + Math.random() * 0.1, Math.random() * 0.1);
        if(this.state == GazerEvent.SPAWN) {
            this.timer -= delta;
            this.threeObj.position.set(this.threeObj.position.x, this.base_y * this.timer / this.spawn_duration, this.threeObj.position.z);
            if(this.timer <= 0) {
                this.timer = this.linger_duration;
                this.state = GazerEvent.LINGER;
            }
        } else if (this.state == GazerEvent.LINGER) {
            this.timer -= delta;
            if(this.level.playerGO.flashlightEnabled) {
                const dist = Math.sqrt((this.threeObj.position.x - this.level.playerGO.threeObj.position.x)**2 + (this.threeObj.position.z - this.level.playerGO.threeObj.position.z)**2);
                if(dist <= 2) {
                    this.level.textController.showText("\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000");
                    this.level.textController.showText("Static fills your head. You cannot seem to remember what just happened.");
                    this.level.textController.showText("Have I always been here?");
                    this.level.levelFailed();
                    return;
                }
                let start = this.threeObj.position;
                let end = this.level.playerGO.threeObj.position;
                start = this.level.navMeshQuery.findClosestPoint(start).point;
                end = this.level.navMeshQuery.findClosestPoint(end).point;
                const result = this.level.navMeshQuery.computePath(start, end);
                if(!result.success) {
                    console.log(`Pathfinding failed: ${result.error}`);
                }
                if(result.path.length >= 2) {
                    const direction = new THREE.Vector3(
                        result.path[1].x - this.threeObj.position.x,
                        0,
                        result.path[1].z - this.threeObj.position.z
                    ).normalize();
                    this.threeObj.position.add(direction.multiplyScalar(this.speed * delta));
                }
            }
            if(this.timer <= 0) {
                this.timer = this.despawn_duration;
                this.state = GazerEvent.DESPAWN;
                this.level.textController.showText("The entity is gone, for now.");
            }
        } else if (this.state == GazerEvent.DESPAWN) {
            this.timer -= delta;
            this.threeObj.position.set(this.threeObj.position.x, this.base_y * (1 - this.timer / this.despawn_duration), this.threeObj.position.z);
            if(this.timer <= 0) {
                this.state = GazerEvent.END;
            }
        }
    }

    isDone() {
        return this.state == GazerEvent.END;
    }

    end() {
        this.level.scene.remove(this.threeObj);
        this.sprite.geometry.dispose();
        this.sprite.material.dispose();
        this.sprite = null;
        this.threeObj = null;
    }
}