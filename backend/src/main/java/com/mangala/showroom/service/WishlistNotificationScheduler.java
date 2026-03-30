package com.mangala.showroom.service;

import com.mangala.showroom.model.Product;
import com.mangala.showroom.model.User;
import com.mangala.showroom.model.Wishlist;
import com.mangala.showroom.repository.ProductRepository;
import com.mangala.showroom.repository.UserRepository;
import com.mangala.showroom.repository.WishlistRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
public class WishlistNotificationScheduler {

    private static final Logger log = LoggerFactory.getLogger(WishlistNotificationScheduler.class);

    @Autowired
    private WishlistRepository wishlistRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    @Scheduled(fixedRate = 60000)
    public void checkBackInStock() {
        List<Wishlist> unnotified = wishlistRepository.findByNotifiedFalse();
        if (unnotified.isEmpty()) return;

        log.debug("Back-in-stock check: {} unnotified wishlist entries", unnotified.size());

        for (Wishlist item : unnotified) {
            Optional<Product> productOpt = productRepository.findById(item.getProductId());
            if (productOpt.isEmpty()) continue;

            Product product = productOpt.get();
            if (product.getStockCount() == null || product.getStockCount() <= 0) continue;

            Optional<User> userOpt = userRepository.findById(item.getUserId());
            if (userOpt.isEmpty()) continue;

            String email = userOpt.get().getEmail();
            emailService.sendBackInStockEmail(email, product.getName(), product.getId());

            item.setNotified(true);
            wishlistRepository.save(item);

            log.info("Notified user {} that '{}' is back in stock", email, product.getName());
        }
    }
}
