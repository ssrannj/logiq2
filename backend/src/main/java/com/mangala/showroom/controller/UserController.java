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
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.LinkedHashMap;

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

    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<java.util.Map<String, Object>>> getAllUsers() {
        List<User> users = userRepository.findAll();
        List<java.util.Map<String, Object>> result = new ArrayList<>();
        for (User u : users) {
            java.util.Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", u.getId());
            m.put("name", u.getName());
            m.put("email", u.getEmail());
            m.put("fullName", u.getFullName() != null ? u.getFullName() : u.getName());
            m.put("phoneNumber", u.getPhoneNumber() != null ? u.getPhoneNumber() : "—");
            m.put("address", u.getAddress() != null ? u.getAddress() : "—");
            m.put("role", u.getRole().toString());
            m.put("points", u.getPoints());
            long orderCount = orderRepository.findByUserIdAndStatus(u.getId(), OrderStatus.DELIVERED).size();
            m.put("totalOrders", orderCount);
            result.add(m);
        }
        return ResponseEntity.ok(result);
    }
}
