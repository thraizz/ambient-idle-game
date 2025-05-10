package ambient.digital.idlegamebackend.model

import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.ManyToMany
import jakarta.persistence.Table

@Entity
@Table(name = "UPGRADES")
class Upgrade(
    val name: String,
    val cost: Int,
    val description: String,
    val enabled: Boolean,
    val damageMultiplier: Double = 1.0,
    val clickRateMultiplier: Double = 1.0,
    val attackValueAddition: Int = 0,

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0
)