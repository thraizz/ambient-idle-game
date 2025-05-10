package ambient.digital.idlegamebackend.model

import jakarta.persistence.*

@Entity
@Table(name = "PLAYER_UPGRADES")
class PlayerUpgrade(
    @ManyToOne
    @JoinColumn(name = "player_id")
    var player: Player,

    @ManyToOne
    @JoinColumn(name = "upgrade_id")
    var upgrade: Upgrade,

    var count: Int = 1,

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0
)