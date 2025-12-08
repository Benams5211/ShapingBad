// -----------------------------------------------------------------------------
// event constants
// -----------------------------------------------------------------------------
const BOAT_EVENT = 'screen.BoatLine';
const WARNING_EVENT = 'screen.Warning';
const WARNING_BOAT_EVENT = 'screen.Warning_Boatline';
const WIN_EVENT = 'game.Win';
const BLACKHOLE_EVENT = 'screen.BlackHole';
const SPLASH_EVENT = 'screen.Splash';
const ZOMBIE_EVENT = 'screen.Zombie';
const CURTAINS_EVENT = 'screen.Curtains';
const PARTY_EVENT = 'screen.Party';
const MIMIC_EVENT = 'screen.Mimic';
const N1_FORMATION_EVENT = 'screen.N1Formation';
const EZ_FORMATION_EVENT = 'screen.EZFormation';
const LOL_FORMATION_EVENT = 'screen.LOLFormation';

// 🔒 global flag: when true, ignore player clicks after win
window.clickLocked = false;

// event list in case we want to make something do a random event empty rn
const EVENT_LIST = [BOAT_EVENT, BLACKHOLE_EVENT, ZOMBIE_EVENT, PARTY_EVENT];

class EventListener {
    constructor() {
        this.listeners = {}; // { eventName : [callbacks]}
    }
    // Use this to setup an event listener
    // eventName -> name to use in the Fire() event
    // callback -> function to call when event is Fired using Fire()
    OnEvent(eventName, callback) {
        if (!this.listeners[eventName]) this.listeners[eventName] = [];
        this.listeners[eventName].push(callback); // eventName : [callbacks]
        return () => this.Disconnect(eventName, callback); // return the function used to cancel the event
    }

    // Returned in OnEvent(), used to cancel or "unlisten" to the event
    Disconnect(eventName, callback) {
        const list = this.listeners[eventName];
        if (!list) return;
        const index = list.indexOf(callback);
        if (index !== -1) list.splice(index, 1);
    }

    // Cycle through the list of callbacks attached to a single event name,
    // and call them all with the given args
    Fire(eventName, ...args) {
        const list = this.listeners[eventName];
        if (!list) return;
        for (const callback of list) callback(...args);
    }

    // Clear all events (cleanup)
    Clear(eventName)  {
        if (eventName) delete this.listeners[eventName];
        else this.listeners = {};
    }
}


class EventManager {
  constructor() {
    this.active = {};
  }

  start(name, durationMs, { onStart = null, onUpdate = null, onEnd = null } = {}) {
    // gets current time
    const now = millis();
    // checks if event already exists
    const existed = !!this.active[name];
    // creates the event and establishes what to do when it ends
    this.active[name] = { endAt: now + durationMs, onUpdate, onEnd };
    // resets it if it already existed
    if (!existed && typeof onStart === "function") onStart();
  }

  // continuously called in draw()
  // checks to see if an events timer has run out
  // if it has it will call the events onEnd function if it has been declared
  // basically just a complicated cleaner function
  update() {
    const now = millis();
    // this.active is just a dictionary of all the events currently inside of the EventManager
    // for loop iterates through all events
    for (const name in this.active) {
      // if it finds an event it sets tempEvent equal too it to compair it
      const tempEvent = this.active[name];
      const timeLeft = Math.max(0, tempEvent.endAt - now);

      if (timeLeft > 0 && typeof tempEvent.onUpdate === "function") {
        tempEvent.onUpdate(timeLeft);
      }

      // checks if the selected event's expiration time has come
      if (now >= tempEvent.endAt) {
        // call the events onEnd function
        const cb = tempEvent.onEnd;
        delete this.active[name];
        // this is so we dont explode
        if (typeof cb === "function") cb();
      }
    }
  }

  renderFront() {
    const now = millis();
    for (const name in this.active) {
      const evt = this.active[name];
      const timeLeft = Math.max(0, evt.endAt - now);
      if (typeof evt.onUpdate === "function") {
        evt.onUpdate(timeLeft, true); // true = front render pass
      }
    }
  }

  isActive(name) {
    return !!this.active[name];
  }

  timeLeft(name) {
    // assigns tempEvent to event
    const tempEvent = this.active[name];
    // if event doesnt exist exit
    if (!tempEvent) return 0;
    // return ms till event ends via taking the time that the event ends minus the current time
    return Math.max(0, tempEvent.endAt - millis());
  }

  cancel(name, runOnEnd = false) {
    // assigns tempEvent to event
    const tempEvent = this.active[name];
    // if event doesnt exist exit
    if (!tempEvent) return;
    // if event does exist delete event
    delete this.active[name];
    // this is so we dont explode
    if (runOnEnd && typeof tempEvent.onEnd === "function") tempEvent.onEnd();
  }
}

// global dictionary of events
const events = new EventManager();
const gameEvents = new EventListener();

// -----------------------------------------------------------------------------
// Important game events
// -----------------------------------------------------------------------------

function setupGameEvents() {
  // Fires in FinisherSequence after the time is played through
  gameEvents.OnEvent("showGameOverScreen", () => {
    // debounce (simple fix for double calls for now, not sure what's happening)
    if (shownGameOverScreen) return;
    shownGameOverScreen = true;
    gameState = "over";
    gameOver = true;

    finalRoundPopupShown = true;
    finalRoundPopup.render();
    gameEvents.Clear();
  })
  gameEvents.OnEvent("gameOver", (showFinisher) => {
    //delay ending screen show
    // debounce (simple fix for double calls for now, not sure what's happening)
    if (gameOverTriggered) return;
    gameOverTriggered = true;
    //interactors.length = 0;
    combinedObjectList.length = 0;
    if (showFinisher) {
      blackout = false;
      const finisher = new FinisherSequence();
      finisher.playRandom();
    }
  })
}

function triggerBlackHoleEvent(ms = 3000, atX = random(width), atY = random(height), deleteOnEnd = false) {
    if(relaxMode) {return;}
  const freezeForever = new FreezeModifier({ chance: 1, duration: 1 }); // freeze the hole

  // Save original states to restore later
  const originalStates = interactors.map(o => ({
    movement: { ...o.movement },
    modifierList: [...o.modifierList],
    state: { ...o.state },
    visible: o.visible,
  }));

  const bhOpts = {
    movement: { enabled: false },
    modifiers: [freezeForever],
    randomColor: false,
    deleteOnClick: false,
    stroke: { enabled: false },
    isWanted: true,
  };
  const BlackHole = new ClickCircle(atX, atY, 0, [0,10,0], bhOpts);

  // jitter used during pull phase
  const jitter = new JitterModifier({ rate: 0.1 });
  let isPulling = false;

  events.start(BLACKHOLE_EVENT, ms, {
    onStart: () => {
      interactors.push(BlackHole);
    },
    onUpdate: (timeLeft) => {
      // Calculate progress 0 -> 1 to use in the different stages of the blackhole event
      const progress = 1 - (timeLeft / ms);
      const bh = BlackHole;
      // During the first 10% of the event, grow size 0->350
      if (progress < 0.1) {
        // grow r: 0 -> 175 over first 10%
        bh.r = lerp(0, 175, progress / 0.1);
      // During the next 40% of the event, force all shapes to follow the BlackHole
      // and build up the jitter rate
      } else if (progress < 0.5) {
         // Only do this once (since this is being called per-frame) 
        if (!isPulling) {
          for (const o of interactors) {
            if (o === bh) continue;
            if (o.isCombined) continue;
            o.modifierList.length = 0;
            o.state = {};
            o.movement.velocityLimit = 20;
            o.modifierList.push(new FollowShape({ otherShape: bh, followStrength: 1 }));
            o.modifierList.push(new JitterModifier({ rate: 3 }));
          }
          isPulling = true;
          bh.modifierList.push(jitter);
        }
        jitter.rate = lerp(jitter.rate, 1, (progress - 0.1) / 0.4);
      // During the next 30% of the event, keep the black hole's size constant
      } else if (progress < 0.8) {
        bh.r = 175;
      } else {
        // Finally, last 20% of the event:
        // Hide all shapes except black hole
        // Shrink the black hole's size back down to 0
        if (isPulling) {
          bh.modifierList.length = 0;
          isPulling = false;
        }
        bh.r = lerp(175, 0, (progress - 0.8) / 0.2);
        // Hide other objs during shrink phase
        for (const o of interactors) {
          if (o.isCombined) continue;
          if (o !== bh) o.visible = false;
        }
      }
    },
    onEnd: () => {
      // remove black hole
      const idx = interactors.indexOf(BlackHole);
      if (idx !== -1) interactors.splice(idx, 1);

      // restore originals
      interactors.forEach((o, i) => {
        const saved = originalStates[i];
        if (!saved) return;
        if (o.isCombined) return;
        if (deleteOnEnd) o.deleteSelf();
        o.movement = { ...saved.movement };
        o.modifierList = [...saved.modifierList];
        o.state = { ...saved.state };
        o.visible = saved.visible;
      });

      // Explosion animation on blackhole event finish
      spawnSplashEvent(BlackHole.x, BlackHole.y, 1000, 300, color(0,0,0));
    }
  });
}

function triggerN1FormationEvent(totalDuration = 6000) {
    if(relaxMode) {return;}
  if (formationDirector.active) formationDirector.cancel();

  events.start(N1_FORMATION_EVENT, totalDuration, {
    onStart: () => {
      console.log("N1_FORMATION_EVENT started");
      formationDirector.formationLocked = true;

      if (formationDirector.active) formationDirector.cancel();
      tauntDirector.start(interactors, {
        type: 'letterN',
        center: { x: width / 2, y: height / 2 },
        radius: Math.min(width, height) * 0.3,
        holdFrames: 180,
        easeIn: 20,
        easeOut: 20,
        useAll: true
      });

      setTimeout(() => {
        if (tauntDirector.active) tauntDirector.cancel();
        tauntDirector.start(interactors, {
          type: 'number1',
          center: { x: width / 2, y: height / 2 },
          radius: Math.min(width, height) * 0.3,
          holdFrames: 180,
          easeIn: 20,
          easeOut: 20,
          useAll: true
        });
      }, totalDuration / 2);
    },

    onEnd: () => {
      console.log("N1_FORMATION_EVENT ended");
      tauntDirector.cancel();
      formationDirector.formationLocked = false;
    }
  });
}


function triggerLOLFormationEvent(totalDuration = 9000) {
    if(relaxMode) {return;}
  if (formationDirector.active) formationDirector.cancel();

  events.start(LOL_FORMATION_EVENT, totalDuration, {
    onStart: () => {
      console.log("LOL_FORMATION_EVENT started");
      formationDirector.formationLocked = true;

      const center = { x: width / 2, y: height / 2 };
      const radius = Math.min(width, height) * 0.25;


      formationDirector.cancel();
      tauntDirector.start(interactors, {
        type: 'letterL',
        center,
        radius,
        holdFrames: 180,
        easeIn: 20,
        easeOut: 20,
        useAll: true
      });

      setTimeout(() => {
        tauntDirector.cancel();
        tauntDirector.start(interactors, {
          type: 'circle',
          center,
          radius,
          holdFrames: 180,
          easeIn: 20,
          easeOut: 20,
          useAll: true
        });
      }, totalDuration / 3);

      setTimeout(() => {
        tauntDirector.cancel();
        tauntDirector.start(interactors, {
          type: 'letterL',
          center,
          radius,
          holdFrames: 180,
          easeIn: 20,
          easeOut: 20,
          useAll: true
        });
      }, (2 * totalDuration) / 3);
    },

    onEnd: () => {
      console.log("LOL_FORMATION_EVENT ended");
      tauntDirector.cancel();
      formationDirector.formationLocked = false;
    }
  });
}


function triggerEZFormationEvent(totalDuration = 6000) {
    if(relaxMode) {return;}
  if (formationDirector.active) formationDirector.cancel();
  events.start(EZ_FORMATION_EVENT, totalDuration, {
    onStart: () => {
      console.log("EZ_FORMATION_EVENT started");
      formationDirector.formationLocked = true;
      
      if (formationDirector.active) formationDirector.cancel();
      tauntDirector.start(interactors, {
        type: 'letterE',
        center: { x: width / 2, y: height / 2 },
        radius: Math.min(width, height) * 0.3,
        holdFrames: 180,
        easeIn: 20,
        easeOut: 20,
        useAll: true
      });

      setTimeout(() => {
        if (tauntDirector.active) tauntDirector.cancel();
        tauntDirector.start(interactors, {
          type: 'letterZ',
          center: { x: width / 2, y: height / 2 },
          radius: Math.min(width, height) * 0.3,
          holdFrames: 180,
          easeIn: 20,
          easeOut: 20,
          useAll: true
        });
      }, totalDuration / 2);
    },

    onEnd: () => {
      console.log("EZ_FORMATION_EVENT ended");
      tauntDirector.cancel();
      formationDirector.formationLocked = false;
    }
  });
}

function triggerPartyEvent(duration = 6000) {
    if(relaxMode) {return;}
  const affected = [];

  events.start(PARTY_EVENT, duration, {
    onStart: () => {
      console.log("PARTY_EVENT started!");

      for (const obj of interactors) {
        // skip wanted object so it behaves normally
        if (obj.isWanted) continue;
        if (!obj.movement) continue;

        affected.push({
          obj,
          original: { ...obj.movement },
        });

        // temporarily disable their normal smooth movement
        obj.movement.enabled = false;

        // give strong random velocity
        obj.vx = random(-12, 12);
        obj.vy = random(-12, 12);
      }
    },

    onUpdate: () => {
      for (const obj of interactors) {
        if (!obj.enabled) continue;
        if (obj.isWanted) continue;

        // move by velocity
        obj.x += obj.vx;
        obj.y += obj.vy;

        // bounce off edges
        if (obj.x < 0 || obj.x > width) obj.vx *= -1;
        if (obj.y < 0 || obj.y > height) obj.vy *= -1;

        // small random velocity changes for chaos
        if (random() < 0.1) {
          obj.vx += random(-2, 2);
          obj.vy += random(-2, 2);
        }
      }
    },

    onEnd: () => {
      console.log("PARTY_EVENT ended!");
      // restore normal movement for affected shapes
      for (const { obj, original } of affected) {
        obj.movement = { ...original };
      }
    }
  });
}

function triggerZombieEvent(ms=10000, zombieCount = 50) {
    if(relaxMode) {return;}
  let zombies = [];
  const ZOMBIE_COL = [0, 210, 0];

  function pickNewTargetFor(zombie) {
    // Filter out: Already infected shapes and wanted objects
    let candidates = interactors.filter(s => !zombies.includes(s) && !s.isWanted);
    // Pick the actual target from the list of candidates
    if (candidates.length > 0) {
      let newTarget = random(candidates);
      // Find the zombie's FollowShape modifier, and change to a new target
      let follow = zombie.modifierList.find(m => m instanceof FollowShape);
      if (follow) {
        follow.otherShape = newTarget;
      }
      zombie.targetShape = newTarget; // Store the target
    } else {
      zombie.targetShape = null;
    }
  }
  
  events.start('ZOMBIE', ms, {
    onStart: () => {      
      for (let i = 0; i < zombieCount; i++) {
        let movementConfig = {
          enabled           : true,
          lerpStrength      : 0.01,
          velocityLimit     : 0,
          switchRate        : random(60),
        }
        // translated: Shape(..., "square", ...) -> ClickRect with same size semantics
        const s = random(10, 15);
        let z = new ClickRect(
          random(width), random(height),
          s, s,                    // square w,h
          ZOMBIE_COL,              // CHANGED: spawn zombies purple (was [0,210,0])
          2,                       // corner radius
          {                        // opts mapped to InteractiveObject
            movement: movementConfig,
            modifiers: [],
            randomColor: false,
            deleteOnClick: false,
            stroke: { enabled: false }
          }
        );

        z.modifierList.push(new FollowShape({ otherShape: null, followStrength: random(0.005,0.01) }));
        zombies.push(z);
        pickNewTargetFor(z); // Give each zombie its own target
      }
      interactors.push(...zombies); // Merge shapes list with zombies list so they get rendered
      
    },
    onUpdate: (timeLeft) => {
      // Cancel event prematurely if every shape has been infected (except desired shape)
      if (zombies.length == interactors.length-1)
        events.cancel('ZOMBIE', true)
      
      for (let z of zombies) {
        const tgt = z.targetShape;
        if (!tgt) continue;

        // Check if zombie is within the target's bounds
        let d = dist(z.x, z.y, tgt.x, tgt.y);
        // IS WITHIN BOUNDS:
        // translated: size/2 checks -> use InteractiveObject bounds radius
        const rz = (typeof z.getBoundsRadius === 'function') ? z.getBoundsRadius() : 10;
        const rt = (typeof tgt.getBoundsRadius === 'function') ? tgt.getBoundsRadius() : 10;
        if (d < rz + rt) {

          // NEW: mirror old render-side color swap by directly tinting infected
          if (Array.isArray(tgt.fillCol)) tgt.fillCol = [120, 0, 120];

          // If the target isn't a zombie, push it to the zombies list and pick a target for it
          if (!zombies.includes(tgt)) {
            tgt.modifierList.push(new FollowShape({ otherShape: null, followStrength: random(0.01, 0.1) }));
            zombies.push(tgt);
            pickNewTargetFor(tgt);
          }
          
          // Retarget the zombie that infected the tgt
          pickNewTargetFor(z);

          // Retarget any other zombies that were also chasing this shape
          for (let other of zombies) {
            if (other !== z && other.targetShape === tgt) {
              pickNewTargetFor(other);
            }
          }
        }
      }
    },
    
    onEnd: () => {
      // Remove all zombies from screen by removing them from the shapes list
      interactors = interactors.filter(s => !zombies.includes(s));
    }
  });
}


function spawnSplashEvent(atX = 0, atY = 0, ms = 500, itemCount = 100, col = color(0,0,0), sizeRange = [5, 10]) {
  let splashObjs = [];

  events.start(Math.random()*1000, ms, {
    onStart: () => {
      for (let i = 0; i < itemCount; i++) {
        const movement = { enabled: true, lerpStrength: 0.1, velocityLimit: 50, switchRate: 1000 };
        const opts = {
          movement,
          modifiers: [new JitterModifier({ rate: 0.4 })],
          randomColor: false,
          deleteOnClick: false,
          stroke: { enabled: false },
        };

        const s = random(sizeRange[0], sizeRange[1]);
        const o = new ClickRect(atX, atY, s, s, [red(col), green(col), blue(col)], 2, opts);
        //const o = new ClickCircle(atX, atY, s, [red(col), green(col), blue(col)], opts);
        //interactors.push(o);
        //splashObjs.push(o);
        o.isCombined = true;
        interactors.unshift(o);
        splashObjs.unshift(o);
      }
    },
    onEnd: () => {
      interactors = interactors.filter(o => !splashObjs.includes(o));
    }
  });
}

function triggerCurtains(ms = 1500) {
  const pauseDuration = 300;
  const halfDuration = ms / 2;
  const totalDuration = ms + pauseDuration;

  let curtainProgress = 0;
  let phase = "closing";
  let pauseStartTime = null;

  events.start(CURTAINS_EVENT, totalDuration, {
    onStart: () => console.log("Curtains start"),

    onUpdate: (timeLeft, isFrontPass) => {
      const elapsed = totalDuration - timeLeft;

      if (phase === "closing") {
        const t = constrain(elapsed / halfDuration, 0, 1);
        curtainProgress = t;
        if (t >= 1) {
          phase = "pause";
          pauseStartTime = millis();
        }
      } else if (phase === "pause") {
        if (millis() - pauseStartTime >= pauseDuration) {
          phase = "opening";
        }
      } else if (phase === "opening") {
        const t = constrain(
          (elapsed - halfDuration - pauseDuration) / halfDuration,
          0,
          1
        );
        curtainProgress = 1 - t;
      }

      if (!isFrontPass) return;

      const w = (width / 2) * curtainProgress;
      push();
      noStroke();
      fill(0, 0, 0);
      rect(0, 0, w + 10, height); // left curtain
      rect(width - w, 0, w + 10, height); // right curtain
      pop();
    },

    onEnd: () => console.log("Curtains end"),
  });
}

function triggerMimicEvent(duration = 8000, cloneCount = 8) {
    if(relaxMode) {return;}
  const clones = [];

  events.start(MIMIC_EVENT, duration, {
    onStart: () => {
      console.log("MIMIC_EVENT started");

      if (!wantedObj) {
        console.warn("No wantedObj to clone");
        return;
      }

      const col = Array.isArray(wantedObj.fillCol) ? [...wantedObj.fillCol] : [255,255,255];

      const baseMove = wantedObj.movement ? { ...wantedObj.movement } : {};
      const mimicMovement = {
        enabled: true,
        lerpStrength: typeof baseMove.lerpStrength === 'number' ? baseMove.lerpStrength : 0.12,
        velocityLimit: Math.max( (baseMove.velocityLimit ?? 2) * 2.0, 3.5),
        switchRate: Math.max(10, (baseMove.switchRate ?? 60) / 2)
      };

      for (let i = 0; i < cloneCount; i++) {

        const pad = 40;
        const cx = random(pad, width - pad);
        const topPad = (windowHeight * 0.1) + pad;
        const cy = random(topPad, height - pad);

        const opts = {
          movement: mimicMovement,
          randomColor: false,
          outline: true,
          stroke: { enabled: true, weight: 6, color: [255, 255, 255] },
          deleteOnClick: true,
          wanted: false
        };

        let mimic = null;

        if (wantedObj instanceof ClickCircle) {
          const r = Math.max(8, wantedObj.r || 30);
          mimic = new ClickCircle(cx, cy, r, col, opts);
        } else if (wantedObj instanceof ClickRect) {
          const w = Math.max(12, wantedObj.w || 45);
          const h = Math.max(12, wantedObj.h || 45);
          const rad = wantedObj.radius || 8;
          mimic = new ClickRect(cx, cy, w, h, col, rad, opts);
        } else if (wantedObj instanceof ClickTri) {
          const s = Math.max(20, wantedObj.size || 60);
          const triOpts = { ...opts, angle: (typeof wantedObj.angle === 'number' ? wantedObj.angle : 0) };
          mimic = new ClickTri(cx, cy, s, col, triOpts);
        } else {
          continue;
        }

        // make sure they’re enabled and move immediately
        mimic.enabled = true;
        mimic.isMimic = true;
        mimic.vx = random(-mimicMovement.velocityLimit, mimicMovement.velocityLimit);
        mimic.vy = random(-mimicMovement.velocityLimit, mimicMovement.velocityLimit);

        clones.push(mimic);
        interactors.push(mimic);
      }
    },
    onEnd: () => {
      console.log("MIMIC_EVENT ended");
      // remove only the clones this event made
      for (const c of clones) {
        const idx = interactors.indexOf(c);
        if (idx !== -1) interactors.splice(idx, 1);
      }
    }
  });
}

function triggerWarning(ms = 2000) {
    if(relaxMode) {return;}
  events.start(WARNING_EVENT, ms, {
    onStart: () => {
      console.log("WARNING_EVENT started");
    },
    onEnd: () => {
      console.log("WARNING_EVENT ended");
    }
  });
}

function triggerBoatLines(ms = 10000) {
if(relaxMode) {return;}
  const laneHeights    = [height * 0.17, height * 0.50, height * 0.83];
  const laneDirections = [+1, -1, +1];

  const boatSpeedPxPerSec = 260;
  const boatWidth  = 250;
  const boatHeight = height / 6.5;
  const boatGap    = 60;
  const boatSpacing = boatWidth + boatGap;

  const eventDurationSec = ms / 1000;
  const crossDistancePx  = width + 2 * boatWidth;
  const crossingTimeSec  = crossDistancePx / boatSpeedPxPerSec;
  const safetyFactor     = 0.9;
  const availableTimeSec = Math.max(0, eventDurationSec * safetyFactor - crossingTimeSec);
  const boatsPerLane     = Math.max(1, Math.floor(availableTimeSec * boatSpeedPxPerSec / boatSpacing) + 1);


  let lanes = [];
  events.start(BOAT_EVENT, ms, {
    onStart: () => {
      console.log("Boat Event started");

      lanes = [];
      for (let i = 0; i < laneHeights.length; i++) {
        const y   = laneHeights[i];
        const dir = laneDirections[i];
        const boats = [];

        // start just off-screen on the entering side
        const entryX = dir > 0 ? -boatWidth : width + boatWidth;
        let cursorX  = entryX;

        for (let k = 0; k < boatsPerLane; k++) {
          boats.push({ x: cursorX, y, w: boatWidth, h: boatHeight, dir });
          cursorX -= dir * boatSpacing;
        }

        lanes.push({
          y,
          dir,
          boats,
          speedPxPerSec: boatSpeedPxPerSec,
          spacing: boatSpacing,
          boatW: boatWidth,
          boatH: boatHeight
        });
      }
    },

    onUpdate: () => {

      // visuals
      push();
      noStroke();
      fill(255, 255, 255, 230);
      rectMode(CENTER);

      const dt = deltaTime / 1000;
      for (const lane of lanes) {
        const vx = lane.speedPxPerSec * lane.dir;

        for (let i = 0; i < lane.boats.length; i++) {
          const b = lane.boats[i];
          b.x += vx * dt;
          rect(b.x, b.y, b.w, b.h, 6);
        }
        for (let i = lane.boats.length - 1; i >= 0; i--) {
          const b = lane.boats[i];
          const offRight = (b.dir > 0) && (b.x - b.w / 2 > width + 8);
          const offLeft  = (b.dir < 0) && (b.x + b.w / 2 < -8);
          if (offRight || offLeft) lane.boats.splice(i, 1);
        }
      }
      pop();
    },

    onEnd: () => {
      console.log("Boat Event ended");
      lanes = []; // release references
    }
  });
}

function updateAndRenderWarning() {
    if(relaxMode) {return;}
  // message could be changed with parameters but im lazy
  const msg = "WARNING INCOMING ";
  // px per second
  const speed = 400;
  // verticle offset
  const y = 40;

  textSize(32);
  textAlign(LEFT, CENTER);
  fill(255, 50, 50);

  // use millis to shift position
  const t = millis() * 0.001; // seconds
  const shift = (t * speed) % textWidth(msg);

  // tile text across the whole screen instead of making a really long message which wouldve been way easier why didnt I think of that before I wrote this
  for (let x = -shift; x < width; x += textWidth(msg)) {
    text(msg, x, y);
  }
}

function triggerWarningBoatLines(warningMs = 2000, boatLinesMs = 15000) {
    if(relaxMode) {return;}
  events.start(WARNING_BOAT_EVENT, warningMs, {
    onStart: () => {
      console.log("WARNING_BOAT_EVENT started");
      triggerWarning(warningMs);
    },
    onEnd: () => {
      triggerBoatLines(boatLinesMs);
      console.log("WARNING_BOAT_EVENT ended");
    }
  });
}

//helper

function boundsRadius(o) {
  // Circle-like
  if (o && typeof o.r === "number") return Math.max(0, o.r);

  // Rect-like
  const w = o?.w ?? o?.width ?? 0;
  const h = o?.h ?? o?.height ?? 0;
  if (w || h) {
    // half-diagonal so the circle fully covers the rect corners
    return 0.5 * Math.hypot(w, h);
  }

  // Fallback if unknown shape — small hit radius
  return 10;
}


