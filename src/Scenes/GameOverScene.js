class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  preload(){
    //load background
  }

  create() {
    

    // go back to game
    this.input.keyboard.once('keydown-ENTER', () => {
      this.scene.start('gameScene');
    });
  }
}
