import Phaser from 'phaser';
import { API_URL } from '../config';

interface PlayerData {
    id: string;
    name: string;
    [key: string]: any;
}

interface BattleSceneData {
    difficulty: string;
    playerId: string;
    finalScore?: number;
}

export default class StartScreen extends Phaser.Scene {
    constructor() {
        super({ key: 'StartScreen' });
    }

    preload(): void {
        // Load any assets needed for the start screen
        this.load.html('nameform', '/assets/nameform.html');
    }

    create(): void {
        // Check if we already have player data in localStorage
        const playerData = localStorage.getItem('playerData');
        
        if (playerData) {
            try {
                // Parse the player data
                const parsedPlayerData = JSON.parse(playerData) as PlayerData;
                console.log('Found existing player data:', parsedPlayerData);
                
                // If we have a valid player ID, start the game immediately
                if (parsedPlayerData && parsedPlayerData.id) {
                    this.scene.start('BattleScene', { 
                        difficulty: 'EASY',
                        playerId: parsedPlayerData.id
                    });
                    return; // Exit early since we're starting the game
                }
            } catch (error) {
                console.error('Error parsing player data:', error);
                // Continue with normal flow if there's an error
            }
        }
        
        // If we don't have valid player data, continue with the normal signup flow
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
        nameInput.style.width = '200px';
        nameInput.style.padding = '8px';
        nameInput.style.fontSize = '16px';
        nameInput.style.borderRadius = '4px';
        nameInput.style.border = 'none';
        nameInput.placeholder = 'Enter your name';

        // Create start button
        const startButton = document.createElement('button');
        startButton.textContent = 'Start Game';
        startButton.style.padding = '10px 20px';
        startButton.style.fontSize = '16px';
        startButton.style.backgroundColor = '#2ecc71';
        startButton.style.color = 'white';
        startButton.style.border = 'none';
        startButton.style.borderRadius = '4px';
        startButton.style.cursor = 'pointer';
        startButton.style.marginLeft = '10px';

        // Add elements to the game
        const element = this.add.dom(400, 300, nameInput);

        // Create loading text (initially hidden)
        const loadingText = this.add.text(400, 400, 'Creating player...', {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);
        loadingText.visible = false;

        // Error text (initially hidden)
        const errorText = this.add.text(400, 400, '', {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#ff0000',
            align: 'center'
        }).setOrigin(0.5);
        errorText.visible = false;

        // Handle button click
        startButton.addEventListener('click', async () => {
            const name = nameInput.value.trim();
            if (name) {
                // Show loading, hide error if visible
                loadingText.visible = true;
                errorText.visible = false;
                
                try {
                    // Create player using API
                    const apiUrl = `${API_URL}/players`;
                    const response = await fetch(apiUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            name: name
                        })
                    });
                    
                    const playerData = await response.json();
                    
                    if (response.ok) {
                        // Store the player data
                        localStorage.setItem('playerName', name);
                        localStorage.setItem('playerData', JSON.stringify(playerData));
                        
                        // Transition to the battle scene
                        this.scene.start('BattleScene', { 
                            difficulty: 'EASY',
                            playerId: playerData.id
                        });
                        console.log('Starting game with player:', playerData);
                    } else {
                        // Show error message
                        errorText.setText(playerData.message || 'Failed to create player');
                        errorText.visible = true;
                        loadingText.visible = false;
                    }
                } catch (error) {
                    console.error('API error:', error);
                    errorText.setText('Network error, please try again');
                    errorText.visible = true;
                    loadingText.visible = false;
                }
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

        // Add the button to the DOM
        const buttonElement = this.add.dom(400, 350, startButton);

        // Handle enter key
        nameInput.addEventListener('keyup', (event) => {
            if (event.key === 'Enter') {
                startButton.click();
            }
        });
        
        // Check if there's a final score from a previous game
        const sceneData = this.scene.settings.data as BattleSceneData;
        if (sceneData && sceneData.finalScore) {
            const finalScore = sceneData.finalScore;
            
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