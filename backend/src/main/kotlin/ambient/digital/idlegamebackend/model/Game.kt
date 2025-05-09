package ambient.digital.idlegamebackend.model

import java.time.Instant
import java.util.concurrent.ConcurrentHashMap

/**
 * The Game class represents the core game state and business logic
 * This is not a JPA entity but a domain object holding game state and rules
 */
class Game(
    val id: String = "default-game",
    var name: String = "Idle Adventure",
    var startTime: Long = Instant.now().epochSecond,
    var lastUpdateTime: Long = Instant.now().epochSecond
) {
    // Active player sessions
    private val activePlayers: MutableMap<Long, Player> = ConcurrentHashMap()

    fun addPlayer(player: Player) {
        player.updateLoginTime()
        activePlayers[player.id] = player
    }

    fun removePlayer(playerId: Long) {
        activePlayers[playerId]?.updateLoginTime()
        activePlayers.remove(playerId)
    }

    fun getActivePlayerCount(): Int {
        return activePlayers.size
    }

    fun calculateOfflineProgress(player: Player): Int {
        return player.calculateOfflineProgress()
    }

    fun update() {
        activePlayers.forEach { (_, player) -> player.update() }
    }

    fun getPlayers(): List<Player> {
        return activePlayers.values.toList()
    }
}
