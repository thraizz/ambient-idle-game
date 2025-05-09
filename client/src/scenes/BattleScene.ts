import Phaser from "phaser";
import { API_URL } from "../config";
import { PlayerData } from "../types/api";

interface EnemyConfig {
  hp: number;
  maxHp: number;
}

interface BattleSceneData {
  difficulty?: string;
  playerId?: string;
  damagePerClick?: number;
  defeatedEnemies?: number;
  finalScore?: number;
  isRestart?: boolean;
}

export default class BattleScene extends Phaser.Scene {
  // Game variables
  private attackSpeed: number;
  private damagePerClick: number;
  private gold: number;
  private defeatedEnemies: number;
  private playerDamage: number;

  // Enemy variables
  private difficulty: string;
  private enemyConfig: EnemyConfig;

  // State variables
  private battleActive: boolean;
  private score: number;
  private isPaused: boolean;
  private playerId: string | null;
  private attackInProgress: boolean;

  // Game objects
  private enemy: Phaser.GameObjects.Sprite;
  private player: Phaser.GameObjects.Sprite;
  private battleArea: Phaser.GameObjects.Rectangle;
  private statsPanel: Phaser.GameObjects.Container;
  private island: Phaser.GameObjects.Image;
  private island2: Phaser.GameObjects.Image;
  private enemyHealthBar: Phaser.GameObjects.Graphics;
  private enemyHealthBg: Phaser.GameObjects.Rectangle;
  private enemyHealthText: Phaser.GameObjects.Text;
  private goldText: Phaser.GameObjects.Text;
  private pauseButton: Phaser.GameObjects.Text;
  private attackTimer: Phaser.Time.TimerEvent;
  private autoAttackLabel: Phaser.GameObjects.Text;
  private damageLabel: Phaser.GameObjects.Text;
  private clickDamageLabel: Phaser.GameObjects.Text;
  private enemiesDefeatedText: Phaser.GameObjects.Text;

  // UI elements for stats display
  private attackSpeedText: Phaser.GameObjects.Text;
  private damageText: Phaser.GameObjects.Text;
  private clickDamageText: Phaser.GameObjects.Text;

  // Upgrade buttons
  private speedUpgradeButton: Phaser.GameObjects.Text;
  private damageUpgradeButton: Phaser.GameObjects.Text;
  private clickUpgradeButton: Phaser.GameObjects.Text;

  constructor() {
    super({ key: "BattleScene" });

    // Idle game variables
    this.attackSpeed = 1; // Attacks per second
    this.damagePerClick = 1; // Additional damage per manual click
    this.gold = 0;
    this.defeatedEnemies = 0;

    // Initialize properties to avoid TypeScript errors
    this.difficulty = "EASY";
    this.enemyConfig = {
      hp: 100,
      maxHp: 100,
    };
    this.battleActive = true;
    this.score = 0;
    this.isPaused = false;
    this.playerId = null;
    this.playerDamage = 15;
    this.attackInProgress = false;
  }

  init(data: BattleSceneData): void {
    console.log("BattleScene init", data);

    // Check if this is a restart and use the passed difficulty if available
    const isRestart = data && data.isRestart === true;
    if (isRestart && data.difficulty) {
      this.difficulty = data.difficulty;
    } else {
      // Default to EASY difficulty for new games
      this.difficulty = "EASY";
    }

    // Set enemy configuration based on difficulty
    this.enemyConfig = {
      hp: this.difficulty === "MEDIUM" ? 200 : 100,
      maxHp: this.difficulty === "MEDIUM" ? 200 : 100,
    };

    // Initialize player variables with defaults
    this.playerDamage = 15;
    this.attackSpeed = 1;
    this.gold = 0;
    this.damagePerClick = 100;
    this.defeatedEnemies = data.defeatedEnemies || 0;

    // Battle state
    this.battleActive = true;
    this.score = 0;
    this.isPaused = false;

    // Store the player ID if it was passed
    this.playerId = data.playerId || null;

    // If we have player data in localStorage and no immediate fetch is required
    let playerData: PlayerData | null = null;
    try {
      const storedData = localStorage.getItem("playerData");
      if (storedData) {
        playerData = JSON.parse(storedData);
        console.log("Loaded player data from localStorage:", playerData);

        // Initialize from stored data while we fetch fresh data
        if (playerData) {
          this.initFromPlayerData(playerData);
        }
      }
    } catch (error) {
      console.error("Error loading player data from localStorage:", error);
    }

    // If we have a player ID, fetch fresh data from the API, but only if it's not a restart
    if (this.playerId && !isRestart) {
      this.fetchInitialPlayerData(this.playerId);
    }

    console.log("BattleScene started!");
  }

  initFromPlayerData(playerData: PlayerData): void {
    if (!playerData) return;

    // Apply player stats
    this.playerDamage = playerData.attackValue || 15;
    this.attackSpeed = playerData.clickRate || 1;
    this.gold = playerData.gold || 0;

    // Initialize enemy health
    if (playerData.currentEnemyHealth !== undefined) {
      this.enemyConfig.hp = playerData.currentEnemyHealth;
      console.log(`Using enemy health from data: ${this.enemyConfig.hp}`);
    }

    if (playerData.currentEnemyMaxHealth !== undefined) {
      this.enemyConfig.maxHp = playerData.currentEnemyMaxHealth;
      console.log(
        `Using enemy max health from data: ${this.enemyConfig.maxHp}`
      );
    }
  }

  async fetchInitialPlayerData(playerId: string): Promise<void> {
    try {
      const apiUrl = `${API_URL}/players/${playerId}`;
      const response = await fetch(apiUrl);

      if (response.ok) {
        const playerData = await response.json();
        console.log("Fetched initial player data from API:", playerData);

        // Apply player data to the game
        this.initFromPlayerData(playerData);

        // Update displays after getting fresh data
        if (this.goldText) this.updateGoldDisplay();
        if (this.attackSpeedText) this.updateStatsDisplay();
        if (this.enemyHealthBar) this.updateEnemyHealthBar();

        // Store the latest data in localStorage
        localStorage.setItem("playerData", JSON.stringify(playerData));
      } else {
        console.error(
          "Failed to fetch initial player data:",
          await response.text()
        );
      }
    } catch (error) {
      console.error("Error fetching initial player data:", error);
    }
  }

  preload(): void {
    // Load island background
    this.load.image("island", "assets/characters/island.png");

    // Load slime sprites with correct dimensions (64x64)
    this.load.spritesheet(
      "slime-idle",
      "assets/characters/slime-idle-sheet.png",
      {
        frameWidth: 64,
        frameHeight: 64,
      }
    );

    this.load.spritesheet(
      "slime-hit",
      "assets/characters/slime-hit-sheet.png",
      {
        frameWidth: 64,
        frameHeight: 64,
      }
    );

    // Load goblin sprites
    this.load.spritesheet(
      "goblin-idle",
      "assets/characters/goblin-idle-sheet.png",
      {
        frameWidth: 64,
        frameHeight: 64,
        margin: 0,
      }
    );

    this.load.spritesheet(
      "goblin-hit",
      "assets/characters/goblin-hit-sheet.png",
      {
        frameWidth: 64,
        frameHeight: 64,
      }
    );

    // Load hero character spritesheet
    this.load.spritesheet("hero-sheet", "assets/characters/hero-sheet.png", {
      frameWidth: 32,
      frameHeight: 64,
    });

    // Load hero attack spritesheet
    this.load.spritesheet("hero-attack", "assets/characters/hero-attack.png", {
      frameWidth: 32,
      frameHeight: 64,
    });

    // Load UI elements
    this.load.image("attack-button", "assets/ui/attack-button.png");
  }

  create(): void {
    console.log("BattleScene create");
    // Set up background
    this.add.rectangle(0, 0, 800, 600, 0x2c1810).setOrigin(0);

    // Create battle area
    this.battleArea = this.add
      .rectangle(400, 300, 600, 300, 0x3c2820)
      .setOrigin(0.5);

    // Check if this is a scene restart
    const data = this.scene.settings.data as BattleSceneData;
    const isRestart = data && data.isRestart === true;

    // Only log the player in if we have a player ID and this is not a restart
    if (this.playerId && !isRestart) {
      this.loginPlayer(this.playerId);
    }

    // Island 1 is behind the player character
    // Add island sprite behind the characters - positioned to be behind both player and enemy
    // Position it exactly halfway between player (200,400) and slime (600,200)
    this.island = this.add.image(400, 310, "island");
    this.island.setScale(4); // Scale up the island to fit the scene
    this.island.setDepth(0); // Set depth to ensure it's behind characters
    this.island.setPosition(200, 450);

    //  Island 2 is behind the enemy
    this.island2 = this.add.image(400, 310, "island");
    this.island2.setScale(4); // Scale up the island to fit the scene
    this.island2.setDepth(0); // Set depth to ensure it's behind characters
    this.island2.setPosition(580, 220);

    // Add battle title
    this.add
      .text(400, 100, "Idle Battle!", {
        fontSize: "48px",
        fontFamily: "Arial",
        color: "#ffffff",
        align: "center",
      })
      .setOrigin(0.5);

    // Create enemy based on difficulty (top right)
    this.createEnemy();

    // Create player character (bottom left)
    this.createPlayer();

    // Create UI elements
    this.createUI();

    // Create upgrade shop
    this.createUpgradeShop();

    // Set up automatic attacks
    this.setupAutomaticAttacks();

    // Start battle
    this.startBattle();

    // Create gold text
    this.goldText = this.add
      .text(400, 50, `Gold: ${this.gold}`, {
        fontSize: "20px",
        fontFamily: "Arial",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    // Make entire battle area clickable for manual attacks
    this.battleArea.setInteractive();
    this.battleArea.on("pointerdown", () => {
      if (this.battleActive && !this.attackInProgress) {
        this.manualAttack();
      }
    });
  }

  createPlayer(): void {
    // Create player sprite in the bottom left but in front of the island
    this.player = this.add.sprite(200, 400, "hero-sheet");

    // Scale the player
    this.player.setScale(2);

    // Set depth to ensure it's in front of the island
    this.player.setDepth(1);

    // Create player idle animation
    this.anims.create({
      key: "hero-idle",
      frames: this.anims.generateFrameNumbers("hero-sheet", {
        start: 0,
        end: 3,
      }),
      frameRate: 6,
      repeat: -1,
    });

    // Create player attack animation
    this.anims.create({
      key: "hero-attack-anim",
      frames: this.anims.generateFrameNumbers("hero-attack", {
        start: 0,
        end: 3,
      }),
      frameRate: 12,
      repeat: 0,
    });

    // Play idle animation
    this.player.play("hero-idle");
  }

  createEnemy(): void {
    // Create enemy sprite in the top right
    this.enemy = this.add.sprite(600, 200, this.getEnemySprite());

    // Scale the enemy
    this.enemy.setScale(2);

    // Set depth to ensure it's in front of the island
    this.enemy.setDepth(1);

    // Create the enemy animations
    this.anims.create({
      key: "slime-idle-anim",
      frames: this.anims.generateFrameNumbers("slime-idle", {
        start: 0,
        end: 3,
      }),
      frameRate: 6,
      repeat: -1,
    });

    this.anims.create({
      key: "slime-hit-anim",
      frames: this.anims.generateFrameNumbers("slime-hit", {
        start: 0,
        end: 3,
      }),
      frameRate: 12,
      repeat: 0,
    });

    // Create goblin animations
    this.anims.create({
      key: "goblin-idle-anim",
      frames: this.anims.generateFrameNumbers("goblin-idle", {
        start: 0,
        end: 2,
      }),
      frameRate: 6,
      repeat: -1,
    });

    this.anims.create({
      key: "goblin-hit-anim",
      frames: this.anims.generateFrameNumbers("goblin-hit", {
        start: 0,
        end: 2,
      }),
      frameRate: 12,
      repeat: 0,
    });

    // Play idle animation based on enemy type
    this.enemy.play(`${this.getEnemyType()}-idle-anim`);

    // Create health bars
    this.createHealthBars();
  }

  createUI(): void {
    // Add pause button
    this.pauseButton = this.add
      .text(700, 50, "Pause", {
        fontSize: "20px",
        fontFamily: "Arial",
        color: "#ffffff",
        backgroundColor: "#444444",
        padding: { x: 10, y: 5 },
      })
      .setOrigin(0.5)
      .setInteractive()
      .on("pointerdown", () => this.togglePause());

    // Create stats panel
    this.createStatsPanel();
  }

  createStatsPanel(): void {
    const textPanelHeight = 170;
    // Add stats panel in the top left
    const statsPanel = this.add
      .rectangle(120, textPanelHeight, 200, 140, 0x000000, 0.7)
      .setOrigin(0.5);
    statsPanel.setDepth(10);

    // Player stats title
    const statsTitle = this.add
      .text(120, textPanelHeight - 60, "STATS", {
        fontSize: "20px",
        fontFamily: "Arial",
        color: "#ffffff",
      })
      .setOrigin(0.5);
    statsTitle.setDepth(10);

    // Attack speed stat
    const attackSpeedLabel = this.add.text(
      40,
      textPanelHeight - 30,
      "Attack Speed:",
      {
        fontSize: "16px",
        fontFamily: "Arial",
        color: "#ffffff",
      }
    );
    attackSpeedLabel.setDepth(10);

    this.attackSpeedText = this.add
      .text(200, textPanelHeight - 30, `${this.attackSpeed.toFixed(1)}/s`, {
        fontSize: "16px",
        fontFamily: "Arial",
        color: "#ffffff",
      })
      .setOrigin(1, 0);
    this.attackSpeedText.setDepth(10);

    // Damage stat
    const damageLabel = this.add.text(40, 170, "Damage:", {
      fontSize: "16px",
      fontFamily: "Arial",
      color: "#ffffff",
    });
    damageLabel.setDepth(10);

    this.damageText = this.add
      .text(200, 170, `${this.playerDamage}`, {
        fontSize: "16px",
        fontFamily: "Arial",
        color: "#ffffff",
      })
      .setOrigin(1, 0);
    this.damageText.setDepth(10);

    // Click damage stat
    const clickLabel = this.add.text(40, 200, "Click Damage:", {
      fontSize: "16px",
      fontFamily: "Arial",
      color: "#ffffff",
    });
    clickLabel.setDepth(10);

    this.clickDamageText = this.add
      .text(200, 200, `+${this.damagePerClick}`, {
        fontSize: "16px",
        fontFamily: "Arial",
        color: "#ffffff",
      })
      .setOrigin(1, 0);
    this.clickDamageText.setDepth(10);

    // Enemies defeated
    const enemiesDefeatedLabel = this.add.text(40, 230, "Enemies Defeated:", {
      fontSize: "16px",
      fontFamily: "Arial",
      color: "#ffffff",
    });
    enemiesDefeatedLabel.setDepth(10);

    this.enemiesDefeatedText = this.add
      .text(200, 230, `${this.defeatedEnemies}`, {
        fontSize: "16px",
        fontFamily: "Arial",
        color: "#ffffff",
      })
      .setOrigin(1, 0);
    this.enemiesDefeatedText.setDepth(10);
  }

  createUpgradeShop(): void {
    // Upgrade panel in the bottom section
    this.add.rectangle(400, 520, 700, 120, 0x000000, 0.7).setOrigin(0.5);

    // Shop title
    this.add
      .text(400, 470, "UPGRADES", {
        fontSize: "20px",
        fontFamily: "Arial",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    // Attack Speed Upgrade
    const speedUpgradeButton = this.add
      .text(
        150,
        520,
        `Speed +0.1\nCost: ${this.getUpgradeCost("speed")} gold`,
        {
          fontSize: "16px",
          fontFamily: "Arial",
          color: "#ffffff",
          backgroundColor: "#4a6fa5",
          padding: { x: 10, y: 5 },
          align: "center",
        }
      )
      .setOrigin(0.5)
      .setInteractive();

    speedUpgradeButton.on("pointerdown", () => {
      this.upgradeAttackSpeed();
    });

    // Damage Upgrade
    const damageUpgradeButton = this.add
      .text(
        400,
        520,
        `Damage +5\nCost: ${this.getUpgradeCost("damage")} gold`,
        {
          fontSize: "16px",
          fontFamily: "Arial",
          color: "#ffffff",
          backgroundColor: "#a54a4a",
          padding: { x: 10, y: 5 },
          align: "center",
        }
      )
      .setOrigin(0.5)
      .setInteractive();

    damageUpgradeButton.on("pointerdown", () => {
      this.upgradeDamage();
    });

    // Click Damage Upgrade
    const clickUpgradeButton = this.add
      .text(
        650,
        520,
        `Click Dmg +1\nCost: ${this.getUpgradeCost("click")} gold`,
        {
          fontSize: "16px",
          fontFamily: "Arial",
          color: "#ffffff",
          backgroundColor: "#4aa54a",
          padding: { x: 10, y: 5 },
          align: "center",
        }
      )
      .setOrigin(0.5)
      .setInteractive();

    clickUpgradeButton.on("pointerdown", () => {
      this.upgradeClickDamage();
    });

    // Store buttons for updating their text
    this.speedUpgradeButton = speedUpgradeButton;
    this.damageUpgradeButton = damageUpgradeButton;
    this.clickUpgradeButton = clickUpgradeButton;
  }
  getUpgradeCost(type: string): number {
    switch (type) {
      case "speed":
        return Math.floor(50 * Math.pow(1.5, this.attackSpeed * 5));
      case "damage":
        return Math.floor(100 * Math.pow(1.3, this.playerDamage / 5));
      case "click":
        return Math.floor(75 * Math.pow(1.4, this.damagePerClick));
      default:
        return 100;
    }
  }
  upgradeAttackSpeed(): void {
    const cost = this.getUpgradeCost("speed");
    if (this.gold >= cost) {
      this.gold -= cost;
      this.attackSpeed += 0.1;
      this.updateGoldDisplay();
      this.updateStatsDisplay();
      this.setupAutomaticAttacks(); // Reset the attack timer with new speed

      // Update button text
      this.speedUpgradeButton.setText(
        `Speed +0.1\nCost: ${this.getUpgradeCost("speed")} gold`
      );
    }
  }
  upgradeDamage(): void {
    const cost = this.getUpgradeCost("damage");
    if (this.gold >= cost) {
      this.gold -= cost;
      this.playerDamage += 5;
      this.updateGoldDisplay();
      this.updateStatsDisplay();

      // Update button text
      this.damageUpgradeButton.setText(
        `Damage +5\nCost: ${this.getUpgradeCost("damage")} gold`
      );
    }
  }
  upgradeClickDamage(): void {
    const cost = this.getUpgradeCost("click");
    if (this.gold >= cost) {
      this.gold -= cost;
      this.damagePerClick += 1;
      this.updateGoldDisplay();
      this.updateStatsDisplay();

      // Update button text
      this.clickUpgradeButton.setText(
        `Click Dmg +1\nCost: ${this.getUpgradeCost("click")} gold`
      );
    }
  }
  updateGoldDisplay(): void {
    this.goldText.setText(`Gold: ${this.gold}`);
  }
  updateStatsDisplay(): void {
    this.attackSpeedText.setText(`${this.attackSpeed.toFixed(1)}/s`);
    this.damageText.setText(`${this.playerDamage}`);
    this.clickDamageText.setText(`+${this.damagePerClick}`);
    this.enemiesDefeatedText.setText(`${this.defeatedEnemies}`);
  }
  setupAutomaticAttacks(): void {
    // Clear existing timer if it exists
    if (this.attackTimer) {
      this.attackTimer.remove();
    }

    // Set up automatic attack timer
    const attackDelay = 1000 / this.attackSpeed; // Convert attacks per second to milliseconds
    this.attackTimer = this.time.addEvent({
      delay: attackDelay,
      callback: this.automaticAttack,
      callbackScope: this,
      loop: true,
    });
  }
  createHealthBars(): void {
    // Enemy health bar background
    this.enemyHealthBg = this.add
      .rectangle(600, 150, 100, 10, 0x000000)
      .setOrigin(0.5);
    this.enemyHealthBg.setDepth(10);

    // Enemy health bar (using Graphics for flexible drawing)
    this.enemyHealthBar = this.add.graphics();
    this.enemyHealthBar.setDepth(10);
    this.updateEnemyHealthBar(); // This will initially draw the health bar

    // Enemy health text
    this.enemyHealthText = this.add
      .text(
        600,
        130,
        `${this.enemyConfig.hp ?? 0}/${this.enemyConfig.maxHp ?? 0}`,
        {
          fontSize: "16px",
          fontFamily: "Arial",
          color: "#ffffff",
        }
      )
      .setOrigin(0.5);
    this.enemyHealthText.setDepth(10);
  }
  togglePause(): void {
    this.isPaused = !this.isPaused;

    if (this.isPaused) {
      this.pauseButton.setText("▶️");
      this.attackTimer.paused = true;
    } else {
      this.pauseButton.setText("⏸️");
      this.attackTimer.paused = false;
    }
  }
  startBattle(): void {
    this.battleActive = true;

    // Show difficulty level
    const difficultyText = this.add
      .text(400, 150, `Difficulty: ${this.difficulty}`, {
        fontSize: "24px",
        fontFamily: "Arial",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    // Fade out difficulty text after 2 seconds
    this.time.delayedCall(2000, () => {
      this.tweens.add({
        targets: difficultyText,
        alpha: 0,
        duration: 1000,
        ease: "Power2",
      });
    });
  }
  automaticAttack(): void {
    if (!this.battleActive || this.isPaused || this.attackInProgress) return;

    this.executeAttack(this.playerDamage);
  }
  manualAttack(): void {
    if (!this.battleActive || this.isPaused || this.attackInProgress) return;

    // Manual attacks do base damage plus bonus click damage
    this.executeAttack(this.playerDamage + this.damagePerClick);

    this.postAttackToServer();
  }
  async postAttackToServer() {
    if (this.playerId) {
      // /api/game/click/{playerId}
      const apiUrl = `${API_URL}/game/click/${this.playerId}`;
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Attack reported to server:", data);
      }
      this.fetchPlayerState(this.playerId, () => {
        this.updateEnemyHealthBar();
      });
    }
  }
  executeAttack(damage: number): void {
    // Set flag to prevent multiple concurrent attacks
    this.attackInProgress = true;

    // Play hero attack animation
    this.player.play("hero-attack-anim");

    // Make player move towards enemy slightly
    this.tweens.add({
      targets: this.player,
      x: this.player.x + 50,
      duration: 300,
      yoyo: true,
      ease: "Power1",
      onComplete: () => {
        // After player attack animation and movement, play enemy hit animation
        this.enemy.play(`${this.getEnemyType()}-hit-anim`);

        // Shake enemy
        this.tweens.add({
          targets: this.enemy,
          x: 600 + Phaser.Math.Between(-10, 10),
          y: 200 + Phaser.Math.Between(-10, 10),
          duration: 50,
          yoyo: true,
          repeat: 3,
        });

        // Calculate damage (with some randomness)
        const finalDamage = damage;

        // Damage number popup
        this.showDamageNumber(finalDamage);

        // Reduce slime HP
        this.enemyConfig.hp = Math.max(0, this.enemyConfig.hp - finalDamage);

        // Update health bar
        this.updateEnemyHealthBar();

        // Refetch the server state and replace our local state
        if (this.playerId) {
          this.fetchPlayerState(this.playerId, () => {
            this.updateEnemyHealthBar();
          });
        }

        // Check if slime is defeated
        if (this.enemyConfig.hp <= 0) {
          this.enemyDefeated();
          return;
        }

        // Set attack in progress to false since we're done and there's no enemy turn
        this.attackInProgress = false;
      },
    });

    // Listen for hero animation complete to go back to idle
    this.player.on(
      "animationcomplete",
      (animation: Phaser.Animations.Animation) => {
        if (animation.key === "hero-attack-anim") {
          this.player.play("hero-idle");
        }
      }
    );

    // Listen for enemy animation complete to go back to idle
    this.enemy.on(
      "animationcomplete",
      (animation: Phaser.Animations.Animation) => {
        if (
          animation.key === `${this.getEnemyType()}-hit-anim` &&
          this.enemyConfig.hp > 0
        ) {
          this.enemy.play(`${this.getEnemyType()}-idle-anim`);
        }
      }
    );
  }
  showDamageNumber(damage: number): void {
    // Create a text showing the damage number
    const damageText = this.add
      .text(
        this.enemy.x + Phaser.Math.Between(-20, 20),
        this.enemy.y - 40,
        damage.toString(),
        {
          fontSize: "24px",
          fontFamily: "Arial",
          color: "#ff0000",
          stroke: "#ffffff",
          strokeThickness: 2,
        }
      )
      .setOrigin(0.5);

    // Animate the damage number
    this.tweens.add({
      targets: damageText,
      y: damageText.y - 50,
      alpha: 0,
      duration: 1000,
      ease: "Power2",
      onComplete: () => {
        damageText.destroy();
      },
    });
  }
  updateEnemyHealthBar(): void {
    // Exit if there is no enemy or health bar components
    if (!this.enemy || !this.enemyHealthBar) return;

    // Clear existing graphics
    this.enemyHealthBar.clear();

    // Calculate the health percentage
    const healthPercent = this.enemyConfig.hp / this.enemyConfig.maxHp;

    // Determine color based on health percentage
    let color = 0x00ff00; // Green
    if (healthPercent < 0.2) {
      color = 0xff0000; // Red
    } else if (healthPercent < 0.5) {
      color = 0xffff00; // Yellow
    }

    // Draw the health bar
    this.enemyHealthBar.fillStyle(color, 1);
    this.enemyHealthBar.fillRect(550, 145, 100 * healthPercent, 10);

    // Update health text only if it exists
    if (this.enemyHealthText && this.enemyHealthText.active) {
      this.enemyHealthText.setText(
        `${this.enemyConfig.hp}/${this.enemyConfig.maxHp}`
      );
    }
  }
  enemyDefeated(): void {
    this.battleActive = false; // Temporarily disable battle while showing victory
    this.defeatedEnemies++;

    // Stop enemy animations
    this.enemy.stop();

    // Add victory text
    const victoryText = this.add
      .text(400, 300, "VICTORY!", {
        fontSize: "64px",
        fontFamily: "Arial",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setAlpha(0);

    // Fade in victory text
    this.tweens.add({
      targets: victoryText,
      alpha: 1,
      duration: 1000,
      ease: "Power2",
    });

    // Add reward text
    // TODO: This should come from the API
    const goldReward = 20;
    const rewardText = this.add
      .text(400, 380, `Reward: ${goldReward} gold`, {
        fontSize: "32px",
        fontFamily: "Arial",
        color: "#FFD700",
      })
      .setOrigin(0.5)
      .setAlpha(0);

    // Fade in reward text
    this.tweens.add({
      targets: rewardText,
      alpha: 1,
      duration: 1000,
      ease: "Power2",
      delay: 500,
    });

    // Update score and gold
    this.score += 10;
    this.gold += goldReward;

    // Update displays
    this.updateGoldDisplay();
    this.updateStatsDisplay();

    // Make enemy fade away
    this.tweens.add({
      targets: this.enemy,
      alpha: 0,
      duration: 1000,
      ease: "Power2",
    });

    // Reset attack in progress flag to prevent attack state lockup
    this.attackInProgress = false;

    // Automatically continue to the next enemy after a delay
    // Choose next difficulty based on current enemy
    let nextDifficulty = "EASY";
    let nextEnemyMaxHp = 100;
    let nextEnemyType = "slime";

    // Progression: after defeating a slime, face a goblin
    if (this.getEnemyType() === "slime") {
      nextDifficulty = "MEDIUM";
      nextEnemyMaxHp = 200;
      nextEnemyType = "goblin";
    }

    // Show next enemy text
    const nextEnemyText = this.add
      .text(400, 450, `Next enemy: ${nextDifficulty} ${nextEnemyType}`, {
        fontSize: "28px",
        fontFamily: "Arial",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    // Fetch player state from API if we have a player ID
    if (this.playerId) {
      this.fetchPlayerState(this.playerId, () => {
        // Override with our progression logic since we're determining enemy type locally
        this.enemyConfig.maxHp = nextEnemyMaxHp;
        this.enemyConfig.hp = nextEnemyMaxHp;

        this.continueToNextEnemy(
          victoryText,
          rewardText,
          nextEnemyText,
          nextDifficulty
        );
      });
    } else {
      // If no player ID, just continue with local data
      this.enemyConfig.maxHp = nextEnemyMaxHp;
      this.enemyConfig.hp = nextEnemyMaxHp;

      this.continueToNextEnemy(
        victoryText,
        rewardText,
        nextEnemyText,
        nextDifficulty
      );
    }
  }

  async fetchPlayerState(
    playerId: string,
    callback: () => void
  ): Promise<void> {
    try {
      // Make API call to get player data according to the OpenAPI spec
      const apiUrl = `${API_URL}/players/${playerId}`;
      const response = await fetch(apiUrl);

      if (response.ok) {
        const playerData = await response.json();
        console.log("Fetched player data:", playerData);

        // Update local state with server state
        this.gold = playerData.gold;
        this.attackSpeed = playerData.clickRate;
        this.playerDamage = playerData.attackValue;

        // Update enemy health from server
        this.enemyConfig.hp = playerData.currentEnemyHealth;
        this.enemyConfig.maxHp = playerData.currentEnemyMaxHealth;

        // Update UI
        this.updateGoldDisplay();
        this.updateStatsDisplay();

        // Store player data in localStorage
        localStorage.setItem("playerData", JSON.stringify(playerData));
      } else {
        console.error("Failed to fetch player data:", await response.text());
      }
    } catch (error) {
      console.error("Error fetching player data:", error);
    }

    // Always call the callback, even if the API call fails
    callback();
  }

  continueToNextEnemy(
    victoryText: Phaser.GameObjects.Text,
    rewardText: Phaser.GameObjects.Text,
    nextEnemyText: Phaser.GameObjects.Text,
    nextDifficulty: string
  ): void {
    // Fade out all text elements
    this.tweens.add({
      targets: [victoryText, rewardText, nextEnemyText],
      alpha: 0,
      duration: 500,
      ease: "Power2",
      onComplete: () => {
        // Restart scene with updated data
        this.scene.restart({
          difficulty: nextDifficulty,
          gold: this.gold,
          attackSpeed: this.attackSpeed,
          damagePerClick: this.damagePerClick,
          defeatedEnemies: this.defeatedEnemies,
          playerId: this.playerId,
          isRestart: true
        });
      },
    });
  }

  async loginPlayer(playerId: string): Promise<void> {
    try {
      const apiUrl = `${API_URL}/game/login/${playerId}`;
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const loginData = await response.json();

      if (response.ok && loginData.success) {
        console.log("Player logged in successfully:", loginData);

        // If player earned gold while offline, show a notification
        if (loginData.offlineGold > 0) {
          this.showOfflineProgress(loginData);

          // Update the player's gold amount
          this.gold += loginData.offlineGold;
          this.updateGoldDisplay();
        }
      } else {
        console.error("Failed to log in player:", loginData);
      }
    } catch (error) {
      console.error("Error logging in player:", error);
    }
  }
  showOfflineProgress(loginData: any): void {
    // Create a notification panel
    const panel = this.add
      .rectangle(400, 300, 500, 200, 0x000000, 0.8)
      .setOrigin(0.5);
    panel.setDepth(100);

    // Add title text
    const titleText = this.add
      .text(400, 230, "Welcome Back!", {
        fontSize: "32px",
        fontFamily: "Arial",
        color: "#ffffff",
        align: "center",
      })
      .setOrigin(0.5);
    titleText.setDepth(101);

    // Add message text
    const messageText = this.add
      .text(400, 300, loginData.message, {
        fontSize: "24px",
        fontFamily: "Arial",
        color: "#ffffff",
        align: "center",
      })
      .setOrigin(0.5);
    messageText.setDepth(101);

    // Add gold amount with gold color
    const goldText = this.add
      .text(400, 350, `+${loginData.offlineGold} gold`, {
        fontSize: "28px",
        fontFamily: "Arial",
        color: "#FFD700",
        align: "center",
      })
      .setOrigin(0.5);
    goldText.setDepth(101);

    // Add close button
    const closeButton = this.add
      .text(400, 400, "Continue", {
        fontSize: "24px",
        fontFamily: "Arial",
        color: "#ffffff",
        backgroundColor: "#2ecc71",
        padding: { x: 20, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive();
    closeButton.setDepth(101);

    // Handle close button click
    closeButton.on("pointerdown", () => {
      // Remove all notification elements
      panel.destroy();
      titleText.destroy();
      messageText.destroy();
      goldText.destroy();
      closeButton.destroy();
    });
  }

  getEnemyType(): string {
    // If we dont have a enemy configuration, return the default sprite
    if (!this.enemyConfig) {
      return "slime";
    }

    // Else, map the enemy max health to a sprite
    const enemyMaxHealth = this.enemyConfig.maxHp;
    if (enemyMaxHealth >= 200) {
      return "goblin";
    }

    return "slime";
  }

  getEnemySprite(): string {
    return this.getEnemyType() + "-idle";
  }
  getEnemyHitSprite(): string {
    return this.getEnemyType() + "-hit";
  }
}
