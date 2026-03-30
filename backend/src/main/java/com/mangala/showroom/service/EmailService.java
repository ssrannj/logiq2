package com.mangala.showroom.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${app.mail.from:noreply@mangala.lk}")
    private String fromAddress;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    private boolean isMailConfigured() {
        return mailSender != null && mailUsername != null && !mailUsername.isBlank();
    }

    public void sendPaymentVerifiedEmail(String toEmail, Long orderId, BigDecimal total) {
        if (!isMailConfigured()) {
            log.warn("Mail not configured — skipping payment verified email to {}", toEmail);
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(toEmail);
            message.setSubject("✅ Your Mangala Showroom Order #" + orderId + " has been Confirmed");
            message.setText(
                "Dear Customer,\n\n" +
                "Great news! Your payment for Order #" + String.format("%06d", orderId) + " has been verified " +
                "and your order is now confirmed.\n\n" +
                "Order Total: Rs. " + String.format("%,.2f", total) + "\n\n" +
                "Our team is now processing your order. You will receive further updates as your order " +
                "progresses through our fulfilment pipeline.\n\n" +
                "You can track your order at any time by visiting the Mangala Showroom website.\n\n" +
                "Thank you for shopping with us.\n\n" +
                "Warm regards,\n" +
                "Mangala Showroom Team"
            );
            mailSender.send(message);
            log.info("Payment verified email sent to {} for order #{}", toEmail, orderId);
        } catch (Exception e) {
            log.error("Failed to send payment verified email to {}: {}", toEmail, e.getMessage());
        }
    }

    public void sendBackInStockEmail(String toEmail, String productName, Long productId) {
        if (!isMailConfigured()) {
            log.warn("Mail not configured — skipping back-in-stock email to {}", toEmail);
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(toEmail);
            message.setSubject("🔔 Back in Stock: " + productName + " — Mangala Showroom");
            message.setText(
                "Dear Customer,\n\n" +
                "Good news! A product on your wishlist is back in stock:\n\n" +
                "  " + productName + "\n\n" +
                "Visit the Mangala Showroom to secure your piece before it sells out again.\n\n" +
                "Thank you for your patience and continued interest.\n\n" +
                "Warm regards,\n" +
                "Mangala Showroom Team"
            );
            mailSender.send(message);
            log.info("Back-in-stock email sent to {} for product '{}'", toEmail, productName);
        } catch (Exception e) {
            log.error("Failed to send back-in-stock email to {}: {}", toEmail, e.getMessage());
        }
    }
}
