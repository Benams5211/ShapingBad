//
//  BaseBoss.js
//


function drawBossUI(name, hp, maxHp, x, y) {
    push();
    const barWidth = 200;
    const barHeight = 16;
    const pct = hp / maxHp;

    fill(40, 40, 60, 180);
    noStroke();
    rectMode(CENTER);
    rect(x, y, barWidth, barHeight, 4);

    const c1 = color(80, 255, 200);
    const c2 = color(255, 80, 120);
    const barFill = lerpColor(c2, c1, pct);
    fill(barFill);
    rect(x - (barWidth * (1 - pct)) / 2, y, barWidth * pct, barHeight, 4);

    stroke(255, 255, 255, 120);
    noFill();
    rect(x, y, barWidth, barHeight, 4);

    noStroke();
    fill(255);
    textAlign(CENTER);
    textSize(24);
    text(name + " (" + hp + "/" + maxHp + ")", x, y - 30);
    pop();
}

function clearBosses() {
    console.log("Clear bosses called");
    for (const boss of activeBosses) {
        boss.forceClear();
    }
    activeBosses.length = 0;
    combinedObjectList.length = 0;
}


// --------------------------------------------------------
// BaseBoss: reusable parent for all bosses
// --------------------------------------------------------
class BaseBoss {
    constructor(name, jsonPath, maxHealth = 100, UIOffset = 275, movementSpeed = 8) {
        this.object = null;
        this.name = name;
        this.jsonPath = jsonPath;
        this.health = maxHealth;
        this.maxHealth = maxHealth;
        this.UIOffset = UIOffset;
        this.movementSpeed = movementSpeed
        this.alive = true;
    }

    async spawn() {
        this.object = await loadCombinedObjectFromFile(this.jsonPath);
        combinedObjectList.push(this.object);
        this.object.mainObject.isCombined = true;
        this.object.mainObject.movement.velocityLimit = this.movementSpeed;
        interactors.push(this.object.mainObject);
        for (const child of this.object.objectList) {
            child.Shape.isCombined = true;
            //child.Shape.events.push("bossShapeClick");
            interactors.push(child.Shape);
        }
        activeBosses.push(this);
    }

    getPosition() {
        if (this.object === null) return 0;
        return createVector(this.object.mainObject.x, this.object.mainObject.y);
    }
    setPosition(x, y) {
        if (this.object === null) return;
        this.object.mainObject.x = x;
        this.object.mainObject.y = y;
    }
    toggleMovement(to) {
        if (this.object === null) return;
        this.object.mainObject.movement.enabled = to
    }

    takeDamage(amount) {
        if (!this.alive) return;
        this.health = constrain(max(0, this.health - amount), 0, this.maxHealth);
        if (this.health <= 0) this.onDeath();
    }

    // generic death animation, can be overridden
    onDeath() {
        this.alive = false;

        const anim = (shape) => {
            shape.isEffectStarting = true;
            shape.blastTime = random(100,120);
            shape.blastScale = 0.8;
            shape.startBlast();
            spawnSplashEvent(shape.x, shape.y, 700, 10, randomColor());
        };

        let tot_delay = 0;
        anim(this.object.mainObject);
        for (const child of this.object.objectList) {
            setTimeout(() => anim(child.Shape), tot_delay);
            tot_delay += 10;
        }

        const pos = this.getPosition();
        FoundEffect.triggerFoundEffect(pos.x, pos.y, [100,100,100]);
        setTimeout(() => {
            const idx = activeBosses.indexOf(this);
            if (idx !== -1) activeBosses.splice(idx, 1);
        }, 2000);
    }

    drawUI() {
        if (!this.alive) return;
        if (!activeBosses.includes(this)) return;
        const pos = this.getPosition();
        drawBossUI(this.name, this.health, this.maxHealth, pos.x, pos.y - this.UIOffset);
    }

    ownsShape(shape) {
        if (!this.object) return false;
        if (shape === this.object.mainObject) return true;
        for (const child of this.object.objectList)
            if (child.Shape === shape) return true;
        return false;
    }

    forceClear() {
        this.alive = false;

        // Remove all shapes belonging to this boss
        if (this.object) {
            const idx = combinedObjectList.indexOf(this.object);
            if (idx !== -1) combinedObjectList.splice(idx, 1);

            for (const c of this.object.objectList) {
                const i = interactors.indexOf(c.Shape);
                if (i !== -1) interactors.splice(i, 1);
            }

            const mainIdx = interactors.indexOf(this.object.mainObject);
            if (mainIdx !== -1) interactors.splice(mainIdx, 1);
        }

        const bossIdx = activeBosses.indexOf(this);
        if (bossIdx !== -1) activeBosses.splice(bossIdx, 1);
    }
}


// --------------------------------------------------------
// Golagon_P1: inherits from BaseBoss
// --------------------------------------------------------
class Golagon_P1 extends BaseBoss {
    constructor() {
        super(
            "The Rainbow Crystalline Golagon's Minion",
            "./assets/combinedObjects/golagon_phase1.json",
            150, // maxHealth
        );
        gameEvents.OnEvent("bodyHit", (shape) => {
            if (!this.alive) return;
            if (!this.ownsShape(shape)) return;
            this.takeDamage(25);
        });
    }
}


// --------------------------------------------------------
// Golagon_P2: inherits from BaseBoss
// --------------------------------------------------------
class Golagon_P2 extends BaseBoss {
    constructor() {
        super(
            "The Rainbow Crystalline Golagon",
            "./assets/combinedObjects/golagon_phase2.json",
            1000, // maxHealth
        );
        const handleHit = (event, dmg) => {
            gameEvents.OnEvent(event, (shape) => {
                if (!this.alive) return;
                if (!this.ownsShape(shape)) return;
                if (this.minionAlive) return;
                this.takeDamage(dmg);
                if (event === "eyeHit" || event === "mainHit") this.spawnGem();
            });
        };
        this.nextSpawnThreshold = this.maxHealth - 300; 
        this.minionHealthStep = 200;

        handleHit("spikeHit", 25);
        handleHit("bodyHit", 50);
        handleHit("mainHit", 70);
        handleHit("eyeHit", 100);
        const shapeAura = () => {
            if (!this.alive) return;

            const pos = this.getPosition();

            spawnSplashEvent(pos.x,pos.y, 150, 30, randomColor(), [5, 50]);
            setTimeout(shapeAura, 100); 
        }
        shapeAura();
    }
    takeDamage(amount) {
        super.takeDamage(amount);

        while (this.health <= this.nextSpawnThreshold && this.nextSpawnThreshold > 0) {
            this.spawnMinion();
            this.nextSpawnThreshold -= this.minionHealthStep;
        }

        if (this.health <= 0) {
            gameEvents.Fire("bossDefeated", "golagon");
            clearBosses();
            isBonusRound=true;
            bonusRound();
            flashlightEnabled = true;
            this.onDeath();
        }
    }

    spawnMinion() {
        const minion = new Golagon_P1();
        minion.spawn();
    }

    spawnGem() {
        const gem = new RainbowGem();
        gem.spawn();
    }

}

class RainbowGem extends BaseBoss {
    constructor() {
        super(
            "Rainbow Gem",
            "./assets/combinedObjects/rainbow_gem.json",
            2, // maxHealth
            100,
            6,
        );
        gameEvents.OnEvent("rainbowGem", (shape) => {
            if (!this.alive) return;
            if (!this.ownsShape(shape)) return;
            this.takeDamage(1);
        });
        
    }
    onDeath(timedOut = false) {
        
        this.alive = false;
        if (!timedOut) {
            bonusStars.push(new BonusIndicator(mouseX, mouseY, 3));
            Timer += 3;
        }

        super.onDeath();
    }
}


// --------------------------------------------------------
// Heartagon: inherits from BaseBoss
// --------------------------------------------------------

class Heartagon extends BaseBoss {
    constructor() {
        super(
            "The Heartagon",
            "./assets/combinedObjects/heartagon.json",
            500, // maxHealth
            150,
            15,
        );

        this.circlesExist = 0;
        this.golden = false;
        this.clicksTilSpawnShapes = 6;

        gameEvents.OnEvent("bodyHit", (shape) => {
            if (!this.alive) return;
            if (!this.ownsShape(shape)) return;
            if (this.circlesExist > 0) return;
            if (this.clicksTilSpawnShapes === 1) this.spawnCircles();
            this.clicksTilSpawnShapes -= 1;
            this.takeDamage(15);
            bonusStars.push(new BonusIndicator(mouseX, mouseY, 1));
            Timer += 1;
        });

        gameEvents.OnEvent("shapeHit", (shape) => {
            if (!this.alive) return;
            this.circlesExist -= 1;
            if (this.circlesExist === 0) this.toggleMovement(true);
            this.takeDamage(10);
            shape.deleteSelf();
            FoundEffect.triggerFoundEffect(shape.x, shape.y, [255, 255, 255]);
        })

        const shapeAura = () => {
            if (!this.alive) return;

            const pos = this.getPosition();
            let g = random(153, 255)
            let y = 255
            if (this.golden) {
                y = random(102, 255);
                g = 255;
            }

            spawnSplashEvent(pos.x,pos.y, 100, 5, color(255, g, y), [5, 50]);
            setTimeout(shapeAura, 75); 
        }
        shapeAura();
    }

    spawnCircles() {
        this.circlesExist = 15;
        this.clicksTilSpawnShapes = 6;
        this.setPosition(width/2, height/2);
        this.toggleMovement(false);
        const movement = { enabled: true, lerpStrength: 0.1, velocityLimit: 3, switchRate: 30 };
        const opts = {
            movement,
            modifiers: [new JitterModifier({ rate: 0.4 })],
            randomColor: false,
            deleteOnClick: false,
            stroke: { enabled: false },
        };
        for (let i = 0; i < 15; i++) {
            const pos = this.getPosition();
            let g = random(153, 255)
            let y = 255
            if (this.golden) {
                y = random(102, 255);
                g = 255;
            }
            const o = new ClickCircle(pos.x,pos.y, random(25,45), [255, g, y], opts);
            o.events.push("shapeHit");
            o.isCombined = true;
            o.stroke.enabled = true
            interactors.push(o); 
        }
    }

    async transformToGolden() {
        this.golden = true;
        this.name = "Golden Heartagon";
        this.movementSpeed = 15;

        if (this.object) {
            const idx = combinedObjectList.indexOf(this.object);
            if (idx !== -1) combinedObjectList.splice(idx, 1);

            for (const child of this.object.objectList) {
                const i = interactors.indexOf(child.Shape);
                if (i !== -1) interactors.splice(i, 1);
            }
            const mainIdx = interactors.indexOf(this.object.mainObject);
            if (mainIdx !== -1) interactors.splice(mainIdx, 1);
        }

        // Load golden asset
        this.object = await loadCombinedObjectFromFile(
            "./assets/combinedObjects/golden_heartagon.json"
        );

        // Insert new model
        combinedObjectList.push(this.object);

        this.object.mainObject.isCombined = true;
        this.object.mainObject.movement.velocityLimit = this.movementSpeed;

        interactors.push(this.object.mainObject);

        for (const child of this.object.objectList) {
            child.Shape.isCombined = true;
            interactors.push(child.Shape);
        }
    }

    takeDamage(amount) {
        super.takeDamage(amount);
        if (!this.golden && this.health <= this.maxHealth / 2) {
                this.transformToGolden();
            }
        if (this.health <= 0) {
            gameEvents.Fire("bossDefeated", "heartagon");
            clearBosses();
            isBonusRound=true;
            bonusRound();
            flashlightEnabled = true;
            this.onDeath();
        }
    }
}


class Sun extends BaseBoss {
    constructor() {
        super(
            "The Sun",
            "./assets/combinedObjects/sun.json",
            1, // maxHealth
            100,
            15,
        );
        gameEvents.OnEvent("sun", (shape) => {
            if (!this.alive) return;
            if (!this.ownsShape(shape)) return;
            this.takeDamage(1);
        });
        setTimeout(() => {
            if (this.alive) this.onDeath(true);
        }, 10000)
    }
    onDeath(timedOut = false) {
        this.alive = false;
        bonusStars.push(new BonusIndicator(mouseX, mouseY, 3));
        if (!timedOut) Timer += 3;
        super.onDeath();

        super.forceClear();
    }
}


class Flaregon extends BaseBoss {
    constructor() {
        super(
            "The Flaregon",
            "./assets/combinedObjects/flaregon.json",
            1000, // maxHealth
            150,
            15,
        );
        this.formationExists = false;
        this.sunExists = false;
        this.canDamage = true;
        this.nextSpawnThreshold = this.maxHealth - 100; 
        this.sunHealthStep = 125;

        gameEvents.OnEvent("bodyHit", (shape) => {
            if (!this.alive) return;
            if (!this.ownsShape(shape)) return;
            if (!this.canDamage) return;
            if (this.circlesExist > 0) return;
            this.takeDamage(30);
            if (this.health > 100)
                this.spawnFormation(40);
        });
        gameEvents.OnEvent("formationClicked", (shape) => {
            if (!this.alive) return;
            this.takeDamage(-100);
        })
        gameEvents.OnEvent("sun", (shape) => {
            if (!this.alive) return;
            this.canDamage = true;
            if (this.formationExists) {
                triggerBlackHoleEvent(3000, mouseX, mouseY, true);
                let teleport = new TeleportModifier({chance: 0.03})
                this.object.mainObject.modifierList.push(teleport);
            }
            bonusStars.push(new BonusIndicator(mouseX, mouseY, 6));
            Timer += 6;
            setTimeout(() => {this.formationExists = false; this.sunExists = false; this.object.mainObject.modifierList.length = 0}, 3000);
        });
        
        const shapeAura = () => {
            if (!this.alive) return;
            const pos = this.getPosition();

            spawnSplashEvent(pos.x,pos.y, 100, 15, color(178,102, 255), [5, 50]);
            setTimeout(shapeAura, 75); 
        }
        shapeAura();
    }
    spawnSun() {
        if (this.sunExists) return;
        this.canDamage = false;
        this.sunExists = true;
        const sun = new Sun();
        sun.spawn();
    }
    spawnFormation(count) {
        if (this.formationExists) return;
        for (let i = 0; i < count; i++) {
            const movement = { enabled: true, lerpStrength: 0.1, velocityLimit: 3, switchRate: 30 };
            const opts = {
                movement,
                modifiers: [],
                randomColor: false,
                deleteOnClick: false,
                stroke: { enabled: false },
            };
            const pos = this.getPosition();
            const o = new ClickCircle(pos.x,pos.y, random(25,45), [255, random(130,160), random(60,80)], opts);
            o.stroke.enabled = true;
            o.events.push("formationClicked");

            o.modifierList.push(new FigureSkateModifier({
                director: formationDirector,
                joinChance: 1,
                strength: 0.5,
                types: ['figure8','sinWave'],
                minGapFrames: 30,
            }));
            interactors.push(o); 
        }
        this.formationExists = true;
    }

    takeDamage(amount) {
        super.takeDamage(amount);

        while (this.health <= this.nextSpawnThreshold && this.nextSpawnThreshold > 0) {
            if (this.formationExists) this.spawnSun();
            this.nextSpawnThreshold -= this.sunHealthStep;
        }

        if (this.health <= 0) {
            gameEvents.Fire("bossDefeated", "flaregon");
            events.cancel(BLACKHOLE_EVENT, false)
            clearBosses();
            isBonusRound=true;
            bonusRound();
            flashlightEnabled = true;
            this.onDeath();
        }
    }
}

class WaterMinion extends BaseBoss {
    constructor() {
        super(
            "The Water Minion",
            "./assets/combinedObjects/water_minion.json",
            3, // maxHealth
            120,
            10,
        );
        gameEvents.OnEvent("waterMinionHit", (balloonHit) => {
            if (!this.alive) return;
            if (typeof balloonHit === 'string')
                this.takeDamage(1);
            else {
                if (!this.ownsShape(balloonHit)) return;
                this.takeDamage(1);
            }
            
        });
    }
    onDeath(timedOut = false) {
        this.alive = false;
        bonusStars.push(new BonusIndicator(mouseX, mouseY, 1));
        if (!timedOut) Timer += 1;
        super.onDeath();

        super.forceClear();
    }
}

class Balloon extends BaseBoss {
    constructor() {
        const balloonType = random(["blue", "red", "green", "purple"]);
        super(
            "The Balloon (" + balloonType + ")",
            "./assets/combinedObjects/"+balloonType+"_balloon.json",
            2, // maxHealth
            150,
            10,
        );
        gameEvents.OnEvent("balloonHit", (shape) => {
            if (!this.alive) return;
            if (!this.ownsShape(shape)) return;
            this.takeDamage(1);
        })
        this.balloonType = balloonType
    }

    onDeath(timedOut = false) {
        this.alive = false;
        let pos = this.getPosition();
        gameEvents.Fire("waterMinionHit", this.balloonType);

        spawnSplashEvent(pos.x,pos.y, 300, 50, color(102, 178, 255), [3, 10]);

        super.forceClear();
    }
}

class Tsunoctagon extends BaseBoss {
    constructor() {
        super(
            "The Tsunoctagon",
            "./assets/combinedObjects/tsunoctagon.json",
            1000, // maxHealth
            300,
            10,
        );

        this.visible = true;
        this.isHealing = false;
        this.balloonCount = 0; //Clicks required to kill all balloons
        this.nextSpawnThreshold = this.maxHealth - 100; 
        this.minionSpawnStep = 125;
        
        gameEvents.OnEvent("bodyHit", (shape) => {
            if (!this.alive) return;
            if (!this.ownsShape(shape)) return;
            if (!this.visible) return;
            this.takeDamage(30);
        });

        gameEvents.OnEvent("balloonHit", (shape) => {
            if (!this.isHealing) return;
            this.balloonCount -= 1;
            if (this.balloonCount === 0) {
                this.toggleVisibility(true);
                this.isHealing = false;
            }
        })
 
        const shapeAura = () => {
            if (!this.alive) return;
            const pos = this.getPosition();

            spawnSplashEvent(pos.x,pos.y, 100, 15, color(40,100,160), [5, 50]);
            setTimeout(shapeAura, 75); 
        }
        shapeAura();
    }

    toggleVisibility(to) {
        this.visible = to;
        if (!to) {
            this.toggleMovement(false);
            this.setPosition(width/2, height/2);
        }
        else {
            this.toggleMovement(true);
            this.setPosition(width/2, height/2);
        }
        this.object.mainObject.visible = to;
        for (const child of this.object.objectList) {
            child.Shape.visible = to;
        }
    }
    spawnMinions(count, balloonCount) {
        this.toggleVisibility(false);
        for (let i = 0; i < count; i++) {
            const water_minion = new WaterMinion();
            water_minion.spawn();
            
        }
        for (let i = 0; i < balloonCount; i++) {
            const balloon = new Balloon();
            balloon.spawn();
        }
        this.balloonCount = balloonCount * 2;
        this.healPhase();
    }

    healPhase() {
        this.isHealing = true;
        const healing = () => {
            if (!this.alive) return;
            if (!this.isHealing) return;
            const pos = this.getPosition();
            this.takeDamage(-5);
            setTimeout(healing, 300); 
        }
        healing();
    }

    takeDamage(amount) {
        super.takeDamage(amount);

        while (this.health <= this.nextSpawnThreshold && this.nextSpawnThreshold > 0) {
            if (!this.isHealing) this.spawnMinions(12, 3);
            this.nextSpawnThreshold -= this.minionSpawnStep;
        }

        if (this.health <= 0) {
            gameEvents.Fire("bossDefeated", "tsunoctagon");
            events.cancel(BLACKHOLE_EVENT, false)
            clearBosses();
            isBonusRound=true;
            bonusRound();
            flashlightEnabled = true;
            this.onDeath();
        }
    }
}

class Ant extends BaseBoss {
    constructor() {
        super(
            "The Ant",
            "./assets/combinedObjects/ant.json",
            100, // maxHealth
            150,
            10,
        );
        
        gameEvents.OnEvent("antHit", (shape) => {
            if (!this.alive) return;
            this.takeDamage(10);
        })
    }
    onDeath() {
        this.alive = false;

        const anim = (shape) => {
            shape.isEffectStarting = true;
            shape.blastTime = random(30, 60);
            shape.blastScale = 0.5;
            shape.startBlast();
        };

        let tot_delay = 0;
        anim(this.object.mainObject);
        for (const child of this.object.objectList) {
            setTimeout(() => anim(child.Shape), tot_delay);
            tot_delay += 10;
        }

        const pos = this.getPosition();
        FoundEffect.triggerFoundEffect(pos.x, pos.y, [100,100,100]);
        setTimeout(() => {
            const idx = activeBosses.indexOf(this);
            if (idx !== -1) activeBosses.splice(idx, 1);
        }, 2000);
        bonusStars.push(new BonusIndicator(pos.x, pos.y, 1));
        Timer += 1;
    }
}

class HealthOrb extends BaseBoss {
    constructor() {
        super(
            "The Health Orb",
            "./assets/combinedObjects/health_orb.json",
            10, // maxHealth
            150,
            0,
        );
        
        gameEvents.OnEvent("healthOrbHit", (shape) => {
            if (!this.alive) return;
            if (!this.ownsShape(shape)) return;
            this.takeDamage(2);
            this.setPosition(0, 0);
        })
    }
    onDeath() {
        this.alive = false;

        const anim = (shape) => {
            shape.isEffectStarting = true;
            shape.blastTime = random(30, 60);
            shape.blastScale = 0.5;
            shape.startBlast();
        };

        let tot_delay = 0;
        anim(this.object.mainObject);
        for (const child of this.object.objectList) {
            setTimeout(() => anim(child.Shape), tot_delay);
            tot_delay += 10;
        }

        const pos = this.getPosition();
        FoundEffect.triggerFoundEffect(pos.x, pos.y, [100,100,100]);
        setTimeout(() => {
            const idx = activeBosses.indexOf(this);
            if (idx !== -1) activeBosses.splice(idx, 1);
        }, 2000);
        gameEvents.Fire("healthOrbDeath");
    }
}

class PerfectCell extends BaseBoss {
    constructor() {
        super(
            "The Perfect Cell",
            "./assets/combinedObjects/perfect.json",
            100, 
            150,
            10,
        );
        gameEvents.OnEvent("bodyHit", (shape) => {
            if (!this.alive) return;
            this.takeDamage(10);
        })
        gameEvents.OnEvent("healthOrbDeath", () => {
            this.healthOrbs -= 1;
        })
        this.healthOrbs = 0
        this.startAbsorptionPhase();
    }

    startAbsorptionPhase() {
        this.isAbsorbing = true;

        // spawn 5 absorb orbs
        this.healthOrbs = 5;
        for (let i = 0; i < this.healthOrbs; i++) {
            const orb = new HealthOrb();
            orb.spawn();
        }

        // Heal loop
        const heal = () => {
            if (!this.isAbsorbing || !this.alive) return;
            this.takeDamage(-3 * this.healthOrbs);
            setTimeout(heal, 300);
        };
        heal();
    }

}

class Delozier extends BaseBoss {
    constructor() {
        super(
            "The Professor Delozier",
            "./assets/combinedObjects/delozier.json",
            1_000_000_000, // maxHealth
            120,
            10,
        );

        this.visible = true;
        this.isHealing = false;
        this.balloonCount = 0; //Clicks required to kill all balloons
        this.nextSpawnThreshold = this.maxHealth - 100; 
        this.minionSpawnStep = 125;
        
        gameEvents.OnEvent("delozierHit", (shape) => {
            if (!this.alive) return;
            if (!this.ownsShape(shape)) return;
            if (!this.visible) return;
            this.takeDamage(30);
        });
 
        const shapeAura = () => {
            if (!this.alive) return;
            const pos = this.getPosition();

            spawnSplashEvent(pos.x,pos.y, 200, 15, color(255, 255, 255), [3, 30]);
            setTimeout(shapeAura, 75); 
        }
        shapeAura();
        this.antPhase();
    }

    antPhase() {
        this.isHealing = true;
        const healing = () => {
            if (!this.alive) return;
            if (!this.isHealing) return;
            this.takeDamage(random(10_000_000, 40_000_000));
            gameEvents.Fire("antHit");
            if (this.health > 100_000_000) {
                const ant = new Ant();
                ant.spawn();
                setTimeout(() => {
                    let follow = new FollowShape({otherShape: this.object.mainObject, followStrength: 0.5})
                    ant.object.mainObject.modifierList.push(follow);
                }, 1500)
            }
            setTimeout(healing, random(300,600));
        }
        healing();
    }

    takeDamage(amount) {
        super.takeDamage(amount);

        if (this.health <= 0) {
            gameEvents.Fire("bossDefeated", "delozier");
            events.cancel(BLACKHOLE_EVENT, false)
            clearBosses();
            isBonusRound=true;
            bonusRound();
            flashlightEnabled = true;
            this.onDeath();
        }
    }
}

