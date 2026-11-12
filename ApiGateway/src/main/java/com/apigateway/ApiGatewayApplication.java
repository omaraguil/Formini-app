package com.apigateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
@EnableDiscoveryClient
public class ApiGatewayApplication {

    public static void main(String[] args) {
        SpringApplication.run(ApiGatewayApplication.class, args);
    }

    @Bean
    public RouteLocator gatewayRoutes(RouteLocatorBuilder builder) {
        return builder.routes()
                .route("session-service", r -> r.path("/api/sessions/**")
                        .uri("lb://MS-SESSIONMANGEMENT"))
                .route("planning-service", r -> r.path("/api/plannings/**")
                        .uri("lb://MS-SESSIONMANGEMENT")) // or another service
                .route("location-service", r -> r.path("/api/location/**")
                        .uri("lb://MS-SESSIONMANGEMENT")) // example service
                .route("evaluation-service", r -> r.path(
                                "/evaluations/**")
                        .uri("lb://MS-EVALUATION"))
                   .route("forum-service", r -> r.path("/api/posts/**")
                        .uri("lb://forum-service"))
                .route("event-service", r -> r.path("/api/events/**")
                        .uri("lb://event-service"))
                .route("trainer-hiring-service", r -> r.path("/api/trainers/**")
                        .uri("lb://MS-TRAINERHIRING"))
                .route("partner-hiring-service", r -> r.path("/api/partners/**")
                        .uri("lb://MS-TRAINERHIRING"))
                .route("MS-Course", r -> r.path("/api/courses/**") // Capture tout sous /api/evaluations
                        .uri("lb://MS-COURSE"))      .route("enrollment-service", r -> r
                        .path("/msenrollment/**")
                        .uri("lb://MS-ENROLLMENT"))

                .build();




    }

}

