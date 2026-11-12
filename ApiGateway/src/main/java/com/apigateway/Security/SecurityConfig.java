package com.apigateway.Security;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;
import reactor.core.publisher.Mono;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
        http
                // Désactiver CSRF pour API Gateway
                .csrf(csrf -> csrf.disable())

                // Autorisations
                .authorizeExchange(auth -> auth
                        .pathMatchers("/public/**").permitAll()
                        .pathMatchers(HttpMethod.OPTIONS).permitAll()
                        .anyExchange().authenticated()
                )

                // Resource Server JWT pour Keycloak
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwtSpec -> {
                            // Optionnel : tu peux configurer un JwtDecoder personnalisé si nécessaire
                        })
                );

        return http.build();
    }

    /**
     * Filtre global pour relayer le token JWT vers les microservices.
     */
    @Component
    class TokenRelayFilter implements GlobalFilter {
        @Override
        public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
            String token = exchange.getRequest().getHeaders().getFirst("Authorization");
            if (token != null) {
                exchange = exchange.mutate()
                        .request(r -> r.header("Authorization", token))
                        .build();
            }
            return chain.filter(exchange);
        }
    }
}