WITH owner_funnel AS (
  SELECT
    u.id,
    i.id AS inbox_id,
    i.id IS NOT NULL AS created_inbox,
    EXISTS (
      SELECT 1 FROM messages m WHERE m.inbox_id = i.id
    ) AS received_message,
    EXISTS (
      SELECT 1
      FROM events e
      WHERE e.inbox_id = i.id AND e.name = 'message_opened'
    ) AS opened_message
  FROM "user" u
  LEFT JOIN inboxes i ON i.owner_user_id = u.id
)
SELECT
  COUNT(*) AS users,
  COALESCE(SUM(created_inbox), 0) AS activated_owners,
  COALESCE(SUM(received_message), 0) AS receiving_owners,
  COALESCE(SUM(opened_message), 0) AS successful_owners,
  (SELECT COUNT(*) FROM messages) AS messages,
  (
    SELECT COUNT(*)
    FROM (
      SELECT inbox_id
      FROM events
      WHERE name = 'message_received'
      GROUP BY inbox_id
      HAVING COUNT(DISTINCT occurred_on) >= 2
    )
  ) AS repeat_inboxes,
  (
    SELECT COUNT(*)
    FROM "user"
    WHERE created_at >= unixepoch() - 604800
  ) AS signups_7d,
  (
    SELECT COUNT(*)
    FROM messages
    WHERE created_at >= unixepoch() - 604800
  ) AS messages_7d
FROM owner_funnel;
