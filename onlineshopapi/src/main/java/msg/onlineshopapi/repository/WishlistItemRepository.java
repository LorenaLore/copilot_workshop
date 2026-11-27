package msg.onlineshopapi.repository;

import msg.onlineshopapi.model.WishlistItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface WishlistItemRepository extends JpaRepository<WishlistItem, UUID> {

    @Query("select w from WishlistItem w join fetch w.product p "
            + "join fetch p.category left join fetch p.supplier "
            + "where w.user.id = :userId order by w.createdAt desc, w.id desc")
    List<WishlistItem> findForUser(@Param("userId") UUID userId);

    @Modifying
    @Query(value = "insert into wishlist_items (id, user_id, product_id) "
            + "values (:id, :userId, :productId) on conflict (user_id, product_id) do nothing",
            nativeQuery = true)
    int insertIfAbsent(@Param("id") UUID id, @Param("userId") UUID userId,
                       @Param("productId") UUID productId);

    @Modifying
    @Query("delete from WishlistItem w where w.user.id = :userId and w.product.id = :productId")
    int deleteForUserAndProduct(@Param("userId") UUID userId, @Param("productId") UUID productId);
}
