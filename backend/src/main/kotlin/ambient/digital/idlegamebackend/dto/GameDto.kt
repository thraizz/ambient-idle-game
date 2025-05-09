package ambient.digital.idlegamebackend.dto

import io.swagger.v3.oas.annotations.media.Schema

@Schema(description = "Response object for game information")
data class GameInfoResponse(
    @Schema(description = "Game ID", example = "default-game")
    val id: String,

    @Schema(description = "Game name", example = "Idle Adventure")
    val name: String,

    @Schema(description = "Game start time (epoch seconds)", example = "1625097600")
    val startTime: Long,

    @Schema(description = "Last game update time (epoch seconds)", example = "1625184000")
    val lastUpdateTime: Long,

    @Schema(description = "Number of active players", example = "5")
    val activePlayerCount: Int,

    @Schema(description = "List of enemies in the game")
    val enemies: List<Map<String, Any>>
)

@Schema(description = "Request object for attacking an enemy")
data class AttackRequest(
    @Schema(description = "Index of the enemy to attack", example = "0", required = true)
    val enemyIndex: Int
)

@Schema(description = "Response object for attack action")
data class AttackResponse(
    @Schema(description = "Whether the attack was successful (enemy defeated)", example = "true")
    val success: Boolean,

    @Schema(description = "Amount of damage dealt", example = "25")
    val damageDealt: Int,

    @Schema(description = "Gold earned from the attack", example = "15")
    val goldEarned: Int,

    @Schema(description = "Experience gained from the attack", example = "10")
    val experienceGained: Int,

    @Schema(description = "Message describing the result", example = "You defeated the enemy and earned 15 gold and 10 experience!")
    val message: String
)

@Schema(description = "Response object for click action")
data class ClickResponse(
    @Schema(description = "Gold earned from the click", example = "5")
    val goldEarned: Int,

    @Schema(description = "Message describing the result", example = "You earned 5 gold!")
    val message: String
)

@Schema(description = "Response object for player login")
data class LoginResponse(
    @Schema(description = "Whether login was successful", example = "true")
    val success: Boolean,

    @Schema(description = "Gold earned while offline", example = "120")
    val offlineGold: Int,

    @Schema(description = "Welcome message", example = "You earned 120 gold while offline!")
    val message: String
)
