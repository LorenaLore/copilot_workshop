package msg.onlineshopapi.unit.service;

import msg.onlineshopapi.exception.ResourceNotFoundException;
import msg.onlineshopapi.model.Product;
import msg.onlineshopapi.model.User;
import msg.onlineshopapi.model.WishlistItem;
import msg.onlineshopapi.repository.ProductRepository;
import msg.onlineshopapi.repository.UserRepository;
import msg.onlineshopapi.repository.WishlistItemRepository;
import msg.onlineshopapi.service.WishlistService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Wishlist service")
class WishlistServiceTest {

    @Mock private WishlistItemRepository wishlistRepository;
    @Mock private UserRepository userRepository;
    @Mock private ProductRepository productRepository;
    @InjectMocks private WishlistService service;

    private final UUID userId = UUID.randomUUID();
    private final UUID productId = UUID.randomUUID();
    private final String email = "owner@example.com";

    @Test
    @DisplayName("List returns only the resolved user's products in repository order")
    void list_should_returnScopedProducts_when_userExists() {
        Product first = Product.builder().id(productId).build();
        Product second = Product.builder().id(UUID.randomUUID()).build();
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(User.builder().id(userId).build()));
        when(wishlistRepository.findForUser(userId)).thenReturn(List.of(
                WishlistItem.builder().product(first).build(), WishlistItem.builder().product(second).build()));

        assertEquals(List.of(first, second), service.list(email));
        verify(wishlistRepository).findForUser(userId);
    }

    @Test
    @DisplayName("Save invokes the conflict-safe insert for the resolved user")
    void save_should_insertForUser_when_productExists() {
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(User.builder().id(userId).build()));
        when(productRepository.existsById(productId)).thenReturn(true);

        service.save(email, productId);

        verify(wishlistRepository).insertIfAbsent(any(UUID.class), eq(userId), eq(productId));
    }

    @Test
    @DisplayName("Save rejects a missing product without inserting")
    void save_should_throwNotFound_when_productMissing() {
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(User.builder().id(userId).build()));
        when(productRepository.existsById(productId)).thenReturn(false);

        assertThrows(ResourceNotFoundException.class, () -> service.save(email, productId));
        verifyNoInteractions(wishlistRepository);
    }

    @Test
    @DisplayName("Remove scopes the deletion to the resolved user")
    void remove_should_deleteForUser_when_associationIsAbsentOrPresent() {
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(User.builder().id(userId).build()));

        service.remove(email, productId);

        verify(wishlistRepository).deleteForUserAndProduct(userId, productId);
    }

    @Test
    @DisplayName("Operations reject an unknown principal")
    void list_should_throwNotFound_when_userMissing() {
        when(userRepository.findByEmail(email)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.list(email));
        verifyNoInteractions(wishlistRepository);
    }
}
