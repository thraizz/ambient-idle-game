package ambient.digital.idlegamebackend.controller

import ambient.digital.idlegamebackend.dto.ClickResponse
import ambient.digital.idlegamebackend.dto.LoginResponse
import ambient.digital.idlegamebackend.service.GameService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.MediaType
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/game")
@Tag(name = "Game", description = "Game operations API")
class GameController(private val gameService: GameService) {

    @Operation(
        summary = "Player login",
        description = "Register player as active and calculate offline progress"
    )
    @ApiResponses(
        ApiResponse(
            responseCode = "200",
            description = "Player logged in successfully",
            content = [Content(
                mediaType = MediaType.APPLICATION_JSON_VALUE,
                schema = Schema(implementation = LoginResponse::class)
            )]
        )
    )
    @PostMapping("/login/{playerId}")
    fun playerLogin(
        @Parameter(description = "ID of the player logging in", required = true)
        @PathVariable playerId: Long
    ): LoginResponse {
        val offlineGold = gameService.playerLogin(playerId)
        return LoginResponse(
            success = true,
            offlineGold = offlineGold,
            message = if (offlineGold > 0) "You earned $offlineGold gold while offline!" else "Welcome back!"
        )
    }

    @Operation(
        summary = "Player logout",
        description = "Mark player as inactive and save their progress"
    )
    @ApiResponses(
        ApiResponse(
            responseCode = "200",
            description = "Player logged out successfully"
        )
    )
    @PostMapping("/logout/{playerId}")
    fun playerLogout(
        @Parameter(description = "ID of the player logging out", required = true)
        @PathVariable playerId: Long
    ) {
        gameService.playerLogout(playerId)
    }

    @Operation(
        summary = "Player click",
        description = "Process a player's click action to earn gold"
    )
    @ApiResponses(
        ApiResponse(
            responseCode = "200",
            description = "Click processed successfully",
            content = [Content(
                mediaType = MediaType.APPLICATION_JSON_VALUE,
                schema = Schema(implementation = ClickResponse::class)
            )]
        )
    )
    @PostMapping("/click/{playerId}")
    fun playerClick(
        @Parameter(description = "ID of the player clicking", required = true)
        @PathVariable playerId: Long
    ): ClickResponse {
        val goldEarned = gameService.playerClick(playerId)
        return ClickResponse(
            goldEarned = goldEarned,
            message = "You earned $goldEarned gold!"
        )
    }

    @Operation(
        summary = "Get active player count",
        description = "Get the number of players currently active in the game"
    )
    @ApiResponses(
        ApiResponse(
            responseCode = "200",
            description = "Active player count retrieved"
        )
    )
    @GetMapping("/active-players")
    fun getActivePlayerCount(): Map<String, Int> {
        return mapOf("count" to gameService.getActivePlayerCount())
    }
}
