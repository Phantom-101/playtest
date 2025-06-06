import * as THREE from 'three';

export default class RainEvent {
    static RAIN_START = 0;
    static RAIN = 1;
    static RAIN_END = 2;
    static END = 3;

    constructor() {
        this.start_duration = 15;
        this.rain_duration = 60;
        this.end_duration = 15;
        this.rain_height = 10;
        this.rain_region = 20;
        this.max_rain = 500;
        this.light_intensity = 0.3;
    }

    start(level) {
        this.level = level;
        this.state = RainEvent.RAIN_START;
        this.timer = this.start_duration;
        const map = new THREE.TextureLoader().load('textures/rain.png');
        map.minFilter = THREE.NearestFilter;
        map.magFilter = THREE.NearestFilter;
        this.material = new THREE.SpriteMaterial({ map: map });
        this.rain = [];
        this.light = new THREE.AmbientLight(0xff0000, 0);
        this.level.scene.add(this.light);
        this.level.textController.showText("Is it... raining?");
        this.level.textController.showUnique("RAIN_LORE", "This strange substance is viscous, but otherwise harmless. A red haze fills the air.");
        this.level.scene.fogOverride = true;
        this.level.scene.fog.color = new THREE.Color(0x331111);
        this.level.scene.fog.density = 0.3;
    }

    update(delta) {
        if(this.state == RainEvent.RAIN_START) {
            this.rain_limit = Math.round(this.max_rain * (1 - this.timer / this.start_duration));
            this.light.intensity = this.light_intensity * (1 - this.timer / this.start_duration);
            this.timer -= delta;
            if(this.timer <= 0) {
                this.state = RainEvent.RAIN;
                this.timer = this.rain_duration;
            }
        } else if (this.state == RainEvent.RAIN) {
            this.rain_limit = this.max_rain;
            this.light.intensity = this.light_intensity;
            this.timer -= delta;
            if(this.timer <= 0) {
                this.state = RainEvent.RAIN_END;
                this.timer = this.end_duration;
                this.level.textController.showText("It seems the rain is dissipating.");
            }
        } else if (this.state == RainEvent.RAIN_END) {
            this.rain_limit = Math.round(this.max_rain * this.timer / this.start_duration);
            this.light.intensity = this.light_intensity * Math.max(this.timer / this.start_duration, 0);
            this.timer -= delta;
            if(this.timer <= 0 && this.rain.length == 0) {
                this.state = RainEvent.END;
            }
        }
        while(this.rain.length < this.rain_limit) {
            const sprite = new THREE.Sprite(this.material);
            sprite.scale.set(0.5, 0.5, 0.5);
            sprite.position.set(
                this.level.playerGO.threeObj.position.x + (Math.random() - 0.5) * 2 * this.rain_region,
                this.rain_height,
                this.level.playerGO.threeObj.position.z + (Math.random() - 0.5) * 2 * this.rain_region
            );
            sprite.rain_velocity = [(Math.random() - 0.5), (Math.random() - 0.5)];
            this.rain.push(sprite);
            this.level.scene.add(sprite);
        }
        let index = 0;
        while(index < this.rain.length) {
            const sprite = this.rain[index];
            sprite.position.set(sprite.position.x + sprite.rain_velocity[0] * delta, sprite.position.y - 10 * delta, sprite.position.z + sprite.rain_velocity[1] * delta);
            if(sprite.position.y < -0.5) {
                this.rain[index] = this.rain[this.rain.length - 1];
                this.rain[this.rain.length - 1] = sprite;
                this.rain.pop();
                this.level.scene.remove(sprite);
            } else {
                index += 1;
            }
        }
    }

    isDone() {
        return this.state == RainEvent.END;
    }

    end() {
        this.level.scene.fogOverride = false;
        this.level.scene.fog.density = 0;
        this.level.scene.fog.color = new THREE.Color(0xEFEFEF);
        this.level.scene.remove(this.light);
        this.light = null;
        this.material.dispose();
        this.material = null;
        while(this.rain.length > 0) {
            this.level.scene.remove(this.rain[this.rain.length - 1]);
            this.rain.pop();
        }
    }
}