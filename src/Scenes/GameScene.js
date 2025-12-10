class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  preload() {
    // sprites & bg
    this.load.image("background", "assets/background.png");
    this.load.image("platform", "assets/fishnet.png");
    this.load.image("playerFish", "assets/playerFish.png");

    this.load.image("fish1", "assets/fish1.png");
    this.load.image("fish2", "assets/fish2.png");
    this.load.image("fish3", "assets/fish3.png");
    this.load.image("fish4", "assets/fish4.png");
    this.load.image("fish5", "assets/fish5.png");
    this.load.image("fish6", "assets/fish6.png");

    // eatFish effect
    this.load.image("eatFish", "assets/magic_03.png"); 

    // powerup
    this.load.image("powerupSlow", "assets/muzzle_01.png"); 

    // sounds
    this.load.audio("eatSfx", "assets/drop_004.ogg"); 
    this.load.audio("powerupSfx", "assets/maximize_004.ogg"); 
    this.load.audio("eaten", "assets/pluck_001.ogg"); 
    this.load.audio("bounce", "assets/bounce.mp3");
    this.load.audio("bgm_main", "assets/background.mp3");
    this.load.audio("bgm_ambient", "assets/underwater.mp3");
    this.load.audio("levelup", "assets/levelup.mp3")

  }

  create() {
    const { width, height } = this.scale;

    this.add.image(0, 0, "background").setOrigin(0, 0);

    this.bgmMain = this.sound.add("bgm_main", {
      loop: true,
      volume: 0.25
    });
    this.bgmAmbient = this.sound.add("bgm_ambient", {
      loop: true,
      volume: 0.9
    });

    this.bgmMain.play();
    this.bgmAmbient.play();


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
    this.player.maxSizeLevel = 7;
    this.player.eatenInLevel = 0;
    this.playerHealth = 50;
    this.player.invincible = false;
    this.score = 0;
    this.lastBounceTime = 0;


    this.player.body.onWorldBounds = true;
    this.physics.world.on(
      "worldbounds",
      (body, up, down, left, right) => {
          if (body.gameObject !== this.player) return;

          if (!down && this.sound) {
            this.sound.play("bounce", { volume: 0.3 });
          }

          if (down) {
            if (this.bgmMain) this.bgmMain.stop();
            if (this.bgmAmbient) this.bgmAmbient.stop();

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
    //this.player.body.maxVelocity.set(150, 150);

    // controls
    this.keys = this.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      d: Phaser.Input.Keyboard.KeyCodes.D,
    });

    // npc fish
    this.fishGroup = this.physics.add.group({ allowGravity: false });

    this.powerupGroup = this.physics.add.group({ allowGravity: false });

    this.physics.add.overlap(
      this.player,
      this.powerupGroup,
      this.handlePlayerPowerup,
      null,
      this
    );


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
      delay: 1000,
      callback: this.spawnFish,
      callbackScope: this,
      loop: true,
    });

    this.powerupTimer = this.time.addEvent({
      delay: 10000,
      callback: this.spawnPowerup,
      callbackScope: this,
      loop: true,
    });

    // grow requirement level: eatfishcount
    this.levelRequirements = {
      1: 3,
      2: 2,
      3: 2,
      4: 2,
      5: 2,
      6: 2
    };

    // HUD
    const box = this.add.rectangle( // x, y, width, height, color, transparency
      8,
      8, 
      160,
      110,
      0x20456f, 
      0.2
    );
    // top left corner
    box.setOrigin(0, 0);
    box.setDepth(0);

    // box.setStrokeStyle(2, 0xffffff);
    const style = { fontSize: "18px", fill: "#ffffff" };
    this.healthText = this.add.text(16, 16, "", style);
    this.sizeText = this.add.text(16, 40, "", style);
    this.scoreText = this.add.text(16, 64, "", style);
    this.countNeeded = this.add.text(16, 88, "", style);
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
    const baseScale = 0.7;
    const step = 0.2;

    this.player.setScale(baseScale + step * (this.player.sizeLevel - 1));

    const displayW = this.player.displayWidth;
    const displayH = this.player.displayHeight;

    const hitW = displayW * 0.7;  
    const hitH = displayH * 0.7;  

    this.player.body.setSize(hitW, hitH, true);  
  }

  _refreshHUD() {
    this.healthText.setText("Health: " + this.playerHealth);
    this.sizeText.setText("Size: " + this.player.sizeLevel);

    if (this.scoreText) {
      this.scoreText.setText("Score: " + this.score);
    }

    if (this.countNeeded) {
      const needed = this.levelRequirements[this.player.sizeLevel] ?? Infinity;

      if (this.player.sizeLevel >= this.player.maxSizeLevel) {
        // already at max
        this.countNeeded.setText("To next: MAX");
      } else {
        const left = Math.max(needed - this.player.eatenInLevel, 0);
        this.countNeeded.setText(left + " more to eat");
      }
    }
  }

  _showLevelUpText() {
    const txt = this.add.text(
      this.player.x,
      this.player.y,
      "Level Up!",
      {
        fontSize: "28px",
        fill: "#a2ee6fff",
        fontStyle: "bold",
        align: "center"
      }
    ).setOrigin(0.5);

    this.tweens.add({
      targets: txt,
      y: txt.y - 40,
      alpha: 0,
      duration: 1500,
      ease: "Cubic.easeOut",
      onComplete: () => txt.destroy()
    });

    this._applyPowerupEffectToPlayer(1000);
  }

  _applyPowerupEffectToPlayer(duration) {
    // stop previous tween
    if (this.player.powerupTween) {
      this.player.powerupTween.stop();
      this.player.powerupTween = null;
    }

    // tint player
    this.player.setTint(0xffdb58);

    // tween
    this.player.powerupTween = this.tweens.add({
      targets: this.player,
      scaleX: this.player.scaleX * 1.08,
      scaleY: this.player.scaleY * 1.08,
      yoyo: true,
      repeat: -1,
      duration: 220,
      ease: "Sine.easeInOut"
    });

    // remove effect
    this.time.delayedCall(duration, () => {
      if (this.player.powerupTween) {
        this.player.powerupTween.stop();
        this.player.powerupTween = null;
      }
      this.player.clearTint();
      this._updatePlayerScale();
    });
  }



  spawnFish() {
    const { width, height } = this.scale;

    const minY = 80;
    const maxY = height - 140;
    const y = Phaser.Math.Between(minY, maxY);

    const fromLeft = Phaser.Math.Between(0, 1) === 0;
    const x = fromLeft ? -40 : width + 40;

    // bias towards smaller sizes
    const sizeOptions = [
      1, 1, 1, 1, 1, 1, 1, 1, 1,
      2, 2, 2, 2, 2, 2,
      3, 3, 3, 3,
      4, 4, 4,
      5, 5,
      6];
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
    const baseSpeed = 30;
    const extraSpeed = (6 - sizeLevel) * 15;
    const speed = baseSpeed + extraSpeed;

    const vx = fromLeft ? speed : -speed;
    fish.setVelocityX(vx);
    fish.setBounce(1, 1);
    fish.setCollideWorldBounds(true);

    // set initial facing
    fish.setFlipX(vx < 0);
  }


  handlePlayerPlatform(player, platform) {
    const body = player.body;

    if (!(body.blocked.down || body.touching.down)) {
      return;
    }

    const relative = (player.x - platform.x) / (platform.body.width / 2);
    const clamped = Phaser.Math.Clamp(relative, -1, 1);

    // gentle growth
    const baseSpeed   = 180;
    const perLevelAdd = 60;
    const maxSpeed    = 500;

    let targetSpeed = baseSpeed + perLevelAdd * (this.player.sizeLevel - 1);
    targetSpeed = Phaser.Math.Clamp(targetSpeed, baseSpeed, maxSpeed);

    const horizontalFactor = 1.0;
    let vx = targetSpeed * clamped * horizontalFactor;

    const speedSq = targetSpeed * targetSpeed;
    const vxSq = vx * vx;
    let vy = -Math.sqrt(Math.max(speedSq - vxSq, 80 * 80));

    this.sound.play("bounce", { volume: 0.3 })

    // little animated effect
    this.tweens.add({
      targets: platform,
      scaleY: 0.8,
      duration: 80,
      yoyo: true,
      ease: "Quad.easeOut"
    });

    player.setVelocity(vx, vy);
  }


  spawnPowerup() {
    const { width, height } = this.scale;
    const x = Phaser.Math.Between(80, width - 80);
    const y = Phaser.Math.Between(80, height / 2);

    const p = this.powerupGroup.create(x, y, "powerupSlow");
    p.setScale(0.1);
    p.setCollideWorldBounds(true);
    p.setBounce(1, 1);
    p.setVelocity(
      Phaser.Math.Between(-40, 40),
      Phaser.Math.Between(-20, 20)
    );
  }


  handlePlayerPowerup(player, powerup) {
    powerup.destroy();

    if (this.sound) {
      this.sound.play("powerupSfx", { volume: 0.6 });
    }

    // slow all enemy fish for 3 seconds
    this._applySlowToFish(0.5, 3000);
  }


  _applySlowToFish(multiplier, duration) {
    this.fishGroup.getChildren().forEach(fish => {
      if (!fish.body) return;

      // store original velocity once
      if (fish.body._origVx === undefined) {
        fish.body._origVx = fish.body.velocity.x;
      }
      fish.setVelocityX(fish.body.velocity.x * multiplier);
    });

    this.time.delayedCall(duration, () => {
      this.fishGroup.getChildren().forEach(fish => {
        if (!fish.body) return;
        if (fish.body._origVx !== undefined) {
          fish.setVelocityX(fish.body._origVx);
          delete fish.body._origVx;
        }
      });
    });
  }


  handlePlayerVsFish(player, fish) {
    // able to eat or not
    if (player.sizeLevel >= fish.sizeLevel) {
      const eatenLevel = fish.sizeLevel;

      this._playEatEffect(fish.x, fish.y);
      if (this.sound) {
        this.sound.play("eatSfx", { volume: 0.5 });
      }

      fish.destroy();
      this.score += eatenLevel * 10;

      // only same size count for levelup
      if (eatenLevel === player.sizeLevel) {
        player.eatenInLevel += 1;

        const needed = this.levelRequirements[player.sizeLevel] ?? Infinity;

        if (
          player.sizeLevel < player.maxSizeLevel &&
          player.eatenInLevel >= needed
        ) {
          player.sizeLevel += 1;
          player.eatenInLevel = 0;

          if (this.sound) {
            this.sound.play("levelup", { volume: 0.5 });
          }

          this._updatePlayerScale();
          this._showLevelUpText();

          if (player.sizeLevel === player.maxSizeLevel) {
            // camera shake for level complete
            this.cameras.main.shake(300, 0.01);

            const banner = this.add.text(
              this.scale.width / 2,
              this.scale.height / 2,
              "Max Size!",
              {
                fontSize: "40px",
                fill: "#ffff66",
                align: "center"
              }
            ).setOrigin(0.5);

            // after a few seconds, go to GameOverScene
            this.time.delayedCall(2000, () => {
              if (this.bgmMain) this.bgmMain.stop();
              if (this.bgmAmbient) this.bgmAmbient.stop();
              this.scene.start("GameOverScene", {
                result: "win",
                score: this.score
              });
            });

            console.log("win");
            return;
          }
        }
      }

      // refresh HUD after score / progress changes
      this._refreshHUD();

    } else {
      // if eaten by bigger fish
      this._takeDamage(player);
    }
  }


  _takeDamage(player) {
    if (player.invincible) return; // ignore if already invincible

    this.playerHealth -= 1;
    this.cameras.main.shake(150, 0.003);
    this._refreshHUD();
    this._showDamageText(player.x, player.y);
    if (this.sound) {
      this.sound.play("eaten", { volume: 0.6 });
    }
    // set invincibility for 1 sec
    player.invincible = true;
    player.setAlpha(0.5);

    this.time.delayedCall(1000, () => {
      player.invincible = false;
      player.setAlpha(1);
    });

    if (this.playerHealth <= 0) {
      if (this.bgmMain) this.bgmMain.stop();
      if (this.bgmAmbient) this.bgmAmbient.stop();
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
      if (this.bgmMain) this.bgmMain.stop();
      if (this.bgmAmbient) this.bgmAmbient.stop();
      this.scene.start("GameOverScene", { result: "lose" });
    }
  }


  _playEatEffect(x, y) {
    const flash = this.add.image(x, y, "eatFish")
      .setScale(0.4)
      .setTint(0xffff66)
      .setAlpha(0.8);

    this.tweens.add({
      targets: flash,
      scale: 0.1,
      alpha: 0,
      duration: 200,
      ease: "Cubic.easeOut",
      onComplete: () => flash.destroy()
    });
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
