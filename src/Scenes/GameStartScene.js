class GameStartScene extends Phaser.Scene {
  constructor() {
    super("GameStartScene");
  }

  preload() {
    this.load.image("bg", "assets/background.png");

    this.load.image("fish1", "assets/fish1.png");
    this.load.image("fish2", "assets/fish2.png");
    this.load.image("fish3", "assets/fish3.png");
    this.load.image("fish4", "assets/fish4.png");
    this.load.image("fish5", "assets/fish5.png");
    this.load.image("fish6", "assets/fish6.png");
  }

  create() {
    const { width, height } = this.scale;

    this.add.image(0, 0, "bg").setOrigin(0, 0);

    // title
    this.add.text(width / 2, height / 2 - 150, "Bouncing Fish", {
      fontSize: "40px",
      fill: "#ffffee"
    }).setOrigin(0.5);

    // start control
    this.add.text(width / 2, height / 2 + 172, "Press SPACE/Click to Start", {
      fontSize: "24px",
      fill: "#979fdbff"
    }).setOrigin(0.5);

    // intro + controls
    const box = this.add.rectangle(
      width / 2 - 110,
      height / 2 + 20,
      420,
      210,
      0x20456f, 
      0.2
    );
    this.add.text(width / 2 - 130, height / 2 + 20,
    `Controls:
    ← / A : Move platform left
    → / D : Move platform right

    Tips:
    • Eat fish your size to level up. 
    • Don't let bigger fishes eat you.
    • Keep bouncing don't fall!       
    • You can slow other fishes down. `,
    {
      fontSize: "18px",
      fill: "#ffffff",
      align: "center",
      wordWrap: { width: 420 }
    }).setOrigin(0.5);

    // fish list
    this.add.rectangle(
      width / 2 + 210,
      height / 2 + 20,
      160,
      210,
      0x20456f, 
      0.2
    );

  const textStyle   = { fontSize: "16px", fill: "#ffffff" };

  const fishData = [
    { size: 1, key: "fish1" },
    { size: 2, key: "fish2" },
    { size: 3, key: "fish3" },
    { size: 4, key: "fish4" },
    { size: 5, key: "fish5" },
    { size: 6, key: "fish6" }
  ];

  const startY = height / 2 - 65;
  const rowH   = 35;

  fishData.forEach((f, i) => {
    const y = startY + i * rowH;

    // fish sprite
    const img = this.add.image(width - 300, y, f.key)
      .setScale(0.4)
      .setOrigin(0, 0.5);

    // label text
    this.add.text(
      width - 250,
      y,
      `size ${f.size}`,
      textStyle
    ).setOrigin(0, 0.5);
  });


    this.input.keyboard.once("keydown-SPACE", () => {
      this.scene.start("GameScene");
    });

    this.input.once("pointerdown", () => {
      this.scene.start("GameScene");
    });
  }
}
