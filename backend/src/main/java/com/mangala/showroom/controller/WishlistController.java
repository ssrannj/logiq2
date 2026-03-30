package com.mangala.showroom.controller;

import com.mangala.showroom.model.Wishlist;
import com.mangala.showroom.security.UserDetailsImpl;
import com.mangala.showroom.service.WishlistService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/wishlist")
public class WishlistController {

    @Autowired
    private WishlistService wishlistService;

    private Long getCurrentUserId() {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return userDetails.getId();
    }

    /**
     * POST /api/wishlist
     * Body: { "productId": 3 }
     * Returns: saved Wishlist entry
     */
    @PostMapping
    public ResponseEntity<?> addToWishlist(@RequestBody Map<String, Long> body) {
        Long userId = getCurrentUserId();
        Long productId = body.get("productId");

        if (productId == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "productId is required."));
        }

        Wishlist saved = wishlistService.addToWishlist(userId, productId);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    /**
     * GET /api/wishlist
     * Returns: all wishlist entries for the authenticated user
     */
    @GetMapping
    public ResponseEntity<List<Wishlist>> getWishlist() {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(wishlistService.getWishlistByUser(userId));
    }
}
