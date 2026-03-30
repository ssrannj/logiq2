package com.mangala.showroom.payload;

import java.time.LocalDate;

public class WarrantyItem {

    private Long productId;
    private String productName;
    private Integer warrantyMonths;
    private LocalDate deliveredDate;
    private LocalDate expiryDate;
    private long remainingDays;
    private boolean active;

    public WarrantyItem(Long productId, String productName, Integer warrantyMonths,
                        LocalDate deliveredDate, LocalDate expiryDate, long remainingDays) {
        this.productId = productId;
        this.productName = productName;
        this.warrantyMonths = warrantyMonths;
        this.deliveredDate = deliveredDate;
        this.expiryDate = expiryDate;
        this.remainingDays = remainingDays;
        this.active = remainingDays > 0;
    }

    public Long getProductId() { return productId; }
    public String getProductName() { return productName; }
    public Integer getWarrantyMonths() { return warrantyMonths; }
    public LocalDate getDeliveredDate() { return deliveredDate; }
    public LocalDate getExpiryDate() { return expiryDate; }
    public long getRemainingDays() { return remainingDays; }
    public boolean isActive() { return active; }
}
