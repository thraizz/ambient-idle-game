package ambient.digital.idlegamebackend.model

import jakarta.persistence.CascadeType
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.OneToMany
import jakarta.persistence.Table
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

    @OneToMany(mappedBy = "player", cascade = [CascadeType.ALL], orphanRemoval = true)
    var playerUpgrades: MutableSet<PlayerUpgrade> = mutableSetOf(),

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0
) {

    val level: Int
        get() = killCount % 5 + 1
    
    val currentEnemyMaxHealth: Int
        get() = (level - 1) * 100 + 1

    val attackWithUpgrades: Int
        get() {
            var attackWithUpgrades = attackValue

            playerUpgrades.forEach {
                attackWithUpgrades += it.upgrade.attackValueAddition
            }

            playerUpgrades.forEach {
                val new = attackWithUpgrades * it.upgrade.damageMultiplier

                attackWithUpgrades = new.toInt()
            }

            return attackWithUpgrades
        }

    val clickRateWithUpgrades: Double
    get() {
        var clickRateWithUpgrades = clickRate

        playerUpgrades.forEach {
            clickRateWithUpgrades *= it.upgrade.clickRateMultiplier
        }

        return clickRateWithUpgrades
    }

    val dps: Double
        get(){
            return attackWithUpgrades * clickRateWithUpgrades
        }
    

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
        updateLoginTime()

        currentEnemyHealth -= dps.toInt()

        if(currentEnemyHealth < 0) {
            gold += 10;
            killCount += 1;
            currentEnemyHealth = currentEnemyMaxHealth;
        }
    }
}