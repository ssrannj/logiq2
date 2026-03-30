package com.mangala.showroom.config;

import com.mangala.showroom.model.Product;
import com.mangala.showroom.model.Role;
import com.mangala.showroom.model.User;
import com.mangala.showroom.repository.ProductRepository;
import com.mangala.showroom.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Optional;

@Component
@Profile("!test")
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder encoder;

    @Override
    public void run(String... args) {
        // --- SEED USERS ---
        seedUser("Admin User", "admin@mangala.lk", "admin123", Role.ADMIN);
        seedUser("Test Customer", "customer@mangala.lk", "cust123", Role.CUSTOMER);

        // --- SEED PRODUCTS ---
        if (productRepository.count() == 0) {
            productRepository.save(new Product(
                "Sri Lankan Teak Grand Sofa",
                new BigDecimal("185000.00"), 5, "Living",
                "https://lh3.googleusercontent.com/aida-public/AB6AXuD3I96KhhUs8CfI8v8atd4H_vu_bo9BTN60gtBkt9clNtPOzHz5Q6UW7VqK4GZ8ilNeYUZ09WE8t--lIBGnCv6Hr8QKKetJqI4OrqDvqIrj63z0PpZ7rexCRbrbCPiGW64yjw53_2Ihi2VZcTHgCBB12vBEZJsxCy4tFbIjIT0WZLvddpxoEtkQ8d2ed6GEaDkc2Zwjgv4yS4y8zwCPTh2x0WSCjG2lYATlnTnZbwPwVum_rAvxAgi2pJ-zvFvf4TiPm3oavfzkiB4",
                "Mangala Signature"
            ));
            productRepository.save(new Product(
                "UltraThin 4K Quantum LED",
                new BigDecimal("345000.00"), 0, "Electronics",
                "https://lh3.googleusercontent.com/aida-public/AB6AXuD6OsbEFpa9YRUc4SNuLnJ1tYOF5PGSpVI3sD2pshEjVZKCyqY46fO_HpBhEYn2fbH0HrRAvx_NjUGiiJYIMCmeWNsSpxKCt278q4qbH3DunJD7fpDyQhvnfSMDIM5gJHfp8yimSjn964FrnQs9j4WuHoJVbIDHqeShY9ys9RwQKxVGZfQHRXRDGsU4eAsZcbnDxPbG2Mnzp_IP8AaWbTQN_XBe4vQnPd4JFGNWFMekDoz3OHYXwZ-wK1ZQVSJ6Vn0AsutCi4ix8ck",
                "Heritage Modern"
            ));
            productRepository.save(new Product(
                "Nordic Trestle Dining Table",
                new BigDecimal("120500.00"), 8, "Kitchen",
                "https://lh3.googleusercontent.com/aida-public/AB6AXuDJL3lz7h-JRUgbGu7ae55NTzxNe-a_Fm0AjIW_wiXs4lfOi0rp44AIJNcwMQdr1j-xzZklveNy2vdTxwCi4jSNbB745dtUhrmfqCy11X5-0XJ7aK8wNVpoVTBNdbwVmdksDzpgVLK5iCMTETpVj_yUY_-C-9URvbi099j0rqoOKaNyfSEpy74f7zm7pb5cGEG-FcJDYMMX5WndtMpRSLHtw6p4rueTEfX-Dyb_FDj5iD_gQIjF2N0twMtD1LBboM-uRRc4X8sRjWY",
                "Mangala Signature"
            ));
            productRepository.save(new Product(
                    "Direct-Cool Double Door Refrigerator",
                    new BigDecimal("256900.00"), 3, "Electronics",
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuCO7SMhZ6inVZJehkAznTr85q33ZEaa1pcfnHRFXDi-pbeJCQ7eScF3Yc4Z1lnYP9Yb67ZW810Wh-boSHCMovsmYhPkdQMuWPAI6DpRWlW2PbKZP0twbTM2DGlo54NohjtYkA430hxqHOLw86g2-uCdbXix2WRIKnMSb2G19sILkMjn1CBB098kaFfSOrRnfwHHZADJ5tgKLYLFlyWuimFP4p0oIyjJSAxDDichWLd2Iguk53ynvk70NspPgPgLsv7Ad_cIAJLzHtM",
                    "Heritage Modern"
                ));
            productRepository.save(new Product(
                "Velvet Heirloom Armchair",
                new BigDecimal("85000.00"), 12, "Living",
                "https://lh3.googleusercontent.com/aida-public/AB6AXuBc92fqu6yVG9_fLiL7m3Hjbymwik2cpsdILYjjGJtE4G1tvpiACD2OfoRDLwKnQD3gVXGb4Z0rCYAE1DL1knhd7kdw7mU5QR3kkZoixD4ArGwgbmKOXw1qhp3o29N3CKNUNQxEGYTmxZTgHCJzG8kECDfumcZSOgLS3xbC_AzcKbtxqZsGF-wl8m0J3XZ3x0lMHJE7G-7c9kutyogA7OBCMt0KIPtR0ZFGKFpV1zjEKrhPi84bkMvCBpKmk5-aFk-Ef_Ky1OLKAaY",
                "Mangala Signature"
            ));
            productRepository.save(new Product(
                "Kandy Teak Dining Table",
                new BigDecimal("245000.00"), 0, "Kitchen",
                "https://lh3.googleusercontent.com/aida-public/AB6AXuDG57Mzx55iXytczUXwjyaxYD2tvBkP5Wj8j7_Y45C8Un4B2HriY_7R3DOEyyf6CLjm4AJcHiDS-Axwxm2aMcIDUOfZ3Kg_S3K9IMMozEpColbC2cDbA8lM8o6HVDxdXffOKYPkPcf5GOy8QkFUUB8oYg0Ft0-XIo3XXoG_O1XSPeeV4qlK_XiVDzkYybhNo57a-f60zfpL3b7_BZGHIdGJbqtUiAWKbSG_DDi9VxX8PeubMehGWKZerpIweDaz9jPMroQR5hzheUI",
                "Heritage Modern"
            ));
            productRepository.save(new Product(
                "Mist Fabric 3-Seater Sofa",
                new BigDecimal("162000.00"), 4, "Living",
                "https://lh3.googleusercontent.com/aida-public/AB6AXuBrQOZUDTq373Oq3lQsObkSDfWxZp8ZgJ6Z008xwKHs1QUBeV_RIfHBFmJHT0OIsJkAdQyRep8UFJUY99j_8zjHPfK9S4YRkA1l9uP19EECpIqyC7DRqBPdbT-Zm6gP9WihXzZ_B6sk0RW2-VQlsY8TELvCsOhha5TMHb2kVZZdD251ERe5Mdze00Tm8weTOMin0Z-3KiEiwUSFCtPvsMDIWJUtRFTuA4nuB58GUDDbLLAxgnXdMp8OO0IHwo1hQQ25jRHY8qjNNQg",
                "Mangala Signature"
            ));
            productRepository.save(new Product(
                "Zen Platform Bed - Oak",
                new BigDecimal("195000.00"), 2, "Bedroom",
                "https://lh3.googleusercontent.com/aida-public/AB6AXuBViKbfJgcmZYHWIloJOJ5AW6hhz5G2otUbygpbnlCF_Rskijw5WH3qDWa5R6sU85hRxwoKdWNYR2JDaCSEsUFAwZNsn9IeMYxflDsNzjZ8GGZhlFACqGsd4h-BarcYw4PQ1h30HVIboyS0LdH8Yaljm9TqmFD6OaLynaOdjLWTH-RdWM9nQD8eiFAWpBYMoo7L6FsDzVCNg6n2KCR1RuNArY5P5LuVcP1DixRt7b9NlNGJblj-U6ii1dbgalKI1Vh9uUDxLLUQxCw",
                "Mangala Signature"
            ));

            System.out.println("✅ Mangala Showroom: Seed products and default users sync complete.");
        }
    }

    private void seedUser(String name, String email, String plainPassword, Role role) {
        Optional<User> existing = userRepository.findByEmail(email);
        if (existing.isEmpty()) {
            userRepository.save(new User(name, email, encoder.encode(plainPassword), role));
            System.out.println("✅ Seeding new user: " + email);
        } else {
            // Update password to ensure the user's manual attempts work with the latest instructions
            User user = existing.get();
            user.setPassword(encoder.encode(plainPassword));
            user.setName(name);
            user.setRole(role);
            userRepository.save(user);
            System.out.println("✅ Synced credentials for: " + email);
        }
    }
}
