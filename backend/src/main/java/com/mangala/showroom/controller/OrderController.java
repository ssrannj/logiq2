package com.mangala.showroom.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mangala.showroom.model.Order;
import com.mangala.showroom.model.OrderStatus;
import com.mangala.showroom.payload.GuestTrackRequest;
import com.mangala.showroom.payload.GuestTrackResponse;
import com.mangala.showroom.repository.UserRepository;
import com.mangala.showroom.security.UserDetailsImpl;
import com.mangala.showroom.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired
    private OrderService orderService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserDetailsImpl) {
            UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();
            return userDetails.getId();
        }
        return null;
    }

    private String getCurrentUserEmail() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserDetailsImpl) {
            return ((UserDetailsImpl) auth.getPrincipal()).getEmail();
        }
        return null;
    }

    /**
     * POST /api/orders/checkout
     * Accepts: multipart/form-data with slip file + details
     */
    @PostMapping("/checkout")
    public ResponseEntity<?> checkout(
            @RequestParam("slip") MultipartFile slip,
            @RequestParam("items") String itemsJson,
            @RequestParam("total") BigDecimal total,
            @RequestParam("customerName") String customerName,
            @RequestParam("phoneNumber") String phoneNumber,
            @RequestParam("address") String address,
            @RequestParam(value = "note", required = false) String note,
            @RequestParam(value = "guestEmail", required = false) String guestEmail
    ) {
        if (slip == null || slip.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Payment slip is required."));
        }

        try {
            Map<Long, Integer> items = objectMapper.readValue(itemsJson, new TypeReference<Map<Long, Integer>>(){});
            Long userId = getCurrentUserId();
            String emailToStore = (userId == null) ? guestEmail : null;

            Order savedOrder = orderService.checkout(
                    slip, items, total, customerName, phoneNumber, address, note, userId, emailToStore
            );

            return ResponseEntity.status(HttpStatus.CREATED).body(savedOrder);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Checkout failed: " + e.getMessage()));
        }
    }

    /**
     * POST /api/orders/track-guest
     * Verifies orderId + email and returns safe tracking data.
     */
    @PostMapping("/track-guest")
    public ResponseEntity<?> trackGuest(@RequestBody GuestTrackRequest request) {
        if (request.getOrderId() == null || request.getEmail() == null || request.getEmail().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Order ID and email are required."));
        }

        Optional<Order> orderOpt = orderService.getOrder(request.getOrderId());
        if (orderOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Order not found. Please check your order ID."));
        }

        Order order = orderOpt.get();
        String providedEmail = request.getEmail().trim().toLowerCase();
        boolean emailMatches = false;

        if (order.getUserId() != null) {
            // Authenticated user order — verify against user's account email
            var userOpt = userRepository.findById(order.getUserId());
            if (userOpt.isPresent() && userOpt.get().getEmail().equalsIgnoreCase(providedEmail)) {
                emailMatches = true;
            }
        } else if (order.getGuestEmail() != null) {
            // Guest order — verify against stored guest email
            emailMatches = order.getGuestEmail().equalsIgnoreCase(providedEmail);
        }

        if (!emailMatches) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Email does not match the order. Please check your details."));
        }

        // Build safe milestones (no private/admin data)
        List<String> statusKeys = Arrays.asList("VERIFYING", "PACKED", "IN_TRANSIT", "DELIVERED");
        List<String> statusLabels = Arrays.asList("Payment Verifying", "Packed & Ready", "In Transit", "Delivered");
        int currentIndex = statusKeys.indexOf(order.getStatus().name());

        List<GuestTrackResponse.Milestone> milestones = new ArrayList<>();
        for (int i = 0; i < statusKeys.size(); i++) {
            milestones.add(new GuestTrackResponse.Milestone(
                    statusKeys.get(i),
                    statusLabels.get(i),
                    i <= currentIndex
            ));
        }

        GuestTrackResponse response = new GuestTrackResponse(
                order.getId(),
                order.getStatus().name(),
                order.getCustomerName(),
                order.getAddress(),
                order.getTotal(),
                order.getCreatedAt(),
                milestones
        );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/my-orders")
    public ResponseEntity<?> getMyOrders() {
        Long userId = getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }
        return ResponseEntity.ok(orderService.getOrdersByUser(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getOrder(@PathVariable Long id) {
        Optional<Order> order = orderService.getOrder(id);
        if (order.isPresent()) return ResponseEntity.ok(order.get());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Order not found"));
    }

    @GetMapping("/all")
    public ResponseEntity<?> getAllOrders() {
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            OrderStatus newStatus = OrderStatus.valueOf(body.get("status"));
            Order updated = orderService.updateStatus(id, newStatus);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Update failed"));
        }
    }
}
