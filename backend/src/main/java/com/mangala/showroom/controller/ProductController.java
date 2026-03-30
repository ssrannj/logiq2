package com.mangala.showroom.controller;

import com.mangala.showroom.model.Product;
import com.mangala.showroom.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    @Autowired
    private ProductService productService;

    /**
     * GET /api/products
     * Returns: all products, optionally filtered by ?category=
     */
    @GetMapping
    public ResponseEntity<List<Product>> getAllProducts(
            @RequestParam(required = false) String category
    ) {
        if (category != null && !category.isBlank()) {
            return ResponseEntity.ok(productService.getProductsByCategory(category));
        }
        return ResponseEntity.ok(productService.getAllProducts());
    }

    /**
     * GET /api/products/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getProductById(@PathVariable Long id) {
        Optional<Product> product = productService.getProductById(id);
        if (product.isPresent()) return ResponseEntity.ok(product.get());
        return ResponseEntity.status(404).body(Map.of("error", "Product not found: " + id));
    }

    /**
     * POST /api/products
     * Admin only. Create a new product.
     */
    @PostMapping
    public ResponseEntity<Product> createProduct(@RequestBody Product product) {
        Product savedProduct = productService.save(product);
        return ResponseEntity.status(201).body(savedProduct);
    }

    /**
     * PUT /api/admin/products/{id}
     * Admin only. Update editable fields of an existing product.
     */
    @PutMapping("/admin/{id}")
    public ResponseEntity<?> updateProduct(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            String name = (String) body.get("name");
            String description = (String) body.get("description");
            BigDecimal price = body.get("price") != null ? new BigDecimal(body.get("price").toString()) : null;
            Integer quantity = body.get("quantity") != null ? Integer.valueOf(body.get("quantity").toString()) : null;
            String category = (String) body.get("category");
            Integer warrantyPeriodMonths = body.get("warrantyPeriodMonths") != null
                    ? Integer.valueOf(body.get("warrantyPeriodMonths").toString()) : null;
            String material = (String) body.get("material");

            Product updated = productService.updateProduct(id, name, description, price, quantity, category, warrantyPeriodMonths, material);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Update failed: " + e.getMessage()));
        }
    }

    /**
     * DELETE /api/products/{id}
     * Admin only. Delete a product.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProduct(@PathVariable Long id) {
        try {
            productService.deleteProduct(id);
            return ResponseEntity.ok(Map.of("message", "Product deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to delete product: " + e.getMessage()));
        }
    }
}
