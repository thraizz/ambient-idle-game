package ambient.digital.idlegamebackend

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class IdleGameBackendApplication

fun main(args: Array<String>) {
    runApplication<IdleGameBackendApplication>(*args)
}
