package com.mangala.showroom.payload;

public class UserProfileResponse {

    private Long id;
    private String name;
    private String email;
    private String fullName;
    private String phoneNumber;
    private String address;
    private String role;
    private Integer points;

    public UserProfileResponse(Long id, String name, String email, String fullName,
                               String phoneNumber, String address, String role, Integer points) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.fullName = fullName;
        this.phoneNumber = phoneNumber;
        this.address = address;
        this.role = role;
        this.points = points;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getFullName() { return fullName; }
    public String getPhoneNumber() { return phoneNumber; }
    public String getAddress() { return address; }
    public String getRole() { return role; }
    public Integer getPoints() { return points; }
}
