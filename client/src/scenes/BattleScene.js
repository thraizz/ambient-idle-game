import Phaser from 'phaser';
import { API_URL } from '../config';
export default class BattleScene extends Phaser.Scene {
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
    }

    init(data) {
        console.log('BattleScene init', data);
        // Get player data from localStorage if available
        let playerData = null;
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

    preload() {
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

    create() {
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
    
    createPlayer() {
        // Create player sprite in the bottom left but in front of the island
        this.player = this.add.sprite(200, 400, 'hero-sheet');
        
        // Scale the player
        this.player.setScale(2);
        
        // Set depth to ensure it's in front of the island
        this.player.setDepth(3);
        
        // Store original position
        this.playerOriginalX = 200;
        this.playerOriginalY = 400;
        
        // Create hero animations
        this.anims.create({
            key: 'hero-idle',
            frames: this.anims.generateFrameNumbers('hero-sheet', { start: 0, end: 0 }),
            frameRate: 5,
            repeat: -1
        });
        
        this.anims.create({
            key: 'hero-attack',
            frames: this.anims.generateFrameNumbers('hero-attack', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: 0
        });
        
        // Start with idle animation
        this.player.play('hero-idle');
    }
    
    createEnemy() {
        // Get sprite for enemy, its based on the max health
        this.enemy = this.add.sprite(600, 200, this.getEnemySprite());
        
        // Adjust scale - since we're now using the correct dimensions, we can use a smaller scale
        this.enemy.setScale(1.5);
        
        // Set depth to ensure it's in front of the island
        this.enemy.setDepth(2);
        
        // Create animations
        this.anims.create({
            key: 'idle',
            frames: this.anims.generateFrameNumbers(this.getEnemySprite(), { start: 0, end: 3 }),
            frameRate: 8,
            repeat: -1
        });
        
        this.anims.create({
            key: 'hit',
            frames: this.anims.generateFrameNumbers(this.getEnemyHitSprite(), { start: 0, end: 3 }),
            frameRate: 10,
            repeat: 0
        });
        
        // Play idle animation
        this.enemy.play('idle');
        
        // Set up blinking for hard enemies
        if (this.enemyConfig.blink) {
            this.setupBlinkEffect();
        }
        
        // Set initial HP
        this.enemyHP = this.enemyConfig.hp;
        this.enemyMaxHP = this.enemyConfig.hp;
    }
    
    createUI() {
        // Create health bars - only enemy health bar now
        this.createHealthBars();
        
        // Add stats panel
        this.createStatsPanel();
        
        // Add pause/resume button
        this.pauseButton = this.add.text(700, 50, '⏸️', {
            fontSize: '32px',
            fontFamily: 'Arial'
        }).setOrigin(0.5).setInteractive();
        this.pauseButton.setDepth(10);
        
        this.pauseButton.on('pointerdown', () => {
            this.togglePause();
        });
        
        // Add score text
        this.scoreText = this.add.text(50, 50, 'Score: 0', {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#ffffff'
        });
        this.scoreText.setDepth(1);
        
        // Add gold counter
        this.goldText = this.add.text(50, 80, `Gold: ${this.gold}`, {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#FFD700'
        });
        this.goldText.setDepth(10);
    }
    
    createStatsPanel() {
        const textPanelHeight = 170;
        // Add stats panel in the top left
        const statsPanel = this.add.rectangle(120, textPanelHeight, 200, 140, 0x000000, 0.7).setOrigin(0.5);
        statsPanel.setDepth(10);
        
        // Player stats title
        const statsTitle = this.add.text(120, textPanelHeight - 60, 'STATS', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(0.5);
        statsTitle.setDepth(10);
        
        // Attack speed stat
        const attackSpeedLabel = this.add.text(40, textPanelHeight - 30, 'Attack Speed:', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffffff'
        });
        attackSpeedLabel.setDepth(10);
        
        this.attackSpeedText = this.add.text(200, textPanelHeight - 30, `${this.attackSpeed.toFixed(1)}/s`, {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(1, 0);
        this.attackSpeedText.setDepth(10);
        
        // Damage stat
        const damageLabel = this.add.text(40, 170, 'Damage:', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffffff'
        });
        damageLabel.setDepth(10);
        
        this.damageText = this.add.text(200, 170, `${this.playerDamage}`, {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(1, 0);
        this.damageText.setDepth(10);
        
        // Click damage stat
        const clickLabel = this.add.text(40, 200, 'Click Damage:', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffffff'
        });
        clickLabel.setDepth(10);
        
        this.clickDamageText = this.add.text(200, 200, `+${this.damagePerClick}`, {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(1, 0);
        this.clickDamageText.setDepth(10);
        
        // Enemies defeated
        const enemiesDefeatedLabel = this.add.text(40, 230, 'Enemies Defeated:', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffffff'
        });
        enemiesDefeatedLabel.setDepth(10);
        
        this.enemiesDefeatedText = this.add.text(200, 230, `${this.defeatedEnemies}`, {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(1, 0);
        this.enemiesDefeatedText.setDepth(10);
    }
    
    createUpgradeShop() {
        // Upgrade panel in the bottom section
        this.add.rectangle(400, 520, 700, 120, 0x000000, 0.7).setOrigin(0.5);
        
        // Shop title
        this.add.text(400, 470, 'UPGRADES', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(0.5);
        
        // Attack Speed Upgrade
        const speedUpgradeButton = this.add.text(150, 520, `Speed +0.1\nCost: ${this.getUpgradeCost('speed')} gold`, {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffffff',
            backgroundColor: '#4a6fa5',
            padding: { x: 10, y: 5 },
            align: 'center'
        }).setOrigin(0.5).setInteractive();
        
        speedUpgradeButton.on('pointerdown', () => {
            this.upgradeAttackSpeed();
        });
        
        // Damage Upgrade
        const damageUpgradeButton = this.add.text(400, 520, `Damage +5\nCost: ${this.getUpgradeCost('damage')} gold`, {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffffff',
            backgroundColor: '#a54a4a',
            padding: { x: 10, y: 5 },
            align: 'center'
        }).setOrigin(0.5).setInteractive();
        
        damageUpgradeButton.on('pointerdown', () => {
            this.upgradeDamage();
        });
        
        // Click Damage Upgrade
        const clickUpgradeButton = this.add.text(650, 520, `Click Dmg +1\nCost: ${this.getUpgradeCost('click')} gold`, {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffffff',
            backgroundColor: '#4aa54a',
            padding: { x: 10, y: 5 },
            align: 'center'
        }).setOrigin(0.5).setInteractive();
        
        clickUpgradeButton.on('pointerdown', () => {
            this.upgradeClickDamage();
        });
        
        // Store buttons for updating their text
        this.speedUpgradeButton = speedUpgradeButton;
        this.damageUpgradeButton = damageUpgradeButton;
        this.clickUpgradeButton = clickUpgradeButton;
    }
    
    getUpgradeCost(type) {
        switch(type) {
            case 'speed':
                return Math.floor(50 * Math.pow(1.5, this.attackSpeed * 5));
            case 'damage':
                return Math.floor(100 * Math.pow(1.3, this.playerDamage / 5));
            case 'click':
                return Math.floor(75 * Math.pow(1.4, this.damagePerClick));
            default:
                return 100;
        }
    }
    
    upgradeAttackSpeed() {
        const cost = this.getUpgradeCost('speed');
        if (this.gold >= cost) {
            this.gold -= cost;
            this.attackSpeed += 0.1;
            this.updateGoldDisplay();
            this.updateStatsDisplay();
            this.setupAutomaticAttacks(); // Reset the attack timer with new speed
            
            // Update button text
            this.speedUpgradeButton.setText(`Speed +0.1\nCost: ${this.getUpgradeCost('speed')} gold`);
        }
    }
    
    upgradeDamage() {
        const cost = this.getUpgradeCost('damage');
        if (this.gold >= cost) {
            this.gold -= cost;
            this.playerDamage += 5;
            this.updateGoldDisplay();
            this.updateStatsDisplay();
            
            // Update button text
            this.damageUpgradeButton.setText(`Damage +5\nCost: ${this.getUpgradeCost('damage')} gold`);
        }
    }
    
    upgradeClickDamage() {
        const cost = this.getUpgradeCost('click');
        if (this.gold >= cost) {
            this.gold -= cost;
            this.damagePerClick += 1;
            this.updateGoldDisplay();
            this.updateStatsDisplay();
            
            // Update button text
            this.clickUpgradeButton.setText(`Click Dmg +1\nCost: ${this.getUpgradeCost('click')} gold`);
        }
    }
    
    updateGoldDisplay() {
        this.goldText.setText(`Gold: ${this.gold}`);
    }
    
    updateStatsDisplay() {
        this.attackSpeedText.setText(`${this.attackSpeed.toFixed(1)}/s`);
        this.damageText.setText(`${this.playerDamage}`);
        this.clickDamageText.setText(`+${this.damagePerClick}`);
        this.enemiesDefeatedText.setText(`${this.defeatedEnemies}`);
    }
    
    setupAutomaticAttacks() {
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
            loop: true
        });
    }
    
    createHealthBars() {
        // Enemy health bar background
        this.enemyHealthBg = this.add.rectangle(600, 150, 100, 10, 0x000000).setOrigin(0.5);
        this.enemyHealthBg.setDepth(10);
        
        // Enemy health bar
        this.enemyHealthBar = this.add.rectangle(600, 150, 100, 10, 0xFF0000).setOrigin(0.5);
        this.enemyHealthBar.setDepth(10);
        
        // Enemy health text
        this.enemyHealthText = this.add.text(600, 130, `${this.enemyHP}/${this.enemyMaxHP}`, {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(0.5);
        this.enemyHealthText.setDepth(10);
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            this.pauseButton.setText('▶️');
            this.attackTimer.paused = true;
        } else {
            this.pauseButton.setText('⏸️');
            this.attackTimer.paused = false;
        }
    }
    
    startBattle() {
        this.battleActive = true;
        
        // Show difficulty level
        const difficultyText = this.add.text(400, 150, `Difficulty: ${this.difficulty}`, {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(0.5);
        
        // Fade out difficulty text after 2 seconds
        this.time.delayedCall(2000, () => {
            this.tweens.add({
                targets: difficultyText,
                alpha: 0,
                duration: 1000,
                ease: 'Power2'
            });
        });
    }
    
    automaticAttack() {
        if (!this.battleActive || this.isPaused || this.attackInProgress) return;
        
        this.executeAttack(this.playerDamage);
    }
    
    manualAttack() {
        if (!this.battleActive || this.isPaused || this.attackInProgress) return;
        
        // Manual attacks do base damage plus bonus click damage
        this.executeAttack(this.playerDamage + this.damagePerClick);
    }
    
    executeAttack(damage) {
        // Set flag to prevent multiple concurrent attacks
        this.attackInProgress = true;
        
        // Play hero attack animation
        this.player.play('hero-attack');
        
        // Make player move towards enemy slightly
        this.tweens.add({
            targets: this.player,
            x: this.player.x + 50,
            duration: 300,
            yoyo: true,
            ease: 'Power1',
            onComplete: () => {
                // After player attack animation and movement, play enemy hit animation
                this.enemy.play('hit');
                
                // Shake enemy
                this.tweens.add({
                    targets: this.enemy,
                    x: 600 + Phaser.Math.Between(-10, 10),
                    y: 200 + Phaser.Math.Between(-10, 10),
                    duration: 50,
                    yoyo: true,
                    repeat: 3
                });
                
                // Calculate damage (with some randomness)
                const finalDamage = damage;
                
                // Damage number popup
                this.showDamageNumber(finalDamage);
                
                // Reduce slime HP
                this.enemyHP = Math.max(0, this.enemyHP - finalDamage);
                
                // Update health bar
                this.updateEnemyHealthBar();
                
                // Check if slime is defeated
                if (this.enemyHP <= 0) {
                    this.enemyDefeated();
                    return;
                }
                
                // Set attack in progress to false since we're done and there's no enemy turn
                this.attackInProgress = false;
            }
        });
        
        // Listen for hero animation complete to go back to idle
        this.player.on('animationcomplete', (animation) => {
            if (animation.key === 'hero-attack') {
                this.player.play('hero-idle');
            }
        });
        
        // Listen for enemy animation complete to go back to idle
        this.enemy.on('animationcomplete', (animation) => {
            if (animation.key === 'hit' && this.enemyHP > 0) {
                this.enemy.play('idle');
            }
        });
    }
    
    showDamageNumber(damage) {
        // Create a text showing the damage number
        const damageText = this.add.text(
            this.enemy.x + Phaser.Math.Between(-20, 20),
            this.enemy.y - 40,
            damage.toString(),
            {
                fontSize: '24px',
                fontFamily: 'Arial',
                color: '#ff0000',
                stroke: '#ffffff',
                strokeThickness: 2
            }
        ).setOrigin(0.5);
        
        // Animate the damage number
        this.tweens.add({
            targets: damageText,
            y: damageText.y - 50,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => {
                damageText.destroy();
            }
        });
    }
    
    updateEnemyHealthBar() {
        // Update the width of the health bar
        const healthPercent = this.enemyHP / this.enemyMaxHP;
        this.enemyHealthBar.width = 100 * healthPercent;
        
        // Update health text
        this.enemyHealthText.setText(`${this.enemyHP}/${this.enemyMaxHP}`);
        
        // Change color based on health remaining
        if (healthPercent < 0.2) {
            this.enemyHealthBar.fillColor = 0xff0000; // Red
        } else if (healthPercent < 0.5) {
            this.enemyHealthBar.fillColor = 0xffff00; // Yellow
        }
    }
    
    enemyDefeated() {
        this.battleActive = false; // Temporarily disable battle while showing victory
        this.defeatedEnemies++;
        
        // Stop enemy animations
        this.enemy.stop();
        
        // Add victory text
        const victoryText = this.add.text(400, 300, 'VICTORY!', {
            fontSize: '64px',
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5).setAlpha(0);
        
        // Fade in victory text
        this.tweens.add({
            targets: victoryText,
            alpha: 1,
            duration: 1000,
            ease: 'Power2'
        });
        
        // Add reward text
        const goldReward = this.enemyConfig.reward * 2;
        const rewardText = this.add.text(400, 380, `Reward: ${goldReward} gold`, {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#FFD700'
        }).setOrigin(0.5).setAlpha(0);
        
        // Fade in reward text
        this.tweens.add({
            targets: rewardText,
            alpha: 1,
            duration: 1000,
            ease: 'Power2',
            delay: 500
        });
        
        // Update score and gold
        this.score += this.enemyConfig.reward;
        this.gold += goldReward;
        this.scoreText.setText(`Score: ${this.score}`);
        this.updateGoldDisplay();
        this.updateStatsDisplay();
        
        // Make enemy fade away
        this.tweens.add({
            targets: this.enemy,
            alpha: 0,
            duration: 1000,
            ease: 'Power2'
        });
        
        // Reset attack in progress flag to prevent attack state lockup
        this.attackInProgress = false;
        
        // Automatically continue to the next enemy after a delay
        this.time.delayedCall(3000, () => {
            // Always default back to green slime (EASY)
            const nextDifficulty = 'EASY';
            
            // Show next enemy text
            const nextEnemyText = this.add.text(400, 450, `Next enemy: ${nextDifficulty} Slime`, {
                fontSize: '28px',
                fontFamily: 'Arial',
                color: '#ffffff'
            }).setOrigin(0.5);
            
            // Fade out all text elements
            this.time.delayedCall(1500, () => {
                this.tweens.add({
                    targets: [victoryText, rewardText, nextEnemyText],
                    alpha: 0,
                    duration: 500,
                    ease: 'Power2',
                    onComplete: () => {
                        // Restart scene with green slime
                        this.scene.restart({ 
                            difficulty: nextDifficulty, 
                            gold: this.gold,
                            attackSpeed: this.attackSpeed,
                            damagePerClick: this.damagePerClick,
                            defeatedEnemies: this.defeatedEnemies,
                            playerId: this.playerId
                        });
                    }
                });
            });
        });
    }
    
    update() {
        // Update game logic here if needed
    }

    // New method to handle player login
    async loginPlayer(playerId) {
        try {
            const apiUrl = `${API_URL}/game/login/${playerId}`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const loginData = await response.json();
            
            if (response.ok && loginData.success) {
                console.log('Player logged in successfully:', loginData);
                
                // If player earned gold while offline, show a notification
                if (loginData.offlineGold > 0) {
                    this.showOfflineProgress(loginData);
                    
                    // Update the player's gold amount
                    this.gold += loginData.offlineGold;
                    this.updateGoldDisplay();
                }
            } else {
                console.error('Failed to log in player:', loginData);
            }
        } catch (error) {
            console.error('Error logging in player:', error);
        }
    }
    
    // New method to show offline progress notification
    showOfflineProgress(loginData) {
        // Create a notification panel
        const panel = this.add.rectangle(400, 300, 500, 200, 0x000000, 0.8).setOrigin(0.5);
        panel.setDepth(100);
        
        // Add title text
        const titleText = this.add.text(400, 230, 'Welcome Back!', {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);
        titleText.setDepth(101);
        
        // Add message text
        const messageText = this.add.text(400, 300, loginData.message, {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);
        messageText.setDepth(101);
        
        // Add gold amount with gold color
        const goldText = this.add.text(400, 350, `+${loginData.offlineGold} gold`, {
            fontSize: '28px',
            fontFamily: 'Arial',
            color: '#FFD700',
            align: 'center'
        }).setOrigin(0.5);
        goldText.setDepth(101);
        
        // Add close button
        const closeButton = this.add.text(400, 400, 'Continue', {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#ffffff',
            backgroundColor: '#2ecc71',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive();
        closeButton.setDepth(101);
        
        // Handle close button click
        closeButton.on('pointerdown', () => {
            // Remove all notification elements
            panel.destroy();
            titleText.destroy();
            messageText.destroy();
            goldText.destroy();
            closeButton.destroy();
        });
    }

    getEnemySprite() {
        // Get sprite based on enemy max health
        // TODO: Add more sprites based on enemy max health
        return 'slime-idle';
    }

    getEnemyHitSprite() {
        // Get sprite based on enemy max health
        // TODO: Add more sprites based on enemy max health
        return 'slime-hit';
    }
} 