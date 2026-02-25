-- Seed app users (Priest, Secretary, Admin). Password for all: ChangeMe1!
-- Change these passwords in production. Hash generated with bcrypt, 10 rounds.
-- Run once after 004_app_users; re-running will fail on duplicate email.

INSERT INTO app_users (email, password_hash, role, display_name) VALUES
  ('admin@church_registry.com', '$2b$10$8lqainwZSDubOWq8ujXgiOIIFktVkCBuF.904OfDlhoFGKCqU5Kni', 'ADMIN', 'Administrator'),
  ('priest@church_registry.com', '$2b$10$8lqainwZSDubOWq8ujXgiOIIFktVkCBuF.904OfDlhoFGKCqU5Kni', 'PRIEST', 'Priest'),
  ('secretary@church_registry.com', '$2b$10$8lqainwZSDubOWq8ujXgiOIIFktVkCBuF.904OfDlhoFGKCqU5Kni', 'SECRETARY', 'Secretary');
