package ambient.digital.idlegamebackend.service

import ambient.digital.idlegamebackend.model.Player
import io.mockk.every
import io.mockk.mockk
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import java.time.Instant

class GameServiceTest {
    val playerService = mockk<PlayerService>()

    val gameService = GameService(playerService)

    val mockPlayer = Player("TestPlayer", gold = 0, killCount = 0, attackValue = 1, clickRate = 1.0, lastLoginTime = Instant.now().epochSecond - 1000L)



    @Test
    fun playerLogin() {
        every { playerService.getPlayerById(1) } returns mockPlayer
        every { playerService.savePlayer(mockPlayer) } returns mockPlayer

        gameService.playerLogin(1)

        assertEquals(10, mockPlayer.gold)
    }
}