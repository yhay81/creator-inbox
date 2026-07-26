CREATE TRIGGER user_pilot_capacity
BEFORE INSERT ON user
WHEN (SELECT COUNT(*) FROM user) >= 20
BEGIN
  SELECT RAISE(ABORT, 'pilot_capacity_reached');
END;
