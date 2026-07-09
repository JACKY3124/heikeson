package com.hackathon.repository;

import com.hackathon.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    /** 按角色查询用户列表 */
    List<User> findByRole(String role);

    /** 按状态查询用户列表 */
    List<User> findByStatus(Integer status);

    /** 按角色和状态查询用户列表 */
    List<User> findByRoleAndStatus(String role, Integer status);

    /** 分页 + 搜索（模糊匹配 username/nickname/email） */
    @Query("SELECT u FROM User u WHERE " +
            "(:keyword IS NULL OR :keyword = '' OR " +
            "u.username LIKE CONCAT('%', :keyword, '%') OR " +
            "u.nickname LIKE CONCAT('%', :keyword, '%') OR " +
            "u.email LIKE CONCAT('%', :keyword, '%')) AND " +
            "(:role IS NULL OR :role = '' OR u.role = :role)")
    Page<User> searchUsers(@Param("keyword") String keyword,
                           @Param("role") String role,
                           Pageable pageable);
}
