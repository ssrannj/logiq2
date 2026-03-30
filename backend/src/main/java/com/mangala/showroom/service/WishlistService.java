package com.mangala.showroom.service;

import com.mangala.showroom.model.Wishlist;
import com.mangala.showroom.repository.WishlistRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class WishlistService {

    @Autowired
    private WishlistRepository wishlistRepository;

    /**
     * Add a product to a user's wishlist.
     * Prevents duplicate entries for the same user+product combination.
     */
    public Wishlist addToWishlist(Long userId, Long productId) {
        if (wishlistRepository.existsByUserIdAndProductId(userId, productId)) {
            return wishlistRepository.findByUserId(userId)
                    .stream()
                    .filter(w -> w.getProductId().equals(productId))
                    .findFirst()
                    .orElseThrow();
        }
        Wishlist item = new Wishlist(userId, productId);
        return wishlistRepository.save(item);
    }

    /**
     * Get all wishlist entries for a user.
     */
    public List<Wishlist> getWishlistByUser(Long userId) {
        return wishlistRepository.findByUserId(userId);
    }
}
