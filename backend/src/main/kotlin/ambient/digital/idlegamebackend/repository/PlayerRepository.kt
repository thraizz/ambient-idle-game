package ambient.digital.idlegamebackend.repository

import ambient.digital.idlegamebackend.model.Player
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface PlayerRepository : JpaRepository<Player, Long> {
    fun findByName(name: String): Player?
}
