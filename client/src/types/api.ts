export interface PlayerData {
    id: number;
    name: string;
    gold: number;
    clickRate: number;
    attackValue: number;
    currentEnemyHealth: number;
    currentEnemyMaxHealth: number;
    level: number;
    killCount: number;
    upgrades: Upgrade[];
}

export interface Upgrade {
    id: number;
    name: string;
    cost: number;
    description: string;
    enabled: boolean;
}

// Example of the response from the API
// {
//     "id": 1,
//     "name": "aron",
//     "gold": 7049,
//     "clickRate": 7.0,
//     "attackValue": 2,
//     "currentEnemyHealth": 301,
//     "currentEnemyMaxHealth": 301,
//     "level": 4,
//     "killCount": 3,
//     "upgrades": [
//         {
//             "id": 1,
//             "name": "Faster Clicks",
//             "cost": 50,
//             "description": "Increases click rate by 10%",
//             "enabled": true
//         },
//         {
//             "id": 2,
//             "name": "Double Damage",
//             "cost": 100,
//             "description": "Doubles your attack value",
//             "enabled": true
//         }
//     ]
// }