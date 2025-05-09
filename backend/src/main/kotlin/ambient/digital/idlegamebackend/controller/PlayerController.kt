package ambient.digital.idlegamebackend.controller

import ambient.digital.idlegamebackend.dto.CreatePlayerRequest
import ambient.digital.idlegamebackend.dto.PlayerResponse
import ambient.digital.idlegamebackend.model.Player
import ambient.digital.idlegamebackend.service.PlayerService
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
@RequestMapping("/api/players")
@Tag(name = "Player", description = "Player management API")
class PlayerController(private val playerService: PlayerService) {

    @Operation(
        summary = "Get all players",
        description = "Retrieve a list of all players in the game"
    )
    @ApiResponses(
        ApiResponse(
            responseCode = "200", 
            description = "Players found",
            content = [Content(
                mediaType = MediaType.APPLICATION_JSON_VALUE,
                array = ArraySchema(schema = Schema(implementation = PlayerResponse::class))
            )]
        )
    )
    @GetMapping
    fun getAllPlayers(): List<PlayerResponse> = 
        playerService.getAllPlayers().map { it.toPlayerResponse() }

    @Operation(
        summary = "Get player by ID",
        description = "Retrieve a specific player by their ID"
    )
    @ApiResponses(
        ApiResponse(
            responseCode = "200", 
            description = "Player found",
            content = [Content(
                mediaType = MediaType.APPLICATION_JSON_VALUE,
                schema = Schema(implementation = PlayerResponse::class)
            )]
        ),
        ApiResponse(
            responseCode = "404", 
            description = "Player not found"
        )
    )
    @GetMapping("/{id}")
    fun getPlayerById(
        @Parameter(description = "ID of the player to retrieve", required = true)
        @PathVariable id: Long
    ): PlayerResponse = 
        try {
            playerService.getPlayerById(id).toPlayerResponse()
        } catch (e: EntityNotFoundException) {
            throw ResponseStatusException(HttpStatus.NOT_FOUND, e.message)
        }

    @Operation(
        summary = "Create a new player",
        description = "Create a new player with the specified attributes"
    )
    @ApiResponses(
        ApiResponse(
            responseCode = "201", 
            description = "Player created successfully",
            content = [Content(
                mediaType = MediaType.APPLICATION_JSON_VALUE,
                schema = Schema(implementation = PlayerResponse::class)
            )]
        ),
        ApiResponse(
            responseCode = "400", 
            description = "Invalid request, such as duplicate player name"
        )
    )
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun createPlayer(
        @io.swagger.v3.oas.annotations.parameters.RequestBody(
            description = "Player details to create",
            required = true,
            content = [Content(
                schema = Schema(implementation = CreatePlayerRequest::class)
            )]
        )
        @RequestBody request: CreatePlayerRequest
    ): PlayerResponse {
        return try {
            val player = playerService.createPlayer(
                name = request.name,
                gold = request.gold,
                clickRate = request.clickRate,
                attackValue = request.attackValue
            )
            player.toPlayerResponse()
        } catch (e: IllegalArgumentException) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, e.message)
        }
    }

    private fun Player.toPlayerResponse() = PlayerResponse(
        id = id,
        name = name,
        gold = gold,
        clickRate = clickRate,
        attackValue = attackValue,
        currentEnemyHealth = currentEnemyHealth
    )
}
