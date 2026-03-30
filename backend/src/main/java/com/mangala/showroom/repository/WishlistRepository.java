package com.mangala.showroom.repository;

import com.mangala.showroom.model.Wishlist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WishlistRepository extends JpaRepository<Wishlist, Long> {
    List<Wishlist> findByUserId(Long userId);
    boolean existsByUserIdAndProductId(Long userId, Long productId);
    List<Wishlist> findByNotifiedFalse();
    List<Wishlist> findByProductIdAndNotifiedFalse(Long productId);
}
