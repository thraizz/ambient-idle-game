package ambient.digital.idlegamebackend.config

import org.springframework.context.annotation.Configuration
import org.springframework.scheduling.annotation.EnableScheduling
import org.springframework.context.annotation.Bean
import org.springframework.web.cors.CorsConfiguration
import org.springframework.web.cors.UrlBasedCorsConfigurationSource
import org.springframework.web.filter.CorsFilter

@Configuration
@EnableScheduling
class AppConfig {
    
    @Bean
    fun corsFilter(): CorsFilter {
        val source = UrlBasedCorsConfigurationSource()
        val config = CorsConfiguration()
        
        // Allow all origins - you should restrict this in production
        config.allowedOrigins = listOf("*")
        // Allow all common HTTP methods
        config.allowedMethods = listOf("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
        // Allow all headers
        config.allowedHeaders = listOf("*")
        // Allow credentials (cookies, authentication)
        config.allowCredentials = false
        
        source.registerCorsConfiguration("/**", config)
        return CorsFilter(source)
    }
}