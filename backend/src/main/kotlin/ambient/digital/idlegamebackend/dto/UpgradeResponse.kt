package ambient.digital.idlegamebackend.dto

import io.swagger.v3.oas.annotations.media.Schema

@Schema(description = "Response containing upgrade information")
data class UpgradeResponse(
    @Schema(description = "Unique identifier of the upgrade", example = "1")
    val id: Long,
    
    @Schema(description = "Name of the upgrade", example = "Double Damage")
    val name: String,
    
    @Schema(description = "Cost to purchase the upgrade", example = "100")
    val cost: Int,
    
    @Schema(description = "Description of the upgrade's effect", example = "Doubles your attack value")
    val description: String,
    
    @Schema(description = "Whether the upgrade is enabled for purchase", example = "true")
    val enabled: Boolean
)
