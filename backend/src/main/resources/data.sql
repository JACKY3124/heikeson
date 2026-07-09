-- ============================================================
-- 初始化数据 - 初始管理员账号 + 测试赛事
-- 账号：admin  密码：admin123 （已 BCrypt 加密）
-- 注意：使用 ON DUPLICATE KEY UPDATE 避免重复插入
-- ============================================================

INSERT INTO users (username, password, nickname, email, role, status) VALUES
    ('admin', '$2a$10$lb6bfOio1sJKx94JlOhlSOYBK3QLCKSkpaBUmktqe97qdqzK5jVp2', 'SystemAdmin', 'admin@hackathon.com', 'admin', 1)
ON DUPLICATE KEY UPDATE username = username;

-- 测试赛事（created_by = 1 即 admin）
INSERT INTO competitions (title, description, competition_type, status, register_start, register_end, submit_start, submit_end, created_by) VALUES
    ('Hackathon Innovation Contest', 'Innovation contest for all students, submissions reviewed by AI + expert judges', 'individual', 'ongoing', '2026-07-01 00:00:00', '2026-07-15 23:59:59', '2026-07-10 00:00:00', '2026-07-20 23:59:59', 1)
ON DUPLICATE KEY UPDATE title = title;
