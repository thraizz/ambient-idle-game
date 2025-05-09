package ambient.digital.idlegamebackend.model

import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import jakarta.persistence.Transient
import java.time.Instant

@Entity
@Table(name = "PLAYERS")
class Player(
    var name: String,
    var gold: Int = 0,
    var clickRate: Double = 1.0,
    var attackValue: Int = 1,
    var lastLoginTime: Long = Instant.now().epochSecond,
    var playTimeSeconds: Long = 0,
    var currentEnemyHealth: Int = 100,

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0
) {
    @Transient
    private val baseExperienceToLevel = 100

    @Transient
    private val experienceMultiplier = 1.5

    fun click(): Int {
        TODO("Not yet implemented")
    }

    fun addGold(amount: Int) {
        gold += amount
    }

    fun updateLoginTime() {
        val currentTime = Instant.now().epochSecond
        val sessionTime = currentTime - lastLoginTime
        playTimeSeconds += sessionTime
        lastLoginTime = currentTime
    }

    fun calculateOfflineProgress(): Int {
        return 0
    }

    fun update() {
        println("Updating player $name")

        val damage = clickRate * attackValue

        currentEnemyHealth -= damage.toInt()

        if(currentEnemyHealth < 0) {
            gold += 10;
            currentEnemyHealth = 100
        }
    }
}
