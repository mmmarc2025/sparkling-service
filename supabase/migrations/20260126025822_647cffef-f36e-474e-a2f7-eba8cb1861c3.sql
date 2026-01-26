-- 為 hi@doce.cc 用戶添加管理員角色
INSERT INTO public.user_roles (user_id, role)
VALUES ('d16f1d3b-72ee-429c-b463-da22d684d7a4', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;