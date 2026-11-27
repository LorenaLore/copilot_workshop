package msg.onlineshopapi.integration;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import msg.onlineshopapi.model.*;
import msg.onlineshopapi.repository.ProductCategoryRepository;
import msg.onlineshopapi.repository.ProductRepository;
import msg.onlineshopapi.repository.UserRepository;
import msg.onlineshopapi.security.JwtService;
import msg.onlineshopapi.service.WishlistService;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.sql.DriverManager;
import java.util.Date;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Wishlist PostgreSQL and secured API")
class WishlistIntegrationTest {

    private static final String SCHEMA = "wishlist_test_" + UUID.randomUUID().toString().replace("-", "");
    private static final String SECRET = "YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXoxMjM0NTY=";
    private static PostgreSQLContainer<?> postgres;
    private static String jdbcUrl;
    private static String username;
    private static String password;

    @DynamicPropertySource
    static void configureDatabase(DynamicPropertyRegistry registry) {
        jdbcUrl = System.getenv("WISHLIST_TEST_DATABASE_URL");
        if (jdbcUrl == null || jdbcUrl.isBlank()) {
            postgres = new PostgreSQLContainer<>("postgres:18");
            postgres.start();
            jdbcUrl = postgres.getJdbcUrl();
            username = postgres.getUsername();
            password = postgres.getPassword();
        } else {
            username = System.getenv("WISHLIST_TEST_DATABASE_USER");
            password = System.getenv("WISHLIST_TEST_DATABASE_PASSWORD");
        }
        registry.add("spring.datasource.url", () -> jdbcUrl + (jdbcUrl.contains("?") ? "&" : "?") + "currentSchema=" + SCHEMA);
        registry.add("spring.datasource.username", () -> username);
        registry.add("spring.datasource.password", () -> password);
        registry.add("spring.flyway.schemas", () -> SCHEMA);
        registry.add("spring.flyway.default-schema", () -> SCHEMA);
    }

    @AfterAll
    static void cleanSchema() throws Exception {
        if (postgres != null) {
            postgres.stop();
        } else if (jdbcUrl != null) {
            try (var connection = DriverManager.getConnection(jdbcUrl, username, password);
                 var statement = connection.createStatement()) {
                statement.execute("DROP SCHEMA IF EXISTS " + SCHEMA + " CASCADE");
            }
        }
    }

    @Autowired private MockMvc mvc;
    @Autowired private JwtService jwtService;
    @Autowired private UserDetailsService userDetailsService;
    @Autowired private WishlistService wishlistService;
    @Autowired private ProductCategoryRepository categories;
    @Autowired private ProductRepository products;
    @Autowired private UserRepository users;
    @Autowired private JdbcTemplate jdbc;

    private User customer;
    private User admin;
    private Product first;
    private Product second;

    @BeforeEach
    void setUp() {
        String suffix = UUID.randomUUID().toString();
        customer = users.save(User.builder().firstName("Customer").lastName("Test")
                .email("customer-" + suffix + "@example.com").password("password").role(UserRole.CUSTOMER).build());
        admin = users.save(User.builder().firstName("Admin").lastName("Test")
                .email("admin-" + suffix + "@example.com").password("password").role(UserRole.ADMIN).build());
        ProductCategory category = categories.save(ProductCategory.builder().name("Category").build());
        first = products.save(Product.builder().name("First").price(BigDecimal.TEN).category(category).build());
        second = products.save(Product.builder().name("Second").price(BigDecimal.ONE).category(category).build());
    }

    private String token(User user) {
        return "Bearer " + jwtService.generateToken(userDetailsService.loadUserByUsername(user.getEmail()));
    }

    @Test
    @DisplayName("Both roles see only their own items and removal is scoped and idempotent")
    void endpoints_should_isolateUsers_when_rolesSaveAndRemove() throws Exception {
        String customerToken = token(customer);
        String adminToken = token(admin);
        mvc.perform(post("/wishlist/{id}", first.getId()).header("Authorization", customerToken)).andExpect(status().isNoContent());
        mvc.perform(post("/wishlist/{id}", first.getId()).header("Authorization", adminToken)).andExpect(status().isNoContent());
        mvc.perform(post("/wishlist/{id}", second.getId()).header("Authorization", adminToken)).andExpect(status().isNoContent());
        mvc.perform(get("/wishlist").header("Authorization", customerToken))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(first.getId().toString()));
        mvc.perform(delete("/wishlist/{id}", first.getId()).header("Authorization", customerToken)).andExpect(status().isNoContent());
        mvc.perform(delete("/wishlist/{id}", first.getId()).header("Authorization", customerToken)).andExpect(status().isNoContent());
        mvc.perform(get("/wishlist").header("Authorization", customerToken)).andExpect(status().isOk()).andExpect(content().json("[]"));
        mvc.perform(get("/wishlist").header("Authorization", adminToken))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].id").value(second.getId().toString()))
                .andExpect(jsonPath("$[1].id").value(first.getId().toString()));
        assertTrue(products.existsById(first.getId()));
    }

    @Test
    @DisplayName("Wishlist rejects missing, malformed, expired and unknown-user tokens")
    void endpoints_should_return401_when_tokenIsMissingOrInvalid() throws Exception {
        String expired = Jwts.builder().subject(customer.getEmail()).expiration(new Date(0))
                .signWith(Keys.hmacShaKeyFor(Decoders.BASE64.decode(SECRET))).compact();
        String unknown = Jwts.builder().subject("unknown@example.com").expiration(new Date(System.currentTimeMillis() + 60000))
                .signWith(Keys.hmacShaKeyFor(Decoders.BASE64.decode(SECRET))).compact();
        mvc.perform(get("/wishlist")).andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Authentication required"));
        mvc.perform(get("/api/wishlist").contextPath("/api"))
                .andExpect(status().isUnauthorized()).andExpect(jsonPath("$.error").value("Authentication required"));
        mvc.perform(get("/products")).andExpect(status().isForbidden());
        for (String authorization : List.of("", "Bearer invalid", "Bearer ", "Bearer " + expired, "Bearer " + unknown)) {
            mvc.perform(get("/wishlist").header("Authorization", authorization))
                    .andExpect(status().isUnauthorized()).andExpect(jsonPath("$.error").value("Authentication required"));
            mvc.perform(post("/wishlist/{id}", first.getId()).header("Authorization", authorization)).andExpect(status().isUnauthorized());
            mvc.perform(delete("/wishlist/{id}", first.getId()).header("Authorization", authorization)).andExpect(status().isUnauthorized());
        }
    }

    @Test
    @DisplayName("Missing products and malformed UUIDs produce the documented errors")
    void endpoints_should_validateProductIds_when_savingOrRemoving() throws Exception {
        String authorization = token(customer);
        mvc.perform(post("/wishlist/{id}", UUID.randomUUID()).header("Authorization", authorization))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.status").value(404));
        mvc.perform(post("/wishlist/not-a-uuid").header("Authorization", authorization)).andExpect(status().isBadRequest());
        mvc.perform(delete("/wishlist/not-a-uuid").header("Authorization", authorization)).andExpect(status().isBadRequest());
        assertEquals(0, jdbc.queryForObject("select count(*) from wishlist_items where user_id = ?", Integer.class, customer.getId()));
    }

    @Test
    @DisplayName("Concurrent duplicate saves retain one row and its original timestamp")
    void save_should_remainUniqueAndKeepTimestamp_when_calledConcurrently() throws Exception {
        ExecutorService executor = Executors.newFixedThreadPool(8);
        try {
            CountDownLatch start = new CountDownLatch(1);
            var futures = java.util.stream.IntStream.range(0, 8).mapToObj(i -> executor.submit(() -> {
                start.await();
                wishlistService.save(customer.getEmail(), first.getId());
                return null;
            })).toList();
            start.countDown();
            for (Future<?> future : futures) future.get(30, TimeUnit.SECONDS);
        } finally {
            executor.shutdownNow();
        }
        assertEquals(1, jdbc.queryForObject("select count(*) from wishlist_items where user_id = ? and product_id = ?",
                Integer.class, customer.getId(), first.getId()));
        var original = jdbc.queryForObject("select created_at from wishlist_items where user_id = ? and product_id = ?",
                java.sql.Timestamp.class, customer.getId(), first.getId());
        wishlistService.save(customer.getEmail(), first.getId());
        assertEquals(original, jdbc.queryForObject("select created_at from wishlist_items where user_id = ? and product_id = ?",
                java.sql.Timestamp.class, customer.getId(), first.getId()));
    }

    @Test
    @DisplayName("Timestamp ties use descending item ID and return current product data")
    void list_should_breakTimestampTiesAndReturnCurrentData_when_productsChange() throws Exception {
        UUID low = UUID.fromString("00000000-0000-0000-0000-000000000001");
        UUID high = UUID.fromString("00000000-0000-0000-0000-000000000002");
        jdbc.update("insert into wishlist_items (id, user_id, product_id, created_at) values (?, ?, ?, timestamp '2025-01-01 00:00:00')",
                low, customer.getId(), first.getId());
        jdbc.update("insert into wishlist_items (id, user_id, product_id, created_at) values (?, ?, ?, timestamp '2025-01-01 00:00:00')",
                high, customer.getId(), second.getId());
        second.setName("Updated");
        products.save(second);

        mvc.perform(get("/wishlist").header("Authorization", token(customer)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(second.getId().toString()))
                .andExpect(jsonPath("$[0].name").value("Updated"))
                .andExpect(jsonPath("$[1].id").value(first.getId().toString()));
    }

    @Test
    @DisplayName("V3 migrates clean and existing databases with and without local seed SQL")
    void migration_should_preserveExistingData_when_upgradingFromV2() throws Exception {
        for (boolean local : List.of(false, true)) {
            for (boolean upgrade : List.of(false, true)) {
                String schema = "wishlist_migration_" + UUID.randomUUID().toString().replace("-", "");
                try {
                    if (!local) {
                        try (var connection = DriverManager.getConnection(jdbcUrl, username, password);
                             var statement = connection.createStatement()) {
                            statement.execute("CREATE SCHEMA " + schema);
                            statement.execute("SET search_path TO " + schema);
                            executeMigration(statement, "V1__create_tables.sql");
                            executeMigration(statement, "V2__add_suppliers.sql");
                            if (upgrade) {
                                statement.execute("insert into product_categories (id, name) values "
                                        + "('00000000-0000-0000-0000-000000000003', 'Existing')");
                            }
                            executeMigration(statement, "V3__create_wishlist_items.sql");
                        }
                    } else if (upgrade) {
                        Flyway.configure().dataSource(jdbcUrl, username, password).schemas(schema)
                                .defaultSchema(schema).locations("classpath:db/migration", "classpath:db/migration/local").target("2.1")
                                .load().migrate();
                        try (var connection = DriverManager.getConnection(jdbcUrl, username, password);
                             var statement = connection.createStatement()) {
                            statement.execute("insert into " + schema + ".product_categories (id, name) values "
                                    + "('00000000-0000-0000-0000-000000000003', 'Existing')");
                        }
                    }
                    if (local) {
                        Flyway.configure().dataSource(jdbcUrl, username, password).schemas(schema)
                                .defaultSchema(schema).locations("classpath:db/migration", "classpath:db/migration/local")
                                .load().migrate();
                    }
                    try (var connection = DriverManager.getConnection(jdbcUrl, username, password);
                         var statement = connection.createStatement()) {
                        try (var result = statement.executeQuery("select count(*) from " + schema + ".wishlist_items")) {
                            assertTrue(result.next());
                            assertEquals(0, result.getInt(1));
                        }
                        if (upgrade) {
                            try (var result = statement.executeQuery("select name from " + schema
                                    + ".product_categories where id = '00000000-0000-0000-0000-000000000003'")) {
                                assertTrue(result.next());
                                assertEquals("Existing", result.getString(1));
                            }
                        }
                    }
                } finally {
                    try (var connection = DriverManager.getConnection(jdbcUrl, username, password);
                         var statement = connection.createStatement()) {
                        statement.execute("DROP SCHEMA IF EXISTS " + schema + " CASCADE");
                    }
                }
            }
        }
    }

    private static void executeMigration(java.sql.Statement statement, String name) throws Exception {
        try (var resource = WishlistIntegrationTest.class.getResourceAsStream("/db/migration/" + name)) {
            assertNotNull(resource);
            statement.execute(new String(resource.readAllBytes(), StandardCharsets.UTF_8));
        }
    }

    @Test
    @DisplayName("Deleting products and users cascades wishlist associations")
    void foreignKeys_should_cascade_when_productOrUserDeleted() {
        wishlistService.save(customer.getEmail(), first.getId());
        wishlistService.save(admin.getEmail(), first.getId());
        wishlistService.save(customer.getEmail(), second.getId());
        products.deleteById(first.getId());
        assertEquals(0, jdbc.queryForObject("select count(*) from wishlist_items where product_id = ?", Integer.class, first.getId()));
        users.deleteById(customer.getId());
        assertEquals(0, jdbc.queryForObject("select count(*) from wishlist_items where user_id = ?", Integer.class, customer.getId()));
        assertTrue(products.existsById(second.getId()));
    }
}
