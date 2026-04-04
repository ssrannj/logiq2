package com.mangala.showroom.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * Catches all non-API routes and returns index.html so React Router
 * can handle client-side navigation in the deployed environment.
 */
@RestController
public class SpaController {

    private byte[] indexHtml;

    @GetMapping(value = { "/", "/{path:[^\\.]*}", "/{path:[^\\.]*}/**" },
                produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<byte[]> spa(HttpServletRequest request) throws IOException {
        String uri = request.getRequestURI();

        // Let Spring handle actual API and static asset requests
        if (uri.startsWith("/api/") || uri.contains(".")) {
            return ResponseEntity.notFound().build();
        }

        if (indexHtml == null) {
            Resource resource = new ClassPathResource("static/index.html");
            if (resource.exists()) {
                indexHtml = resource.getInputStream().readAllBytes();
            } else {
                return ResponseEntity.notFound().build();
            }
        }

        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_HTML)
                .body(indexHtml);
    }
}
