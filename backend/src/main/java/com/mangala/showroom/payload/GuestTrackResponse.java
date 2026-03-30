package com.mangala.showroom.payload;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class GuestTrackResponse {

    private Long orderId;
    private String status;
    private String customerName;
    private String address;
    private BigDecimal total;
    private LocalDateTime createdAt;
    private List<Milestone> milestones;

    public GuestTrackResponse(Long orderId, String status, String customerName,
                               String address, BigDecimal total, LocalDateTime createdAt,
                               List<Milestone> milestones) {
        this.orderId = orderId;
        this.status = status;
        this.customerName = customerName;
        this.address = address;
        this.total = total;
        this.createdAt = createdAt;
        this.milestones = milestones;
    }

    public static class Milestone {
        private String key;
        private String label;
        private boolean completed;

        public Milestone(String key, String label, boolean completed) {
            this.key = key;
            this.label = label;
            this.completed = completed;
        }

        public String getKey() { return key; }
        public String getLabel() { return label; }
        public boolean isCompleted() { return completed; }
    }

    public Long getOrderId() { return orderId; }
    public String getStatus() { return status; }
    public String getCustomerName() { return customerName; }
    public String getAddress() { return address; }
    public BigDecimal getTotal() { return total; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public List<Milestone> getMilestones() { return milestones; }
}
