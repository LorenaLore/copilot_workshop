package msg.onlineshopapi.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import msg.onlineshopapi.dto.ProductResponseDto;
import msg.onlineshopapi.dto.mapper.ProductMapper;
import msg.onlineshopapi.service.WishlistService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/wishlist")
@RequiredArgsConstructor
@Tag(name = "Wishlist", description = "Authenticated user's saved products")
public class WishlistController {

    private final WishlistService wishlistService;
    private final ProductMapper productMapper;

    @GetMapping
    @Operation(summary = "List the current user's saved products, newest first")
    @ApiResponse(responseCode = "200", description = "Wishlist retrieved")
    @ApiResponse(responseCode = "401", description = "Authentication required")
    public List<ProductResponseDto> list(Principal principal) {
        return wishlistService.list(principal.getName()).stream().map(productMapper::toDto).toList();
    }

    @PostMapping("/{productId}")
    @Operation(summary = "Save a product to the current user's wishlist")
    @ApiResponse(responseCode = "204", description = "Product saved or already present")
    @ApiResponse(responseCode = "400", description = "Invalid product ID")
    @ApiResponse(responseCode = "401", description = "Authentication required")
    @ApiResponse(responseCode = "404", description = "Product not found")
    public ResponseEntity<Void> save(@PathVariable UUID productId, Principal principal) {
        wishlistService.save(principal.getName(), productId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{productId}")
    @Operation(summary = "Remove a product from the current user's wishlist")
    @ApiResponse(responseCode = "204", description = "Product removed or not present")
    @ApiResponse(responseCode = "400", description = "Invalid product ID")
    @ApiResponse(responseCode = "401", description = "Authentication required")
    public ResponseEntity<Void> remove(@PathVariable UUID productId, Principal principal) {
        wishlistService.remove(principal.getName(), productId);
        return ResponseEntity.noContent().build();
    }
}
