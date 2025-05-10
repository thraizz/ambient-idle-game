package ambient.digital.idlegamebackend.repository

import ambient.digital.idlegamebackend.model.Upgrade
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface UpgradeRepository : JpaRepository<Upgrade, Long> {
    override fun findAll(): List<Upgrade>
}