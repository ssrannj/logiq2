package com.mangala.showroom.service;

import com.mangala.showroom.model.Product;
import com.mangala.showroom.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public List<Product> getProductsByCategory(String category) {
        return productRepository.findByCategory(category);
    }

    public Optional<Product> getProductById(Long id) {
        return productRepository.findById(id);
    }

    public Product save(Product product) {
        return productRepository.save(product);
    }

    public void deleteProduct(Long id) {
        productRepository.deleteById(id);
    }

    public Product updateProduct(Long id, String name, String description, java.math.BigDecimal price,
                                  Integer quantity, String category, Integer warrantyPeriodMonths) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found: " + id));
        if (name != null && !name.isBlank()) product.setName(name);
        if (description != null) product.setDescription(description);
        if (price != null) product.setPrice(price);
        if (quantity != null) product.setStockCount(quantity);
        if (category != null && !category.isBlank()) product.setCategory(category);
        if (warrantyPeriodMonths != null) product.setWarrantyPeriodMonths(warrantyPeriodMonths);
        return productRepository.save(product);
    }
}
