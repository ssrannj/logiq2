package com.mangala.showroom.controller;

import com.mangala.showroom.model.Category;
import com.mangala.showroom.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    @Autowired
    private CategoryRepository categoryRepository;

    @GetMapping
    public ResponseEntity<List<Category>> getAllCategories() {
        return ResponseEntity.ok(categoryRepository.findAll());
    }

    @PostMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createCategory(@RequestBody Map<String, Object> body) {
        String name = (String) body.get("name");
        Object parentIdObj = body.get("parentId");
        Long parentId = parentIdObj != null ? Long.valueOf(parentIdObj.toString()) : null;

        if (name == null || name.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Category name is required."));
        }
        if (categoryRepository.existsByName(name.trim())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Category already exists."));
        }
        Category cat = new Category(name.trim(), parentId);
        return ResponseEntity.status(201).body(categoryRepository.save(cat));
    }

    @DeleteMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteCategory(@PathVariable Long id) {
        if (!categoryRepository.existsById(id)) {
            return ResponseEntity.status(404).body(Map.of("error", "Category not found."));
        }
        List<Category> children = categoryRepository.findByParentId(id);
        if (!children.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error",
                    "Cannot delete a main category that has subcategories. Remove sub-categories first."));
        }
        categoryRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Category deleted."));
    }
}
