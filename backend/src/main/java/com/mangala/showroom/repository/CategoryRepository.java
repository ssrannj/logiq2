package com.mangala.showroom.repository;

import com.mangala.showroom.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    Optional<Category> findByName(String name);
    boolean existsByName(String name);
    List<Category> findByParentId(Long parentId);
    List<Category> findByParentIdIsNull();
}
