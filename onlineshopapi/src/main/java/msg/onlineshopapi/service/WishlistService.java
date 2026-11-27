package msg.onlineshopapi.service;

import lombok.RequiredArgsConstructor;
import msg.onlineshopapi.exception.ResourceNotFoundException;
import msg.onlineshopapi.model.Product;
import msg.onlineshopapi.model.User;
import msg.onlineshopapi.model.WishlistItem;
import msg.onlineshopapi.repository.ProductRepository;
import msg.onlineshopapi.repository.UserRepository;
import msg.onlineshopapi.repository.WishlistItemRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WishlistService {

    private final WishlistItemRepository wishlistRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public List<Product> list(String email) {
        return wishlistRepository.findForUser(resolveUser(email).getId()).stream()
                .map(WishlistItem::getProduct)
                .toList();
    }

    @Transactional
    public void save(String email, UUID productId) {
        User user = resolveUser(email);
        if (!productRepository.existsById(productId)) {
            throw new ResourceNotFoundException("Product not found with id: " + productId);
        }
        wishlistRepository.insertIfAbsent(UUID.randomUUID(), user.getId(), productId);
    }

    @Transactional
    public void remove(String email, UUID productId) {
        wishlistRepository.deleteForUserAndProduct(resolveUser(email).getId(), productId);
    }

    private User resolveUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }
}
