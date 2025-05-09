import Phaser from 'phaser';
import BattleScene from './scenes/BattleScene';
import StartScreen from './scenes/StartScreen';

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game',
    backgroundColor: '#2c1810', // Dark brown background
    scene: [StartScreen, BattleScene],
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 }
        }
    },
    dom: {
        createContainer: true
    }
};

new Phaser.Game(config); 