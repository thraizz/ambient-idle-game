package ambient.digital.idlegamebackend.service

import ambient.digital.idlegamebackend.model.Player
import ambient.digital.idlegamebackend.repository.PlayerRepository
import jakarta.persistence.EntityNotFoundException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class PlayerService(private val playerRepository: PlayerRepository) {

    fun getAllPlayers(): List<Player> = playerRepository.findAll()

    fun getPlayerById(id: Long): Player = playerRepository.findById(id)
        .orElseThrow { EntityNotFoundException("Player not found with id: $id") }

    @Transactional
    fun createPlayer(name: String, gold: Int = 0, clickRate: Double = 1.0, attackValue: Int = 1): Player {
        val existingPlayer = playerRepository.findByName(name)
        if (existingPlayer != null) {
            throw IllegalArgumentException("Player with name '$name' already exists")
        }
        
        val player = Player(name, gold, clickRate, attackValue)
        return playerRepository.save(player)
    }
    
    @Transactional
    fun savePlayer(player: Player): Player {
        return playerRepository.save(player)
    }
}
