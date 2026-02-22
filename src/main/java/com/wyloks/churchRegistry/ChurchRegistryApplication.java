package com.wyloks.churchRegistry;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ChurchRegistryApplication {

	public static void main(String[] args) {
		SpringApplication.run(ChurchRegistryApplication.class, args);
	}

}
