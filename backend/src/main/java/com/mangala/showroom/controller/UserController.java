package com.mangala.showroom.controller;

import com.mangala.showroom.model.Order;
import com.mangala.showroom.model.OrderStatus;
import com.mangala.showroom.model.Product;
import com.mangala.showroom.model.User;
import com.mangala.showroom.payload.UserProfileResponse;
import com.mangala.showroom.payload.WarrantyItem;
import com.mangala.showroom.repository.OrderRepository;
import com.mangala.showroom.repository.ProductRepository;
import com.mangala.showroom.repository.UserRepository;
import com.mangala.showroom.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/user")
public class UserController {

    @Autowired
    UserRepository userRepository;

    @Autowired
    OrderRepository orderRepository;

    @Autowired
    ProductRepository productRepository;

    private UserDetailsImpl currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (UserDetailsImpl) auth.getPrincipal();
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile() {
        UserDetailsImpl userDetails = currentUser();

        User user = userRepository.findByEmail(userDetails.getEmail()).orElse(null);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }

        String role = userDetails.getAuthorities().iterator().next()
                .getAuthority().replace("ROLE_", "");

        UserProfileResponse profile = new UserProfileResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getFullName(),
                user.getPhoneNumber(),
                user.getAddress(),
                role,
                user.getPoints()
        );

        return ResponseEntity.ok(profile);
    }

    @GetMapping("/warranties")
    public ResponseEntity<List<WarrantyItem>> getWarranties() {
        UserDetailsImpl userDetails = currentUser();

        User user = userRepository.findByEmail(userDetails.getEmail()).orElse(null);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }

        List<Order> deliveredOrders = orderRepository.findByUserIdAndStatus(user.getId(), OrderStatus.DELIVERED);
        List<WarrantyItem> warranties = new ArrayList<>();

        for (Order order : deliveredOrders) {
            LocalDate deliveredAt = order.getDeliveredAt();
            if (deliveredAt == null) continue;

            for (Long productId : order.getItems().keySet()) {
                Optional<Product> productOpt = productRepository.findById(productId);
                if (productOpt.isEmpty()) continue;

                Product product = productOpt.get();
                Integer months = product.getWarrantyPeriodMonths();
                if (months == null || months <= 0) continue;

                LocalDate expiryDate = deliveredAt.plusMonths(months);
                long remainingDays = ChronoUnit.DAYS.between(LocalDate.now(), expiryDate);

                warranties.add(new WarrantyItem(
                        product.getId(),
                        product.getName(),
                        months,
                        deliveredAt,
                        expiryDate,
                        remainingDays
                ));
            }
        }

        return ResponseEntity.ok(warranties);
    }
}
