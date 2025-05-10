package ambient.digital.idlegamebackend.config

import ambient.digital.idlegamebackend.model.Upgrade
import ambient.digital.idlegamebackend.repository.UpgradeRepository
import org.springframework.boot.CommandLineRunner
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class DataInitializer {

    @Bean
    fun upgradeDataInitializer(upgradeRepository: UpgradeRepository): CommandLineRunner {
        return CommandLineRunner {
            // Check if we already have upgrades in the database
            if (upgradeRepository.count() == 0L) {
                val upgrades = listOf(
                    Upgrade(
                        name = "Faster Clicks",
                        cost = 50,
                        description = "Increases click rate by 10%",
                        enabled = true
                    ),
                    Upgrade(
                        name = "Double Damage",
                        cost = 100,
                        description = "Doubles your attack value",
                        enabled = true
                    ),
                    Upgrade(
                        name = "Gold Rush",
                        cost = 200,
                        description = "Increases gold drops by 25%",
                        enabled = true
                    ),
                    Upgrade(
                        name = "Critical Hits",
                        cost = 500,
                        description = "10% chance to deal triple damage",
                        enabled = true
                    ),
                    Upgrade(
                        name = "Auto Clicker",
                        cost = 1000,
                        description = "Automatically clicks once per second",
                        enabled = true
                    ),
                    Upgrade(
                        name = "Idle Gold",
                        cost = 750,
                        description = "Earn gold while offline",
                        enabled = true
                    ),
                    Upgrade(
                        name = "Ruthless Efficiency",
                        cost = 2000,
                        description = "Increases all damage by 50%",
                        enabled = false
                    ),
                    Upgrade(
                        name = "Master Looter",
                        cost = 3000,
                        description = "Double gold from all sources",
                        enabled = false
                    )
                )
                upgradeRepository.saveAll(upgrades)
                println("Initialized ${upgrades.size} upgrades")
            }
        }
    }
}
