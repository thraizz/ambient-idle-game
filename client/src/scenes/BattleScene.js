import Phaser from 'phaser';

export default class BattleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BattleScene' });
        
        // Slime difficulty levels
        this.SLIME_TYPES = {
            EASY: {
                key: 'green-slime',
                color: 0x8AFF5D,
                hp: 50,
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
        // Get difficulty from data or default to EASY
        this.difficulty = data.difficulty || 'EASY';
        this.slimeConfig = this.SLIME_TYPES[this.difficulty];
        
        // Player stats
        this.playerHP = 100;
        this.playerMaxHP = 100;
        this.playerDamage = 15;
        
        // Battle state
        this.battleActive = false;
        this.score = 0;
        this.isPaused = false;
        
        // Restore gold and stats from previous runs if they exist
        this.gold = data.gold || 0;
        this.attackSpeed = data.attackSpeed || 1;
        this.damagePerClick = data.damagePerClick || 1;
        this.defeatedEnemies = data.defeatedEnemies || 0;
    }

    preload() {
        // Load slime sprites with correct dimensions (64x64)
        this.load.spritesheet('slime-idle', 'assets/characters/slime-idle-sheet.png', { 
            frameWidth: 64, 
            frameHeight: 64 
        });
        
        this.load.spritesheet('slime-hit', 'assets/characters/slime-hit-sheet.png', { 
            frameWidth: 64, 
            frameHeight: 64 
        });
        
        // Load player character - using single images instead of spritesheets
        this.load.image('senior-codewarrior', 'assets/characters/senior_codewarrior.png');
        this.load.image('senior-codewarrior-idle', 'assets/characters/senior_codewarrior_idle.png');
        this.load.image('senior-codewarrior-attack', 'assets/characters/senior_codewarrior_attack.png');
        
        // Load UI elements
        this.load.image('attack-button', 'assets/ui/attack-button.png');
    }

    create() {
        // Set up background
        this.add.rectangle(0, 0, 800, 600, 0x2c1810).setOrigin(0);
        
        // Create battle area
        this.battleArea = this.add.rectangle(400, 300, 600, 300, 0x3c2820).setOrigin(0.5);
        
        // Add battle title
        this.add.text(400, 100, 'Idle Battle!', {
            fontSize: '48px',
            fontFamily: 'Arial',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);
        
        // Create slime based on difficulty (top right)
        this.createSlime();
        
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
        // Create player sprite in the bottom left
        this.player = this.add.sprite(200, 400, 'senior-codewarrior-idle');
        
        // Scale the player
        this.player.setScale(2);
        
        // Store original position
        this.playerOriginalX = 200;
        this.playerOriginalY = 400;
    }
    
    createSlime() {
        // Create slime sprite in the top right
        this.slime = this.add.sprite(600, 200, 'slime-idle');
        
        // Adjust scale - since we're now using the correct dimensions, we can use a smaller scale
        this.slime.setScale(1.5);
        
        // Set slime tint based on difficulty
        this.slime.setTint(this.slimeConfig.color);
        
        // Create slime animations
        this.anims.create({
            key: 'idle',
            frames: this.anims.generateFrameNumbers('slime-idle', { start: 0, end: 3 }),
            frameRate: 8,
            repeat: -1
        });
        
        this.anims.create({
            key: 'hit',
            frames: this.anims.generateFrameNumbers('slime-hit', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: 0
        });
        
        // Play idle animation
        this.slime.play('idle');
        
        // Set up blinking for hard slime
        if (this.slimeConfig.blink) {
            this.setupBlinkEffect();
        }
        
        // Set initial HP
        this.slimeHP = this.slimeConfig.hp;
        this.slimeMaxHP = this.slimeConfig.hp;
    }
    
    setupBlinkEffect() {
        // Create a blinking effect for the hard (red) slime
        this.time.addEvent({
            delay: 500,
            callback: () => {
                if (this.slime.tint === this.slimeConfig.color) {
                    // Blink to bright white-red
                    this.slime.setTint(0xFFADAD);
                } else {
                    // Back to normal red
                    this.slime.setTint(this.slimeConfig.color);
                }
            },
            loop: true
        });
    }
    
    createUI() {
        // Create health bars
        this.createHealthBars();
        
        // Add stats panel
        this.createStatsPanel();
        
        // Add pause/resume button
        this.pauseButton = this.add.text(700, 50, '⏸️', {
            fontSize: '32px',
            fontFamily: 'Arial'
        }).setOrigin(0.5).setInteractive();
        
        this.pauseButton.on('pointerdown', () => {
            this.togglePause();
        });
        
        // Add score text
        this.scoreText = this.add.text(50, 50, 'Score: 0', {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#ffffff'
        });
        
        // Add gold counter
        this.goldText = this.add.text(50, 80, `Gold: ${this.gold}`, {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#FFD700'
        });
    }
    
    createStatsPanel() {
        // Add stats panel in the top left
        this.add.rectangle(120, 170, 200, 140, 0x000000, 0.7).setOrigin(0.5);
        
        // Player stats title
        this.add.text(120, 110, 'STATS', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(0.5);
        
        // Attack speed stat
        this.add.text(40, 140, 'Attack Speed:', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffffff'
        });
        
        this.attackSpeedText = this.add.text(200, 140, `${this.attackSpeed.toFixed(1)}/s`, {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(1, 0);
        
        // Damage stat
        this.add.text(40, 170, 'Damage:', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffffff'
        });
        
        this.damageText = this.add.text(200, 170, `${this.playerDamage}`, {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(1, 0);
        
        // Click damage stat
        this.add.text(40, 200, 'Click Damage:', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffffff'
        });
        
        this.clickDamageText = this.add.text(200, 200, `+${this.damagePerClick}`, {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(1, 0);
        
        // Enemies defeated
        this.add.text(40, 230, 'Enemies Defeated:', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffffff'
        });
        
        this.enemiesDefeatedText = this.add.text(200, 230, `${this.defeatedEnemies}`, {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(1, 0);
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
        // Slime health bar background (above the slime)
        this.add.rectangle(600, 140, 200, 20, 0x000000).setOrigin(0.5);
        
        // Slime health bar
        this.slimeHealthBar = this.add.rectangle(600, 140, 200, 20, 0xff0000).setOrigin(0.5);
        
        // Slime health text
        this.slimeHealthText = this.add.text(600, 140, `${this.slimeHP}/${this.slimeMaxHP}`, {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(0.5);
        
        // Player health bar background (above the player)
        this.add.rectangle(200, 340, 200, 20, 0x000000).setOrigin(0.5);
        
        // Player health bar
        this.playerHealthBar = this.add.rectangle(200, 340, 200, 20, 0x00ff00).setOrigin(0.5);
        
        // Player health text
        this.playerHealthText = this.add.text(200, 340, `${this.playerHP}/${this.playerMaxHP}`, {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(0.5);
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
        
        // Switch to attack texture
        this.player.setTexture('senior-codewarrior-attack');
        
        // Make player move towards slime slightly
        this.tweens.add({
            targets: this.player,
            x: this.player.x + 50,
            duration: 300,
            yoyo: true,
            ease: 'Power1',
            onComplete: () => {
                // Switch back to idle texture after attack movement
                this.player.setTexture('senior-codewarrior-idle');
                
                // After player attack animation and movement, play slime hit animation
                this.slime.play('hit');
                
                // Shake slime
                this.tweens.add({
                    targets: this.slime,
                    x: 600 + Phaser.Math.Between(-10, 10),
                    y: 200 + Phaser.Math.Between(-10, 10),
                    duration: 50,
                    yoyo: true,
                    repeat: 3
                });
                
                // Calculate damage (with some randomness)
                const finalDamage = damage + Phaser.Math.Between(-3, 3);
                
                // Damage number popup
                this.showDamageNumber(finalDamage);
                
                // Reduce slime HP
                this.slimeHP = Math.max(0, this.slimeHP - finalDamage);
                
                // Update health bar
                this.updateSlimeHealthBar();
                
                // Check if slime is defeated
                if (this.slimeHP <= 0) {
                    this.slimeDefeated();
                    return;
                }
                
                // Slime turn after a delay
                this.time.delayedCall(500, () => {
                    this.slimeTurn();
                });
            }
        });
        
        // Listen for slime animation complete to go back to idle
        this.slime.on('animationcomplete', (animation) => {
            if (animation.key === 'hit' && this.slimeHP > 0) {
                this.slime.play('idle');
            }
        });
    }
    
    slimeTurn() {
        if (!this.battleActive) return;
        
        // Slime moves towards player
        this.tweens.add({
            targets: this.slime,
            x: this.slime.x - 50,
            duration: 300,
            yoyo: true,
            ease: 'Power1',
            onComplete: () => {
                // Calculate slime damage (with some randomness)
                const damage = this.slimeConfig.damage + Phaser.Math.Between(-2, 2);
                
                // Reduce player HP
                this.playerHP = Math.max(0, this.playerHP - damage);
                
                // Update player health bar
                this.updatePlayerHealthBar();
                
                // Visual feedback for player being hit
                this.cameras.main.shake(200, 0.01);
                
                // Briefly flash the player red
                this.player.setTint(0xff0000);
                this.time.delayedCall(200, () => {
                    this.player.clearTint();
                });
                
                // Check if player is defeated
                if (this.playerHP <= 0) {
                    this.playerDefeated();
                    return;
                }
                
                // Reset attack in progress flag
                this.attackInProgress = false;
            }
        });
    }
    
    showDamageNumber(damage) {
        // Create a text showing the damage number
        const damageText = this.add.text(
            this.slime.x + Phaser.Math.Between(-20, 20),
            this.slime.y - 40,
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
    
    updateSlimeHealthBar() {
        // Update the width of the health bar
        const healthPercent = this.slimeHP / this.slimeMaxHP;
        this.slimeHealthBar.width = 200 * healthPercent;
        
        // Update health text
        this.slimeHealthText.setText(`${this.slimeHP}/${this.slimeMaxHP}`);
        
        // Change color based on health remaining
        if (healthPercent < 0.2) {
            this.slimeHealthBar.fillColor = 0xff0000; // Red
        } else if (healthPercent < 0.5) {
            this.slimeHealthBar.fillColor = 0xffff00; // Yellow
        }
    }
    
    updatePlayerHealthBar() {
        // Update the width of the health bar
        const healthPercent = this.playerHP / this.playerMaxHP;
        this.playerHealthBar.width = 200 * healthPercent;
        
        // Update health text
        this.playerHealthText.setText(`${this.playerHP}/${this.playerMaxHP}`);
        
        // Change color based on health remaining
        if (healthPercent < 0.2) {
            this.playerHealthBar.fillColor = 0xff0000; // Red
        } else if (healthPercent < 0.5) {
            this.playerHealthBar.fillColor = 0xffff00; // Yellow
        }
    }
    
    slimeDefeated() {
        this.battleActive = false;
        this.defeatedEnemies++;
        
        // Stop slime animations
        this.slime.stop();
        
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
        const goldReward = this.slimeConfig.reward * 2;
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
        this.score += this.slimeConfig.reward;
        this.gold += goldReward;
        this.scoreText.setText(`Score: ${this.score}`);
        this.updateGoldDisplay();
        this.updateStatsDisplay();
        
        // Add continue button
        this.time.delayedCall(2000, () => {
            const continueButton = this.add.text(400, 450, 'CONTINUE', {
                fontSize: '32px',
                fontFamily: 'Arial',
                color: '#ffffff',
                backgroundColor: '#2ecc71',
                padding: { x: 20, y: 10 }
            }).setOrigin(0.5).setInteractive();
            
            continueButton.on('pointerdown', () => {
                // Choose next difficulty or return to menu
                if (this.difficulty === 'EASY') {
                    this.scene.restart({ 
                        difficulty: 'MEDIUM', 
                        gold: this.gold,
                        attackSpeed: this.attackSpeed,
                        damagePerClick: this.damagePerClick,
                        defeatedEnemies: this.defeatedEnemies
                    });
                } else if (this.difficulty === 'MEDIUM') {
                    this.scene.restart({ 
                        difficulty: 'HARD', 
                        gold: this.gold,
                        attackSpeed: this.attackSpeed,
                        damagePerClick: this.damagePerClick,
                        defeatedEnemies: this.defeatedEnemies
                    });
                } else {
                    // Cycle back to easy with increased difficulty (hp multiplier)
                    this.scene.restart({ 
                        difficulty: 'EASY', 
                        gold: this.gold,
                        attackSpeed: this.attackSpeed,
                        damagePerClick: this.damagePerClick,
                        defeatedEnemies: this.defeatedEnemies
                    });
                }
            });
        });
        
        // Make slime fade away
        this.tweens.add({
            targets: this.slime,
            alpha: 0,
            duration: 1000,
            ease: 'Power2'
        });
    }
    
    playerDefeated() {
        this.battleActive = false;
        
        // Add defeat text
        const defeatText = this.add.text(400, 300, 'DEFEAT!', {
            fontSize: '64px',
            fontFamily: 'Arial',
            color: '#ff0000',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5).setAlpha(0);
        
        // Fade in defeat text
        this.tweens.add({
            targets: defeatText,
            alpha: 1,
            duration: 1000,
            ease: 'Power2'
        });
        
        // Add retry button
        this.time.delayedCall(2000, () => {
            const retryButton = this.add.text(400, 400, 'RETRY', {
                fontSize: '32px',
                fontFamily: 'Arial',
                color: '#ffffff',
                backgroundColor: '#e74c3c',
                padding: { x: 20, y: 10 }
            }).setOrigin(0.5).setInteractive();
            
            retryButton.on('pointerdown', () => {
                this.scene.restart({ 
                    difficulty: this.difficulty,
                    gold: this.gold,
                    attackSpeed: this.attackSpeed,
                    damagePerClick: this.damagePerClick,
                    defeatedEnemies: this.defeatedEnemies
                });
            });
            
            const menuButton = this.add.text(400, 470, 'MENU', {
                fontSize: '32px',
                fontFamily: 'Arial',
                color: '#ffffff',
                backgroundColor: '#3498db',
                padding: { x: 20, y: 10 }
            }).setOrigin(0.5).setInteractive();
            
            menuButton.on('pointerdown', () => {
                this.scene.start('StartScreen');
            });
        });
    }
    
    update() {
        // Update game logic here if needed
    }
} 