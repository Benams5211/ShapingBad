// abstract class definition of score indicator
// -----------------------------------------------------------------------------
class ScoreIndicator {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.t0 = millis();
    this.lifetime = 700; // ms
  }

  update() {
    let age = millis() - this.t0;
    this.t = constrain(age / this.lifetime, 0, 1);

    // growth + fade
    this.radius = 6 + (1 - pow(1 - this.t, 3)) * 40;
    this.alpha = 255 * (1 - pow(this.t, 1.6));
  }  
  
  isDead() {
    return millis() - this.t0 > this.lifetime;
  }
}

// ----------------------------------------
// indicating +1 score shape implementation
// ----------------------------------------
class StarScoreIndicator extends ScoreIndicator {
  show() {
    // Only draw the text (no yellow star behind it)
    push();
    translate(this.x, this.y);
    textAlign(CENTER, CENTER);
    fill(255, this.alpha);
    stroke(0, this.alpha * 0.6);
    strokeWeight(2);
    textSize(this.radius * 0.8);

       const isRelax =
      typeof window !== 'undefined' && window.relaxMode === true;

    let middle;

    if (isRelax) {
      // Relax mode: no timer, just a simple bonus text
      middle = "+1";
    } else {
      if (combo < 10) middle = "+3 sec";
      else if (combo < 20) middle = "+4 sec";
      else if (combo < 30) middle = "+5 sec";
      else if (combo < 40) middle = "+6 sec";
      else if (combo < 50) middle = "+7 sec";
    }

    text(middle, 0, 0);

    pop();
  }

  drawStar(x, y, points, outerR, innerR) {
    beginShape();
    for (let i = 0; i < points * 2; i++) {
      let angle = i * PI / points - HALF_PI;
      let r = (i % 2 === 0) ? outerR : innerR;
      let sx = x + cos(angle) * r;
      let sy = y + sin(angle) * r;
      vertex(sx, sy);
    }
    endShape(CLOSE);
  }
}

// -----------------------------------------------------------------------------
// indicating -1 score shape implementation
// -----------------------------------------------------------------------------
class CircleBurstScoreIndicator extends ScoreIndicator {
  show() {
    push();
    translate(this.x, this.y);

    // circle burst
    noStroke();
    fill(255, 50, 50, this.alpha);   // red fill
    ellipse(0, 0, this.radius * 2);

    stroke(255, this.alpha * 0.8);
    strokeWeight(2);
    noFill();
    ellipse(0, 0, this.radius * 2);

    pop();

    // "-1" in the middle
    push();
    translate(this.x, this.y);
    textAlign(CENTER, CENTER);
    fill(255, this.alpha);
    stroke(0, this.alpha * 0.6);
    strokeWeight(2);
    textSize(this.radius * 0.8);
       const isRelax =
      typeof window !== 'undefined' && window.relaxMode === true;

    text(isRelax ? "-1" : "-5 sec", 0, 0);

    pop();
  }
}

// -----------------------------------------------------------------------------
// indicating boss kill implementation
// -----------------------------------------------------------------------------
class BossKillIndicator extends ScoreIndicator {
  show() {
    push();
    translate(this.x, this.y);

    // circle burst
    noStroke();
    fill(50, 50, 255, this.alpha);   // blue fill
    ellipse(0, 0, this.radius * 2);

    stroke(255, this.alpha * 0.8);
    strokeWeight(2);
    noFill();
    ellipse(0, 0, this.radius * 2);

    pop();

    // "-1" in the middle
    push();
    translate(this.x, this.y);
    textAlign(CENTER, CENTER);
    fill(255, this.alpha);
    stroke(0, this.alpha * 0.6);
    strokeWeight(2);
    textSize(this.radius * 0.8);
    text("Wow!", 0, 0);
    pop();
  }

}

// -----------------------------------------------------------------------------
// indicating +1 timer bonus
// ---------------------------------------------------------------
class BonusIndicator extends ScoreIndicator {
  constructor(x, y, timeAdded = 1) {
    super(x, y);
    this.timeAdded = timeAdded;
  }
  show() { 
    push();
    translate(this.x, this.y);
    
    // glowing star
    noStroke();
    fill(255, 200, 0, this.alpha);
    this.drawStar(0, 0, 5, this.radius, this.inner);
    
    // outline
    stroke(255, this.alpha * 0.8);
    strokeWeight(2);
    noFill();
    this.drawStar(0, 0, 5, this.radius, this.inner);

    pop();

    // "+1" in the middle
    push();
    translate(this.x, this.y);
    textAlign(CENTER, CENTER);
    fill(255, this.alpha);
    stroke(0, this.alpha * 0.6);
    strokeWeight(2);
    textSize(this.radius * 0.8);

      const isRelax =
      typeof window !== 'undefined' && window.relaxMode === true;

    let middle;
    if (isRelax) {
      // Relax mode: no seconds text, just a simple bonus
      middle = "+1";
    } else {
      middle = "+ " + this.timeAdded + " sec";
    }

    text(middle, 0, 0);
    pop();
  }


  drawStar(x, y, points, outerR, innerR) {
    beginShape();
    for (let i = 0; i < points * 2; i++) {
      let angle = i * PI / points - HALF_PI;
      let r = (i % 2 === 0) ? outerR : innerR;
      let sx = x + cos(angle) * r;
      let sy = y + sin(angle) * r;
      vertex(sx, sy);
    }
    endShape(CLOSE);
  }

}

