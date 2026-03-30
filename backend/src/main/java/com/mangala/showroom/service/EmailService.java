package com.mangala.showroom.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private static final String RESEND_API_URL = "https://api.resend.com/emails";

    @Value("${resend.api.key:}")
    private String resendApiKey;

    @Value("${app.mail.from:onboarding@resend.dev}")
    private String fromAddress;

    private final RestTemplate restTemplate = new RestTemplate();

    private boolean isConfigured() {
        return resendApiKey != null && !resendApiKey.isBlank();
    }

    private void send(String to, String subject, String html) {
        if (!isConfigured()) {
            log.warn("RESEND_API_KEY not set — skipping email to {}", to);
            return;
        }
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(resendApiKey);

            Map<String, Object> body = Map.of(
                "from", fromAddress,
                "to", List.of(to),
                "subject", subject,
                "html", html
            );

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(RESEND_API_URL, request, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("Email sent via Resend to {} — subject: {}", to, subject);
            } else {
                log.error("Resend returned non-2xx status {} for email to {}: {}", response.getStatusCode(), to, response.getBody());
            }
        } catch (Exception e) {
            log.error("Failed to send email via Resend to {}: {}", to, e.getMessage());
        }
    }

    public void sendPaymentVerifiedEmail(String toEmail, Long orderId, BigDecimal total) {
        String subject = "Your Mangala Showroom Order #" + String.format("%06d", orderId) + " is Confirmed";
        String html = "<div style='font-family:Inter,sans-serif;max-width:600px;margin:0 auto;color:#333'>" +
            "<div style='background:#005a07;padding:24px 32px;border-radius:8px 8px 0 0'>" +
            "<h1 style='color:#fff;margin:0;font-size:22px'>Mangala Showroom</h1>" +
            "</div>" +
            "<div style='padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px'>" +
            "<h2 style='color:#005a07;margin-top:0'>&#10003; Order Confirmed!</h2>" +
            "<p>Dear Customer,</p>" +
            "<p>Great news! Your payment for <strong>Order #" + String.format("%06d", orderId) + "</strong> " +
            "has been verified and your order is now confirmed.</p>" +
            "<div style='background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 24px;margin:24px 0'>" +
            "<p style='margin:0;font-size:18px'>Order Total: <strong>Rs. " + String.format("%,.2f", total) + "</strong></p>" +
            "</div>" +
            "<p>Our team is now processing your order. You can track your order status anytime on the " +
            "Mangala Showroom website.</p>" +
            "<p style='margin-top:32px'>Warm regards,<br><strong>Mangala Showroom Team</strong></p>" +
            "</div>" +
            "</div>";
        send(toEmail, subject, html);
    }

    public void sendBackInStockEmail(String toEmail, String productName, Long productId) {
        String subject = "Back in Stock: " + productName + " — Mangala Showroom";
        String html = "<div style='font-family:Inter,sans-serif;max-width:600px;margin:0 auto;color:#333'>" +
            "<div style='background:#005a07;padding:24px 32px;border-radius:8px 8px 0 0'>" +
            "<h1 style='color:#fff;margin:0;font-size:22px'>Mangala Showroom</h1>" +
            "</div>" +
            "<div style='padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px'>" +
            "<h2 style='color:#005a07;margin-top:0'>&#128276; Back in Stock!</h2>" +
            "<p>Dear Customer,</p>" +
            "<p>Good news! A product on your wishlist is back in stock:</p>" +
            "<div style='background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 24px;margin:24px 0'>" +
            "<p style='margin:0;font-size:18px;font-weight:600'>" + productName + "</p>" +
            "</div>" +
            "<p>Visit Mangala Showroom to secure your piece before it sells out again.</p>" +
            "<p style='margin-top:32px'>Warm regards,<br><strong>Mangala Showroom Team</strong></p>" +
            "</div>" +
            "</div>";
        send(toEmail, subject, html);
    }
}
