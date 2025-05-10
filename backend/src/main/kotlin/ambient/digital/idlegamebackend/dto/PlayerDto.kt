package ambient.digital.idlegamebackend.dto

import io.swagger.v3.oas.annotations.media.Schema

@Schema(description = "Request object for creating a new player")
data class CreatePlayerRequest(
    @Schema(description = "Unique player ID", example = "1", required = true)
    val id: Long,

    @Schema(description = "Player name", example = "Warrior", required = true)
    val name: String,
    
    @Schema(description = "Initial gold amount", example = "100", defaultValue = "0")
    val gold: Int = 0,
    
    @Schema(description = "Initial click rate multiplier", example = "1.0", defaultValue = "1.0")
    val clickRate: Double = 1.0,
    
    @Schema(description = "Initial attack value", example = "10", defaultValue = "1")
    val attackValue: Int = 1
)

@Schema(description = "Response object representing a player")
data class PlayerResponse(
    @Schema(description = "Player ID", example = "1")
    val id: Long,
    
    @Schema(description = "Player name", example = "Warrior")
    val name: String,
    
    @Schema(description = "Current gold amount", example = "150")
    val gold: Int,
    
    @Schema(description = "Current click rate multiplier", example = "1.2")
    val clickRate: Double,
    
    @Schema(description = "Current attack value", example = "12")
    val attackValue: Int,

    @Schema(description= "Current Enemy health", example = "100")
    val currentEnemyHealth: Int,

    @Schema(description = "Current Enemy Max Health", example = "100")
    val currentEnemyMaxHealth: Int = 100,

    @Schema(description = "Level", example = "1")
    val level: Int,

    @Schema(description = "How many enemies the player has defeated", example = "34")
    val killCount: Int,

    @Schema(description = "the upgrades the player has")
    val upgrades: List<UpgradeResponse>
)
