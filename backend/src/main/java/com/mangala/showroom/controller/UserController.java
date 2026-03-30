package com.mangala.showroom.controller;

import com.mangala.showroom.model.User;
import com.mangala.showroom.payload.UserProfileResponse;
import com.mangala.showroom.repository.UserRepository;
import com.mangala.showroom.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user")
public class UserController {

    @Autowired
    UserRepository userRepository;

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        User user = userRepository.findByEmail(userDetails.getEmail())
                .orElse(null);

        if (user == null) {
            return ResponseEntity.notFound().build();
        }

        String role = userDetails.getAuthorities().iterator().next()
                .getAuthority().replace("ROLE_", "");

        UserProfileResponse profile = new UserProfileResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getFullName(),
                user.getPhoneNumber(),
                user.getAddress(),
                role,
                user.getPoints()
        );

        return ResponseEntity.ok(profile);
    }
}
