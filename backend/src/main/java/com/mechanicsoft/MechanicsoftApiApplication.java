package com.mechanicsoft;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class MechanicsoftApiApplication {

    // Lee la versión desde el pom.xml
    @Value("${spring.application.name:Mechanicsoft}")
    private String appName;

    @Value("${spring.profiles.active:default}")
    private String profile;

    @Value("${server.port:8080}")
    private String port;

    public static void main(String[] args) {
        SpringApplication.run(MechanicsoftApiApplication.class, args);
    }

    @PostConstruct
    public void printBanner() {
        String ascii = """
                 __  __                                 _                _     
                |  \\/  | ___  ___ __ _ _   _  ___  ___ | |_  ___   ___  | |_   
                | |\\/| |/ _ \\/ __/ _` | | | |/ __|/ _ \\| __|/ _ \\ / __| | __|  
                | |  | |  __/ (_| (_| | |_| | (__| (_) | |_| (_) | (__  | |_   
                |_|  |_|\\___|\\___\\__,_|\\__,_|\\___|\\___/ \\__|\\___/ \\___|  \\__|  
                """;

        String banner = """
                %s
                =========================================================
                APP: %s
                MODO: %s
                PUERTO: %s
                =========================================================
                """.formatted(ascii, appName.toUpperCase(), profile.toUpperCase(), port);
        System.out.println(banner);
    }

}
