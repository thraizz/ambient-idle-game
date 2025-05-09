export interface PlayerData {
    id: number;
    name: string;
    gold: number;
    clickRate: number;
    attackValue: number;
    currentEnemyHealth: number;
    currentEnemyMaxHealth: number;
}


// Example of the response from the API
// {
//     "id": 66,
//     "name": "Aron123123",
//     "gold": 60,
//     "clickRate": 1,
//     "attackValue": 1,
//     "currentEnemyHealth": 96,
//     "currentEnemyMaxHealth": 100
// }