package com.mangala.showroom.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

import java.io.IOException;

/**
 * Web MVC configuration:
 * - CORS for API routes
 * - Static resource serving with SPA fallback (index.html for unknown paths)
 *
 * The static directory is configurable at runtime via -Dapp.static-dir=file:../frontend/dist/
 * Defaults to the classpath static folder embedded in the JAR.
 */
@Configuration
public class WebConfig {

    @Value("${app.static-dir:classpath:/static/}")
    private String staticDir;

    private final ResourceLoader resourceLoader;

    public WebConfig(ResourceLoader resourceLoader) {
        this.resourceLoader = resourceLoader;
    }

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
                String location = staticDir.endsWith("/") ? staticDir : staticDir + "/";
                String indexPath = location + "index.html";

                registry.addResourceHandler("/**")
                        .addResourceLocations(location)
                        .resourceChain(true)
                        .addResolver(new PathResourceResolver() {
                            @Override
                            protected Resource getResource(String resourcePath, Resource loc)
                                    throws IOException {
                                Resource requested = loc.createRelative(resourcePath);
                                if (requested.exists() && requested.isReadable()) {
                                    return requested;
                                }
                                // SPA fallback: serve index.html for any unknown path
                                Resource indexHtml = resourceLoader.getResource(indexPath);
                                return indexHtml.exists() ? indexHtml : null;
                            }
                        });
            }
        };
    }
}
