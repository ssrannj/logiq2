package com.mangala.showroom.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mangala.showroom.model.Order;
import com.mangala.showroom.model.OrderStatus;
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
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired
    private OrderService orderService;

    @Autowired
    private ObjectMapper objectMapper;

    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserDetailsImpl) {
            UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();
            return userDetails.getId();
        }
        return null; // Guest or unauthenticated
    }

    /**
     * POST /api/orders/checkout
     * Accepts: multipart/form-data with slip file + details
     */
    @PostMapping("/checkout")
    public ResponseEntity<?> checkout(
            @RequestParam("slip") MultipartFile slip,
            @RequestParam("items") String itemsJson, // JSON string like {"1": 2, "3": 1}
            @RequestParam("total") BigDecimal total,
            @RequestParam("customerName") String customerName,
            @RequestParam("phoneNumber") String phoneNumber,
            @RequestParam("address") String address,
            @RequestParam(value = "note", required = false) String note
    ) {
        if (slip == null || slip.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Payment slip is required."));
        }

        try {
            Map<Long, Integer> items = objectMapper.readValue(itemsJson, new TypeReference<Map<Long, Integer>>(){});
            Long userId = getCurrentUserId();
            
            Order savedOrder = orderService.checkout(
                    slip, 
                    items, 
                    total, 
                    customerName, 
                    phoneNumber, 
                    address, 
                    note, 
                    userId
            );
            
            return ResponseEntity.status(HttpStatus.CREATED).body(savedOrder);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Checkout failed: " + e.getMessage()));
        }
    }

    @GetMapping("/my-orders")
    public ResponseEntity<?> getMyOrders() {
        Long userId = getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }
        List<Order> orders = orderService.getOrdersByUser(userId);
        return ResponseEntity.ok(orders);
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
