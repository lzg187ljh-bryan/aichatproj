-- 清空数据库表
-- 注意：此操作不可逆，请谨慎使用

-- 先删除 messages（外键依赖）
DELETE FROM messages;

-- 再删除 conversations
DELETE FROM conversations;

-- 重置序列（如果需要）
-- ALTER SEQUENCE messages_id_seq RESTART WITH 1;
-- ALTER SEQUENCE conversations_id_seq RESTART WITH 1;
