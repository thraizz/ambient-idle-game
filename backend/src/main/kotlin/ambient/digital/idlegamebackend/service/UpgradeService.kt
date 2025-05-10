package ambient.digital.idlegamebackend.service

import org.springframework.stereotype.Service

import ambient.digital.idlegamebackend.model.Upgrade
import ambient.digital.idlegamebackend.repository.UpgradeRepository
import jakarta.persistence.EntityNotFoundException
import org.springframework.transaction.annotation.Transactional

@Service
class UpgradeService(
    private val upgradeRepository: UpgradeRepository,
) {
    fun getAllUpgrades(): List<Upgrade> = upgradeRepository.findAll()
    
    fun getUpgradeById(id: Long): Upgrade = upgradeRepository.findById(id)
        .orElseThrow { EntityNotFoundException("Upgrade not found with id: $id") }
    
    @Transactional
    fun saveUpgrade(upgrade: Upgrade): Upgrade = upgradeRepository.save(upgrade)
}