import Phaser from 'phaser';

// Define types for enemy configurations
interface EnemyType {
    key: string;
    color: number;
    hp: number;
    damage: number;
    reward: number;
    blink?: boolean;
}

interface EnemyConfig {
    hp: number;
    damage: number;
    reward: number;
}

interface PlayerData {
    id?: string;
    attackValue?: number;
    clickRate?: number;
    gold?: number;
    currentEnemyHealth?: EnemyConfig;
    currentEnemyMaxHealth?: number;
    [key: string]: any;
}

interface BattleSceneData {
    difficulty?: string;
    playerId?: string;
    damagePerClick?: number;
    defeatedEnemies?: number;
    finalScore?: number;
}

export default class BattleScene extends Phaser.Scene {
    // Enemy types
    private ENEMY_TYPES: Record<string, EnemyType>;
    
    // Game variables
    private attackSpeed: number;
    private damagePerClick: number;
    private gold: number;
    private defeatedEnemies: number;
    private playerDamage: number;
    
    // Enemy variables
    private difficulty: string;
    private enemyConfig: EnemyConfig;
    private enemyHP: number;
    private enemyMaxHP: number;
    
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
    private enemyHealthText: Phaser.GameObjects.Text;
    private goldText: Phaser.GameObjects.Text;
    private pauseButton: Phaser.GameObjects.Text;
    private attackTimer: Phaser.Time.TimerEvent;
    private autoAttackLabel: Phaser.GameObjects.Text;
    private damageLabel: Phaser.GameObjects.Text;
    private clickDamageLabel: Phaser.GameObjects.Text;
    private enemiesDefeatedText: Phaser.GameObjects.Text;
    
    constructor() {
        super({ key: 'BattleScene' });
        
        // Enemy difficulty levels
        this.ENEMY_TYPES = {
            EASY: {
                key: 'green-slime',
                color: 0x8AFF5D,
                hp: 100,
                damage: 5,
                reward: 10
            },
            MEDIUM: {
                key: 'blue-slime',
                color: 0x5D9EFF,
                hp: 100,
                damage: 10,
                reward: 25
            },
            HARD: {
                key: 'red-slime',
                color: 0xFF5D5D,
                hp: 200,
                damage: 20,
                reward: 50,
                blink: true
            }
        };
        
        // Idle game variables
        this.attackSpeed = 1; // Attacks per second
        this.damagePerClick = 1; // Additional damage per manual click
        this.gold = 0;
        this.defeatedEnemies = 0;
        
        // Initialize properties to avoid TypeScript errors
        this.difficulty = 'EASY';
        this.enemyConfig = { hp: 100, damage: 5, reward: 10 };
        this.enemyHP = 100;
        this.enemyMaxHP = 100;
        this.battleActive = true;
        this.score = 0;
        this.isPaused = false;
        this.playerId = null;
        this.playerDamage = 15;
        this.attackInProgress = false;
    }

    init(data: BattleSceneData): void {
        console.log('BattleScene init', data);
        // Get player data from localStorage if available
        let playerData: PlayerData | null = null;
        try {
            const storedData = localStorage.getItem('playerData');
            if (storedData) {
                playerData = JSON.parse(storedData);
                console.log('Loaded player data:', playerData);
            }
        } catch (error) {
            console.error('Error loading player data:', error);
        }
        
        // Default to EASY (green slime) regardless of passed difficulty
        this.difficulty = 'EASY';
        this.enemyConfig = {
            hp: 100,
            damage: 5,
            reward: 10
        };
        
        // Player stats - initialize from player data if available
        if (playerData) {
            this.playerDamage = playerData.attackValue || 15;
            this.attackSpeed = playerData.clickRate || 1;
            this.gold = playerData.gold || 0;
            
            // Initialize enemy health from player data
            // For current health
            if (playerData.currentEnemyHealth !== undefined) {
                this.enemyConfig = playerData.currentEnemyHealth;
                console.log(`Using current enemy health from server: ${this.enemyHP}`);
            } 
            
            // For max health
            if (playerData.currentEnemyMaxHealth !== undefined) {
                this.enemyMaxHP = playerData.currentEnemyMaxHealth;
                console.log(`Using enemy max health from server: ${this.enemyMaxHP}`);
            } 
        } else {
            // Fallback to default values
            this.playerDamage = 15;
            this.enemyHP = 999;
            this.enemyMaxHP = 999;
        }
        
        // Battle state
        this.battleActive = true;
        this.score = 0;
        this.isPaused = false;
        
        // Restore other stats from previous runs if they exist
        this.damagePerClick = data.damagePerClick || 1;
        this.defeatedEnemies = data.defeatedEnemies || 0;
        
        // Store the player ID if it was passed
        this.playerId = data.playerId || null;
    }

    preload(): void {
        // Load island background
        this.load.image('island', 'assets/characters/island.png');
        
        // Load slime sprites with correct dimensions (64x64)
        this.load.spritesheet('slime-idle', 'assets/characters/slime-idle-sheet.png', { 
            frameWidth: 64, 
            frameHeight: 64 
        });
        
        this.load.spritesheet('slime-hit', 'assets/characters/slime-hit-sheet.png', { 
            frameWidth: 64, 
            frameHeight: 64 
        });
        
        // Load hero character spritesheet
        this.load.spritesheet('hero-sheet', 'assets/characters/hero-sheet.png', {
            frameWidth: 32,
            frameHeight: 64
        });

        // Load hero attack spritesheet
        this.load.spritesheet('hero-attack', 'assets/characters/hero-attack.png', {
            frameWidth: 32,
            frameHeight: 64
        });
        
        // Load UI elements
        this.load.image('attack-button', 'assets/ui/attack-button.png');
    }

    create(): void {
        console.log('BattleScene create');
        // Set up background
        this.add.rectangle(0, 0, 800, 600, 0x2c1810).setOrigin(0);
        
        // Create battle area
        this.battleArea = this.add.rectangle(400, 300, 600, 300, 0x3c2820).setOrigin(0.5);
        
        // Log the player in if we have a player ID
        if (this.playerId) {
            this.loginPlayer(this.playerId);
        }

        // Island 1 is behind the player character
        // Add island sprite behind the characters - positioned to be behind both player and enemy
        // Position it exactly halfway between player (200,400) and slime (600,200)
        this.island = this.add.image(400, 310, 'island');
        this.island.setScale(4); // Scale up the island to fit the scene
        this.island.setDepth(0); // Set depth to ensure it's behind characters
        this.island.setPosition(200, 450);

        //  Island 2 is behind the enemy
        this.island2 = this.add.image(400, 310, 'island');
        this.island2.setScale(4); // Scale up the island to fit the scene
        this.island2.setDepth(0); // Set depth to ensure it's behind characters
        this.island2.setPosition(580, 220);
        
        // Add battle title
        this.add.text(400, 100, 'Idle Battle!', {
            fontSize: '48px',
            fontFamily: 'Arial',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);
        
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
        
        // Make entire battle area clickable for manual attacks
        this.battleArea.setInteractive();
        this.battleArea.on('pointerdown', () => {
            if (this.battleActive && !this.attackInProgress) {
                this.manualAttack();
            }
        });
    }
    
    createPlayer(): void {
        // Create player sprite in the bottom left but in front of the island
        this.player = this.add.sprite(200, 400, 'hero-sheet');
        
        // Scale the player
        this.player.setScale(2);
        
        // Set depth to ensure it's in front of the island
        this.player.setDepth(1);
        
        // Create player idle animation
        this.anims.create({
            key: 'hero-idle',
            frames: this.anims.generateFrameNumbers('hero-sheet', { start: 0, end: 3 }),
            frameRate: 6,
            repeat: -1
        });
        
        // Create player attack animation
        this.anims.create({
            key: 'hero-attack-anim',
            frames: this.anims.generateFrameNumbers('hero-attack', { start: 0, end: 3 }),
            frameRate: 12,
            repeat: 0
        });
        
        // Play idle animation
        this.player.play('hero-idle');
    }
    
    createEnemy(): void {
        // Create enemy sprite in the top right
        this.enemy = this.add.sprite(600, 200, 'slime-idle');
        
        // Scale the enemy
        this.enemy.setScale(2);
        
        // Set depth to ensure it's in front of the island
        this.enemy.setDepth(1);
        
        // Create the enemy animations
        this.anims.create({
            key: 'slime-idle-anim',
            frames: this.anims.generateFrameNumbers('slime-idle', { start: 0, end: 3 }),
            frameRate: 6,
            repeat: -1
        });
        
        this.anims.create({
            key: 'slime-hit-anim',
            frames: this.anims.generateFrameNumbers('slime-hit', { start: 0, end: 3 }),
            frameRate: 12,
            repeat: 0
        });
        
        // Play idle animation
        this.enemy.play('slime-idle-anim');
        
        // Set up health values
        this.enemyHP = this.enemyConfig.hp;
        this.enemyMaxHP = this.enemyConfig.hp;
        
        // Create health bars
        this.createHealthBars();
    }
    
    // We'll need to implement the remaining methods as we continue converting
    // This is a partial conversion due to the file size limitations
    
    createUI(): void {
        // Add pause button
        this.pauseButton = this.add.text(700, 50, 'Pause', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#ffffff',
            backgroundColor: '#444444',
            padding: { x: 10, y: 5 }
        })
        .setOrigin(0.5)
        .setInteractive()
        .on('pointerdown', () => this.togglePause());
        
        // Create stats panel
        this.createStatsPanel();
    }
    
    // Placeholder for method implementations that will be added in further conversions
    createStatsPanel(): void { /* Implementation will be added later */ }
    createUpgradeShop(): void { /* Implementation will be added later */ }
    getUpgradeCost(type: string): number { return 0; /* Implementation will be added later */ }
    upgradeAttackSpeed(): void { /* Implementation will be added later */ }
    upgradeDamage(): void { /* Implementation will be added later */ }
    upgradeClickDamage(): void { /* Implementation will be added later */ }
    updateGoldDisplay(): void { /* Implementation will be added later */ }
    updateStatsDisplay(): void { /* Implementation will be added later */ }
    setupAutomaticAttacks(): void { /* Implementation will be added later */ }
    createHealthBars(): void { /* Implementation will be added later */ }
    togglePause(): void { /* Implementation will be added later */ }
    startBattle(): void { /* Implementation will be added later */ }
    automaticAttack(): void { /* Implementation will be added later */ }
    manualAttack(): void { /* Implementation will be added later */ }
    executeAttack(damage: number): void { /* Implementation will be added later */ }
    showDamageNumber(damage: number): void { /* Implementation will be added later */ }
    updateEnemyHealthBar(): void { /* Implementation will be added later */ }
    enemyDefeated(): void { /* Implementation will be added later */ }
    update(time: number, delta: number): void { /* Implementation will be added later */ }
    async loginPlayer(playerId: string): Promise<void> { /* Implementation will be added later */ }
    showOfflineProgress(loginData: any): void { /* Implementation will be added later */ }
    getEnemySprite(): string { return ''; /* Implementation will be added later */ }
    getEnemyHitSprite(): string { return ''; /* Implementation will be added later */ }
} 