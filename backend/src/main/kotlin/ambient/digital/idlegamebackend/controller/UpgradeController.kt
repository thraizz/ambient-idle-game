package ambient.digital.idlegamebackend.controller

import ambient.digital.idlegamebackend.dto.UpgradeResponse
import ambient.digital.idlegamebackend.model.Upgrade
import ambient.digital.idlegamebackend.service.UpgradeService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.media.ArraySchema
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.persistence.EntityNotFoundException
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.web.bind.annotation.*
import org.springframework.web.server.ResponseStatusException

@RestController
@RequestMapping("/api/upgrades")
@Tag(name = "Upgrade", description = "Upgrade management API")
class UpgradeController(private val upgradeService: UpgradeService) {

    @Operation(
        summary = "Get all upgrades",
        description = "Retrieve a list of all available upgrades in the game"
    )
    @ApiResponses(
        ApiResponse(
            responseCode = "200", 
            description = "Upgrades found",
            content = [Content(
                mediaType = MediaType.APPLICATION_JSON_VALUE,
                array = ArraySchema(schema = Schema(implementation = UpgradeResponse::class))
            )]
        )
    )
    @GetMapping
    fun getAllUpgrades(): List<UpgradeResponse> = 
        upgradeService.getAllUpgrades().map { it.toUpgradeResponse() }

    @Operation(
        summary = "Get upgrade by ID",
        description = "Retrieve a specific upgrade by its ID"
    )
    @ApiResponses(
        ApiResponse(
            responseCode = "200", 
            description = "Upgrade found",
            content = [Content(
                mediaType = MediaType.APPLICATION_JSON_VALUE,
                schema = Schema(implementation = UpgradeResponse::class)
            )]
        ),
        ApiResponse(
            responseCode = "404", 
            description = "Upgrade not found"
        )
    )
    @GetMapping("/{id}")
    fun getUpgradeById(
        @Parameter(description = "ID of the upgrade to retrieve", required = true)
        @PathVariable id: Long
    ): UpgradeResponse = 
        try {
            upgradeService.getUpgradeById(id).toUpgradeResponse()
        } catch (e: EntityNotFoundException) {
            throw ResponseStatusException(HttpStatus.NOT_FOUND, e.message)
        }

    private fun Upgrade.toUpgradeResponse() = UpgradeResponse(
        id = id,
        name = name,
        cost = cost,
        description = description,
        enabled = enabled
    )
}
