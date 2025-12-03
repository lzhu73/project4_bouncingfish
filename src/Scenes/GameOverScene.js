class GameOverScene extends Phaser.Scene {
  constructor() {
    super("GameOverScene");
  }

  create(data) {
    const { width, height } = this.scale;
    this.add.image(0, 0, "background").setOrigin(0, 0);

    const resultText = data.result === "win" ? "You Win!" : "Game Over";
    const score = data.score ?? 0;

    this.add
      .text(width / 2, height / 2 - 60, resultText, {
        fontSize: "40px",
        fill: "#ffffff"
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 - 10, `Score: ${score}`, {
        fontSize: "28px",
        fill: "#ffff66"
      })
      .setOrigin(0.5);

    const playAgain = this.add
      .text(width / 2, height / 2 + 50, "Press ENTER to Play Again", {
        fontSize: "28px",
        fill: "#00ffcc"
      })
      .setOrigin(0.5)

    this.input.keyboard.once("keydown-ENTER", () => {
      this.scene.start("GameScene"); // restart the game
    });
  }
}

