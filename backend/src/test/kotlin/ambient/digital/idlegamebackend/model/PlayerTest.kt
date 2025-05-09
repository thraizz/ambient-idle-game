package ambient.digital.idlegamebackend.model

import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import java.time.Instant

class PlayerTest {
    @Test
    fun calculateOfflineProgress() {
        val player = Player("TestPlayer",0, clickRate = 1.0, attackValue = 1)
        player.killCount = 10
        player.lastLoginTime = Instant.now().epochSecond - 100L

        assertEquals(1, player.calculateOfflineProgress())
    }

}