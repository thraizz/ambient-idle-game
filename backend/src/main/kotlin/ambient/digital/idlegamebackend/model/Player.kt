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
    var attackValue: Int = 2,
    var lastLoginTime: Long = Instant.now().epochSecond,
    var killCount: Int = 0,
    var playTimeSeconds: Long = 0,
    var currentEnemyHealth: Int = 1,

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0
) {
    
    val currentEnemyMaxHealth: Int
        get() = killCount % 5 * 100 + 1

    val dps: Double
        get() = attackValue * clickRate
    

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
        val secondsSinceLastLogin = Instant.now().epochSecond - lastLoginTime

        if(secondsSinceLastLogin < 1) {
            return 0
        }

        val killTimeCurrentEnemy = dps / currentEnemyMaxHealth

        val potentiallyEarnedGold = secondsSinceLastLogin / killTimeCurrentEnemy

        return (potentiallyEarnedGold / 100.0).toInt()
    }

    fun update() {
        println("Updating player $name")

        currentEnemyHealth -= dps.toInt()

        if(currentEnemyHealth < 0) {
            gold += 10;
            killCount += 1;
            currentEnemyHealth = currentEnemyMaxHealth;
        }
    }
}