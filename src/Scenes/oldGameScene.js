// src/Scenes/GameScene.js
class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  preload() {
    this.load.image("background", "assets/background.png");
    this.load.image("platform", "assets/fishnet.png");
    this.load.image("playerFish", "assets/playerFish.png");

    this.load.image("fish1", "assets/fish1.png");
    this.load.image("fish2", "assets/fish2.png");
    this.load.image("fish3", "assets/fish3.png");
    this.load.image("fish4", "assets/fish4.png");
    this.load.image("fish5", "assets/fish5.png");
    this.load.image("fish6", "assets/fish6.png");
  }

  create() {
    const { width, height } = this.scale;

    this.add.image(0, 0, "background").setOrigin(0, 0);

    // platform
    this.platform = this.physics.add
      .image(width / 2, height - 25, "platform")
      .setImmovable(true)
      .setCollideWorldBounds(true)
      .setScale(0.5);
    this.platform.body.allowGravity = false;

    const baseW = this.platform.displayWidth;
    const baseH = this.platform.displayHeight;

    const hitWidth  = baseW * 1.9; 
    const hitHeight = baseH; 

    this.platform.body.setSize(hitWidth, hitHeight, true);

    this.platform.body.checkCollision.up = true;
    this.platform.body.checkCollision.down = false;
    this.platform.body.checkCollision.left = false;
    this.platform.body.checkCollision.right = false;


    // player fish
    this.player = this.physics.add
      .image(width / 2, height / 2, "playerFish")
      .setCollideWorldBounds(true)
      .setBounce(1);

    this.player.sizeLevel = 1;
    this.player.maxSizeLevel = 6;
    this.player.eatenInLevel = 0;
    this.playerHealth = 5;
    this.player.invincible = false;
    this.score = 0;

    this.player.body.onWorldBounds = true;
    this.physics.world.on(
      "worldbounds",
      (body, up, down, left, right) => {
          if (body.gameObject !== this.player) return;
          if (down) {
            this.scene.start("GameOverScene", {
              result: "lose",
              score: this.score
            });
          }

      },
      this
    );

    this._updatePlayerScale();

    // initial speed
    this.player.setVelocity(150, -150);  //right, up
    this.player.body.maxVelocity.set(150, 150);

    // controls
    this.keys = this.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      d: Phaser.Input.Keyboard.KeyCodes.D,
    });

    // npc fish
    this.fishGroup = this.physics.add.group({ allowGravity: false });

    // controllable bounce off platform
    this.physics.add.collider(
      this.player,
      this.platform,
      this.handlePlayerPlatform,
      null,
      this
    );

    // overlaps
    this.physics.add.overlap(
      this.player,
      this.fishGroup,
      this.handlePlayerVsFish,
      null,
      this
    );

    //this.physics.add.overlap(
    //  this.fishGroup,
    //  this.fishGroup,
      //this.handleFishVsFish,
    //  null,
    //  this
    //);

    // spawn fish
    this.spawnTimer = this.time.addEvent({
      delay: 1200,
      callback: this.spawnFish,
      callbackScope: this,
      loop: true,
    });

    // grow requirement level: eatfishcount
    this.levelRequirements = {
      1: 1,
      2: 1,
      3: 1,
      4: 2,
      5: 2,
      6: 2
    };

    // HUD
    const style = { fontSize: "18px", fill: "#ffffff" };
    this.healthText = this.add.text(16, 16, "", style);
    this.sizeText = this.add.text(16, 40, "", style);
    this.scoreText = this.add.text(16, 64, "", style);
    this._refreshHUD();
  }

  update() {
    // platform
    const speed = 280;
    this.platform.setVelocityX(0);

    const leftPressed = this.keys.left.isDown || this.keys.a.isDown;
    const rightPressed = this.keys.right.isDown || this.keys.d.isDown;

    if (leftPressed) {
      this.platform.setVelocityX(-speed);
    } else if (rightPressed) {
      this.platform.setVelocityX(speed);
    }

    // set npc facing based on direction
    this.fishGroup.getChildren().forEach((fish) => {
      // wrap
      if (fish.x < -50 && fish.body.velocity.x < 0) {
        fish.x = this.scale.width + 50;
      } else if (fish.x > this.scale.width + 50 && fish.body.velocity.x > 0) {
        fish.x = -50;
      }

      // face direction
      fish.setFlipX(fish.body.velocity.x < 0);
    });
  }

  _updatePlayerScale() {
    const baseScale = 0.6;
    const step = 0.2;
    this.player.setScale(baseScale + step * (this.player.sizeLevel - 1));
    const r = (this.player.width * this.player.scaleX) / 2;
    this.player.body.setCircle(r);
  }

  _refreshHUD() {
      this.healthText.setText("Health: " + this.playerHealth);
      this.sizeText.setText("Size: " + this.player.sizeLevel);
      if (this.scoreText) {
        this.scoreText.setText("Score: " + this.score);
  }
}
  spawnFish() {
    const { width, height } = this.scale;

    const minY = 80;
    const maxY = height - 140;
    const y = Phaser.Math.Between(minY, maxY);

    const fromLeft = Phaser.Math.Between(0, 1) === 0;
    const x = fromLeft ? -40 : width + 40;

    // bias towards smaller sizes
    const sizeOptions = [1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 4, 4, 5, 6];
    const sizeLevel =
      sizeOptions[Phaser.Math.Between(0, sizeOptions.length - 1)];

    const sizeToTexture = {
      1: "fish1",
      2: "fish2",
      3: "fish3",
      4: "fish4",
      5: "fish5",
      6: "fish6"
    };
    const textureKey = sizeToTexture[sizeLevel] || "fish6";

    const fish = this.fishGroup.create(x, y, textureKey);

    fish.sizeLevel = sizeLevel;

    const baseScale = 0.5;
    const step = 0.2;
    fish.setScale(baseScale + step * (sizeLevel - 1));

    // slower swim, smaller fish faster
    const baseSpeed = 40;
    const extraSpeed = (6 - sizeLevel) * 25;
    const speed = baseSpeed + extraSpeed;

    const vx = fromLeft ? speed : -speed;
    fish.setVelocityX(vx);
    fish.setBounce(1, 1);
    fish.setCollideWorldBounds(true);

    // set initial facing
    fish.setFlipX(vx < 0);
  }

handlePlayerPlatform(player, platform) {
  if (player.body.velocity.y > 0) {
    const relative = (player.x - platform.x) / (platform.body.width / 2);
    const clamped = Phaser.Math.Clamp(relative, -1, 1);

    const currentSpeed = player.body.velocity.length();
    const targetSpeed = Phaser.Math.Clamp(currentSpeed, 180, 240);

    const horizontalFactor = 1.2;
    let vx = targetSpeed * clamped * horizontalFactor;

    let vy = -Math.sqrt(
      Math.max(targetSpeed * targetSpeed - vx * vx, 80 * 80)
    );

    player.setVelocity(vx, vy);
  }
}

  handlePlayerVsFish(player, fish) {
    if (player.invincible) {
      if (player.sizeLevel >= fish.sizeLevel) {
        fish.destroy(); 
      }
      return;
    }

    if (player.sizeLevel >= fish.sizeLevel) {
      const eatenLevel = fish.sizeLevel;
      fish.destroy();
      this.score += eatenLevel * 10;
      this._refreshHUD();
      // only count same size fish toward growth
      if (eatenLevel === player.sizeLevel) {
        player.eatenInLevel += 1;

        const needed = this.levelRequirements[player.sizeLevel] || Infinity;

        if (
          player.sizeLevel < player.maxSizeLevel &&
          player.eatenInLevel >= needed
        ) {
          player.sizeLevel += 1;
          player.eatenInLevel = 0;
          this._updatePlayerScale();
          this._refreshHUD();

          if (player.sizeLevel === player.maxSizeLevel) {
            this.scene.start("GameOverScene", { result: "win", score: this.score });
            console.log("win");
            return;
          }
        }
      }

    } else {
      this._takeDamage(player);
    }
  }

  _takeDamage(player) {
    if (player.invincible) return; // ignore if already invincible

    this.playerHealth -= 1;
    this._refreshHUD();
    this._showDamageText(player.x, player.y);

    // set invincibility for 1 sec
    player.invincible = true;
    player.setAlpha(0.5);

    this.time.delayedCall(1000, () => {
      player.invincible = false;
      player.setAlpha(1);
    });

    if (this.playerHealth <= 0) {
      this.scene.start("GameOverScene", { result: "lose", score: this.score });
      console.log("lose");
    }
  }

  // handleFishVsFish(fishA, fishB) {
  //   if (fishA === fishB) return;
  //   if (fishA.sizeLevel === fishB.sizeLevel) return;

  //   const bigger = fishA.sizeLevel > fishB.sizeLevel ? fishA : fishB;
  //   const smaller = bigger === fishA ? fishB : fishA;
  //   smaller.destroy();
  // }

  handlePlayerMiss() {
    this.playerHealth -= 1;
    this._refreshHUD();

    // reset
    const { width, height } = this.scale;
    this.player.setPosition(width / 2, height / 2);
    const angle = Phaser.Math.FloatBetween(-Math.PI * 0.75, -Math.PI * 0.25); // mostly upward
    const speed = 150;
    this.player.setVelocity(
      Math.cos(angle) * speed,
      Math.sin(angle) * speed
    );

    if (this.playerHealth <= 0) {
      this.scene.start("GameOverScene", { result: "lose" });
    }
  }

  _showDamageText(x, y) {
    const txt = this.add.text(x, y - 20, "-1 HP", {
      fontSize: "24px",
      fill: "#c62323ff",
      fontStyle: "bold"
    }).setOrigin(0.5);

    this.tweens.add({
      targets: txt,
      y: y - 60,
      alpha: 0,
      duration: 800,
      ease: "Cubic.easeOut",
      onComplete: () => txt.destroy()
    });
  }

}
