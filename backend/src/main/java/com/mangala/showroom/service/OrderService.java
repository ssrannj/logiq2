package com.mangala.showroom.service;

import com.mangala.showroom.model.Order;
import com.mangala.showroom.model.OrderStatus;
import com.mangala.showroom.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class OrderService {

    private static final String UPLOAD_DIR = "./uploads/receipts/";

    @Autowired
    private OrderRepository orderRepository;

    /**
     * Process checkout: save slip file to disk, create Order with multiple items and shipping info.
     */
    public Order checkout(
            MultipartFile slip,
            Map<Long, Integer> items,
            BigDecimal total,
            String customerName,
            String phoneNumber,
            String address,
            String note,
            Long userId,
            String guestEmail
    ) throws IOException {
        
        // Ensure upload directory exists
        Path uploadPath = Paths.get(UPLOAD_DIR);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        // Generate unique filename and save file
        String extension = ".pdf";
        if (slip.getOriginalFilename() != null && slip.getOriginalFilename().contains(".")) {
            extension = slip.getOriginalFilename().substring(slip.getOriginalFilename().lastIndexOf("."));
        }
        String savedFilename = UUID.randomUUID() + extension;
        Path targetPath = uploadPath.resolve(savedFilename);
        Files.copy(slip.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

        // Create and save the order
        Order order = new Order();
        order.setStatus(OrderStatus.PENDING_PAYMENT);
        order.setTotal(total != null ? total : BigDecimal.ZERO);
        order.setReceiptFilePath(targetPath.toString());
        order.setCustomerName(customerName);
        order.setPhoneNumber(phoneNumber);
        order.setAddress(address);
        order.setNote(note);
        order.setUserId(userId);
        order.setGuestEmail(guestEmail);
        order.setItems(items);

        return orderRepository.save(order);
    }

    public Optional<Order> getOrder(Long id) {
        return orderRepository.findById(id);
    }

    public java.util.List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    public java.util.List<Order> getOrdersByUser(Long userId) {
        return orderRepository.findByUserId(userId);
    }

    public Order updateStatus(Long id, OrderStatus status) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found: " + id));
        order.setStatus(status);
        if (status == OrderStatus.DELIVERED && order.getDeliveredAt() == null) {
            order.setDeliveredAt(LocalDate.now());
        }
        return orderRepository.save(order);
    }
}
