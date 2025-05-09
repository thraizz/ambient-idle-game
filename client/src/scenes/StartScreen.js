export default class StartScreen extends Phaser.Scene {
    constructor() {
        super({ key: 'StartScreen' });
    }

    preload() {
        // Load any assets needed for the start screen
        this.load.html('nameform', '/assets/nameform.html');
    }

    create() {
        // Add title text
        this.add.text(400, 150, 'Ambient Idle Game', {
            fontSize: '48px',
            fontFamily: 'Arial',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        // Add subtitle
        this.add.text(400, 220, 'Enter your name to begin:', {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        // Create name input
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.id = 'nameInput';
        nameInput.style = 'width: 200px; padding: 8px; font-size: 16px; border-radius: 4px; border: none;';
        nameInput.placeholder = 'Enter your name';

        // Create start button
        const startButton = document.createElement('button');
        startButton.textContent = 'Start Game';
        startButton.style = `
            padding: 10px 20px;
            font-size: 16px;
            background-color: #2ecc71;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            margin-left: 10px;
        `;

        // Add elements to the game
        const element = this.add.dom(400, 300, nameInput);
        const buttonElement = this.add.dom(400, 350, startButton);

        // Handle button click
        startButton.addEventListener('click', () => {
            const name = nameInput.value.trim();
            if (name) {
                // Store the player name
                localStorage.setItem('playerName', name);
                // Transition to the battle scene
                this.scene.start('BattleScene', { difficulty: 'EASY' });
                console.log('Starting game with name:', name);
            } else {
                // Shake the input if no name is entered
                this.tweens.add({
                    targets: element,
                    x: 400,
                    ease: 'Power1',
                    duration: 100,
                    yoyo: true,
                    repeat: 3,
                    onStart: () => element.x = 395,
                    onComplete: () => element.x = 400
                });
            }
        });

        // Handle enter key
        nameInput.addEventListener('keyup', (event) => {
            if (event.key === 'Enter') {
                startButton.click();
            }
        });
        
        // Check if there's a final score from a previous game
        if (this.scene.settings.data && this.scene.settings.data.finalScore) {
            const finalScore = this.scene.settings.data.finalScore;
            
            // Display final score
            this.add.text(400, 500, `Previous Score: ${finalScore}`, {
                fontSize: '32px',
                fontFamily: 'Arial',
                color: '#ffff00',
                align: 'center'
            }).setOrigin(0.5);
        }
    }
} 