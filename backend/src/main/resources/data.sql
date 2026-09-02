-- ============================================================
-- 初始化数据 - 初始管理员账号 + 测试赛事
-- 账号：admin  密码：admin123 （已 BCrypt 加密）
-- 注意：使用 ON DUPLICATE KEY UPDATE 避免重复插入
-- ============================================================

INSERT INTO users (username, password, nickname, email, role, status) VALUES
    ('admin', '$2a$10$lb6bfOio1sJKx94JlOhlSOYBK3QLCKSkpaBUmktqe97qdqzK5jVp2', 'SystemAdmin', 'admin@hackathon.com', 'admin', 1),
    ('player1', '$2a$10$JI9vtdUEJbZpETvnivCN1.ezMS0HXRCG20HbM9wIzen/0HfrqnlPu', 'Player One', 'player1@example.com', 'player', 1),
    ('player2', '$2a$10$JI9vtdUEJbZpETvnivCN1.ezMS0HXRCG20HbM9wIzen/0HfrqnlPu', 'Player Two', 'player2@example.com', 'player', 1),
    ('expert1', '$2a$10$/alKXy2t8rb9iAzLbD1e3OZj791Ug.xFcK9r/zr6qsMoNMWbmoed.', 'Expert One', 'expert1@example.com', 'expert', 1)
ON DUPLICATE KEY UPDATE username = username;

-- 测试赛事（created_by = 1 即 admin）
-- 报名/提交窗口设置为未来时间，确保任何时候演示都能报名与提交
INSERT INTO competitions (title, description, competition_type, status, register_start, register_end, submit_start, submit_end, created_by) VALUES
    ('Hackathon Innovation Contest', 'Innovation contest for all students, submissions reviewed by AI + expert judges', 'individual', 'ongoing', '2026-07-01 00:00:00', '2026-12-31 23:59:59', '2026-07-10 00:00:00', '2026-12-31 23:59:59', 1)
ON DUPLICATE KEY UPDATE title = title;

-- 兜底：若数据库已存在该赛事（旧窗口已过期），强制延长报名/提交窗口
UPDATE competitions SET register_end = '2026-12-31 23:59:59', submit_end = '2026-12-31 23:59:59' WHERE title = 'Hackathon Innovation Contest';
