package com.mangala.showroom.controller;

import com.mangala.showroom.model.Order;
import com.mangala.showroom.model.OrderStatus;
import com.mangala.showroom.model.Product;
import com.mangala.showroom.model.Role;
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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

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

    @Autowired
    PasswordEncoder encoder;

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
        try {
            List<User> users = userRepository.findAll();
            List<java.util.Map<String, Object>> result = new ArrayList<>();
            for (User u : users) {
                java.util.Map<String, Object> m = new LinkedHashMap<>();
                m.put("id", u.getId() != null ? u.getId() : 0L);
                m.put("name", u.getName() != null ? u.getName() : "");
                m.put("email", u.getEmail() != null ? u.getEmail() : "");
                m.put("fullName", u.getFullName() != null ? u.getFullName() : (u.getName() != null ? u.getName() : ""));
                m.put("phoneNumber", u.getPhoneNumber() != null ? u.getPhoneNumber() : "—");
                m.put("address", u.getAddress() != null ? u.getAddress() : "—");
                m.put("role", u.getRole() != null ? u.getRole().toString() : "CUSTOMER");
                m.put("points", u.getPoints() != null ? u.getPoints() : 0);
                m.put("totalOrders", orderRepository.findByUserId(u.getId() != null ? u.getId() : 0L).size());
                m.put("forcePasswordChange", u.isForcePasswordChange());
                result.add(m);
            }
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(null);
        }
    }

    @PostMapping("/admin/create-staff")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createStaffAccount(@RequestBody Map<String, String> body) {
        String email    = body.get("email");
        String name     = body.get("name");
        String password = body.get("password");

        if (email == null || name == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "name, email, and password are required"));
        }
        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is already in use"));
        }

        User staff = new User(name, email, encoder.encode(password), Role.ADMIN);
        staff.setFullName(name);
        staff.setForcePasswordChange(true);
        staff.setPoints(0);
        userRepository.save(staff);

        return ResponseEntity.ok(Map.of("message", "Staff account created successfully", "email", email));
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> body) {
        UserDetailsImpl userDetails = currentUser();
        User user = userRepository.findByEmail(userDetails.getEmail()).orElse(null);
        if (user == null) return ResponseEntity.notFound().build();

        String newPassword = body.get("newPassword");
        if (newPassword == null || newPassword.length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("error", "Password must be at least 6 characters"));
        }

        user.setPassword(encoder.encode(newPassword));
        user.setForcePasswordChange(false);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }
}
