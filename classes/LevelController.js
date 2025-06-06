export default class LevelController {
    static SELECT = 0;
    static WAIT = 1;
    static EVENT = 2;

    constructor(events) {
        this.state = LevelController.SELECT;
        this.events_remaining = 0;
        this.events = events;
        this.event = null;
        this.timer = 0;
        this.level = 0;
    }

    setEventsRemaining(target) {
        this.events_remaining = target;
    }

    update(delta) {
        if(this.state == LevelController.SELECT) {
            if(this.events_remaining > 0) {
                this.events_remaining -= 1;
                this.event = this.events[Math.floor(Math.random() * this.events.length)];
                if(this.event != null) {
                    this.textController.showText("It feels like something is about to happen...");
                    this.timer = Math.random() * 20 + 20;
                    this.state = LevelController.WAIT;
                }
            }
        } else if (this.state == LevelController.WAIT) {
            this.timer -= delta;
            if(this.timer <= 0) {
                this.event.start(this);
                this.state = LevelController.EVENT;
            }
        } else if (this.state == LevelController.EVENT) {
            this.event.update(delta);
            if(this.event.isDone()) {
                this.event.end();
                this.state = LevelController.SELECT;
            }
        }
    }

    levelDone() {
        this.playerGO.resetPosition();
        this.level += 1;
        this.setEventsRemaining(3);
        if(this.state == LevelController.EVENT && this.event != null) {
            this.event.end();
        }
        this.state = LevelController.SELECT;
    }

    levelFailed() {
        this.playerGO.resetPosition();
        this.level = 0;
        this.levelDone();
    }
}