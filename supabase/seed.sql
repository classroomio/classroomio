--
-- PostgreSQL database dump
--

-- Dumped from database version 15.1 (Ubuntu 15.1-1.pgdg20.04+1)
-- Dumped by pg_dump version 15.4 (Ubuntu 15.4-1.pgdg20.04+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."audit_log_entries" ("instance_id", "id", "payload", "created_at", "ip_address") VALUES
	('00000000-0000-0000-0000-000000000000', 'de6f63a4-91ee-46db-ace5-8c37dce6ea6d', '{"action":"user_signedup","actor_id":"6f4e680b-820b-4832-8c2a-6f4157a5f0c3","actor_username":"admin@test.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2024-02-12 05:29:42.686048+00', ''),
	('00000000-0000-0000-0000-000000000000', '10d9d78e-8e8f-4905-b5c8-2f8357aa3b0c', '{"action":"login","actor_id":"6f4e680b-820b-4832-8c2a-6f4157a5f0c3","actor_username":"admin@test.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2024-02-12 05:29:42.690601+00', ''),
	('00000000-0000-0000-0000-000000000000', 'aba8c673-cb01-4e02-b341-214836b29fd0', '{"action":"token_refreshed","actor_id":"6f4e680b-820b-4832-8c2a-6f4157a5f0c3","actor_username":"admin@test.com","actor_via_sso":false,"log_type":"token"}', '2024-02-12 06:27:43.551818+00', ''),
	('00000000-0000-0000-0000-000000000000', '4b28bf6f-a620-4357-b9df-dad656ebfff6', '{"action":"token_revoked","actor_id":"6f4e680b-820b-4832-8c2a-6f4157a5f0c3","actor_username":"admin@test.com","actor_via_sso":false,"log_type":"token"}', '2024-02-12 06:27:43.553893+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a65794af-2070-44b2-899c-d371ae663bd2', '{"action":"logout","actor_id":"6f4e680b-820b-4832-8c2a-6f4157a5f0c3","actor_username":"admin@test.com","actor_via_sso":false,"log_type":"account"}', '2024-02-12 06:37:31.406921+00', ''),
	('00000000-0000-0000-0000-000000000000', '8125adf1-71a6-4266-9305-42cbefcc2fa0', '{"action":"user_signedup","actor_id":"648a6894-5804-4cba-aec5-a4b8163fe4bf","actor_username":"student@test.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2024-02-12 06:41:21.345519+00', ''),
	('00000000-0000-0000-0000-000000000000', '59eeaa5f-88a1-4071-ab0a-1354c6a0ba9e', '{"action":"login","actor_id":"648a6894-5804-4cba-aec5-a4b8163fe4bf","actor_username":"student@test.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2024-02-12 06:41:21.380164+00', ''),
	('00000000-0000-0000-0000-000000000000', '72ac9086-238a-4cdd-a8eb-4caf4fc86c7e', '{"action":"token_refreshed","actor_id":"648a6894-5804-4cba-aec5-a4b8163fe4bf","actor_username":"student@test.com","actor_via_sso":false,"log_type":"token"}', '2024-02-12 07:39:47.763562+00', ''),
	('00000000-0000-0000-0000-000000000000', '10127f84-8d4c-4c45-9cfb-69db7f5689b3', '{"action":"token_revoked","actor_id":"648a6894-5804-4cba-aec5-a4b8163fe4bf","actor_username":"student@test.com","actor_via_sso":false,"log_type":"token"}', '2024-02-12 07:39:47.76536+00', ''),
	('00000000-0000-0000-0000-000000000000', '81ab4afa-28e1-43b8-af9a-5b00bd447737', '{"action":"login","actor_id":"6f4e680b-820b-4832-8c2a-6f4157a5f0c3","actor_username":"admin@test.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2024-02-12 08:07:02.626453+00', '');


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at") VALUES
	('00000000-0000-0000-0000-000000000000', '648a6894-5804-4cba-aec5-a4b8163fe4bf', 'authenticated', 'authenticated', 'student@test.com', '$2a$10$bPxdJzyPzSTARCxNIGmhC.7BBTuaT1KcHLAkyBDDGGdceMPrzI8qW', '2024-02-12 06:41:21.347197+00', NULL, '', NULL, '', NULL, '', '', NULL, '2024-02-12 06:41:21.382297+00', '{"provider": "email", "providers": ["email"]}', '{}', NULL, '2024-02-12 06:41:21.33931+00', '2024-02-12 07:39:47.76952+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL),
	('00000000-0000-0000-0000-000000000000', '6f4e680b-820b-4832-8c2a-6f4157a5f0c3', 'authenticated', 'authenticated', 'admin@test.com', '$2a$10$8ma7ebb5.yJow5wDuQE9GeeqGopgoWChS6J7BIvjNqaMliiAqGsa6', '2024-02-12 05:29:42.68805+00', NULL, '', NULL, '', NULL, '', '', NULL, '2024-02-12 08:07:02.627934+00', '{"provider": "email", "providers": ["email"]}', '{}', NULL, '2024-02-12 05:29:42.672106+00', '2024-02-12 08:07:02.631358+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('6f4e680b-820b-4832-8c2a-6f4157a5f0c3', '6f4e680b-820b-4832-8c2a-6f4157a5f0c3', '{"sub": "6f4e680b-820b-4832-8c2a-6f4157a5f0c3", "email": "admin@test.com", "email_verified": false, "phone_verified": false}', 'email', '2024-02-12 05:29:42.684137+00', '2024-02-12 05:29:42.684374+00', '2024-02-12 05:29:42.684374+00', '28b36def-7365-4e6c-8e28-7d01e6647157'),
	('648a6894-5804-4cba-aec5-a4b8163fe4bf', '648a6894-5804-4cba-aec5-a4b8163fe4bf', '{"sub": "648a6894-5804-4cba-aec5-a4b8163fe4bf", "email": "student@test.com", "email_verified": false, "phone_verified": false}', 'email', '2024-02-12 06:41:21.343499+00', '2024-02-12 06:41:21.343565+00', '2024-02-12 06:41:21.343565+00', '0e238b2c-08a6-431b-8b41-c20b076f55ec');


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag") VALUES
	('9e23b60b-c714-40a6-8daa-dbda3af2a7ee', '648a6894-5804-4cba-aec5-a4b8163fe4bf', '2024-02-12 06:41:21.382461+00', '2024-02-12 07:39:47.771962+00', NULL, 'aal1', NULL, '2024-02-12 07:39:47.771802', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36', '172.18.0.1', NULL),
	('3cedb1fa-614e-46cc-8bc5-dd002929c825', '6f4e680b-820b-4832-8c2a-6f4157a5f0c3', '2024-02-12 08:07:02.628018+00', '2024-02-12 08:07:02.628018+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36', '172.18.0.1', NULL);


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") VALUES
	('9e23b60b-c714-40a6-8daa-dbda3af2a7ee', '2024-02-12 06:41:21.386627+00', '2024-02-12 06:41:21.386627+00', 'password', 'd4a2fe16-8220-470b-9766-8898ab4e5ff0'),
	('3cedb1fa-614e-46cc-8bc5-dd002929c825', '2024-02-12 08:07:02.631907+00', '2024-02-12 08:07:02.631907+00', 'password', 'ce4b6099-b302-4995-80d0-fa943d4cec28');


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") VALUES
	('00000000-0000-0000-0000-000000000000', 3, '5VWVLSmereIozpua_WssgA', '648a6894-5804-4cba-aec5-a4b8163fe4bf', true, '2024-02-12 06:41:21.384145+00', '2024-02-12 07:39:47.766627+00', NULL, '9e23b60b-c714-40a6-8daa-dbda3af2a7ee'),
	('00000000-0000-0000-0000-000000000000', 4, 'hQakYVnk3wRkpGTirQ8r9Q', '648a6894-5804-4cba-aec5-a4b8163fe4bf', false, '2024-02-12 07:39:47.767875+00', '2024-02-12 07:39:47.767875+00', '5VWVLSmereIozpua_WssgA', '9e23b60b-c714-40a6-8daa-dbda3af2a7ee'),
	('00000000-0000-0000-0000-000000000000', 5, '8AQ7piBlKzva1yg4RWIE1g', '6f4e680b-820b-4832-8c2a-6f4157a5f0c3', false, '2024-02-12 08:07:02.629606+00', '2024-02-12 08:07:02.629606+00', NULL, '3cedb1fa-614e-46cc-8bc5-dd002929c825');


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: key; Type: TABLE DATA; Schema: pgsodium; Owner: supabase_admin
--



--
-- Data for Name: organization; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."organization" ("id", "name", "siteName", "avatar_url", "settings", "landingpage", "theme", "created_at") VALUES
	('79727457-507e-46f3-b293-fefdfdfb69e2', 'Udemy Academy', 'udemy-academy', 'http://localhost:54321/storage/v1/object/public/avatars/user/Udemy%20Academy1707716288852.webp', '{}', '{}', 'theme-rose', '2024-02-12 05:29:59.786403+00');


--
-- Data for Name: group; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."group" ("id", "name", "description", "created_at", "updated_at", "organization_id") VALUES
	('4cbfc681-0e3b-4239-be3b-dda4c7662e3b', 'Introduction to AI', 'The Introduction to AI course provides a comprehensive introduction to the field of Artificial Intelligence, covering key concepts, techniques, and applications, equipping students with a strong foundation in this rapidly evolving field.', '2024-02-12 05:46:03.222816+00', '2024-02-12 05:46:03.222816+00', '79727457-507e-46f3-b293-fefdfdfb69e2'),
	('ec2c262f-58f1-4803-ab5c-34d5e8cc4f46', 'React.js Fundamentals', 'React.js Fundamentals is a comprehensive course designed to equip learners with the foundational knowledge and skills needed to understand and develop applications using React.js, a popular JavaScript library for building user interfaces.', '2024-02-12 06:25:25.358301+00', '2024-02-12 06:25:25.358301+00', '79727457-507e-46f3-b293-fefdfdfb69e2');


--
-- Data for Name: course; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."course" ("title", "description", "overview", "id", "created_at", "updated_at", "group_id", "is_template", "logo", "slug", "metadata", "cost", "currency", "banner_image", "is_published", "is_certificate_downloadable", "certificate_theme", "status") VALUES
	('Introduction to AI and ML', 'The Introduction to AI course provides a comprehensive introduction to the field of Artificial Intelligence, covering key concepts, techniques, and applications, equipping students with a strong foundation in this rapidly evolving field.', 'Welcome to this amazing course 🚀 ', '45209adc-b85f-4a89-a3ee-329329f27e23', '2024-02-12 05:46:03.240579+00', '2024-02-12 05:46:03.240579+00', '4cbfc681-0e3b-4239-be3b-dda4c7662e3b', true, 'https://images.unsplash.com/photo-1526925539332-aa3b66e35444?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w1MTE1NTV8MHwxfHNlYXJjaHwxNnx8bWFjaGluZSUyMGxlYXJuaW5nfGVufDB8fHx8MTcwNzcxOTEzOHww&ixlib=rb-4.0.3&q=80&w=1080', 'introduction-to-ai-and-ml-1707719751725', '{"goals": "", "grading": false, "description": "", "requirements": "", "lessonDownload": false, "allowNewStudent": true, "lessonTabsOrder": [{"id": 1, "name": "Note"}, {"id": 2, "name": "Slide"}, {"id": 3, "name": "Video"}]}', 0, 'NGN', NULL, true, false, NULL, 'ACTIVE'),
	('React.js Fundamentals', 'React.js Fundamentals is a comprehensive course designed to equip learners with the foundational knowledge and skills needed to understand and develop applications using React.js, a popular JavaScript library for building user interfaces.', 'Welcome to this amazing course 🚀 ', '774a2734-3cb5-4a45-93cd-5e2c34669c18', '2024-02-12 06:25:25.378551+00', '2024-02-12 06:25:25.378551+00', 'ec2c262f-58f1-4803-ab5c-34d5e8cc4f46', true, 'https://images.unsplash.com/photo-1561736778-92e52a7769ef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w1MTE1NTV8MHwxfHNlYXJjaHwxNnx8cmVhY3R8ZW58MHx8fHwxNzA3NzE5NzAxfDA&ixlib=rb-4.0.3&q=80&w=1080', 'react-js-fundamentals-1707719764793', '{"goals": "", "grading": false, "description": "", "requirements": "", "lessonDownload": false, "allowNewStudent": true, "lessonTabsOrder": [{"id": 1, "name": "Note"}, {"id": 2, "name": "Slide"}, {"id": 3, "name": "Video"}]}', 0, 'NGN', NULL, true, false, NULL, 'ACTIVE');


--
-- Data for Name: profile; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."profile" ("id", "fullname", "username", "avatar_url", "created_at", "updated_at", "email", "can_add_course", "role", "goal", "source", "metadata", "telegram_chat_id") VALUES
	('6f4e680b-820b-4832-8c2a-6f4157a5f0c3', 'Elon Gates', 'admin1707715782708', 'http://localhost:54321/storage/v1/object/public/avatars/user/2a7ed2a1-5807-4f42-9d56-5e4d6e41faa2.webp', '2024-02-12 05:29:42.728433+00', '2024-02-12 05:29:42.728433+00', 'admin@test.com', true, NULL, 'sell-online', 'search-engine', '{"code":"FORBIDDEN_ORIGIN","message":"Your request origin is not allowed: http://localhost:5173","resolution":"You can manage filtering from the Ipregistry dashboard: https://dashboard.ipregistry.co/keys"}', NULL),
	('648a6894-5804-4cba-aec5-a4b8163fe4bf', 'student', 'student1707720081397', 'http://localhost:54321/storage/v1/object/public/avatars/user/bfd345ad-0720-4c3b-91fc-add6354a386d.webp', '2024-02-12 06:41:21.436734+00', '2024-02-12 06:41:21.436734+00', 'student@test.com', true, NULL, NULL, NULL, NULL, NULL);


--
-- Data for Name: role; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."role" ("type", "description", "id", "updated_at", "created_at") VALUES
	('ADMIN', 'The main controller', 1, '2024-02-12 05:26:17.112307+00', '2024-02-12 05:26:17.112307+00'),
	('TUTOR', 'Can make changes to content, courses, but cant control passwords and cant add other tutors', 2, '2024-02-12 05:26:17.112307+00', '2024-02-12 05:26:17.112307+00'),
	('STUDENT', 'A student role, can interact with application but cant make changes', 3, '2024-02-12 05:26:17.112307+00', '2024-02-12 05:26:17.112307+00');


--
-- Data for Name: groupmember; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."groupmember" ("id", "group_id", "role_id", "profile_id", "email", "created_at", "assigned_student_id") VALUES
	('a3c00ea1-6bb4-4823-8c86-affbc6491686', '4cbfc681-0e3b-4239-be3b-dda4c7662e3b', 2, '6f4e680b-820b-4832-8c2a-6f4157a5f0c3', 'admin@test.com', '2024-02-12 05:46:03.314654+00', NULL),
	('b6b8c175-919f-4983-a490-ba5269b01a97', 'ec2c262f-58f1-4803-ab5c-34d5e8cc4f46', 2, '6f4e680b-820b-4832-8c2a-6f4157a5f0c3', 'admin@test.com', '2024-02-12 06:25:25.524308+00', NULL),
	('72054e63-6ada-40d5-8cf3-7bb9025559fe', 'ec2c262f-58f1-4803-ab5c-34d5e8cc4f46', 3, '648a6894-5804-4cba-aec5-a4b8163fe4bf', NULL, '2024-02-12 06:41:23.981071+00', NULL);


--
-- Data for Name: apps_poll; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: apps_poll_option; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: apps_poll_submission; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: organizationmember; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."organizationmember" ("id", "organization_id", "role_id", "profile_id", "email", "verified", "created_at") VALUES
	(1, '79727457-507e-46f3-b293-fefdfdfb69e2', 1, '6f4e680b-820b-4832-8c2a-6f4157a5f0c3', NULL, false, '2024-02-12 05:29:59.809596+00'),
	(2, '79727457-507e-46f3-b293-fefdfdfb69e2', 3, '648a6894-5804-4cba-aec5-a4b8163fe4bf', NULL, false, '2024-02-12 06:41:21.461782+00');


--
-- Data for Name: community_question; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: community_answer; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: currency; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: lesson; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."lesson" ("note", "video_url", "slide_url", "course_id", "id", "created_at", "updated_at", "title", "public", "lesson_at", "teacher_id", "is_complete", "call_url", "order", "is_unlocked", "videos") VALUES
	(NULL, NULL, NULL, '45209adc-b85f-4a89-a3ee-329329f27e23', '586c0421-8121-4f85-89fa-9c0146779573', '2024-02-12 05:51:56.032294+00', '2024-02-12 05:51:56.032294+00', 'Model Selection and Validation', false, '2024-02-12 05:51:54.187+00', '6f4e680b-820b-4832-8c2a-6f4157a5f0c3', false, NULL, NULL, false, '[]'),
	(NULL, NULL, NULL, '45209adc-b85f-4a89-a3ee-329329f27e23', '5e2b971e-8249-4cbb-9adc-bb278f93fb9a', '2024-02-12 05:52:05.628957+00', '2024-02-12 05:52:05.628957+00', 'Ethical Considerations in AI and ML', false, '2024-02-12 05:52:03.523+00', '6f4e680b-820b-4832-8c2a-6f4157a5f0c3', false, NULL, NULL, false, '[]'),
	(NULL, NULL, NULL, '45209adc-b85f-4a89-a3ee-329329f27e23', '0ac9337f-41d5-4c03-ad24-00d1f1008a2b', '2024-02-12 05:52:15.607417+00', '2024-02-12 05:52:15.607417+00', 'Future Trends and Applications', false, '2024-02-12 05:52:13.59+00', '6f4e680b-820b-4832-8c2a-6f4157a5f0c3', false, NULL, NULL, false, '[]'),
	('<h2>Objective:</h2>
<p>The objective of this lesson is to introduce students to the fundamentals of React.js, a popular JavaScript library used for building user interfaces.</p>
<h2>Key Topics:</h2>
<ul>
<li>What is React?</li>
<li>Why use React?</li>
<li>React''s Virtual DOM</li>
<li>React Components</li>
<li>React''s State and Props</li>
<li>React''s JSX Syntax</li>
<li>React''s Lifecycle Methods</li>
</ul>
<h2>Lesson Overview:</h2>
<p>In this lesson, we will cover the following topics:</p>
<h3>1. What is React?</h3>
<p>We will start by understanding what React is and its role in web development. We will explore its benefits and why it has gained popularity among developers.</p>
<h3>2. Why use React?</h3>
<p>We will discuss the advantages of using React over traditional approaches to building user interfaces. We will look at its performance, reusability, and maintainability.</p>
<h3>3. React''s Virtual DOM</h3>
<p>We will delve into the concept of React''s Virtual DOM and how it optimizes rendering performance. We will compare it to the real DOM and understand its advantages.</p>
<h3>4. React Components</h3>
<p>We will learn about React components, the building blocks of React applications. We will explore the different types of components and their usage. We will also understand the component lifecycle and its methods.</p>
<h3>5. React''s State and Props</h3>
<p>We will study React''s state and props, which allow us to manage and pass data between components. We will learn how to update component state and pass data through props.</p>
<h3>6. React''s JSX Syntax</h3>
<p>We will cover JSX, a syntax extension for JavaScript used in React. We will understand how to write JSX code and its benefits.</p>
<h3>7. React''s Lifecycle Methods</h3>
<p>We will explore React''s lifecycle methods and their purpose. We will understand when each method is called and how to utilize them effectively.</p>
<h2>Resources:</h2>
<ul>
<li>React.js Documentation: <a href="https://reactjs.org/docs/getting-started.html">https://reactjs.org/docs/getting-started.html</a></li>
<li>React in 100 Seconds - Tutorial for Beginners: <a href="https://www.youtube.com/watch?v=_ZTT9kw3PIE">https://www.youtube.com/watch?v=_ZTT9kw3PIE</a></li>
</ul>', NULL, NULL, '774a2734-3cb5-4a45-93cd-5e2c34669c18', 'dea55f18-a63f-468e-a069-c536b120f831', '2024-02-12 06:25:54.032537+00', '2024-02-12 08:07:23.18479+00', 'Introduction to React', false, '2024-02-12 06:25:45.315+00', '6f4e680b-820b-4832-8c2a-6f4157a5f0c3', false, NULL, NULL, true, '[]'),
	('<h3>Learning Objectives:</h3>
<ul>
<li>Understand the fundamental concepts of Artificial Intelligence (AI) and Machine Learning (ML).</li>
<li>Familiarize yourself with the terminology commonly used in the field of AI and ML.</li>
</ul>
<h3>Content:</h3>
<p>In this lesson, we will explore the basic concepts and terminology of Artificial Intelligence (AI) and Machine Learning (ML). AI is a multidisciplinary field that aims to create intelligent machines capable of mimicking human-like intelligence, while ML is a subset of AI that focuses on enabling computers to learn from data and make accurate predictions or decisions without being explicitly programmed. To understand AI and ML, it is important to be familiar with the following key terms:</p>
<h4>1. Artificial Intelligence (AI):</h4>
<p>AI refers to the simulation of human-like intelligence in machines that are programmed to think and learn. It involves the development of intelligent systems that can analyze and interpret complex data, solve problems, and make decisions.</p>
<h4>2. Machine Learning (ML):</h4>
<p>ML is a subset of AI that focuses on enabling computers to learn from data and improve their performance over time without being explicitly programmed. ML algorithms can automatically learn patterns and make predictions or decisions based on the provided data.</p>
<h4>3. Data:</h4>
<p>Data refers to the information that is used as input for Machine Learning algorithms. It can be structured (e.g., numerical data stored in databases) or unstructured (e.g., text, images, audio, etc.).</p>
<h4>4. Training Data:</h4>
<p>Training data is a subset of available data that is used to train the Machine Learning model. It contains input features and corresponding known output labels or target values, allowing the model to learn how to make accurate predictions or decisions.</p>
<h4>5. Feature:</h4>
<p>A feature refers to an individual measurable property or characteristic of the data that is fed into the Machine Learning model. Features can be specific attributes, variables, or dimensions that provide valuable information for the learning process.</p>
<h4>6. Model:</h4>
<p>A model is the representation of learned patterns or relationships between input features and output values. It is created by the Machine Learning algorithm during the training process and can be used to make predictions or decisions on new, unseen data.</p>
<h4>7. Prediction:</h4>
<p>A prediction is the outcome generated by the Machine Learning model for a specific input instance that was not part of the training data. The model uses its learned patterns to produce an estimate or expected value.</p>
<h3>Summary:</h3>
<p>In this lesson, we discussed the basic concepts and terminology of Artificial Intelligence (AI) and Machine Learning (ML). AI involves the creation of intelligent systems that can think and learn like humans, while ML focuses on enabling computers to learn from data and make accurate predictions or decisions. We explored key terms such as AI, ML, data, training data, feature, model, and prediction. Understanding these fundamentals is essential for further exploration in the field of AI and ML.</p>', NULL, NULL, '45209adc-b85f-4a89-a3ee-329329f27e23', '11cd0d69-8838-4802-b0c6-47fffb320bed', '2024-02-12 05:50:54.78285+00', '2024-02-12 06:05:57.912372+00', 'Data Collection and Preparation', false, '2024-02-12 05:50:51.565+00', '6f4e680b-820b-4832-8c2a-6f4157a5f0c3', false, NULL, NULL, false, '[]'),
	('<p>In this lesson, we will dive into the fundamentals of Artificial Intelligence (AI) and Machine Learning (ML), exploring the basic concepts, techniques, and applications that form the foundation of these exciting fields.</p>
<h3>Learning Objectives:</h3>
<ol>
<li>Understand the definition and scope of Artificial Intelligence.</li>
<li>Explore the various branches of AI and their respective applications.</li>
<li>Comprehend the basics of Machine Learning and its relationship to AI.</li>
<li>Identify different types of Machine Learning algorithms and their use cases.</li>
<li>Gain insights into the applications of AI and ML in various industries.</li>
</ol>
<h3>Topics Covered:</h3>
<ul>
<li>Definition and Scope of Artificial Intelligence</li>
<li>Branches of AI: Expert Systems, Natural Language Processing, Computer Vision, Robotics, etc.</li>
<li>Introduction to Machine Learning</li>
<li>Supervised, Unsupervised, and Reinforcement Learning</li>
<li>Commonly Used Machine Learning Algorithms: Linear Regression, Logistic Regression, Decision Trees, etc.</li>
<li>Real-world Applications of AI and ML: Healthcare, Finance, Autonomous Vehicles, Recommender Systems, etc.</li>
</ul>
<h3>Lesson Overview:</h3>
<p>The lesson will begin by establishing a clear understanding of what Artificial Intelligence entails. We will examine its broad scope and discuss the different branches of AI, such as Expert Systems, Natural Language Processing, Computer Vision, and Robotics. The emphasis will be on gaining insights into the real-world applications of these branches.</p>
<p>Following the AI overview, we will delve into the fundamentals of Machine Learning. We will explore the key concepts, including supervised, unsupervised, and reinforcement learning. Emphasis will be placed on understanding the differences between these learning paradigms and their use cases.</p>
<p>The lesson will culminate in exploring commonly used Machine Learning algorithms, such as Linear Regression, Logistic Regression, and Decision Trees. We will discuss their applications and understand how they can be used to solve real-world problems.</p>
<p>Throughout the lesson, we will emphasize the practical relevance of AI and ML in various industries, such as Healthcare, Finance, Autonomous Vehicles, and Recommender Systems. This will help students appreciate the wide-ranging applications of these technologies in today''s world.</p>', NULL, NULL, '45209adc-b85f-4a89-a3ee-329329f27e23', '085097b5-0753-4eea-9ac4-1ed25b817fce', '2024-02-12 05:49:36.450215+00', '2024-02-12 06:00:12.276599+00', 'Fundamentals of AI and ML', false, '2024-02-12 05:49:29.39+00', '6f4e680b-820b-4832-8c2a-6f4157a5f0c3', false, NULL, NULL, false, '[{"link": "https://www.youtube.com/watch?v=G2fqAlgmoPo&ab_channel=GoogleCloudTech", "type": "youtube", "metadata": {}}]'),
	(NULL, NULL, NULL, '45209adc-b85f-4a89-a3ee-329329f27e23', 'd62f1ef6-4856-484c-a702-d26f33c00331', '2024-02-12 05:51:04.275467+00', '2024-02-12 06:02:05.244565+00', 'Supervised Learning Algorithms', false, '2024-02-12 05:51:02.039+00', '6f4e680b-820b-4832-8c2a-6f4157a5f0c3', false, NULL, NULL, false, '[{"link": "https://www.youtube.com/watch?v=W01tIRP_Rqs&pp=ygUTc3VwZXJ2aXNlZCBsZWFybmluZw%3D%3D", "type": "youtube", "metadata": {}}]'),
	(NULL, NULL, NULL, '45209adc-b85f-4a89-a3ee-329329f27e23', 'c3427c82-4934-400f-8961-39767eff7a1a', '2024-02-12 05:51:29.823098+00', '2024-02-12 06:03:39.415617+00', 'Unsupervised Learning Algorithms', false, '2024-02-12 05:51:12.421+00', '6f4e680b-820b-4832-8c2a-6f4157a5f0c3', false, NULL, NULL, false, '[{"link": "https://www.youtube.com/watch?v=D6gtZrsYi6c&pp=ygUgVW5zdXBlcnZpc2VkIExlYXJuaW5nIEFsZ29yaXRobXM%3D", "type": "youtube", "metadata": {}}]'),
	(NULL, NULL, NULL, '45209adc-b85f-4a89-a3ee-329329f27e23', '5b64d7d8-c872-4920-b71d-f57890b5072c', '2024-02-12 05:51:39.268507+00', '2024-02-12 06:04:07.153692+00', 'Neural Networks and Deep Learning', false, '2024-02-12 05:51:32.623+00', '6f4e680b-820b-4832-8c2a-6f4157a5f0c3', false, NULL, NULL, false, '[{"link": "https://www.youtube.com/watch?v=bfmFfD2RIcg&pp=ygUhTmV1cmFsIE5ldHdvcmtzIEFuZCBEZWVwIExlYXJuaW5n", "type": "youtube", "metadata": {}}]'),
	('<p>In this lesson, we will dive into the fundamentals of Artificial Intelligence (AI) and Machine Learning (ML), exploring the basic concepts, techniques, and applications that form the foundation of these exciting fields.</p>
<h3>Learning Objectives:</h3>
<ol>
<li>Understand the definition and scope of Artificial Intelligence.</li>
<li>Explore the various branches of AI and their respective applications.</li>
<li>Comprehend the basics of Machine Learning and its relationship to AI.</li>
<li>Identify different types of Machine Learning algorithms and their use cases.</li>
<li>Gain insights into the applications of AI and ML in various industries.</li>
</ol>
<h3>Topics Covered:</h3>
<ul>
<li>Definition and Scope of Artificial Intelligence</li>
<li>Branches of AI: Expert Systems, Natural Language Processing, Computer Vision, Robotics, etc.</li>
<li>Introduction to Machine Learning</li>
<li>Supervised, Unsupervised, and Reinforcement Learning</li>
<li>Commonly Used Machine Learning Algorithms: Linear Regression, Logistic Regression, Decision Trees, etc.</li>
<li>Real-world Applications of AI and ML: Healthcare, Finance, Autonomous Vehicles, Recommender Systems, etc.</li>
</ul>
<h3>Lesson Overview:</h3>
<p>The lesson will begin by establishing a clear understanding of what Artificial Intelligence entails. We will examine its broad scope and discuss the different branches of AI, such as Expert Systems, Natural Language Processing, Computer Vision, and Robotics. The emphasis will be on gaining insights into the real-world applications of these branches.</p>
<p>Following the AI overview, we will delve into the fundamentals of Machine Learning. We will explore the key concepts, including supervised, unsupervised, and reinforcement learning. Emphasis will be placed on understanding the differences between these learning paradigms and their use cases.</p>
<p>The lesson will culminate in exploring commonly used Machine Learning algorithms, such as Linear Regression, Logistic Regression, and Decision Trees. We will discuss their applications and understand how they can be used to solve real-world problems.</p>
<p>Throughout the lesson, we will emphasize the practical relevance of AI and ML in various industries, such as Healthcare, Finance, Autonomous Vehicles, and Recommender Systems. This will help students appreciate the wide-ranging applications of these technologies in today''s world.</p>', NULL, NULL, '45209adc-b85f-4a89-a3ee-329329f27e23', 'd6361638-ec02-4ef8-af1d-80c69faecabc', '2024-02-12 05:50:42.509024+00', '2024-02-12 06:05:20.584463+00', 'Basic Concepts and Terminology', false, '2024-02-12 05:50:32.282+00', '6f4e680b-820b-4832-8c2a-6f4157a5f0c3', false, NULL, NULL, false, '[{"link": "https://www.youtube.com/watch?v=G2fqAlgmoPo&ab_channel=GoogleCloudTech", "type": "youtube", "metadata": {}}]'),
	('<p>In the field of Artificial Intelligence and Machine Learning, evaluation metrics are used to assess the performance and effectiveness of different models and algorithms. By quantifying the achievements and limitations of these models, we can make informed decisions about their usefulness in solving specific problems.</p>
<p>There are several evaluation metrics commonly used in AI and ML, each serving a specific purpose and providing insights into different aspects of model performance. Some of the most important evaluation metrics used in this field include:</p>
<p><strong>1. Accuracy:</strong> Accuracy is a widely used metric that measures the percentage of correctly predicted instances out of the total instances. It is a good metric for balanced datasets but may not be suitable for imbalanced datasets where the class distribution is skewed.</p>
<p><strong>2. Precision:</strong> Precision is a metric that quantifies the proportion of correctly predicted positive instances out of the total predicted positive instances. It measures the model''s ability to correctly identify positive instances and is useful in tasks where the cost of false positives is high.</p>
<p><strong>3. Recall (Sensitivity or True Positive Rate):</strong> Recall measures the proportion of correctly predicted positive instances out of the total actual positive instances. It assesses the model''s ability to detect all positive instances and is important in tasks where the cost of false negatives is high.</p>
<p><strong>4. F1 Score:</strong> The F1 score is the harmonic mean of precision and recall, providing a balance between both metrics. It is a useful evaluation metric when there is an uneven class distribution in the dataset.</p>
<p><strong>5. ROC AUC:</strong> The Receiver Operating Characteristic (ROC) curve and the Area Under the Curve (AUC) are used to evaluate binary classifiers. The ROC curve plots the True Positive Rate against the False Positive Rate at different classification thresholds. The AUC represents the overall performance of the classifier, with a higher value indicating better performance.</p>
<p><strong>6. Mean Squared Error (MSE):</strong> MSE is a commonly used metric for regression problems. It measures the average squared difference between the predicted and actual values, providing an indication of the model''s ability to fit the data.</p>
<p><strong>7. Mean Absolute Error (MAE):</strong> MAE is another commonly used metric for regression problems. It measures the average absolute difference between the predicted and actual values, providing a more robust evaluation metric compared to MSE.</p>
<p>These are just a few examples of the evaluation metrics used in the field of AI and ML. Depending on the specific problem and dataset, different metrics may be more appropriate for assessing model performance. It is important to consider the strengths and limitations of each metric and choose the most suitable ones to make accurate evaluations and comparisons.</p>', NULL, NULL, '45209adc-b85f-4a89-a3ee-329329f27e23', '9d608b48-3454-4bac-a8c4-24774bcc8a4a', '2024-02-12 05:51:51.796104+00', '2024-02-12 06:04:33.487986+00', 'Evaluation Metrics', false, '2024-02-12 05:51:45.972+00', '6f4e680b-820b-4832-8c2a-6f4157a5f0c3', false, NULL, NULL, false, '[]'),
	('<p>In React.js, lifecycle methods allow certain code to be executed at specific points in the component''s life cycle. These methods enable developers to perform certain actions based on the current state of the component. Understanding the different lifecycle methods is crucial for managing and controlling the behavior of React components.</p>
<h2>Mounting Lifecycle Methods</h2>
<p>The mounting phase refers to the creation process of a component and its insertion into the DOM. During this phase, the following lifecycle methods are available:</p>
<ul>
<li><strong>constructor(props) :</strong> This method is called when a component is created and is used to initialize state and bind event handlers.</li>
<li><strong>render() :</strong> This method is responsible for rendering the component''s content onto the DOM. It should not contain any side effects or modify the component''s state.</li>
<li><strong>componentDidMount() :</strong> This method is invoked immediately after the component is mounted to the DOM. It is commonly used to perform any necessary setup like fetching data from APIs or subscribing to event listeners.</li>
</ul>
<h2>Updating Lifecycle Methods</h2>
<p>The updating phase occurs whenever there is a change in the component''s props or state. During this phase, the following lifecycle methods are invoked:</p>
<ul>
<li><strong>shouldComponentUpdate(nextProps, nextState) :</strong> This method is called before the component is re-rendered, allowing developers to determine if the update should proceed. It can be utilized to improve performance by preventing unnecessary re-rendering.</li>
<li><strong>render() :</strong> As mentioned earlier, this method is responsible for rendering the component''s content onto the DOM.</li>
<li><strong>componentDidUpdate(prevProps, prevState) :</strong> This method is invoked after the component has been re-rendered. It is commonly used to perform operations after a component has been updated, such as updating the DOM or fetching new data based on the changes.</li>
</ul>
<h2>Unmounting Lifecycle Method</h2>
<p>The unmounting phase occurs when a component is about to be removed from the DOM. The following lifecycle method is available:</p>
<ul>
<li><strong>componentWillUnmount() :</strong> This method is called right before the component is unmounted from the DOM. It can be used to clean up any resources or subscriptions associated with the component.</li>
</ul>
<h2>Error Handling Lifecycle Methods</h2>
<p>The error handling phase occurs when there is an error during rendering, in a lifecycle method, or within a child component''s constructor or render method. The following methods are involved:</p>
<ul>
<li><strong>componentDidCatch(error, info) :</strong> This method is called whenever an error is thrown in the component''s child tree. It allows developers to implement error boundaries and handle or log the error.</li>
</ul>
<p>Understanding the usage and order of these lifecycle methods is essential in building robust and efficient React.js applications. By properly utilizing these methods, developers can control the various stages of a component''s lifecycle and optimize the overall performance of their application.</p>', NULL, NULL, '774a2734-3cb5-4a45-93cd-5e2c34669c18', 'f17c96c8-a7a0-45df-adb2-4a357744fdaa', '2024-02-12 06:26:02.170976+00', '2024-02-12 08:07:23.95017+00', 'Lifecycle Methods', false, '2024-02-12 06:25:55.087+00', '6f4e680b-820b-4832-8c2a-6f4157a5f0c3', false, NULL, NULL, true, '[]'),
	('<div class="lesson-note">
<p>The objective of this lesson is to understand server-side rendering (SSR) in React.js using Next.js.</p>
<h2>Introduction</h2>
<p>Server-side rendering is a technique commonly used in web development to improve the performance and SEO of React applications. In this lesson, we will explore how to implement server-side rendering with Next.js, a popular framework built on top of React.</p>
<h2>Key Concepts</h2>
<ul>
<li><strong>Server-side rendering:</strong> Rendering React components on the server and sending the pre-rendered HTML to the client before JavaScript is executed.</li>
<li><strong>Next.js:</strong> A framework for building server-side rendered React applications.</li>
<li><strong>Pages and routing:</strong> How to create pages in Next.js and define routes for server-side rendered content.</li>
<li><strong>Data fetching:</strong> How to fetch data from external APIs or databases during server-side rendering.</li>
<li><strong>Reusable components:</strong> How to create reusable React components that can be used across multiple pages in Next.js.</li>
</ul>
<h2>Lesson Content</h2>
<p>In this lesson, we will cover the following topics:</p>
<ol>
<li>Setting up a new Next.js project</li>
<li>Creating dynamic pages and defining routes</li>
<li>Fetching data during server-side rendering</li>
<li>Building reusable components</li>
<li>Deploying a Next.js application</li>
</ol>
<h2>Conclusion</h2>
<p>By the end of this lesson, you should have a solid understanding of server-side rendering in React.js using Next.js. You will be able to build server-side rendered React applications with improved performance and SEO capabilities.</p>
<div class="additional-resources">
<h3>Additional Resources</h3>
<ul>
<li><a href="https://nextjs.org/docs/getting-started">Next.js documentation</a></li>
<li><a href="https://reactjs.org/">React documentation</a></li>
<li><a href="https://www.youtube.com/watch?v=5oiXG9f6GO0">Introduction to server-side rendering with Next.js (YouTube video)</a></li>
</ul>
</div>
<h2>References</h2>
<p>[Insert references/sources used in the lesson here]</p>
</div>', NULL, NULL, '774a2734-3cb5-4a45-93cd-5e2c34669c18', 'e21d16ef-d108-4634-99e5-612415fe7bf6', '2024-02-12 06:26:56.422093+00', '2024-02-12 06:35:16.590301+00', 'Server Side Rendering w/ Next.js', false, '2024-02-12 06:26:41.326+00', '6f4e680b-820b-4832-8c2a-6f4157a5f0c3', false, NULL, NULL, false, '[]'),
	('<p>In this lesson, we will be discussing the concept of state in React.js. State is an important aspect of React.js as it allows us to manage and store data within a component. It enables us to create dynamic, interactive, and responsive user interfaces.</p>
<p>State is an object that holds values that can change over time, and it is managed internally within a component. It represents the current state of the component and can be updated through various means, such as user interactions, data fetching, or timers.</p>
<p>To utilize state in a React.js component, we need to initialize it within the constructor method. The state object is usually defined as a key-value pair, where the keys represent the names of the state properties, and the values represent the initial values of those properties.</p>
<p>Once the state is initialized, we can access and update its values using the JavaScript dot notation, just like accessing properties of any other object. However, unlike props, state values can be modified within the component itself, making them mutable.</p>
<p>Updating the state is a crucial step in React.js programming, as it triggers the re-rendering of the component and reflects the changes in the user interface. To update the state, we use the <code>setState()</code> method provided by the React.js library. This method allows us to update the values of state properties and notifies React.js to re-render the component accordingly.</p>
<p>It is important to note that when updating the state using <code>setState()</code>, we should always provide the new state object that contains the updated values. This ensures that the correct state is maintained and prevents any unexpected behavior.</p>
<p>Furthermore, updating the state using the <code>setState()</code> method is asynchronous in nature. It means that React.js may batch multiple state updates together for performance optimization. Therefore, if you want to perform additional tasks after the state update, you should make use of the optional callback function provided by <code>setState()</code>.</p>
<p>By understanding and effectively using state in React.js, you can build more interactive and dynamic web applications. It enables you to create components that respond to user input and provide real-time updates.</p>
<p>Next lesson, we will explore more advanced concepts and techniques related to state management in React.js. Make sure to practice and review the material covered in this lesson to strengthen your understanding.</p>', NULL, NULL, '774a2734-3cb5-4a45-93cd-5e2c34669c18', 'ea78130e-3a7f-4e71-a43c-7054d4c0c891', '2024-02-12 06:26:13.31743+00', '2024-02-12 08:07:24.984095+00', 'State', false, '2024-02-12 06:26:03.14+00', '6f4e680b-820b-4832-8c2a-6f4157a5f0c3', false, NULL, NULL, true, '[]'),
	('<p>Welcome to today''s lesson on React Hooks. In this lesson, we will be diving into the world of React Hooks - a feature introduced in React version 16.8. React Hooks provides a new way of writing components that allows you to use state and other React features without writing a class.</p>
<p>Firstly, let''s understand the need for React Hooks. Traditionally, React components were written using class syntax which sometimes led to complex code structures and increased cognitive load. React Hooks were introduced to simplify the development process and enable developers to write more concise and reusable code.</p>
<p>There are several types of React Hooks, but the most commonly used ones are the <code>useState</code>, <code>useEffect</code>, and <code>useContext</code> hooks. We will explore each of these hooks in detail in the upcoming sections.</p>
<h4>1. useState Hook</h4>
<p>The <code>useState</code> hook allows us to add state to functional components. It takes an initial value and returns an array with two elements: the current state value and a function to update the state value. We will see how this hook can help us manage state within functional components.</p>
<h4>2. useEffect Hook</h4>
<p>The <code>useEffect</code> hook is used to perform side effects in functional components. It allows us to handle lifecycle events such as component mounting, updating, and unmounting. We will explore how to use this hook to fetch data, subscribe to events, and clean up resources.</p>
<h4>3. useContext Hook</h4>
<p>The <code>useContext</code> hook provides a way to consume a context in a functional component. It allows us to access the value provided by a context without wrapping the component in a higher-order component or using render props. We will see how this hook simplifies consuming contexts.</p>
<p>In addition to these hooks, React provides other hooks such as <code>useReducer</code>, <code>useCallback</code>, <code>useMemo</code>, and <code>useRef</code> that offer more advanced functionalities. However, we will focus on the basics and the most frequently used hooks in this lesson.</p>
<p>By the end of this lesson, you should feel comfortable working with React Hooks and understand their benefits in writing efficient and reusable code. Remember to practice and experiment with these hooks to gain hands-on experience.</p>
<p>That''s all for now. Get ready to dive into the world of React Hooks and enhance your React development skills!</p>', NULL, NULL, '774a2734-3cb5-4a45-93cd-5e2c34669c18', '7c74d4f6-bf77-40c9-84df-abd014850b3d', '2024-02-12 06:26:26.450827+00', '2024-02-12 06:31:52.798272+00', 'React Hooks', false, '2024-02-12 06:26:18.991+00', '6f4e680b-820b-4832-8c2a-6f4157a5f0c3', false, NULL, NULL, false, '[]'),
	('<p>In this lesson, students will learn about Redux, a predictable state container for JavaScript applications. They will understand the benefits of using Redux in React.js development and how it helps in managing application state efficiently.</p>
<h2>Lesson Outline</h2>
<p>1. Introduction to Redux</p>
<ul>
<li>What is Redux and why is it used in React.js development</li>
<li>The Redux architecture and core concepts</li>
<li>Understanding the Redux data flow</li>
</ul>
<p>2. Setting up Redux in a React.js application</p>
<ul>
<li>Installing Redux and required dependencies</li>
<li>Creating a Redux store</li>
<li>Implementing Redux reducers</li>
<li>Connecting Redux store to React components</li>
</ul>
<p>3. Working with Actions</p>
<ul>
<li>Defining Redux actions and action creators</li>
<li>Dispatching actions to update the Redux store</li>
<li>Handling asynchronous actions using Redux middleware</li>
</ul>
<p>4. Using Redux DevTools for debugging</p>
<ul>
<li>Installing and configuring Redux DevTools extension</li>
<li>Inspecting Redux state changes</li>
<li>Time-travel debugging with Redux DevTools</li>
</ul>
<h2>Lesson Homework</h2>
<p>As a homework assignment, students should build a simple React.js application using Redux. They should implement a basic counter functionality, allowing users to increment and decrement a counter value using Redux actions and reducers. Students should also make use of Redux DevTools to debug and inspect the state changes.</p>
<h2>Additional Resources</h2>
<ul>
<li><a href="https://redux.js.org/">Official Redux Documentation</a></li>
<li><a href="https://react-redux.js.org/">React Redux Documentation</a></li>
<li><a href="https://github.com/zalmoxisus/redux-devtools-extension">Redux DevTools Extension</a></li>
</ul>', NULL, NULL, '774a2734-3cb5-4a45-93cd-5e2c34669c18', '84afb32f-5cd8-4d23-a1e8-578a8623961c', '2024-02-12 06:26:39.980285+00', '2024-02-12 06:33:53.995528+00', 'Redux', false, '2024-02-12 06:26:27.458+00', '6f4e680b-820b-4832-8c2a-6f4157a5f0c3', false, NULL, NULL, false, '[]'),
	('<!DOCTYPE html>
<html>
<head>
  <title>React.js Fundamentals - Lesson Note</title>
</head>
<body>
  <h1>React.js Fundamentals - Lesson Note</h1>
  
  <h2>Lesson: Props</h2>
  
  <h3>Learning Objectives</h3>
  <ul>
    <li>Understand the concept of props in React.js</li>
    <li>Learn how to pass props from parent components to child components</li>
    <li>Explore the usage of props to make components more flexible and reusable</li>
  </ul>
  
  <h3>Introduction</h3>
  <p>In React.js, props (short for properties) are a means to pass data from one component to another. They allow components to communicate with each other by passing information in a uni-directional flow, from parent components to child components.</p>
  
  <h3>Passing Props</h3>
  <p>Props are passed to child components as attributes, similar to how HTML attributes are passed to HTML elements. We can pass any kind of data through props, including primitive types like strings and numbers, as well as complex data structures like objects and arrays.</p>
  
  <p>To pass props to a child component, we can specify the props as attributes when rendering the child component within the parent component''s JSX. For example:</p>
  
  <pre><code>
    &lt;ParentComponent&gt;
      &lt;ChildComponent propName="propValue" /&gt;
    &lt;/ParentComponent&gt;
  </code></pre>
  
  <p>In the example above, the parent component (ParentComponent) is passing a prop called propName with a value of "propValue" to its child component (ChildComponent).</p>
  
  <h3>Accessing Props</h3>
  <p>Inside a child component, props can be accessed through the component''s props object. The props object contains key-value pairs, where the keys correspond to the prop names defined in the parent component, and the values represent the actual values passed to those props.</p>
  
  <p>To access the value of a prop, we use the dot notation and the prop name. For example:</p>
  
  <pre><code>
    // Inside ChildComponent render method
    render() {
      return (
        &lt;div&gt;
          &lt;p&gt;Prop Value: {this.props.propName}&lt;/p&gt;
        &lt;/div&gt;
      );
    }
  </code></pre>
  
  <p>In the example above, the value of the prop called propName is displayed using curly braces and the dot notation (this.props.propName).</p>
  
  <h3>Prop Validation</h3>
  <p>In React.js, prop validation allows us to define the expected types and structure of the props that a component should receive. This helps to ensure that components are being used correctly and minimizes potential bugs caused by incorrect prop usage.</p>
  
  <p>We can use the PropTypes module from the prop-types package to define prop validation rules. PropTypes provide a range of validators to check the type, presence, and other constraints of the props. For example:</p>
  
  <pre><code>
    import PropTypes from ''prop-types'';
    
    // Inside ChildComponent propTypes definition
    ChildComponent.propTypes = {
      propName: PropTypes.string.isRequired,
      // Additional prop validation rules...
    };
  </code></pre>
  
  <p>In the example above, PropTypes.string.isRequired indicates that propName should be a required prop, and its value should be of type string.</p>
  
  <h3>Conclusion</h3>
  <p>Props are an important concept in React.js that allow components to communicate and share data with each other. By passing props from parent components to child components, we can create more flexible and reusable components. Understanding props and how to work with them is crucial for building complex React.js applications.</p>
  
</body>
</html>', NULL, NULL, '774a2734-3cb5-4a45-93cd-5e2c34669c18', '725cfce7-8481-4d82-9bd5-c9244b37a4f4', '2024-02-12 06:26:17.470644+00', '2024-02-12 08:07:26.289893+00', 'Props', false, '2024-02-12 06:26:14.424+00', '6f4e680b-820b-4832-8c2a-6f4157a5f0c3', false, NULL, NULL, true, '[]');


--
-- Data for Name: exercise; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."exercise" ("title", "description", "lesson_id", "created_at", "updated_at", "id", "due_by") VALUES
	('Artificial Intelligence and Machine Learning Fundamentals Quiz', 'Please answer the following questions based on the lesson on Artificial Intelligence and Machine Learning fundamentals.', '085097b5-0753-4eea-9ac4-1ed25b817fce', '2024-02-12 06:05:05.446827+00', '2024-02-12 06:05:05.446827+00', '160ddbf6-ecbb-470b-b7dc-47ab0619e166', NULL),
	('Quiz', 'Please answer the following questions.', 'd6361638-ec02-4ef8-af1d-80c69faecabc', '2024-02-12 06:05:47.788669+00', '2024-02-12 06:05:47.788669+00', 'c4f99501-8379-4c0c-9850-d4cf90bedb04', NULL),
	('HTML Elements Quiz', 'Test your knowledge of HTML elements', '11cd0d69-8838-4802-b0c6-47fffb320bed', '2024-02-12 06:21:03.67628+00', '2024-02-12 06:21:03.67628+00', 'd6ce3607-36bb-42c7-bd84-e333ef5dae2d', NULL),
	('React ES6 Classes Quiz', 'Test your knowledge of React ES6 classes.', 'dea55f18-a63f-468e-a069-c536b120f831', '2024-02-12 06:28:25.739151+00', '2024-02-12 06:28:25.739151+00', 'b47653e5-9446-4c79-9a0c-7b08e8d9eceb', NULL),
	('React Class Components Quiz', 'Test your knowledge of React class components.', 'f17c96c8-a7a0-45df-adb2-4a357744fdaa', '2024-02-12 06:29:58.281028+00', '2024-02-12 06:29:58.281028+00', '3086d810-8754-408c-8856-15dccb732e3f', NULL),
	('React useState Hook Quiz', 'Test your knowledge about the React useState hook.', '7c74d4f6-bf77-40c9-84df-abd014850b3d', '2024-02-12 06:32:25.799814+00', '2024-02-12 06:32:25.799814+00', 'a2c739ed-4d33-465d-a480-a071499eca43', NULL),
	('React Props Quiz', 'Test your knowledge of React props.', '725cfce7-8481-4d82-9bd5-c9244b37a4f4', '2024-02-12 06:34:41.809648+00', '2024-02-12 06:34:41.809648+00', '242b05d0-4288-4618-9225-a52b408b1760', NULL);


--
-- Data for Name: group_attendance; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: lesson_comment; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: lesson_completion; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."lesson_completion" ("id", "created_at", "lesson_id", "profile_id", "is_complete", "updated_at") VALUES
	(1, '2024-02-12 00:00:00+00', 'dea55f18-a63f-468e-a069-c536b120f831', '648a6894-5804-4cba-aec5-a4b8163fe4bf', true, '2024-02-12 00:00:00+00'),
	(2, '2024-02-12 00:00:00+00', 'f17c96c8-a7a0-45df-adb2-4a357744fdaa', '648a6894-5804-4cba-aec5-a4b8163fe4bf', true, '2024-02-12 00:00:00+00'),
	(3, '2024-02-12 00:00:00+00', 'ea78130e-3a7f-4e71-a43c-7054d4c0c891', '648a6894-5804-4cba-aec5-a4b8163fe4bf', true, '2024-02-12 00:00:00+00');


--
-- Data for Name: lesson_progress; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: question_type; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."question_type" ("id", "label", "created_at", "updated_at", "typename") VALUES
	(1, 'Single answer', '2021-08-07 18:49:46.246529+00', '2021-08-15 00:57:08.12069+00', 'RADIO'),
	(2, 'Multiple answers', '2021-08-07 18:49:46.246529+00', '2021-08-15 00:57:27.935478+00', 'CHECKBOX'),
	(3, 'Paragraph', '2021-08-07 18:49:46.246529+00', '2021-08-15 00:57:38.634665+00', 'TEXTAREA');


--
-- Data for Name: question; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."question" ("id", "question_type_id", "title", "created_at", "updated_at", "exercise_id", "name", "points", "order") VALUES
	(1, 1, 'Question 1', '2024-02-12 06:05:05.467344+00', '2024-02-12 06:05:05.467344+00', '160ddbf6-ecbb-470b-b7dc-47ab0619e166', 'dea7714a-1153-4035-935c-c82891fa5850', 8, 0),
	(2, 2, 'Question 2', '2024-02-12 06:05:05.533236+00', '2024-02-12 06:05:05.533236+00', '160ddbf6-ecbb-470b-b7dc-47ab0619e166', '31bf0c84-0c6b-40ef-9b72-7a765243bede', 9, 1),
	(3, 3, 'Question 3', '2024-02-12 06:05:05.584108+00', '2024-02-12 06:05:05.584108+00', '160ddbf6-ecbb-470b-b7dc-47ab0619e166', 'b8a8764d-35ba-4d0a-ae58-060a1501d22d', 7, 2),
	(4, 1, 'Question 4', '2024-02-12 06:05:05.595502+00', '2024-02-12 06:05:05.595502+00', '160ddbf6-ecbb-470b-b7dc-47ab0619e166', '2117f1b0-2303-4e59-bc3c-08344ea58298', 10, 3),
	(5, 1, 'What is the simulation of human-like intelligence in machines that are programmed to think and learn?', '2024-02-12 06:05:47.80703+00', '2024-02-12 06:05:47.80703+00', 'c4f99501-8379-4c0c-9850-d4cf90bedb04', '72a0e1f0-822b-46c5-9395-51761d1f5521', 7, 0),
	(6, 1, 'What is the subset of AI that focuses on enabling computers to learn from data and improve their performance over time without being explicitly programmed?', '2024-02-12 06:05:47.862698+00', '2024-02-12 06:05:47.862698+00', 'c4f99501-8379-4c0c-9850-d4cf90bedb04', 'a283bdea-bc00-435a-95c0-2a464dcedac7', 8, 1),
	(7, 1, 'What refers to the information that is used as input for Machine Learning algorithms?', '2024-02-12 06:05:47.929394+00', '2024-02-12 06:05:47.929394+00', 'c4f99501-8379-4c0c-9850-d4cf90bedb04', 'effd0439-d63c-49a6-8525-40fbd3a93bff', 9, 2),
	(8, 1, 'What is the representation of learned patterns or relationships between input features and output values in Machine Learning?', '2024-02-12 06:05:48.085947+00', '2024-02-12 06:05:48.085947+00', 'c4f99501-8379-4c0c-9850-d4cf90bedb04', '056df7e4-2cdb-4928-912b-467924934dcd', 10, 3),
	(9, 2, 'What are the fundamental concepts of Artificial Intelligence (AI) and Machine Learning (ML)?', '2024-02-12 06:05:48.135251+00', '2024-02-12 06:05:48.135251+00', 'c4f99501-8379-4c0c-9850-d4cf90bedb04', '3985faf4-d319-45bb-99ff-8aab8d815505', 9, 4),
	(10, 3, 'Explain the concept of Data in AI and ML.', '2024-02-12 06:05:48.18422+00', '2024-02-12 06:05:48.18422+00', 'c4f99501-8379-4c0c-9850-d4cf90bedb04', '85a0318c-1974-4a0a-8006-e1100a6f2ac2', 9, 5),
	(11, 2, 'What is the purpose of Training Data?', '2024-02-12 06:05:48.194066+00', '2024-02-12 06:05:48.194066+00', 'c4f99501-8379-4c0c-9850-d4cf90bedb04', '0c969286-6213-4ff3-9147-a762f9229003', 10, 6),
	(12, 3, 'Define Prediction in Machine Learning.', '2024-02-12 06:05:48.246747+00', '2024-02-12 06:05:48.246747+00', 'c4f99501-8379-4c0c-9850-d4cf90bedb04', '6030371a-c001-4525-8c49-137e6a99ae89', 10, 7),
	(13, 1, 'Which HTML tag is used to define the structure of an HTML document?', '2024-02-12 06:21:03.695144+00', '2024-02-12 06:21:03.695144+00', 'd6ce3607-36bb-42c7-bd84-e333ef5dae2d', 'f71c980e-1e08-4e23-9919-89e1ff206c38', 1, 0),
	(14, 1, 'How can you create a hyperlink in HTML?', '2024-02-12 06:21:03.743646+00', '2024-02-12 06:21:03.743646+00', 'd6ce3607-36bb-42c7-bd84-e333ef5dae2d', 'edc3a4ab-66e8-4d6f-8c16-a65065453942', 1, 1),
	(15, 1, 'Which HTML tag is used to define a paragraph?', '2024-02-12 06:21:03.782817+00', '2024-02-12 06:21:03.782817+00', 'd6ce3607-36bb-42c7-bd84-e333ef5dae2d', 'a496fb2a-ad2e-4765-bd2d-9806acd24b8b', 1, 2),
	(16, 1, 'How do you create an ordered list in HTML?', '2024-02-12 06:21:03.821405+00', '2024-02-12 06:21:03.821405+00', 'd6ce3607-36bb-42c7-bd84-e333ef5dae2d', 'ca8f1385-11db-44b3-8ca6-e60335a0725a', 1, 3),
	(17, 2, 'Which HTML tag is used to define a table?', '2024-02-12 06:21:03.908471+00', '2024-02-12 06:21:03.908471+00', 'd6ce3607-36bb-42c7-bd84-e333ef5dae2d', '3dbf6bfa-2c79-43a7-860f-904618527d01', 1, 4),
	(18, 2, 'How do you insert an image in HTML?', '2024-02-12 06:21:03.955125+00', '2024-02-12 06:21:03.955125+00', 'd6ce3607-36bb-42c7-bd84-e333ef5dae2d', '93ca4750-033d-4d11-9a31-33a7a3720571', 1, 5),
	(19, 2, 'What is the purpose of the ''div'' element in HTML?', '2024-02-12 06:21:04.003614+00', '2024-02-12 06:21:04.003614+00', 'd6ce3607-36bb-42c7-bd84-e333ef5dae2d', 'bf598676-d0db-4774-bfda-658ae90eeeb8', 1, 6),
	(20, 3, 'Explain the use of the ''hr'' element in HTML.', '2024-02-12 06:21:04.053141+00', '2024-02-12 06:21:04.053141+00', 'd6ce3607-36bb-42c7-bd84-e333ef5dae2d', '089583b3-e3ea-444f-98c8-0b45c72296d7', 2, 7),
	(21, 3, 'What is the purpose of the ''iframe'' element in HTML?', '2024-02-12 06:21:04.063655+00', '2024-02-12 06:21:04.063655+00', 'd6ce3607-36bb-42c7-bd84-e333ef5dae2d', 'e070c665-7ba6-44aa-89f2-2b3c0d68003e', 2, 8),
	(22, 3, 'How do you create an unordered list in HTML?', '2024-02-12 06:21:04.076614+00', '2024-02-12 06:21:04.076614+00', 'd6ce3607-36bb-42c7-bd84-e333ef5dae2d', 'fa9da310-e773-4c56-b5d1-e79c3755c067', 1, 9),
	(23, 1, 'What is a class in ES6?', '2024-02-12 06:28:25.755845+00', '2024-02-12 06:28:25.755845+00', 'b47653e5-9446-4c79-9a0c-7b08e8d9eceb', '492e4c4e-1457-4e4a-ac50-2465dc5c7bb6', 1, 0),
	(24, 1, 'What keyword is used to create a class in ES6?', '2024-02-12 06:28:25.800724+00', '2024-02-12 06:28:25.800724+00', 'b47653e5-9446-4c79-9a0c-7b08e8d9eceb', 'e2a36cce-c394-4382-84f5-9c02727b21db', 1, 1),
	(25, 1, 'Which method is automatically called when an object is created from a class?', '2024-02-12 06:28:25.842478+00', '2024-02-12 06:28:25.842478+00', 'b47653e5-9446-4c79-9a0c-7b08e8d9eceb', 'df7a8902-7548-446f-a248-abf779c2caa9', 1, 2),
	(26, 1, 'What is the purpose of the "render" method in a React component?', '2024-02-12 06:28:25.881521+00', '2024-02-12 06:28:25.881521+00', 'b47653e5-9446-4c79-9a0c-7b08e8d9eceb', 'ee6e8398-3dd6-4260-8770-01a2361f61dd', 1, 3),
	(27, 1, 'Which React lifecycle method is used for cleanup activities?', '2024-02-12 06:28:25.994464+00', '2024-02-12 06:28:25.994464+00', 'b47653e5-9446-4c79-9a0c-7b08e8d9eceb', 'e0f3e7f8-f9fa-4ed4-98dc-5d9b5134ef5c', 1, 4),
	(28, 2, 'Select all valid ways to define props in React.', '2024-02-12 06:28:26.045429+00', '2024-02-12 06:28:26.045429+00', 'b47653e5-9446-4c79-9a0c-7b08e8d9eceb', 'abf2f253-1e6b-4517-9e11-0412fcb1a161', 1, 5),
	(29, 3, 'Write a JSX element representing a React component named "MyComponent".', '2024-02-12 06:28:26.104427+00', '2024-02-12 06:28:26.104427+00', 'b47653e5-9446-4c79-9a0c-7b08e8d9eceb', 'fd212483-8ebd-4b6a-89cd-f6f8a19645a0', 1, 6),
	(30, 3, 'Explain the purpose of "setState" in React.', '2024-02-12 06:28:26.117458+00', '2024-02-12 06:28:26.117458+00', 'b47653e5-9446-4c79-9a0c-7b08e8d9eceb', 'ba2d21f7-31b6-4d13-9df0-e3f4702ac350', 1, 7),
	(31, 3, 'What is the purpose of "super()" in a React class constructor?', '2024-02-12 06:28:26.128545+00', '2024-02-12 06:28:26.128545+00', 'b47653e5-9446-4c79-9a0c-7b08e8d9eceb', 'f4b49433-7a7b-42b3-9889-ac70b6d5d4ac', 1, 8),
	(32, 3, 'List some advantages of using ES6 classes in React development.', '2024-02-12 06:28:26.14053+00', '2024-02-12 06:28:26.14053+00', 'b47653e5-9446-4c79-9a0c-7b08e8d9eceb', 'b7e90f79-34ed-456f-9dc9-b9daece6e90f', 1, 9),
	(33, 1, 'What is a class component in React?', '2024-02-12 06:29:58.300177+00', '2024-02-12 06:29:58.300177+00', '3086d810-8754-408c-8856-15dccb732e3f', 'a950e352-cafd-44c1-9906-2c9970045fdd', 1, 0),
	(34, 1, 'What is the main difference between a functional component and a class component in React?', '2024-02-12 06:29:58.348873+00', '2024-02-12 06:29:58.348873+00', '3086d810-8754-408c-8856-15dccb732e3f', 'fb2e1380-f7a2-4cae-9419-22d0ceafee71', 1, 1),
	(35, 1, 'What is the purpose of the constructor method in a React class component?', '2024-02-12 06:29:58.388931+00', '2024-02-12 06:29:58.388931+00', '3086d810-8754-408c-8856-15dccb732e3f', '68bdb1dd-7067-49c0-901a-82d4f772c81d', 1, 2),
	(36, 1, 'How do you update the state of a class component in React?', '2024-02-12 06:29:58.429726+00', '2024-02-12 06:29:58.429726+00', '3086d810-8754-408c-8856-15dccb732e3f', '93f2e708-fc7e-4371-b2ce-6d70a2cff163', 1, 3),
	(37, 2, 'Select all valid lifecycle methods in a React class component.', '2024-02-12 06:29:58.471362+00', '2024-02-12 06:29:58.471362+00', '3086d810-8754-408c-8856-15dccb732e3f', 'e0d6c759-4ae8-45b6-83b2-45848d805586', 1, 4),
	(38, 3, 'Write an example of defining a class component in React.', '2024-02-12 06:29:58.522564+00', '2024-02-12 06:29:58.522564+00', '3086d810-8754-408c-8856-15dccb732e3f', '9eb166c2-bc42-46ec-8276-e5127c3984c9', 1, 5),
	(39, 3, 'Explain the concept of the component lifecycle in React class components.', '2024-02-12 06:29:58.532015+00', '2024-02-12 06:29:58.532015+00', '3086d810-8754-408c-8856-15dccb732e3f', 'f63bd5b2-9386-4d1e-81b7-c52cdd049d94', 1, 6),
	(40, 3, 'What is the significance of the `super()` method in a React class component constructor?', '2024-02-12 06:29:58.5416+00', '2024-02-12 06:29:58.5416+00', '3086d810-8754-408c-8856-15dccb732e3f', '38267e2d-d3fb-4b40-8df8-9a1322e2870f', 1, 7),
	(41, 3, 'List some advantages of using class components in React development.', '2024-02-12 06:29:58.551397+00', '2024-02-12 06:29:58.551397+00', '3086d810-8754-408c-8856-15dccb732e3f', '82fa9812-09a7-4911-a1a3-3bf1ee5912b1', 1, 8),
	(42, 3, 'How can you handle events in a React class component?', '2024-02-12 06:29:58.561847+00', '2024-02-12 06:29:58.561847+00', '3086d810-8754-408c-8856-15dccb732e3f', '32350456-c2b4-4ebe-880e-72e27a5519cb', 1, 9),
	(43, 1, 'What is the purpose of the useState hook in React?', '2024-02-12 06:32:25.81856+00', '2024-02-12 06:32:25.81856+00', 'a2c739ed-4d33-465d-a480-a071499eca43', '618f2098-5bc8-4227-9313-32cdafda576e', 1, 0),
	(44, 1, 'How do you import the useState hook in a React component?', '2024-02-12 06:32:25.870284+00', '2024-02-12 06:32:25.870284+00', 'a2c739ed-4d33-465d-a480-a071499eca43', '71180ec8-7334-4533-8d92-6241d0dcdc24', 1, 1),
	(45, 2, 'Which of the following is a valid way to use the useState hook?', '2024-02-12 06:32:25.911484+00', '2024-02-12 06:32:25.911484+00', 'a2c739ed-4d33-465d-a480-a071499eca43', '87b56daf-80e5-462e-9380-2dacbbfa6f75', 1, 2),
	(46, 1, 'What is the value returned by the useState hook?', '2024-02-12 06:32:25.951494+00', '2024-02-12 06:32:25.951494+00', 'a2c739ed-4d33-465d-a480-a071499eca43', 'e80edcab-7108-4565-a0e7-d4a5b58fa6f2', 1, 3),
	(47, 1, 'In which part of a functional component do you typically call the useState hook?', '2024-02-12 06:32:25.98996+00', '2024-02-12 06:32:25.98996+00', 'a2c739ed-4d33-465d-a480-a071499eca43', '3d8aca64-f4a6-46cd-b96e-0ce4f7af3f81', 1, 4),
	(48, 1, 'How do you update the state using the useState hook?', '2024-02-12 06:32:26.031091+00', '2024-02-12 06:32:26.031091+00', 'a2c739ed-4d33-465d-a480-a071499eca43', 'c96b41b5-cefd-413e-94c7-080e28813905', 1, 5),
	(49, 1, 'What is the initial state value in the following code?', '2024-02-12 06:32:26.069794+00', '2024-02-12 06:32:26.069794+00', 'a2c739ed-4d33-465d-a480-a071499eca43', 'bf7f5124-c37a-4110-a2c7-72b0521b829f', 1, 6),
	(50, 1, 'What is the purpose of the state update function returned by useState?', '2024-02-12 06:32:26.129746+00', '2024-02-12 06:32:26.129746+00', 'a2c739ed-4d33-465d-a480-a071499eca43', 'addcf8c3-8f42-4fb2-9699-a2b5c1ef5f97', 1, 7),
	(51, 1, 'What is the recommended way to update the state based on the previous state value?', '2024-02-12 06:32:26.177101+00', '2024-02-12 06:32:26.177101+00', 'a2c739ed-4d33-465d-a480-a071499eca43', '88e84fc4-2b9d-4c73-a5e8-1ff90e5bd4f5', 1, 8),
	(52, 1, 'How can you access the current state value inside a functional component?', '2024-02-12 06:32:26.217256+00', '2024-02-12 06:32:26.217256+00', 'a2c739ed-4d33-465d-a480-a071499eca43', 'a3aa0925-a69b-4728-8a03-4f583d7ee7a7', 1, 9),
	(53, 1, 'What are props in React?', '2024-02-12 06:34:41.826994+00', '2024-02-12 06:34:41.826994+00', '242b05d0-4288-4618-9225-a52b408b1760', '8e3a7e63-52ec-4fc5-98f7-d94b535fa00d', 1, 0),
	(54, 1, 'How do you pass props to a child component in React?', '2024-02-12 06:34:41.886363+00', '2024-02-12 06:34:41.886363+00', '242b05d0-4288-4618-9225-a52b408b1760', '22392cd9-26b2-4864-90f5-7b09ab517959', 1, 1),
	(55, 1, 'Can props be modified within a child component in React?', '2024-02-12 06:34:41.929209+00', '2024-02-12 06:34:41.929209+00', '242b05d0-4288-4618-9225-a52b408b1760', 'd031b293-b6c8-4886-9f95-5f9164e0db55', 1, 2),
	(56, 2, 'Select all valid ways to define and use props in a React component.', '2024-02-12 06:34:41.969519+00', '2024-02-12 06:34:41.969519+00', '242b05d0-4288-4618-9225-a52b408b1760', 'ab7bfe8d-89ae-45db-92c5-fcfcf3d3b86d', 1, 3),
	(57, 3, 'Write an example of passing and using props in a React component.', '2024-02-12 06:34:42.024431+00', '2024-02-12 06:34:42.024431+00', '242b05d0-4288-4618-9225-a52b408b1760', '8b39ef1e-7d3e-4e88-b5fe-e7e406e1b6f7', 1, 4),
	(58, 3, 'Explain the concept of "prop drilling" in React.', '2024-02-12 06:34:42.036089+00', '2024-02-12 06:34:42.036089+00', '242b05d0-4288-4618-9225-a52b408b1760', '03100e83-47cf-42ce-9dd9-1b37bb72f465', 1, 5),
	(59, 3, 'What is the significance of default props in React?', '2024-02-12 06:34:42.046846+00', '2024-02-12 06:34:42.046846+00', '242b05d0-4288-4618-9225-a52b408b1760', '2053e079-bf48-4733-8d0c-717086643cf2', 1, 6),
	(60, 3, 'List some benefits of using props for component communication in React.', '2024-02-12 06:34:42.056887+00', '2024-02-12 06:34:42.056887+00', '242b05d0-4288-4618-9225-a52b408b1760', '7ba1d1b9-2cba-451f-8008-e28e167a60f6', 1, 7),
	(61, 3, 'How can you handle missing props in a React component?', '2024-02-12 06:34:42.066479+00', '2024-02-12 06:34:42.066479+00', '242b05d0-4288-4618-9225-a52b408b1760', 'a1af8df7-4123-49f5-81c0-997b166903bd', 1, 8),
	(62, 1, 'Can you pass non-primitive data types (e.g., objects, arrays) as props in React?', '2024-02-12 06:34:42.076767+00', '2024-02-12 06:34:42.076767+00', '242b05d0-4288-4618-9225-a52b408b1760', 'e1e2a3ec-07cc-43ab-b1b4-fee56e0bed9a', 1, 9);


--
-- Data for Name: option; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."option" ("id", "label", "is_correct", "question_id", "value", "created_at", "updated_at") VALUES
	(1, 'AI is limited to the development of robots and automated systems.', false, 1, 'a9f73499-e0e7-410f-ac0a-861cf9c5189d', '2024-02-12 06:05:05.487028+00', '2024-02-12 06:05:05.487028+00'),
	(2, 'AI is a branch of science that deals with creating intelligent machines.', true, 1, 'd7c06211-c704-4f34-8a47-8444a1c24516', '2024-02-12 06:05:05.499232+00', '2024-02-12 06:05:05.499232+00'),
	(3, 'AI is focused solely on natural language processing.', false, 1, '77b682bd-d2d7-44e6-a0fc-a977ebe02f97', '2024-02-12 06:05:05.51025+00', '2024-02-12 06:05:05.51025+00'),
	(4, 'AI is primarily used in the field of finance.', false, 1, '1c02752a-d30a-4068-a716-91e4da05b100', '2024-02-12 06:05:05.521951+00', '2024-02-12 06:05:05.521951+00'),
	(5, 'Expert Systems', true, 2, 'd5e5581a-7747-469c-b6ef-cfa7ad7ca97b', '2024-02-12 06:05:05.543088+00', '2024-02-12 06:05:05.543088+00'),
	(6, 'Natural Language Processing', true, 2, '750d2e44-aa51-4dfb-987a-f66474dc78f8', '2024-02-12 06:05:05.554479+00', '2024-02-12 06:05:05.554479+00'),
	(7, 'Computer Vision', true, 2, '6df85bca-fb59-4f00-ba6c-1647f59d4e3f', '2024-02-12 06:05:05.56545+00', '2024-02-12 06:05:05.56545+00'),
	(8, 'Robotics', true, 2, '375774be-98ad-471f-8cae-59d9b6e521ce', '2024-02-12 06:05:05.574692+00', '2024-02-12 06:05:05.574692+00'),
	(9, 'Linear Regression', true, 4, '9afae131-eb13-4fd4-8a1c-e9823a3b8779', '2024-02-12 06:05:05.60596+00', '2024-02-12 06:05:05.60596+00'),
	(10, 'Logistic Regression', false, 4, 'fefaa5cf-7b85-423a-9ecc-881506e1ef41', '2024-02-12 06:05:05.615959+00', '2024-02-12 06:05:05.615959+00'),
	(11, 'Decision Trees', false, 4, '7bbb7d20-8c8e-4340-8b88-ad1766b56606', '2024-02-12 06:05:05.629541+00', '2024-02-12 06:05:05.629541+00'),
	(12, 'Artificial Neural Networks', false, 4, 'b570b8aa-7bd3-4993-a93a-871d6f2973c3', '2024-02-12 06:05:05.639987+00', '2024-02-12 06:05:05.639987+00'),
	(13, 'Artificial Intelligence (AI)', true, 5, '9dd4c439-ae6c-4ba9-b271-32189869850a', '2024-02-12 06:05:47.820605+00', '2024-02-12 06:05:47.820605+00'),
	(14, 'Machine Learning (ML)', false, 5, '27a6dbb8-5e5c-4bd2-8215-7fe4fc1ae0ab', '2024-02-12 06:05:47.832268+00', '2024-02-12 06:05:47.832268+00'),
	(15, 'Data', false, 5, 'e7f6570d-e999-4e84-9a68-53e06c541b01', '2024-02-12 06:05:47.842064+00', '2024-02-12 06:05:47.842064+00'),
	(16, 'Feature', false, 5, 'b71b8834-9bd1-4f09-88ea-ea2a324247bd', '2024-02-12 06:05:47.851928+00', '2024-02-12 06:05:47.851928+00'),
	(17, 'Artificial Intelligence (AI)', false, 6, 'cdda8eb8-30fa-4e75-bc2f-eeb8c8358f12', '2024-02-12 06:05:47.876157+00', '2024-02-12 06:05:47.876157+00'),
	(18, 'Machine Learning (ML)', true, 6, 'f6cf746a-5999-4322-a682-7ea2d8d9463f', '2024-02-12 06:05:47.885827+00', '2024-02-12 06:05:47.885827+00'),
	(19, 'Data', false, 6, '5fd645df-634f-4cb0-891a-dcd94eaf26c9', '2024-02-12 06:05:47.897679+00', '2024-02-12 06:05:47.897679+00'),
	(20, 'Feature', false, 6, '057e3977-3448-46e1-8ca5-a953db5060a4', '2024-02-12 06:05:47.907802+00', '2024-02-12 06:05:47.907802+00'),
	(21, 'Artificial Intelligence (AI)', false, 7, '0e84a712-a259-41d6-b0ed-2ad18169c8d1', '2024-02-12 06:05:47.961422+00', '2024-02-12 06:05:47.961422+00'),
	(22, 'Machine Learning (ML)', false, 7, '82067f77-4cd5-44fc-9acb-2d384fb58afd', '2024-02-12 06:05:47.997003+00', '2024-02-12 06:05:47.997003+00'),
	(23, 'Data', true, 7, '040d573e-ca6b-4730-b65b-158a112144c3', '2024-02-12 06:05:48.058178+00', '2024-02-12 06:05:48.058178+00'),
	(24, 'Feature', false, 7, '9ef49e22-ec75-4f10-aa6f-26e4115231d6', '2024-02-12 06:05:48.072106+00', '2024-02-12 06:05:48.072106+00'),
	(25, 'Artificial Intelligence (AI)', false, 8, '6bda4597-b6be-4552-a562-eece2d1af619', '2024-02-12 06:05:48.097006+00', '2024-02-12 06:05:48.097006+00'),
	(26, 'Machine Learning (ML)', false, 8, '0be611ed-acea-4643-b9e7-d0aa3aa2f983', '2024-02-12 06:05:48.106348+00', '2024-02-12 06:05:48.106348+00'),
	(27, 'Data', false, 8, '0d90749e-5e0d-46fa-80c9-ec27bc68987b', '2024-02-12 06:05:48.115928+00', '2024-02-12 06:05:48.115928+00'),
	(28, 'Model', true, 8, '06c37319-d012-4d6e-8982-36e2d0243611', '2024-02-12 06:05:48.125705+00', '2024-02-12 06:05:48.125705+00'),
	(29, 'Artificial Intelligence (AI)', true, 9, 'e3613977-cb2d-4505-8012-0ba292a5ed6c', '2024-02-12 06:05:48.145703+00', '2024-02-12 06:05:48.145703+00'),
	(30, 'Machine Learning (ML)', true, 9, 'b191ad4d-f4ef-47fa-beda-3dbbd07456d7', '2024-02-12 06:05:48.155377+00', '2024-02-12 06:05:48.155377+00'),
	(31, 'Data', false, 9, '5df42b66-ba6d-4653-ae10-d72070acacce', '2024-02-12 06:05:48.164868+00', '2024-02-12 06:05:48.164868+00'),
	(32, 'Feature', false, 9, 'cdbb2168-c125-4f85-85c8-68022ee323bd', '2024-02-12 06:05:48.174415+00', '2024-02-12 06:05:48.174415+00'),
	(33, 'To confuse the ML model', false, 11, '3cf8c224-3137-4964-a030-9d3ec8548f6a', '2024-02-12 06:05:48.20412+00', '2024-02-12 06:05:48.20412+00'),
	(34, 'To test the ML model', false, 11, '2043f609-983c-4231-8679-91c208883e6a', '2024-02-12 06:05:48.213782+00', '2024-02-12 06:05:48.213782+00'),
	(35, 'To train the ML model', true, 11, '26f16360-7afc-42b2-b991-1aa9548f9741', '2024-02-12 06:05:48.224487+00', '2024-02-12 06:05:48.224487+00'),
	(36, 'To validate the ML model', false, 11, '285adf98-529c-4ce4-9362-51ff826200e5', '2024-02-12 06:05:48.234618+00', '2024-02-12 06:05:48.234618+00'),
	(37, '<body>', false, 13, 'e2ef569f-e3bc-4376-a40d-1ddafb9c59b9', '2024-02-12 06:21:03.71131+00', '2024-02-12 06:21:03.71131+00'),
	(38, '<html>', true, 13, '0294d4ee-b526-4639-8069-27aa1967e93b', '2024-02-12 06:21:03.723733+00', '2024-02-12 06:21:03.723733+00'),
	(39, '<head>', false, 13, 'a9c377b6-fe2b-49d9-bb71-642583cdc96c', '2024-02-12 06:21:03.733987+00', '2024-02-12 06:21:03.733987+00'),
	(40, '<hyperlink>link text</hyperlink>', false, 14, 'bbed01a0-a621-420c-af33-10e42ca9abed', '2024-02-12 06:21:03.753147+00', '2024-02-12 06:21:03.753147+00'),
	(41, '<a href=''url''>link text</a>', true, 14, '611b59ab-ee43-49c3-82c2-9f5aa02c9261', '2024-02-12 06:21:03.762888+00', '2024-02-12 06:21:03.762888+00'),
	(42, '<link href=''url''>link text</link>', false, 14, '9797c4fa-a2cf-4eab-b5b3-34537e77acbf', '2024-02-12 06:21:03.77295+00', '2024-02-12 06:21:03.77295+00'),
	(43, '<paragraph>', false, 15, 'c2ebd2a8-07ef-4069-8998-f666982b9025', '2024-02-12 06:21:03.794068+00', '2024-02-12 06:21:03.794068+00'),
	(44, '<para>', false, 15, '83ca130b-95cd-4714-8b5c-13701f6e75f3', '2024-02-12 06:21:03.803302+00', '2024-02-12 06:21:03.803302+00'),
	(45, '<p>', true, 15, '62d26807-75e9-4271-b107-4145607dfc7f', '2024-02-12 06:21:03.812188+00', '2024-02-12 06:21:03.812188+00'),
	(46, '<li>', false, 16, '581ab789-9b21-4271-89d7-fef316bf6c80', '2024-02-12 06:21:03.831445+00', '2024-02-12 06:21:03.831445+00'),
	(47, '<ol>', true, 16, 'c837d745-350d-4392-959e-8a628c0239cc', '2024-02-12 06:21:03.888068+00', '2024-02-12 06:21:03.888068+00'),
	(48, '<ul>', false, 16, 'fcb90ea2-2e96-4c2a-a600-aae00c9f8f33', '2024-02-12 06:21:03.897969+00', '2024-02-12 06:21:03.897969+00'),
	(49, '<table>', true, 17, '448ebf7e-5b04-4451-b2d4-ba72fc22a83e', '2024-02-12 06:21:03.920519+00', '2024-02-12 06:21:03.920519+00'),
	(50, '<tab>', false, 17, '82c8a534-bc4a-40d3-bfb4-ea6446fecea8', '2024-02-12 06:21:03.930503+00', '2024-02-12 06:21:03.930503+00'),
	(51, '<tb>', false, 17, '3e7e7a21-864d-4d07-b905-898390949b87', '2024-02-12 06:21:03.942406+00', '2024-02-12 06:21:03.942406+00'),
	(52, '<picture src=''image.jpg''>', false, 18, '9e2e0012-fe53-4da2-b21c-fe335752ad91', '2024-02-12 06:21:03.965478+00', '2024-02-12 06:21:03.965478+00'),
	(53, '<img src=''image.jpg''>', true, 18, '7679a71e-0cce-41f6-9257-10501983831b', '2024-02-12 06:21:03.976275+00', '2024-02-12 06:21:03.976275+00'),
	(54, '<image href=''image.jpg''>', false, 18, '3d141747-e3f3-4d01-b39a-e59eb1a45ac3', '2024-02-12 06:21:03.990512+00', '2024-02-12 06:21:03.990512+00'),
	(55, 'Define a division or a section', true, 19, 'cdc39bce-323c-4b21-adba-c6813ca58e2c', '2024-02-12 06:21:04.014348+00', '2024-02-12 06:21:04.014348+00'),
	(56, 'Insert a video', false, 19, 'd0eadf26-28e9-4501-831b-4314c811351d', '2024-02-12 06:21:04.026409+00', '2024-02-12 06:21:04.026409+00'),
	(57, 'Create a link', false, 19, '6bf86b9c-c5f1-43f5-a464-bfe9bb52d00f', '2024-02-12 06:21:04.039484+00', '2024-02-12 06:21:04.039484+00'),
	(58, 'A constructor method', false, 23, 'af0b6819-50f8-43ba-85af-bf259985e8b1', '2024-02-12 06:28:25.771263+00', '2024-02-12 06:28:25.771263+00'),
	(59, 'A function', false, 23, '8f7491b1-1422-4fd5-986b-bdf5e3506a74', '2024-02-12 06:28:25.781248+00', '2024-02-12 06:28:25.781248+00'),
	(60, 'A blueprint for creating objects', true, 23, 'e46dfe5f-76fe-4917-95af-5c7a67ed6176', '2024-02-12 06:28:25.791137+00', '2024-02-12 06:28:25.791137+00'),
	(61, 'function', false, 24, '415a156d-e195-436c-961c-70a2c5cc039e', '2024-02-12 06:28:25.810551+00', '2024-02-12 06:28:25.810551+00'),
	(62, 'class', true, 24, '0dce9b0d-3b90-46b5-b599-40749a84b3b2', '2024-02-12 06:28:25.820369+00', '2024-02-12 06:28:25.820369+00'),
	(63, 'prototype', false, 24, '9e2f2f60-95cb-4638-8fee-2e304b089918', '2024-02-12 06:28:25.830585+00', '2024-02-12 06:28:25.830585+00'),
	(64, 'initialize', false, 25, '75eea014-447c-43f3-b22d-b316558f9142', '2024-02-12 06:28:25.852675+00', '2024-02-12 06:28:25.852675+00'),
	(65, 'create', false, 25, 'bcc301fe-cfd4-42a7-971d-912f3d341914', '2024-02-12 06:28:25.862313+00', '2024-02-12 06:28:25.862313+00'),
	(66, 'constructor', true, 25, 'ea8c36e3-a295-4a18-be00-43cb4e056a15', '2024-02-12 06:28:25.871636+00', '2024-02-12 06:28:25.871636+00'),
	(67, 'To render HTML elements', true, 26, '274f8d90-3f1c-4730-abac-4911fcc81c9f', '2024-02-12 06:28:25.891888+00', '2024-02-12 06:28:25.891888+00'),
	(68, 'To define props', false, 26, '92d46f85-5798-4276-82fa-4bceb0de0d5a', '2024-02-12 06:28:25.913568+00', '2024-02-12 06:28:25.913568+00'),
	(69, 'To update state', false, 26, 'f12032d2-ebd6-41a6-8343-614a60896480', '2024-02-12 06:28:25.983131+00', '2024-02-12 06:28:25.983131+00'),
	(70, 'componentDidMount', false, 27, '21c31c02-bd77-4ab4-8e63-940ec55c8114', '2024-02-12 06:28:26.00742+00', '2024-02-12 06:28:26.00742+00'),
	(71, 'componentDidUpdate', false, 27, 'fe0ea905-b144-4a66-9e50-a78eaba0db3b', '2024-02-12 06:28:26.0205+00', '2024-02-12 06:28:26.0205+00'),
	(72, 'componentWillUnmount', true, 27, '2e39d828-b750-4839-ad0e-88af06ba09cf', '2024-02-12 06:28:26.033628+00', '2024-02-12 06:28:26.033628+00'),
	(73, 'Using propTypes', true, 28, '3d2edf6b-001a-4b55-a08f-15828d40bb1b', '2024-02-12 06:28:26.058806+00', '2024-02-12 06:28:26.058806+00'),
	(74, 'Using defaultProps', true, 28, 'd33e69b6-5e50-4ec7-94bf-36c82af5f122', '2024-02-12 06:28:26.071554+00', '2024-02-12 06:28:26.071554+00'),
	(75, 'Using the constructor', false, 28, 'b87ced12-ddf7-4a61-9758-b1fc5e1425b6', '2024-02-12 06:28:26.083541+00', '2024-02-12 06:28:26.083541+00'),
	(76, 'Using the render method', false, 28, '954390a1-32b8-4bc7-b50e-27a847822027', '2024-02-12 06:28:26.093032+00', '2024-02-12 06:28:26.093032+00'),
	(77, 'A JavaScript class used to define a React element', true, 33, '8b581f9a-85af-45e8-b032-35b191c2623d', '2024-02-12 06:29:58.317013+00', '2024-02-12 06:29:58.317013+00'),
	(78, 'A class used to style React components', false, 33, '02addc20-81c9-48b7-ae5e-59d5c1df8015', '2024-02-12 06:29:58.329+00', '2024-02-12 06:29:58.329+00'),
	(79, 'A React component that uses only functional components', false, 33, '8b3201db-737d-4887-a1cb-364cddc951f5', '2024-02-12 06:29:58.338837+00', '2024-02-12 06:29:58.338837+00'),
	(80, 'Functional components use functions, while class components use the `render` method', true, 34, 'd8e83881-145e-417e-bd4e-601db287d6da', '2024-02-12 06:29:58.35916+00', '2024-02-12 06:29:58.35916+00'),
	(81, 'Functional components cannot have state, while class components can', false, 34, 'e89e8f15-d7c2-46fc-8868-64147976ef97', '2024-02-12 06:29:58.369395+00', '2024-02-12 06:29:58.369395+00'),
	(82, 'Functional components use the `render` method, while class components use functions', false, 34, 'a4b8340f-b757-49e6-b29a-5193ba1298e7', '2024-02-12 06:29:58.379316+00', '2024-02-12 06:29:58.379316+00'),
	(83, 'To initialize the component''s state and bind event handlers', true, 35, 'b3480339-af4d-40cd-b659-8d30d6dfa787', '2024-02-12 06:29:58.398807+00', '2024-02-12 06:29:58.398807+00'),
	(84, 'To declare props for the component', false, 35, '49a0afa4-0950-4b56-93b0-5df6fe40213b', '2024-02-12 06:29:58.408127+00', '2024-02-12 06:29:58.408127+00'),
	(85, 'To define the component''s rendering logic', false, 35, '0ced40d6-8143-4c70-86bc-0c1d1091f994', '2024-02-12 06:29:58.417881+00', '2024-02-12 06:29:58.417881+00'),
	(86, 'By calling the `setState` method', true, 36, '4696a993-52bc-43c3-af74-e71c7fd331b3', '2024-02-12 06:29:58.440933+00', '2024-02-12 06:29:58.440933+00'),
	(87, 'By directly modifying the `state` property', false, 36, 'f2877b4c-8535-4cd4-b2be-46ba338250d7', '2024-02-12 06:29:58.450816+00', '2024-02-12 06:29:58.450816+00'),
	(88, 'By assigning a new value to `this.state`', false, 36, 'bada992b-df76-4f87-8758-042b4da4c259', '2024-02-12 06:29:58.461662+00', '2024-02-12 06:29:58.461662+00'),
	(89, 'componentDidMount', true, 37, '40fc668d-e370-4038-8e02-3ffcadeba08b', '2024-02-12 06:29:58.481661+00', '2024-02-12 06:29:58.481661+00'),
	(90, 'componentUpdate', false, 37, '9df3361b-f058-46ef-947e-eb5cf080fec9', '2024-02-12 06:29:58.491686+00', '2024-02-12 06:29:58.491686+00'),
	(91, 'render', true, 37, '8f03115f-04a5-48d8-ac9b-a9b579eb0c3b', '2024-02-12 06:29:58.502121+00', '2024-02-12 06:29:58.502121+00'),
	(92, 'componentWillUnmount', true, 37, 'b11cdcbc-7403-4bd8-bada-253c1f646803', '2024-02-12 06:29:58.512755+00', '2024-02-12 06:29:58.512755+00'),
	(93, 'To manage state in functional components', true, 43, '8adfb428-f8b2-455c-890e-a198de2ee93f', '2024-02-12 06:32:25.835823+00', '2024-02-12 06:32:25.835823+00'),
	(94, 'To manage state in class components', false, 43, '4b4716b5-27a1-4b20-8cf3-2839040602c9', '2024-02-12 06:32:25.847403+00', '2024-02-12 06:32:25.847403+00'),
	(95, 'To handle events in React', false, 43, 'd61846c2-cc99-486f-82be-43d78a5c99cd', '2024-02-12 06:32:25.859025+00', '2024-02-12 06:32:25.859025+00'),
	(96, 'import { useState } from "react";', false, 44, '68d10383-a384-4d06-9286-3a70a7bab6e6', '2024-02-12 06:32:25.880903+00', '2024-02-12 06:32:25.880903+00'),
	(97, 'import useState from "react";', true, 44, 'def601e4-b9d6-4b1e-9ccb-50267198b676', '2024-02-12 06:32:25.891589+00', '2024-02-12 06:32:25.891589+00'),
	(98, 'import React, { useState } from "react";', false, 44, '3f894098-73bf-4c8d-bda3-8bb4a1db7222', '2024-02-12 06:32:25.901744+00', '2024-02-12 06:32:25.901744+00'),
	(99, 'const count = useState(0);', false, 45, '8114aaeb-aa79-43ba-9911-eb3bcc5121f2', '2024-02-12 06:32:25.921973+00', '2024-02-12 06:32:25.921973+00'),
	(100, 'const [count, setCount] = useState(0);', true, 45, 'aeb48e1f-9daa-43ab-99fc-eb5be9f18fa0', '2024-02-12 06:32:25.931508+00', '2024-02-12 06:32:25.931508+00'),
	(101, 'useState(count);', false, 45, 'decfa9da-be89-4c76-b624-3e9de3275942', '2024-02-12 06:32:25.940587+00', '2024-02-12 06:32:25.940587+00'),
	(102, 'An array containing the current state value and a function to update it', true, 46, '6959f3d8-9fa7-4356-859d-18409a77b99d', '2024-02-12 06:32:25.961656+00', '2024-02-12 06:32:25.961656+00'),
	(103, 'The current state value', false, 46, 'b68a7d5f-7632-421e-b4e5-ae0ee96258b7', '2024-02-12 06:32:25.970622+00', '2024-02-12 06:32:25.970622+00'),
	(104, 'A function for updating the state', false, 46, '11b1cf14-fb9b-4d77-ba95-8ec147010b46', '2024-02-12 06:32:25.98062+00', '2024-02-12 06:32:25.98062+00'),
	(105, 'Inside a JSX element', false, 47, '17cd3781-95e7-4129-9310-ccd73bdfad88', '2024-02-12 06:32:25.999652+00', '2024-02-12 06:32:25.999652+00'),
	(106, 'Inside the component render method', false, 47, 'b6f0f5f1-f16f-4874-9ecd-5208779983a3', '2024-02-12 06:32:26.010302+00', '2024-02-12 06:32:26.010302+00'),
	(107, 'Inside the component function body', true, 47, 'c0aa5047-fca4-4a60-bd34-c3b3f1436177', '2024-02-12 06:32:26.021563+00', '2024-02-12 06:32:26.021563+00'),
	(108, 'By using setState() method', false, 48, '2c8dad3a-cc4f-4533-91d2-65a2b94ebfb9', '2024-02-12 06:32:26.040613+00', '2024-02-12 06:32:26.040613+00'),
	(109, 'By directly modifying the state variable', false, 48, '81492d15-8a2d-488a-a96e-8904f9ca9598', '2024-02-12 06:32:26.049452+00', '2024-02-12 06:32:26.049452+00'),
	(110, 'By calling the function returned by useState with the new state value', true, 48, 'baabf196-e17b-4885-9afa-8d391843fcaf', '2024-02-12 06:32:26.060103+00', '2024-02-12 06:32:26.060103+00'),
	(111, 'The argument passed to useState (0 in this case)', true, 49, 'b2e15b54-0527-4cb1-8e10-dc2bae5f5cb9', '2024-02-12 06:32:26.080048+00', '2024-02-12 06:32:26.080048+00'),
	(112, 'null', false, 49, '5f9d86c6-8d46-4b4f-ab1f-fed3952e0bc0', '2024-02-12 06:32:26.089669+00', '2024-02-12 06:32:26.089669+00'),
	(113, '0', false, 49, '4275c932-337a-456e-9d8a-4cf6c85dea92', '2024-02-12 06:32:26.10837+00', '2024-02-12 06:32:26.10837+00'),
	(114, 'To set the initial state value', false, 50, '0edcb442-c411-4308-87c3-e853de49a330', '2024-02-12 06:32:26.145063+00', '2024-02-12 06:32:26.145063+00'),
	(115, 'To update the state with a new value', true, 50, '30bcca79-72c1-41e1-b6c5-404dac7f4e40', '2024-02-12 06:32:26.155688+00', '2024-02-12 06:32:26.155688+00'),
	(116, 'To retrieve the current state value', false, 50, 'c100be03-cd4c-4385-aa2c-73cdd60b083c', '2024-02-12 06:32:26.166013+00', '2024-02-12 06:32:26.166013+00'),
	(117, 'By using the setState method', false, 51, '07fccc6d-16fe-4f83-9bf3-352fc081993b', '2024-02-12 06:32:26.187322+00', '2024-02-12 06:32:26.187322+00'),
	(118, 'By passing a function to the state update function', true, 51, '5e089f88-8b73-4867-b9d4-e155652621a0', '2024-02-12 06:32:26.19736+00', '2024-02-12 06:32:26.19736+00'),
	(119, 'By using a class component', false, 51, '5032161e-02d8-4fb1-8fc0-26d2739dd19e', '2024-02-12 06:32:26.206848+00', '2024-02-12 06:32:26.206848+00'),
	(120, 'By passing props to the component', false, 52, '76bc7e88-f66a-4fda-8203-ac0a50d034e8', '2024-02-12 06:32:26.230629+00', '2024-02-12 06:32:26.230629+00'),
	(121, 'By using the state variable returned by useState', true, 52, '0edc8da1-132a-47d6-a551-c47b05c4f512', '2024-02-12 06:32:26.240288+00', '2024-02-12 06:32:26.240288+00'),
	(122, 'By using this.state', false, 52, '783d7b95-2612-4255-be9a-20b79fa17929', '2024-02-12 06:32:26.249903+00', '2024-02-12 06:32:26.249903+00'),
	(123, 'A method to define component styles', false, 53, 'c53208b3-b0e6-48e4-8e5b-b0f365dbc441', '2024-02-12 06:34:41.852625+00', '2024-02-12 06:34:41.852625+00'),
	(124, 'A way to define component state', false, 53, '49fd6da6-0e72-45c5-b54b-c0794a58c27f', '2024-02-12 06:34:41.86485+00', '2024-02-12 06:34:41.86485+00'),
	(125, 'Data that is passed from a parent component to a child component', true, 53, 'c754a489-b184-4eba-9bed-50f7c18f42ad', '2024-02-12 06:34:41.875883+00', '2024-02-12 06:34:41.875883+00'),
	(126, 'By directly modifying the child component''s state', false, 54, 'd14bb912-b1b6-47ee-8fb8-19d4a1c6f672', '2024-02-12 06:34:41.896718+00', '2024-02-12 06:34:41.896718+00'),
	(127, 'Using the `state` property', false, 54, 'b609ced1-de7a-4074-9374-d92ee043a145', '2024-02-12 06:34:41.908288+00', '2024-02-12 06:34:41.908288+00'),
	(128, 'Using the `props` attribute in the child component''s JSX', true, 54, '2c82f9a1-9e6b-4f54-930c-051d53a8f34e', '2024-02-12 06:34:41.918347+00', '2024-02-12 06:34:41.918347+00'),
	(129, 'Yes, props can be modified within a child component', false, 55, 'f5382351-ceff-45f0-89b5-39db194882fc', '2024-02-12 06:34:41.939895+00', '2024-02-12 06:34:41.939895+00'),
	(130, 'Props can only be modified within a parent component', false, 55, '2c92f273-61d0-4712-b3cb-a779ad8784be', '2024-02-12 06:34:41.950151+00', '2024-02-12 06:34:41.950151+00'),
	(131, 'No, props are immutable within a child component', true, 55, '9b650fde-3e2b-419b-b8c8-51688016d95d', '2024-02-12 06:34:41.959356+00', '2024-02-12 06:34:41.959356+00'),
	(132, 'Define props using a JavaScript object', true, 56, '087c669d-53f5-4387-9d6c-1ef262151fe5', '2024-02-12 06:34:41.979672+00', '2024-02-12 06:34:41.979672+00'),
	(133, 'Access props directly as function parameters', false, 56, '0421f3ca-82ac-4792-bc2a-5a675173fab2', '2024-02-12 06:34:41.989495+00', '2024-02-12 06:34:41.989495+00'),
	(134, 'Access props within a component using `this.props`', true, 56, '85b3b95d-443c-4c64-a1ba-8bb2172b6a0d', '2024-02-12 06:34:42.000921+00', '2024-02-12 06:34:42.000921+00'),
	(135, 'Define props using the `props` attribute', false, 56, '6e5b3785-8a8f-4cce-ab55-2f6773b5a654', '2024-02-12 06:34:42.014836+00', '2024-02-12 06:34:42.014836+00'),
	(136, 'Non-primitive data types can only be passed as state', false, 62, '80699aa7-06da-460d-b762-13c3a2ec99fb', '2024-02-12 06:34:42.085968+00', '2024-02-12 06:34:42.085968+00'),
	(137, 'Yes, you can pass non-primitive data types as props', true, 62, '624f7a1f-50b9-4563-89f6-481d81dbe093', '2024-02-12 06:34:42.096621+00', '2024-02-12 06:34:42.096621+00'),
	(138, 'No, only primitive data types can be passed as props', false, 62, '8dbbd750-34e8-4537-be17-c2445a744092', '2024-02-12 06:34:42.108281+00', '2024-02-12 06:34:42.108281+00');


--
-- Data for Name: organization_contacts; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: organization_emaillist; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: submissionstatus; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."submissionstatus" ("id", "label", "updated_at") VALUES
	(1, 'Submitted', '2024-02-12 05:26:17.112307+00'),
	(2, 'In Progress', '2024-02-12 05:26:17.112307+00'),
	(3, 'Graded', '2024-02-12 05:26:17.112307+00');


--
-- Data for Name: submission; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."submission" ("id", "reviewer_id", "status_id", "total", "created_at", "updated_at", "exercise_id", "submitted_by", "course_id") VALUES
	('09e98586-45de-441c-89ee-21f3beb8b9e6', NULL, 1, 0, '2024-02-12 08:13:09.104481+00', '2024-02-12 08:13:09.104481+00', 'b47653e5-9446-4c79-9a0c-7b08e8d9eceb', '72054e63-6ada-40d5-8cf3-7bb9025559fe', '774a2734-3cb5-4a45-93cd-5e2c34669c18');


--
-- Data for Name: question_answer; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."question_answer" ("id", "answers", "question_id", "open_answer", "group_member_id", "submission_id", "point") VALUES
	(1, '{e46dfe5f-76fe-4917-95af-5c7a67ed6176}', 23, '', '72054e63-6ada-40d5-8cf3-7bb9025559fe', '09e98586-45de-441c-89ee-21f3beb8b9e6', 0),
	(2, '{0dce9b0d-3b90-46b5-b599-40749a84b3b2}', 24, '', '72054e63-6ada-40d5-8cf3-7bb9025559fe', '09e98586-45de-441c-89ee-21f3beb8b9e6', 0),
	(3, '{ea8c36e3-a295-4a18-be00-43cb4e056a15}', 25, '', '72054e63-6ada-40d5-8cf3-7bb9025559fe', '09e98586-45de-441c-89ee-21f3beb8b9e6', 0),
	(4, '{274f8d90-3f1c-4730-abac-4911fcc81c9f}', 26, '', '72054e63-6ada-40d5-8cf3-7bb9025559fe', '09e98586-45de-441c-89ee-21f3beb8b9e6', 0),
	(5, '{2e39d828-b750-4839-ad0e-88af06ba09cf}', 27, '', '72054e63-6ada-40d5-8cf3-7bb9025559fe', '09e98586-45de-441c-89ee-21f3beb8b9e6', 0),
	(6, '{3d2edf6b-001a-4b55-a08f-15828d40bb1b,d33e69b6-5e50-4ec7-94bf-36c82af5f122}', 28, '', '72054e63-6ada-40d5-8cf3-7bb9025559fe', '09e98586-45de-441c-89ee-21f3beb8b9e6', 0),
	(7, '{}', 29, 'fshsfhsfh', '72054e63-6ada-40d5-8cf3-7bb9025559fe', '09e98586-45de-441c-89ee-21f3beb8b9e6', 0),
	(8, '{}', 30, 'lorem ipsum', '72054e63-6ada-40d5-8cf3-7bb9025559fe', '09e98586-45de-441c-89ee-21f3beb8b9e6', 0),
	(9, '{}', 31, 'lorem ipsum', '72054e63-6ada-40d5-8cf3-7bb9025559fe', '09e98586-45de-441c-89ee-21f3beb8b9e6', 0),
	(10, '{}', 32, 'lorem ipsum', '72054e63-6ada-40d5-8cf3-7bb9025559fe', '09e98586-45de-441c-89ee-21f3beb8b9e6', 0);


--
-- Data for Name: quiz; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: quiz_play; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: test_tenant; Type: TABLE DATA; Schema: public; Owner: supabase_admin
--



--
-- Data for Name: video_transcripts; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: waitinglist; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

INSERT INTO "storage"."buckets" ("id", "name", "owner", "created_at", "updated_at", "public", "avif_autodetection", "file_size_limit", "allowed_mime_types", "owner_id") VALUES
	('avatars', 'avatars', NULL, '2024-02-12 05:26:17.610937+00', '2024-02-12 05:26:17.610937+00', true, false, NULL, NULL, NULL);


--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

INSERT INTO "storage"."objects" ("id", "bucket_id", "name", "owner", "created_at", "updated_at", "last_accessed_at", "metadata", "version", "owner_id") VALUES
	('aa9c5e2a-177c-4a5f-a031-4e04d9f8e75f', 'avatars', 'user/a972b627-cb80-4727-b058-23a44b114d4f.webp', '6f4e680b-820b-4832-8c2a-6f4157a5f0c3', '2024-02-12 05:37:57.405668+00', '2024-02-12 05:37:57.405668+00', '2024-02-12 05:37:57.405668+00', '{"eTag": "\"26c78e00e0344279926d91d10e1ee06a\"", "size": 2956, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2024-02-12T05:37:57.374Z", "contentLength": 2956, "httpStatusCode": 200}', 'd0d55e1a-1554-427d-9602-ad8787da988a', '6f4e680b-820b-4832-8c2a-6f4157a5f0c3'),
	('68b5a3c3-112e-4202-8de5-82d579edef9b', 'avatars', 'user/Udemy Academy1707716288852.webp', '6f4e680b-820b-4832-8c2a-6f4157a5f0c3', '2024-02-12 05:38:08.946107+00', '2024-02-12 05:38:08.946107+00', '2024-02-12 05:38:08.946107+00', '{"eTag": "\"26c78e00e0344279926d91d10e1ee06a\"", "size": 2956, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2024-02-12T05:38:08.938Z", "contentLength": 2956, "httpStatusCode": 200}', 'dd33078a-b9d1-4979-9703-1fa2c1f6f49e', '6f4e680b-820b-4832-8c2a-6f4157a5f0c3'),
	('44532f4b-2c7e-4c76-9cc6-fbf76a6b3aa0', 'avatars', 'user/2a7ed2a1-5807-4f42-9d56-5e4d6e41faa2.webp', '6f4e680b-820b-4832-8c2a-6f4157a5f0c3', '2024-02-12 05:45:14.124072+00', '2024-02-12 05:45:14.124072+00', '2024-02-12 05:45:14.124072+00', '{"eTag": "\"85a3e4ce3ceb3f93399ae574e2c3ac3b\"", "size": 63244, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2024-02-12T05:45:14.118Z", "contentLength": 63244, "httpStatusCode": 200}', '11537108-98ba-46a3-a5b3-fb216c8b26b4', '6f4e680b-820b-4832-8c2a-6f4157a5f0c3'),
	('720bdd67-b3d6-4482-bb2b-f489887ade5a', 'avatars', 'user/bfd345ad-0720-4c3b-91fc-add6354a386d.webp', '648a6894-5804-4cba-aec5-a4b8163fe4bf', '2024-02-12 07:00:00.114091+00', '2024-02-12 07:00:00.114091+00', '2024-02-12 07:00:00.114091+00', '{"eTag": "\"e911cd7757308d0cd499842cab3acfde\"", "size": 63660, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2024-02-12T07:00:00.109Z", "contentLength": 63660, "httpStatusCode": 200}', '53baef18-5853-41b2-ab99-5777cadb8fad', '648a6894-5804-4cba-aec5-a4b8163fe4bf');


--
-- Data for Name: hooks; Type: TABLE DATA; Schema: supabase_functions; Owner: supabase_functions_admin
--



--
-- Data for Name: secrets; Type: TABLE DATA; Schema: vault; Owner: supabase_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 5, true);


--
-- Name: key_key_id_seq; Type: SEQUENCE SET; Schema: pgsodium; Owner: supabase_admin
--

SELECT pg_catalog.setval('"pgsodium"."key_key_id_seq"', 1, false);


--
-- Name: apps_poll_option_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."apps_poll_option_id_seq"', 1, false);


--
-- Name: apps_poll_submision_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."apps_poll_submision_id_seq"', 1, false);


--
-- Name: community_question_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."community_question_id_seq"', 1, false);


--
-- Name: currency_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."currency_id_seq"', 1, false);


--
-- Name: group_attendance_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."group_attendance_id_seq"', 1, false);


--
-- Name: lesson_comment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."lesson_comment_id_seq"', 1, false);


--
-- Name: lesson_completion_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."lesson_completion_id_seq"', 3, true);


--
-- Name: lesson_progress_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."lesson_progress_id_seq"', 1, false);


--
-- Name: option_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."option_id_seq"', 138, true);


--
-- Name: organization_contacts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."organization_contacts_id_seq"', 1, false);


--
-- Name: organization_emaillist_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."organization_emaillist_id_seq"', 1, false);


--
-- Name: organizationmember_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."organizationmember_id_seq"', 2, true);


--
-- Name: play_quiz_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."play_quiz_id_seq"', 1, false);


--
-- Name: question_answer_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."question_answer_id_seq"', 10, true);


--
-- Name: question_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."question_id_seq"', 62, true);


--
-- Name: question_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."question_type_id_seq"', 3, true);


--
-- Name: role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."role_id_seq"', 3, true);


--
-- Name: submission_status_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."submission_status_id_seq"', 3, true);


--
-- Name: test_tenant_id_seq; Type: SEQUENCE SET; Schema: public; Owner: supabase_admin
--

SELECT pg_catalog.setval('"public"."test_tenant_id_seq"', 1, false);


--
-- Name: video_transcripts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."video_transcripts_id_seq"', 1, false);


--
-- Name: waitinglist_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."waitinglist_id_seq"', 1, false);


--
-- Name: hooks_id_seq; Type: SEQUENCE SET; Schema: supabase_functions; Owner: supabase_functions_admin
--

SELECT pg_catalog.setval('"supabase_functions"."hooks_id_seq"', 1, false);


--
-- PostgreSQL database dump complete
--

RESET ALL;
