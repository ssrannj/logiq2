package com.mangala.showroom.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "products")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @Column(nullable = false)
    private Integer stockCount;

    @Column(nullable = false)
    private String category;

    @Column(columnDefinition = "TEXT")
    private String imageUrl;

    private String brand;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column
    private Integer warrantyPeriodMonths;

    @Column
    private String material;

    // ---- Constructors ----

    public Product() {}

    public Product(String name, BigDecimal price, Integer stockCount, String category, String imageUrl, String brand) {
        this.name = name;
        this.price = price;
        this.stockCount = stockCount;
        this.category = category;
        this.imageUrl = imageUrl;
        this.brand = brand;
    }

    // ---- Getters & Setters ----

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }

    public Integer getStockCount() { return stockCount; }
    public void setStockCount(Integer stockCount) { this.stockCount = stockCount; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public String getBrand() { return brand; }
    public void setBrand(String brand) { this.brand = brand; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Integer getWarrantyPeriodMonths() { return warrantyPeriodMonths; }
    public void setWarrantyPeriodMonths(Integer warrantyPeriodMonths) { this.warrantyPeriodMonths = warrantyPeriodMonths; }

    public String getMaterial() { return material; }
    public void setMaterial(String material) { this.material = material; }
}
