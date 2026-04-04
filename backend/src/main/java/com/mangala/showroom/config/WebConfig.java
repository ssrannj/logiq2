package com.mangala.showroom.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

import java.io.IOException;

/**
 * Web MVC configuration:
 * - CORS for API routes
 * - Static resource serving with SPA fallback (index.html for unknown paths)
 */
@Configuration
public class WebConfig {

    @Bean
    public WebMvcConfigurer webMvcConfigurer() {
        return new WebMvcConfigurer() {

            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**")
                        .allowedOriginPatterns("*")
                        .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                        .allowedHeaders("*")
                        .allowCredentials(true)
                        .maxAge(3600);
            }

            @Override
            public void addResourceHandlers(ResourceHandlerRegistry registry) {
                registry.addResourceHandler("/**")
                        .addResourceLocations("classpath:/static/")
                        .resourceChain(true)
                        .addResolver(new PathResourceResolver() {
                            @Override
                            protected Resource getResource(String resourcePath, Resource location)
                                    throws IOException {
                                Resource requested = location.createRelative(resourcePath);
                                // Serve the file if it exists (JS, CSS, images, etc.)
                                if (requested.exists() && requested.isReadable()) {
                                    return requested;
                                }
                                // Fallback to index.html for React Router paths
                                Resource indexHtml = new ClassPathResource("static/index.html");
                                return indexHtml.exists() ? indexHtml : null;
                            }
                        });
            }
        };
    }
}
