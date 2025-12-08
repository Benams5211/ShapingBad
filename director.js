class Director {
  constructor(eventManager, gameEventBus) {
    this.events = eventManager;
    this.gameEvents = gameEventBus;

    this.difficultyScore = 0;
    this.lastDecisionTime = 0;
    this.decisionCooldown = 5000;
  }

  update() {
    const now = millis();

    // throttle decision frequency
    if (now - this.lastDecisionTime < this.decisionCooldown) return;
    this.lastDecisionTime = now;

    this.assessPlayer();
    this.makeDecision();
  }

  assessPlayer() {
    const scoreWeight = combo * 2;
    const timeWeight = Timer < 10 ? -20 : (Timer > 30 ? 10 : 0);
    const roundWeight = round * 0.5;

    this.difficultyScore = constrain(scoreWeight + timeWeight + roundWeight, -50, 100);
  }

  makeDecision() {
    if (this.events.isActive('DIRECTOR_EVENT')) return;
    if (wantedObj === null) return; // Simple check for boss round (no wantedObj)


    if (this.difficultyScore > 40) {
      const choice = random(['BLACKHOLE_EVENT', 'ZOMBIE_EVENT', 'BOAT_EVENT']);
      this.triggerEvent(choice);
    }
    // ease up if struggling
    else if (this.difficultyScore < -10) {
      this.spawnBonus();
    }
  }

  triggerEvent(eventType) {
    switch (eventType) {
      case 'BLACKHOLE_EVENT': triggerBlackHoleEvent(4000); break;
      case 'ZOMBIE_EVENT': triggerZombieEvent(8000, 40); break;
      case 'BOAT_EVENT': triggerBoatLines(16000); break;
    }

    // prevent event spam
    this.events.start('DIRECTOR_EVENT', 8000, { onEnd: () => {} });
  }

  spawnBonus() {
    console.log("Director: giving player a breather");
    Timer += 5;  // small bonus time
  }
}


