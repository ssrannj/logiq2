package com.mangala.showroom.payload;

public class GuestTrackRequest {
    private Long orderId;
    private String email;

    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}
