
-- Insert leader_role_id into app_config if it doesn't exist
INSERT INTO app_config (key, value, description)
VALUES ('leader_role_id', '', 'Global Discord Role ID for Neighborhood Leaders')
ON CONFLICT (key) DO NOTHING;
