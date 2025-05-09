package ambient.digital.idlegamebackend.service

import ambient.digital.idlegamebackend.model.Game
import jakarta.annotation.PostConstruct
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class GameService(private val playerService: PlayerService) {

    // Main game instance
    private val game = Game()

    @PostConstruct
    fun initialize() {
        // Initialize game when service starts
        game.update()
    }

    @Transactional
    @Scheduled(cron="*/1 * * * * *") // Update game state every minute
    fun updateGameState() {
        game.update()
        game.getPlayers().forEach { player -> playerService.savePlayer(player) }
    }

    fun getGame(): Game {
        return game
    }

    @Transactional
    fun playerLogin(playerId: Long): Int {
        val player = playerService.getPlayerById(playerId)
        // Calculate offline progress when player logs in
        val offlineGold = game.calculateOfflineProgress(player)
        game.addPlayer(player)
        return offlineGold
    }

    @Transactional
    fun playerLogout(playerId: Long) {
        val player = playerService.getPlayerById(playerId)
        player.updateLoginTime()
        game.removePlayer(playerId)
        playerService.savePlayer(player)
    }

    @Transactional
    fun playerClick(playerId: Long): Int {
        TODO("Not yet implemented")
    }

    fun getActivePlayerCount(): Int {
        return game.getActivePlayerCount()
    }
}
