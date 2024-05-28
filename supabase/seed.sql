--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at") VALUES
	('00000000-0000-0000-0000-000000000000', '0c256e75-aa40-4f62-8d30-0217ca1c60d9', 'authenticated', 'authenticated', 'student@test.com', '$2a$10$dgxySj.k12gDKhLx7X4x6./J.Nzhz7WQrwh5lkjLKwIwWW4o5GJcW', '2023-12-18 17:08:57.413996+00', NULL, '', NULL, '', NULL, '', '', NULL, '2023-12-19 18:22:55.359055+00', '{"provider": "email", "providers": ["email"]}', '{}', NULL, '2023-12-18 17:08:57.399895+00', '2024-01-22 19:48:40.922563+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL),
	('00000000-0000-0000-0000-000000000000', '7ac00503-8519-43c8-a5ea-b79aeca900b1', 'authenticated', 'authenticated', 'admin@test.com', '$2a$10$n8vBI6.pyE0W/RO9DcJDseLKF/CRwsU4X4Lc2MaQogt8pQgnJavTa', '2023-12-16 14:04:38.311724+00', NULL, '', NULL, '', NULL, '', '', NULL, '2023-12-19 18:21:06.60122+00', '{"provider": "email", "providers": ["email"]}', '{}', NULL, '2023-12-16 14:04:38.281783+00', '2024-01-22 19:48:43.852203+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL),
	('00000000-0000-0000-0000-000000000000', '01676a50-bb56-4c5e-8a61-fb9e9190fb10', 'authenticated', 'authenticated', 'test@test.com', '$2a$10$WmfPO84h.8SbkZWSzXAygead77QQQXdeO5XIMd8iXk8SFQKB3Udy2', '2023-11-22 10:09:32.250231+00', NULL, '', NULL, '', NULL, '', '', NULL, '2023-12-04 12:57:34.337219+00', '{"provider": "email", "providers": ["email"]}', '{}', NULL, '2023-11-22 10:09:32.171201+00', '2023-12-16 14:00:35.986845+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at") VALUES
	('01676a50-bb56-4c5e-8a61-fb9e9190fb10', '01676a50-bb56-4c5e-8a61-fb9e9190fb10', '{"sub": "01676a50-bb56-4c5e-8a61-fb9e9190fb10", "email": "test@test.com"}', 'email', '2023-11-22 10:09:32.225444+00', '2023-11-22 10:09:32.225521+00', '2023-11-22 10:09:32.225521+00'),
	('7ac00503-8519-43c8-a5ea-b79aeca900b1', '7ac00503-8519-43c8-a5ea-b79aeca900b1', '{"sub": "7ac00503-8519-43c8-a5ea-b79aeca900b1", "email": "admin@test.com"}', 'email', '2023-12-16 14:04:38.302264+00', '2023-12-16 14:04:38.302326+00', '2023-12-16 14:04:38.302326+00'),
	('0c256e75-aa40-4f62-8d30-0217ca1c60d9', '0c256e75-aa40-4f62-8d30-0217ca1c60d9', '{"sub": "0c256e75-aa40-4f62-8d30-0217ca1c60d9", "email": "student@test.com"}', 'email', '2023-12-18 17:08:57.410285+00', '2023-12-18 17:08:57.410344+00', '2023-12-18 17:08:57.410344+00');


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



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
	('7a75d8bc-eaef-48fb-8906-850aa458c2a2', 'PD', 'pd', NULL, '{}', '{}', '', '2023-11-22 10:09:46.998435+00'),
	('811abf96-90db-44ec-87f1-cbd295a341b6', 'Vajeo', 'vajeo', NULL, '{}', '{}', NULL, '2023-12-01 18:19:47.326749+00'),
	('4f0070c2-ecc0-4d2e-90d4-7d067cf74db2', 'Lorem', 'lorem', NULL, '{}', '{}', NULL, '2023-12-01 18:33:48.679976+00'),
	('586b799a-238b-4ea4-920a-b3d2dde7ed05', 'Coca-cola', 'coca-cola', NULL, '{}', '{}', NULL, '2023-12-01 18:38:43.195278+00'),
	('3e8211ac-3de8-4759-a938-ab7c179ab260', '123345', '123345', NULL, '{}', '{}', NULL, '2023-12-01 18:47:20.729443+00'),
	('4efb4986-7c82-4376-8197-5bed31a163bf', 'Extra', 'extra', NULL, '{}', '{}', NULL, '2023-12-01 18:50:20.19025+00'),
	('04375092-9dec-4cf5-a143-061b500d87a7', 'daalu', 'daalu', NULL, '{}', '{}', NULL, '2023-12-01 19:42:03.356932+00'),
	('e27082ff-9512-4011-9e9b-c5e53cf66fa5', 'Blide', 'blide', NULL, '{}', '{}', NULL, '2023-12-04 10:03:51.196567+00'),
	('74c5768d-0c60-49f0-bbdc-6f57ece8f004', 'Teeeeee', 'teeeeee', NULL, '{}', '{}', NULL, '2023-12-04 10:05:57.71089+00'),
	('6719ea10-fb1a-4c94-b087-79714134a496', 'Dayco', 'dayco', NULL, '{}', '{}', NULL, '2023-12-04 10:07:15.905529+00'),
	('1cfdac36-a1da-4ef9-8421-7af3fd1ee089', 'TopbayTutor', 'topbaytutor', NULL, '{}', '{}', NULL, '2023-12-04 12:58:02.503716+00'),
	('1a1dcddd-1abc-4f72-b644-0bd18191a289', 'Udemy Test', 'udemy-test', NULL, '{}', '{}', NULL, '2023-12-16 14:05:03.932949+00');


--
-- Data for Name: group; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."group" ("id", "name", "description", "created_at", "updated_at", "organization_id") VALUES
	('c0ab7c5b-db2e-46e7-9853-9308c8ccb2cd', 'Building express apps', 'This shows how to build an express app', '2023-11-22 10:16:06.801846+00', '2023-11-22 10:16:06.801846+00', '7a75d8bc-eaef-48fb-8906-850aa458c2a2'),
	('c6b022fd-fff3-4f09-8960-c9cb06819761', 'Getting started with MVC', 'Embark on a comprehensive journey into the world of Model-View-Controller (MVC) architecture with our course, "Getting Started with MVC." Designed for beginners and aspiring developers, this course provides a solid foundation for understanding the principles and practices behind MVC, a widely adopted design pattern in software development.

Through a carefully crafted curriculum, you''ll learn the core concepts of MVC, exploring how it enhances the organization, scalability, and maintainability of your code', '2023-12-16 14:11:16.648686+00', '2023-12-16 14:11:16.648686+00', '1a1dcddd-1abc-4f72-b644-0bd18191a289'),
	('04a250f1-bcb9-4e0d-a3d4-a01096e7a105', 'Modern Web Development with React', 'By the end of this course, you''ll be equipped to build interactive and responsive web applications, making you a proficient React developer ready for the demands of today''s web development landscape.', '2023-12-16 14:40:15.353729+00', '2023-12-16 14:40:15.353729+00', '1a1dcddd-1abc-4f72-b644-0bd18191a289'),
	('0789ced2-b8f3-472c-97ff-bdde1e80dddf', 'Data Science with Python and Pandas', 'Unlock the power of data with our "Data Science with Python and Pandas" course. Dive into Python programming fundamentals and then journey into the world of Pandas for efficient data manipulation and analysis. Learn essential data cleaning and preprocessing techniques before venturing into statistical analysis using Pandas. Cap off your exploration with data visualization using Matplotlib and Seaborn. Gain the skills to derive meaningful insights from data and communicate them effectively, positioning yourself as a proficient data scientist in the dynamic field of data analytics.', '2023-12-16 14:41:15.270465+00', '2023-12-16 14:41:15.270465+00', '1a1dcddd-1abc-4f72-b644-0bd18191a289');


--
-- Data for Name: course; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."course" ("title", "description", "overview", "id", "created_at", "updated_at", "group_id", "is_template", "logo", "slug", "metadata", "cost", "currency", "banner_image", "is_published", "is_certificate_downloadable", "certificate_theme", "status") VALUES
	('Building express apps', 'This shows how to build an express app', 'Welcome to this amazing course 🚀 ', '2e845a61-98a4-4a78-a8db-f140d14f451b', '2023-11-22 10:16:06.854875+00', '2023-11-22 10:16:06.854875+00', 'c0ab7c5b-db2e-46e7-9853-9308c8ccb2cd', true, '', 'build-express-apps', '{"goals": "", "description": "", "requirements": ""}', 0, 'NGN', NULL, false, false, NULL, 'ACTIVE'),
	('Data Science with Python and Pandas', 'Unlock the power of data with our "Data Science with Python and Pandas" course. Dive into Python programming fundamentals and then journey into the world of Pandas for efficient data manipulation and analysis. Learn essential data cleaning and preprocessing techniques before venturing into statistical analysis using Pandas. Cap off your exploration with data visualization using Matplotlib and Seaborn. Gain the skills to derive meaningful insights from data and communicate them effectively, positioning yourself as a proficient data scientist in the dynamic field of data analytics.', 'Welcome to this amazing course 🚀 ', 'f0a85d18-aff4-412f-b8e6-3b34ef098dce', '2023-12-16 14:41:15.294951+00', '2023-12-16 14:41:15.294951+00', '0789ced2-b8f3-472c-97ff-bdde1e80dddf', true, 'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w1MTE1NTV8MHwxfHNlYXJjaHwxOHx8ZGF0YSUyMHNjaWVuY2V8ZW58MHx8fHwxNzA3Nzk5MzMwfDA&ixlib=rb-4.0.3&q=80&w=1080', 'data-science-with-python-and-pandas-1702919269375', '{"goals": "", "grading": true, "description": "", "requirements": "", "lessonDownload": true, "allowNewStudent": true, "lessonTabsOrder": [{"id": 1, "name": "Note"}, {"id": 2, "name": "Slide"}, {"id": 3, "name": "Video"}]}', 0, 'NGN', NULL, true, false, NULL, 'ACTIVE'),
	('Getting started with MVC', 'Embark on a comprehensive journey into the world of Model-View-Controller (MVC) architecture with our course, "Getting Started with MVC." Designed for beginners and aspiring developers, this course provides a solid foundation for understanding the principles and practices behind MVC, a widely adopted design pattern in software development.

Through a carefully crafted curriculum, you''ll learn the core concepts of MVC, exploring how it enhances the organization, scalability, and maintainability of your code', '<p>"Getting Started with MVC. is designed for beginners and aspiring developers, this course provides a solid foundation for understanding the principles and practices behind MVC, a widely adopted design pattern in software development.</p>
<div class="w-full text-token-text-primary" data-testid="conversation-turn-9">
<div class="px-4 py-2 justify-center text-base md:gap-6 m-auto">
<div class="flex flex-1 text-base mx-auto gap-3 md:px-5 lg:px-1 xl:px-5 md:max-w-3xl lg:max-w-[40rem] xl:max-w-[48rem] group">
<div class="relative flex w-full flex-col lg:w-[calc(100%-115px)] agent-turn">
<div class="flex-col gap-1 md:gap-3">
<div class="flex flex-grow flex-col max-w-full">
<div class="min-h-[20px] text-message flex flex-col items-start gap-3 whitespace-pre-wrap break-words [.text-message+&amp;]:mt-5 overflow-x-auto" data-message-author-role="assistant" data-message-id="8dcabe18-7b20-4a86-876b-04d37d85185a">
<div class="markdown prose w-full break-words dark:prose-invert dark">
<p>By the end of this course, you''ll not only comprehend the fundamentals of MVC but also be equipped with the skills to architect well-structured, scalable, and maintainable software applications.</p>
<p>&nbsp;</p>
<p>Whether you''re a beginner or looking to reinforce your understanding of MVC, this course serves as a stepping stone toward mastering modern software development practices. Enroll now and elevate your programming expertise with the power of Model-View-Controller.</p>
</div>
</div>
</div>
<div class="mt-1 flex justify-start gap-3 empty:hidden">
<div class="text-gray-400 flex self-end lg:self-center justify-center lg:justify-start mt-0 gap-1 visible"><button class="flex items-center gap-1.5 rounded-md p-1 pl-0 text-xs hover:text-gray-950 dark:text-gray-400 dark:hover:text-gray-200 disabled:dark:hover:text-gray-400 md:invisible md:group-hover:visible md:group-[.final-completion]:visible"></button>
<div class="flex gap-1">&nbsp;</div>
</div>
</div>
</div>
</div>
</div>
</div>
</div>
<div class="w-full text-token-text-primary" data-testid="conversation-turn-10">
<div class="px-4 py-2 justify-center text-base md:gap-6 m-auto">
<div class="flex flex-1 text-base mx-auto gap-3 md:px-5 lg:px-1 xl:px-5 md:max-w-3xl lg:max-w-[40rem] xl:max-w-[48rem] group">
<div class="flex-shrink-0 flex flex-col relative items-end">
<div>
<div class="pt-0.5">
<div class="gizmo-shadow-stroke flex h-6 w-6 items-center justify-center overflow-hidden rounded-full">&nbsp;</div>
</div>
</div>
</div>
</div>
</div>
</div>', '98e6e798-f0bd-4f9d-a6f5-ce0816a4f97e', '2023-12-16 14:11:16.672983+00', '2023-12-16 14:11:16.672983+00', 'c6b022fd-fff3-4f09-8960-c9cb06819761', true, '', 'getting-started-with-mvc', '{"goals": "", "grading": false, "description": "", "requirements": "", "lessonDownload": false, "allowNewStudent": true, "lessonTabsOrder": [{"id": 1, "name": "Note"}, {"id": 2, "name": "Slide"}, {"id": 3, "name": "Video"}]}', 0, 'NGN', NULL, true, false, NULL, 'ACTIVE'),
	('Modern Web Development with React', 'By the end of this course, you''ll be equipped to build interactive and responsive web applications, making you a proficient React developer ready for the demands of today''s web development landscape.', 'Welcome to this amazing course 🚀 ', '16e3bc8d-5d1b-4708-988e-93abae288ccf', '2023-12-16 14:40:15.374067+00', '2023-12-16 14:40:15.374067+00', '04a250f1-bcb9-4e0d-a3d4-a01096e7a105', true, 'https://images.unsplash.com/photo-1565843708714-52ecf69ab81f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w1MTE1NTV8MHwxfHNlYXJjaHwxOHx8cmVhY3QlMjBkZXZ8ZW58MHx8fHwxNzA3Nzk5NDMyfDA&ixlib=rb-4.0.3&q=80&w=1080', 'modern-web-development', '{"goals": "", "grading": true, "description": "", "requirements": "", "lessonDownload": false, "allowNewStudent": true, "lessonTabsOrder": [{"id": 1, "name": "Note"}, {"id": 2, "name": "Slide"}, {"id": 3, "name": "Video"}]}', 0, 'NGN', NULL, true, false, NULL, 'ACTIVE');


--
-- Data for Name: profile; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."profile" ("id", "fullname", "username", "avatar_url", "created_at", "updated_at", "email", "can_add_course", "role", "goal", "source", "metadata", "telegram_chat_id") VALUES
	('01676a50-bb56-4c5e-8a61-fb9e9190fb10', 'Alice', 'alice1700647772421', 'https://tapaozmyjsuykgerrfkt.supabase.co/storage/v1/object/public/avatars/avatar.png', '2023-11-22 10:09:32.429935+00', '2023-11-22 10:09:32.429935+00', 'test@test.com', true, NULL, 'explore', 'friends-family', NULL, NULL),
	('7ac00503-8519-43c8-a5ea-b79aeca900b1', 'Elon Gates', 'admin1702735478395', 'https://tapaozmyjsuykgerrfkt.supabase.co/storage/v1/object/public/avatars/avatar.png', '2023-12-16 14:04:38.401211+00', '2023-12-16 14:04:38.401211+00', 'admin@test.com', true, NULL, 'sell-online', 'articles', NULL, NULL),
	('0c256e75-aa40-4f62-8d30-0217ca1c60d9', 'John Doe', 'student1702919337513', 'https://tapaozmyjsuykgerrfkt.supabase.co/storage/v1/object/public/avatars/avatar.png', '2023-12-18 17:08:57.517768+00', '2023-12-18 17:08:57.517768+00', 'student@test.com', true, NULL, NULL, NULL, NULL, NULL);



--
-- Data for Name: groupmember; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."groupmember" ("id", "group_id", "role_id", "profile_id", "email", "created_at", "assigned_student_id") VALUES
	('6aa63f9f-6ada-42bd-a11f-bcdfa9b78263', 'c0ab7c5b-db2e-46e7-9853-9308c8ccb2cd', 2, '01676a50-bb56-4c5e-8a61-fb9e9190fb10', 'test@test.com', '2023-11-22 10:16:06.938824+00', NULL),
	('b96896ff-d954-44b8-acb4-234b0d4e87d7', 'c6b022fd-fff3-4f09-8960-c9cb06819761', 2, '7ac00503-8519-43c8-a5ea-b79aeca900b1', 'admin@test.com', '2023-12-16 14:11:16.73019+00', NULL),
	('5e021c47-07c3-416d-bb75-d218ee482f82', '04a250f1-bcb9-4e0d-a3d4-a01096e7a105', 2, '7ac00503-8519-43c8-a5ea-b79aeca900b1', 'admin@test.com', '2023-12-16 14:40:15.401711+00', NULL),
	('f5ef8afa-7652-4615-8217-a9c7c75a8e89', '0789ced2-b8f3-472c-97ff-bdde1e80dddf', 2, '7ac00503-8519-43c8-a5ea-b79aeca900b1', 'admin@test.com', '2023-12-16 14:41:15.316511+00', NULL),
	('5840085d-0d0b-44ca-b6fb-6a758c9543ce', '0789ced2-b8f3-472c-97ff-bdde1e80dddf', 3, '0c256e75-aa40-4f62-8d30-0217ca1c60d9', NULL, '2023-12-18 17:10:51.293318+00', NULL);


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
	(1, '7a75d8bc-eaef-48fb-8906-850aa458c2a2', 1, '01676a50-bb56-4c5e-8a61-fb9e9190fb10', NULL, false, '2023-11-22 10:09:47.094861+00'),
	(2, '811abf96-90db-44ec-87f1-cbd295a341b6', 1, '01676a50-bb56-4c5e-8a61-fb9e9190fb10', NULL, false, '2023-12-01 18:19:47.355017+00'),
	(3, '4f0070c2-ecc0-4d2e-90d4-7d067cf74db2', 1, '01676a50-bb56-4c5e-8a61-fb9e9190fb10', NULL, false, '2023-12-01 18:33:48.794171+00'),
	(4, '586b799a-238b-4ea4-920a-b3d2dde7ed05', 1, '01676a50-bb56-4c5e-8a61-fb9e9190fb10', NULL, false, '2023-12-01 18:38:43.21006+00'),
	(5, '3e8211ac-3de8-4759-a938-ab7c179ab260', 1, '01676a50-bb56-4c5e-8a61-fb9e9190fb10', NULL, false, '2023-12-01 18:47:20.752601+00'),
	(6, '4efb4986-7c82-4376-8197-5bed31a163bf', 1, '01676a50-bb56-4c5e-8a61-fb9e9190fb10', NULL, false, '2023-12-01 18:50:20.210065+00'),
	(7, '04375092-9dec-4cf5-a143-061b500d87a7', 1, '01676a50-bb56-4c5e-8a61-fb9e9190fb10', NULL, false, '2023-12-01 19:42:03.386878+00'),
	(8, 'e27082ff-9512-4011-9e9b-c5e53cf66fa5', 1, '01676a50-bb56-4c5e-8a61-fb9e9190fb10', NULL, false, '2023-12-04 10:03:51.232771+00'),
	(9, '74c5768d-0c60-49f0-bbdc-6f57ece8f004', 1, '01676a50-bb56-4c5e-8a61-fb9e9190fb10', NULL, false, '2023-12-04 10:05:57.7629+00'),
	(10, '6719ea10-fb1a-4c94-b087-79714134a496', 1, '01676a50-bb56-4c5e-8a61-fb9e9190fb10', NULL, false, '2023-12-04 10:07:15.927134+00'),
	(11, '1cfdac36-a1da-4ef9-8421-7af3fd1ee089', 1, '01676a50-bb56-4c5e-8a61-fb9e9190fb10', NULL, false, '2023-12-04 12:58:02.530536+00'),
	(12, '1a1dcddd-1abc-4f72-b644-0bd18191a289', 1, '7ac00503-8519-43c8-a5ea-b79aeca900b1', NULL, false, '2023-12-16 14:05:03.978453+00'),
	(13, '1a1dcddd-1abc-4f72-b644-0bd18191a289', 3, '0c256e75-aa40-4f62-8d30-0217ca1c60d9', NULL, false, '2023-12-18 17:08:57.537093+00');


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
	(NULL, NULL, NULL, '98e6e798-f0bd-4f9d-a6f5-ce0816a4f97e', '5c75f4f1-c222-44a9-a8c6-81773ea33872', '2023-12-16 14:18:43.592018+00', '2023-12-16 14:26:59.886821+00', 'Lesson 1: Introduction to MVC Architecture', false, '2023-12-16 14:18:30.516+00', '7ac00503-8519-43c8-a5ea-b79aeca900b1', false, NULL, NULL, false, '[{"link": "https://youtu.be/pXLWqkA87e4?si=rUHaBMnuFgAMjm2T", "type": "youtube", "metadata": {}}]'),
	(NULL, NULL, NULL, '98e6e798-f0bd-4f9d-a6f5-ce0816a4f97e', 'a99e65b7-1394-4751-ad8d-a5fb670ccb9e', '2023-12-16 14:22:53.246346+00', '2023-12-18 07:31:43.127287+00', 'Anatomy of MVC Components', false, '2023-12-16 14:22:29.984+00', '7ac00503-8519-43c8-a5ea-b79aeca900b1', false, NULL, NULL, false, '[{"link": "https://youtu.be/4Qfk8MhtZJU?si=VZ7cF-pjvm_RmFMp", "type": "youtube", "metadata": {}}]'),
	(NULL, NULL, NULL, '98e6e798-f0bd-4f9d-a6f5-ce0816a4f97e', '266b3daa-1eb2-401e-9510-1819952b44b7', '2023-12-16 14:23:34.510117+00', '2023-12-18 07:43:28.385172+00', 'Building Your First MVC Application', false, '2023-12-16 14:23:11.543+00', '7ac00503-8519-43c8-a5ea-b79aeca900b1', false, NULL, NULL, false, '[{"link": "https://www.youtube.com/watch?v=EMwu8F0dCXE", "type": "youtube", "metadata": {}}]'),
	(NULL, NULL, NULL, '16e3bc8d-5d1b-4708-988e-93abae288ccf', '80b79665-733b-41bf-9853-34fd8ab50496', '2023-12-16 14:42:38.14007+00', '2023-12-18 08:10:55.586189+00', 'State and Lifecycle: Managing Data in React Applications', false, '2023-12-16 14:42:25.728+00', '7ac00503-8519-43c8-a5ea-b79aeca900b1', false, NULL, NULL, false, '[{"link": "https://www.youtube.com/watch?v=DveeFlWzWzc", "type": "youtube", "metadata": {}}]'),
	(NULL, NULL, NULL, '98e6e798-f0bd-4f9d-a6f5-ce0816a4f97e', 'd1903e13-3ef1-4163-bcc4-a25d78c4e257', '2023-12-16 14:24:12.342598+00', '2023-12-18 07:47:37.01818+00', 'Exploring MVC Frameworks and Tools', false, '2023-12-16 14:23:54.545+00', '7ac00503-8519-43c8-a5ea-b79aeca900b1', false, NULL, NULL, false, '[{"link": "https://www.youtube.com/watch?v=mbDBVt1SBKg", "type": "youtube", "metadata": {}}]'),
	(NULL, NULL, NULL, '98e6e798-f0bd-4f9d-a6f5-ce0816a4f97e', '74cf090a-6a39-47a4-9746-6dac6c8cfa3f', '2023-12-16 14:24:47.381462+00', '2023-12-18 07:55:54.584289+00', 'Best Practices and Advanced MVC Concepts', false, '2023-12-16 14:24:42.309+00', '7ac00503-8519-43c8-a5ea-b79aeca900b1', false, NULL, NULL, false, '[{"link": "https://www.youtube.com/watch?v=mbDBVt1SBKg", "type": "youtube", "metadata": {}}]'),
	(NULL, NULL, NULL, 'f0a85d18-aff4-412f-b8e6-3b34ef098dce', '5e5c8221-4c11-4c40-8664-11743bb79579', '2023-12-16 14:44:06.83841+00', '2023-12-18 17:16:36.276134+00', 'Python Essentials: An Introduction to Data Science', false, '2023-12-16 14:43:36.61+00', '7ac00503-8519-43c8-a5ea-b79aeca900b1', false, NULL, NULL, true, '[{"link": "https://www.youtube.com/watch?v=T5pRlIbr6gg&vl=en", "type": "youtube", "metadata": {}}]'),
	(NULL, NULL, NULL, '16e3bc8d-5d1b-4708-988e-93abae288ccf', '0a39ab2f-9451-4a90-902c-3030bf965637', '2023-12-16 14:42:21.549353+00', '2023-12-18 08:04:21.047142+00', 'Components and Props: Building Reusable UI Elements', false, '2023-12-16 14:42:09.227+00', '7ac00503-8519-43c8-a5ea-b79aeca900b1', false, NULL, NULL, false, '[{"link": "https://www.youtube.com/watch?v=H-PkPKF2Tfk", "type": "youtube", "metadata": {}}]'),
	(NULL, NULL, NULL, 'f0a85d18-aff4-412f-b8e6-3b34ef098dce', '829da386-8ccd-4c81-b2fb-b9891102c83c', '2023-12-16 14:44:44.271772+00', '2023-12-18 17:16:41.099812+00', 'Delving into Data Analysis with Pandas', false, '2023-12-16 14:44:10.863+00', '7ac00503-8519-43c8-a5ea-b79aeca900b1', false, NULL, NULL, true, '[{"link": "https://www.youtube.com/watch?v=T5pRlIbr6gg&vl=en", "type": "youtube", "metadata": {}}]'),
	(NULL, NULL, NULL, '16e3bc8d-5d1b-4708-988e-93abae288ccf', '30ca12a6-2009-4457-830e-32945618712d', '2023-12-16 14:42:58.559078+00', '2023-12-18 08:14:33.18137+00', 'Handling Forms and Events: Interactivity in React', false, '2023-12-16 14:42:40.89+00', '7ac00503-8519-43c8-a5ea-b79aeca900b1', false, NULL, NULL, false, '[{"link": "https://www.youtube.com/watch?v=o-rGDHAWwO4", "type": "youtube", "metadata": {}}]'),
	(NULL, NULL, NULL, '16e3bc8d-5d1b-4708-988e-93abae288ccf', '6f2d8142-0903-425c-8534-f5105b624752', '2023-12-16 14:41:58.504141+00', '2023-12-18 08:05:10.778848+00', 'Introduction to React: Understanding the Basics', false, '2023-12-16 14:41:38.942+00', '7ac00503-8519-43c8-a5ea-b79aeca900b1', false, NULL, NULL, false, '[{"link": "https://www.youtube.com/watch?v=H-PkPKF2Tfk", "type": "youtube", "metadata": {}}]'),
	(NULL, NULL, NULL, '16e3bc8d-5d1b-4708-988e-93abae288ccf', 'a25bca81-bf27-4eb9-bb1d-f37c00b453d3', '2023-12-16 14:43:21.593951+00', '2023-12-18 08:15:44.75161+00', 'React Router and Navigation: Creating Dynamic Web Applications', false, '2023-12-16 14:43:02.591+00', '7ac00503-8519-43c8-a5ea-b79aeca900b1', false, NULL, NULL, false, '[{"link": "https://www.youtube.com/watch?v=o-rGDHAWwO4", "type": "youtube", "metadata": {}}]'),
	(NULL, NULL, NULL, 'f0a85d18-aff4-412f-b8e6-3b34ef098dce', '05f03084-3ff1-49e3-aa2a-7a13840cc4b1', '2023-12-16 14:45:06.850362+00', '2023-12-18 17:16:46.175022+00', 'Data Cleaning and Preprocessing Techniques', false, '2023-12-16 14:44:47.638+00', '7ac00503-8519-43c8-a5ea-b79aeca900b1', false, NULL, NULL, true, '[{"link": "https://www.youtube.com/watch?v=LI7s_lyooO8", "type": "youtube", "metadata": {}}]'),
	(NULL, NULL, NULL, 'f0a85d18-aff4-412f-b8e6-3b34ef098dce', '4cc9878f-e659-4cb0-a112-1b108e734d4b', '2023-12-16 14:45:30.592744+00', '2023-12-18 17:16:47.807918+00', 'Statistical Analysis with Pandas: Descriptive and Inferential Statistics', false, '2023-12-16 14:45:08.689+00', '7ac00503-8519-43c8-a5ea-b79aeca900b1', false, NULL, NULL, true, '[{"link": "https://www.youtube.com/watch?v=11QuoxzHs-4", "type": "youtube", "metadata": {}}]'),
	(NULL, NULL, NULL, 'f0a85d18-aff4-412f-b8e6-3b34ef098dce', '77f5ee04-79c3-4421-abf3-1eb8abcb0163', '2023-12-16 14:45:49.039901+00', '2023-12-18 17:16:52.775606+00', 'Data Visualization with Matplotlib and Seaborn', false, '2023-12-16 14:45:33.044+00', '7ac00503-8519-43c8-a5ea-b79aeca900b1', false, NULL, NULL, true, '[{"link": "https://www.youtube.com/watch?v=NF4WX-cDsTA", "type": "youtube", "metadata": {}}]');


--
-- Data for Name: exercise; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."exercise" ("title", "description", "lesson_id", "created_at", "updated_at", "id", "due_by") VALUES
	('MVC essentials quiz', '<p>This exercise tests your knowledge of what we''ve covered in the first lesson.</p>', '5c75f4f1-c222-44a9-a8c6-81773ea33872', '2023-12-16 14:48:49.714448+00', '2023-12-16 14:51:49.403782+00', 'e2ea9fb8-6448-4f6c-a1d5-02c2b12cf862', NULL),
	('MVC Components quiz', NULL, 'a99e65b7-1394-4751-ad8d-a5fb670ccb9e', '2023-12-18 07:32:05.352832+00', '2023-12-18 07:32:05.352832+00', '8b6084b0-a936-411d-9408-a1289aeed068', NULL),
	('NodeJS MVC Quiz', NULL, '266b3daa-1eb2-401e-9510-1819952b44b7', '2023-12-18 07:35:42.142627+00', '2023-12-18 07:41:41.212306+00', '43f43374-7df0-4e02-b839-56403f71473a', NULL),
	('MVC frameworks and tools quiz', NULL, 'd1903e13-3ef1-4163-bcc4-a25d78c4e257', '2023-12-18 07:47:55.823125+00', '2023-12-18 07:49:16.253857+00', '2f8e9919-ece0-4160-8d36-6b2eac77d197', NULL),
	('Best Practices And Advanced MVC Concepts quiz', NULL, '74cf090a-6a39-47a4-9746-6dac6c8cfa3f', '2023-12-18 07:50:54.450376+00', '2023-12-18 07:50:54.450376+00', 'aa4bde62-07e9-41c6-b6e6-0d4f8a380c19', NULL),
	('Introduction To React: Quiz', NULL, '6f2d8142-0903-425c-8534-f5105b624752', '2023-12-18 07:58:36.127443+00', '2023-12-18 08:01:32.844915+00', 'e78bfd24-8ac3-43e9-a117-a2f9d00f74b1', NULL),
	('Components And Props Quiz', NULL, '0a39ab2f-9451-4a90-902c-3030bf965637', '2023-12-18 08:05:00.634233+00', '2023-12-18 08:05:00.634233+00', '43ead5d7-af88-47cf-8f86-99124f5eb0cd', NULL),
	('React State And Lifecycle Quiz', NULL, '80b79665-733b-41bf-9853-34fd8ab50496', '2023-12-18 08:11:17.720227+00', '2023-12-18 08:11:17.720227+00', 'b0770deb-a8a0-4efe-9d28-8bf1298c04b2', NULL),
	('Handling Forms And Events Quiz', NULL, '30ca12a6-2009-4457-830e-32945618712d', '2023-12-18 08:14:49.030025+00', '2023-12-18 08:14:49.030025+00', '4f01f787-3b21-45d0-a245-5a130d908532', NULL),
	('React Router Quiz', NULL, 'a25bca81-bf27-4eb9-bb1d-f37c00b453d3', '2023-12-18 08:16:43.377908+00', '2023-12-18 08:16:43.377908+00', '52a45eb3-452e-48ef-b08e-3a09a02173b6', NULL),
	('Delving Into Data Analysis With Pandas - Quiz', NULL, '829da386-8ccd-4c81-b2fb-b9891102c83c', '2023-12-18 16:15:33.151942+00', '2023-12-18 16:15:33.151942+00', 'bd6e81c7-3d28-4037-acf0-a3028c583771', NULL),
	('Data Visualization With Matplotlib And Seaborn - Quiz', NULL, '77f5ee04-79c3-4421-abf3-1eb8abcb0163', '2023-12-18 16:20:01.136448+00', '2023-12-18 16:20:01.136448+00', 'c5408793-c3cb-4ff9-afc1-36a9bd57061c', NULL),
	('Statistical Analysis With Pandas: Descriptive And Inferential Statistics - Quiz', NULL, '4cc9878f-e659-4cb0-a112-1b108e734d4b', '2023-12-18 16:24:29.297145+00', '2023-12-18 16:24:29.297145+00', 'fdec962c-ed43-4042-b60d-57a353676ee3', NULL),
	('Data Cleaning And Preprocessing Techniques - Quiz', NULL, '05f03084-3ff1-49e3-aa2a-7a13840cc4b1', '2023-12-18 16:32:48.490769+00', '2023-12-18 16:32:48.490769+00', 'd8cd1cf7-1951-46b3-ad1c-41e415185bc1', NULL),
	('Introduction to Python - Quiz', NULL, '5e5c8221-4c11-4c40-8664-11743bb79579', '2023-12-18 16:12:11.463241+00', '2023-12-18 17:22:03.669934+00', '6f1063ed-3791-43fe-81e9-ad3b007834fa', '2023-12-21 18:21:00');


--
-- Data for Name: group_attendance; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: lesson_comment; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."lesson_comment" ("id", "created_at", "updated_at", "lesson_id", "groupmember_id", "comment") VALUES
	(1, '2023-12-18 07:28:35.149526+00', '2023-12-18 07:28:35.149526+00', '5c75f4f1-c222-44a9-a8c6-81773ea33872', 'b96896ff-d954-44b8-acb4-234b0d4e87d7', 'Looking forward to your submissions!'),
	(2, '2023-12-18 07:31:15.792089+00', '2023-12-18 07:31:15.792089+00', 'a99e65b7-1394-4751-ad8d-a5fb670ccb9e', 'b96896ff-d954-44b8-acb4-234b0d4e87d7', 'We hope you enjoy the second lesson of this course'),
	(3, '2023-12-18 07:31:42.6417+00', '2023-12-18 07:31:42.6417+00', 'a99e65b7-1394-4751-ad8d-a5fb670ccb9e', 'b96896ff-d954-44b8-acb4-234b0d4e87d7', 'Be sure to take the exercise to test your knowledge!'),
	(4, '2023-12-18 07:42:14.50923+00', '2023-12-18 07:42:14.50923+00', '266b3daa-1eb2-401e-9510-1819952b44b7', 'b96896ff-d954-44b8-acb4-234b0d4e87d7', 'Endeavour to try out the quiz question'),
	(5, '2023-12-18 07:42:26.04562+00', '2023-12-18 07:42:26.04562+00', '266b3daa-1eb2-401e-9510-1819952b44b7', 'b96896ff-d954-44b8-acb4-234b0d4e87d7', 'Good job'),
	(6, '2023-12-18 07:49:34.872902+00', '2023-12-18 07:49:34.872902+00', 'd1903e13-3ef1-4163-bcc4-a25d78c4e257', 'b96896ff-d954-44b8-acb4-234b0d4e87d7', 'Awesome!!'),
	(7, '2023-12-18 07:50:32.597818+00', '2023-12-18 07:50:32.597818+00', '74cf090a-6a39-47a4-9746-6dac6c8cfa3f', 'b96896ff-d954-44b8-acb4-234b0d4e87d7', 'Kindly refer to the context'),
	(8, '2023-12-18 07:58:08.381121+00', '2023-12-18 07:58:08.381121+00', '6f2d8142-0903-425c-8534-f5105b624752', '5e021c47-07c3-416d-bb75-d218ee482f82', 'Reactjs is amazing, loved working on this course'),
	(9, '2023-12-18 08:07:32.504784+00', '2023-12-18 08:07:32.504784+00', '0a39ab2f-9451-4a90-902c-3030bf965637', '5e021c47-07c3-416d-bb75-d218ee482f82', 'Reusable component are crucial to maintainable apps'),
	(10, '2023-12-18 08:10:42.926993+00', '2023-12-18 08:10:42.926993+00', '80b79665-733b-41bf-9853-34fd8ab50496', '5e021c47-07c3-416d-bb75-d218ee482f82', 'Amazing '),
	(11, '2023-12-18 08:14:11.014751+00', '2023-12-18 08:14:11.014751+00', '30ca12a6-2009-4457-830e-32945618712d', '5e021c47-07c3-416d-bb75-d218ee482f82', 'Ensure to following along and send in your exercise'),
	(12, '2023-12-18 08:16:24.763132+00', '2023-12-18 08:16:24.763132+00', 'a25bca81-bf27-4eb9-bb1d-f37c00b453d3', '5e021c47-07c3-416d-bb75-d218ee482f82', 'Awesome '),
	(13, '2023-12-18 08:22:37.034616+00', '2023-12-18 08:22:37.034616+00', NULL, '5e021c47-07c3-416d-bb75-d218ee482f82', 'Good job'),
	(46, '2023-12-18 16:11:13.924672+00', '2023-12-18 16:11:13.924672+00', '5e5c8221-4c11-4c40-8664-11743bb79579', 'f5ef8afa-7652-4615-8217-a9c7c75a8e89', 'I really love Python'),
	(47, '2023-12-18 16:11:21.76263+00', '2023-12-18 16:11:21.76263+00', '5e5c8221-4c11-4c40-8664-11743bb79579', 'f5ef8afa-7652-4615-8217-a9c7c75a8e89', 'Amazing content'),
	(48, '2023-12-18 16:11:45.272455+00', '2023-12-18 16:11:45.272455+00', '5e5c8221-4c11-4c40-8664-11743bb79579', 'f5ef8afa-7652-4615-8217-a9c7c75a8e89', 'Hi everyone, how''s it going?'),
	(49, '2023-12-18 16:15:16.630463+00', '2023-12-18 16:15:16.630463+00', '829da386-8ccd-4c81-b2fb-b9891102c83c', 'f5ef8afa-7652-4615-8217-a9c7c75a8e89', 'Hi everyone'),
	(50, '2023-12-18 16:19:00.281798+00', '2023-12-18 16:19:00.281798+00', '77f5ee04-79c3-4421-abf3-1eb8abcb0163', 'f5ef8afa-7652-4615-8217-a9c7c75a8e89', 'Hello everyone'),
	(51, '2023-12-18 16:25:34.063621+00', '2023-12-18 16:25:34.063621+00', '4cc9878f-e659-4cb0-a112-1b108e734d4b', 'f5ef8afa-7652-4615-8217-a9c7c75a8e89', 'Awesome'),
	(52, '2023-12-18 16:37:50.326304+00', '2023-12-18 16:37:50.326304+00', '05f03084-3ff1-49e3-aa2a-7a13840cc4b1', 'f5ef8afa-7652-4615-8217-a9c7c75a8e89', 'Awesome');


--
-- Data for Name: lesson_completion; Type: TABLE DATA; Schema: public; Owner: postgres
--



INSERT INTO "public"."question" ("id", "question_type_id", "title", "created_at", "updated_at", "exercise_id", "name", "points", "order") VALUES
	(1, 2, 'What does MVC stand for', '2023-12-16 14:51:49.433261+00', '2023-12-16 14:51:49.433261+00', 'e2ea9fb8-6448-4f6c-a1d5-02c2b12cf862', 'd7316838-284f-4096-bf55-e51db9a98d47', 0, 0),
	(2, 3, 'What is the primary responsibility of the "Controller" component in the Model-View-Controller (MVC) architecture, and how does it differ from the responsibilities of the "Model" and "View"?', '2023-12-18 07:33:47.030263+00', '2023-12-18 07:33:47.030263+00', '8b6084b0-a936-411d-9408-a1289aeed068', '30c37146-5060-4fc7-beac-1a0b2cfcf3cc', 0, 0),
	(3, 2, 'In the context of Node.js MVC, what is middleware and how is it typically used in the Express.js framework?', '2023-12-18 07:41:41.233753+00', '2023-12-18 07:41:41.233753+00', '43f43374-7df0-4e02-b839-56403f71473a', 'f8286b17-69b7-4ec3-8b11-bb25cada47b9', 0, 0),
	(4, 3, 'In the context of web development, explain the significance of a "middleware" in the Express.js framework. Provide an example of a scenario where middleware plays a crucial role in enhancing the functionality of an MVC application.', '2023-12-18 07:49:16.272254+00', '2023-12-18 07:49:16.272254+00', '2f8e9919-ece0-4160-8d36-6b2eac77d197', '9a00eba5-24e1-4b6a-bb09-a8236ab9cdde', 0, 0),
	(5, 2, 'What is the primary purpose of the "Service Layer" in the context of advanced MVC concepts?', '2023-12-18 07:55:24.139179+00', '2023-12-18 07:55:24.139179+00', 'aa4bde62-07e9-41c6-b6e6-0d4f8a380c19', '545916cf-4984-41e7-bb8e-b156e3ba372f', 10, 0),
	(6, 2, 'In the context of MVC best practices, what is the purpose of the "Data Transfer Object (DTO)" pattern?', '2023-12-18 07:55:24.21024+00', '2023-12-18 07:55:36.562606+00', 'aa4bde62-07e9-41c6-b6e6-0d4f8a380c19', '8eddc204-f6c3-47be-846a-16280d784587', 10, 1),
	(7, 2, 'What is the purpose of the virtual DOM in React, and how does it contribute to the framework''s performance optimization?', '2023-12-18 08:00:45.234554+00', '2023-12-18 08:00:45.234554+00', 'e78bfd24-8ac3-43e9-a117-a2f9d00f74b1', '5fc6a9d8-5575-46a1-abec-e1ff770498a2', 10, 0),
	(8, 3, 'In React, what is the primary purpose of the key prop when rendering a list of components? Why is it important, and how does it contribute to the efficiency of React applications?', '2023-12-18 08:06:17.346827+00', '2023-12-18 08:06:17.346827+00', '43ead5d7-af88-47cf-8f86-99124f5eb0cd', 'f8fa01df-f8e0-4eaa-9c9e-784c262d6f92', 0, 0),
	(9, 3, 'Consider a React component that manages complex state logic and asynchronous data fetching. How would you optimize the component''s performance by utilizing the useEffect hook and avoiding unnecessary renders? ', '2023-12-18 08:12:26.542344+00', '2023-12-18 08:12:26.542344+00', 'b0770deb-a8a0-4efe-9d28-8bf1298c04b2', 'a63f6124-a26e-4ac9-8734-b9a9a5e7bdae', 20, 0),
	(10, 3, 'Discuss the differences between controlled and uncontrolled components in the context of form handling in React. ', '2023-12-18 08:15:41.712519+00', '2023-12-18 08:15:41.712519+00', '4f01f787-3b21-45d0-a245-5a130d908532', 'db782430-5972-4782-a4e7-3ab68f3166df', 20, 0),
	(11, 2, 'In a React component that utilizes the React Router library, you want to programmatically navigate to a new route when a certain condition is met. Which React Router hook should you use, and how would you implement this navigation?', '2023-12-18 08:22:19.802705+00', '2023-12-18 08:22:26.065789+00', '52a45eb3-452e-48ef-b08e-3a09a02173b6', 'ce0f08df-abb7-4078-9fe0-763114369712', 20, 0),
	(44, 3, 'What is the purpose of the NumPy library in Python for data science, and how does it contribute to numerical operations in data analysis?', '2023-12-18 16:14:05.862243+00', '2023-12-18 16:14:05.862243+00', '6f1063ed-3791-43fe-81e9-ad3b007834fa', '090c7f8e-d38a-46ca-ac6c-5a6561eb02dd', 20, 0),
	(45, 3, 'Explain the significance of the Pandas library in the context of Python for data science. Provide examples of key data structures within Pandas and describe their roles in handling and manipulating tabular data.', '2023-12-18 16:14:05.8955+00', '2023-12-18 16:14:05.8955+00', '6f1063ed-3791-43fe-81e9-ad3b007834fa', '4babe8e6-613f-4ca3-8086-0a11582885cb', 20, 1),
	(46, 2, 'When working with Pandas, what function is used to drop missing values from a DataFrame?', '2023-12-18 16:17:36.376801+00', '2023-12-18 16:17:36.376801+00', 'bd6e81c7-3d28-4037-acf0-a3028c583771', 'd3dba5d2-c29b-4813-9f3b-1cc8b7c684f3', 20, 0),
	(47, 3, 'What is the primary purpose of using Matplotlib and Seaborn in data visualization, and how do they differ in terms of their design philosophy and default styles?', '2023-12-18 16:21:07.735222+00', '2023-12-18 16:21:07.735222+00', 'c5408793-c3cb-4ff9-afc1-36a9bd57061c', 'e9d2a20c-3509-44b0-aeb1-121c7d9c3000', 20, 0),
	(48, 3, 'In a given dataset using Pandas, what function can you use to calculate the mean, median, and standard deviation of a numerical column simultaneously? Provide an example using a hypothetical DataFrame named "df" and a column named "values."', '2023-12-18 16:25:13.804375+00', '2023-12-18 16:25:20.077322+00', 'fdec962c-ed43-4042-b60d-57a353676ee3', '54801373-ef73-40c2-95d1-f9de24c5bd6d', 20, 0),
	(49, 2, 'What is the primary purpose of data cleaning in the context of data preprocessing?', '2023-12-18 16:37:31.977078+00', '2023-12-18 16:37:31.977078+00', 'd8cd1cf7-1951-46b3-ad1c-41e415185bc1', '12200af7-41a2-41e4-b12c-9d820fcd0415', 0, 0);


--
-- Data for Name: option; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."option" ("id", "label", "is_correct", "question_id", "value", "created_at", "updated_at") VALUES
	(1, 'Modulus, View, Calculus', false, 1, '0bed262a-5e7a-40de-b46b-4e55e96971eb', '2023-12-16 14:51:49.481327+00', '2023-12-16 14:51:49.481327+00'),
	(2, 'Mode, Vue, Controller', false, 1, '78e1a99a-971d-456c-822d-1962c70707ed', '2023-12-16 14:51:49.50838+00', '2023-12-16 14:51:49.50838+00'),
	(3, 'Model, View, Controller', true, 1, 'b5cbbb61-0d5a-404a-86a4-78ec5b694143', '2023-12-16 14:51:49.522525+00', '2023-12-16 14:51:49.522525+00'),
	(4, 'Middleware is a design pattern used to structure code in a more modular way.', false, 3, 'c567d8ec-2e6e-429e-9854-186beeafe6f1', '2023-12-18 07:41:41.2506+00', '2023-12-18 07:41:41.2506+00'),
	(5, 'Middleware refers to the data manipulation functions in the Model', false, 3, '3100afec-1a9f-49e9-bc1e-fc5049efab87', '2023-12-18 07:41:41.268962+00', '2023-12-18 07:41:41.268962+00'),
	(6, 'Middleware is used for handling HTTP requests and responses before they reach the route handler.', true, 3, 'd8e036f2-b7c6-4fc9-a624-fa2eb6368cac', '2023-12-18 07:41:41.280639+00', '2023-12-18 07:41:41.280639+00'),
	(7, 'Middleware is the term for the view components in the MVC architecture.', false, 3, '7efbb7c6-e825-4c51-b5e6-0ff6eadb9982', '2023-12-18 07:41:41.29216+00', '2023-12-18 07:41:41.29216+00'),
	(8, 'To manage database interactions and business logic', false, 5, '43f85a19-873f-4379-94ac-daa00e7318cb', '2023-12-18 07:55:24.162473+00', '2023-12-18 07:55:24.162473+00'),
	(9, 'To handle user input and update the view', false, 5, '7fa2f24c-17ed-4502-a52e-ddd17e88c6fa', '2023-12-18 07:55:24.174125+00', '2023-12-18 07:55:24.174125+00'),
	(10, 'To define routing and navigation within the application', false, 5, '64cae8b0-e5be-4545-8d75-1f7235f9c8b2', '2023-12-18 07:55:24.186611+00', '2023-12-18 07:55:24.186611+00'),
	(11, 'To encapsulate complex business operations and maintain separation of concerns', true, 5, '8b9baa21-b23c-48b4-b9da-c6a25c390678', '2023-12-18 07:55:24.199092+00', '2023-12-18 07:55:24.199092+00'),
	(12, 'To define the structure of the database schema', false, 6, 'b49acabb-bc8e-4a82-956c-fc8b2a82b989', '2023-12-18 07:55:24.22167+00', '2023-12-18 07:55:24.22167+00'),
	(13, 'To facilitate communication between different layers of an application', true, 6, '3e3cd02d-9874-45fa-ab33-fac206d0173b', '2023-12-18 07:55:24.23339+00', '2023-12-18 07:55:24.23339+00'),
	(14, 'To optimize rendering performance in the view', false, 6, '684802fb-de82-4e90-818b-e95a8256f7f2', '2023-12-18 07:55:24.246276+00', '2023-12-18 07:55:24.246276+00'),
	(15, 'To enforce encapsulation within the model layer', false, 6, '494afb9b-d6ab-4bb7-a438-34146503cca2', '2023-12-18 07:55:24.256232+00', '2023-12-18 07:55:24.256232+00'),
	(16, 'It stores React components in a centralized virtual memory.', false, 7, '3507f7e0-a6cb-4f88-b43c-cb92232fa171', '2023-12-18 08:00:45.261026+00', '2023-12-18 08:00:45.261026+00'),
	(17, 'It facilitates direct communication between the browser and the server.', false, 7, '75472460-b4ff-48a0-bff1-96e967a14b38', '2023-12-18 08:00:45.275211+00', '2023-12-18 08:00:45.275211+00'),
	(18, 'It is an in-memory representation of the actual DOM, allowing React to efficiently update and render UI changes.', true, 7, 'ef9e5df1-220e-4d5e-b7b7-110e70ead657', '2023-12-18 08:00:45.288121+00', '2023-12-18 08:00:45.288121+00'),
	(19, 'It handles encryption and decryption for secure data transmission.', false, 7, '6670c1c7-23f1-4837-9ac6-135d54c7c8b0', '2023-12-18 08:00:45.299509+00', '2023-12-18 08:00:45.299509+00'),
	(20, 'useNavigate; invoke it with the desired route path when the condition is met.', true, 11, '416e3a9f-9e48-48af-98d2-c8d75f03350c', '2023-12-18 08:22:19.831439+00', '2023-12-18 08:22:19.831439+00'),
	(21, 'useHistory; call its push method with the target route path when the condition is satisfied', false, 11, '4fb4bf5e-0455-4bcb-b79e-cae5b7505124', '2023-12-18 08:22:19.847833+00', '2023-12-18 08:22:19.847833+00'),
	(22, 'useRedirect; specify the new route as an argument to trigger the redirection.', false, 11, '007d1433-29a6-45c2-9bbe-cfb265a3c19c', '2023-12-18 08:22:19.863822+00', '2023-12-18 08:22:19.863822+00'),
	(23, 'useRoute; access the navigate function and call it with the new route path when the condition is fulfilled.', false, 11, 'ebcba72b-b821-4f0c-94d2-14d13d832c68', '2023-12-18 08:22:19.879397+00', '2023-12-18 08:22:19.879397+00'),
	(53, 'drop_null()', false, 46, '555d875f-3d0c-42a9-9455-b1ffce8c6dac', '2023-12-18 16:17:36.401733+00', '2023-12-18 16:17:36.401733+00'),
	(54, 'remove_missing()', false, 46, 'a4eda4f5-3812-482f-b531-3ac2627734ee', '2023-12-18 16:17:36.416158+00', '2023-12-18 16:17:36.416158+00'),
	(55, ' dropna()', true, 46, '566afc22-5de0-4e6b-9c69-311dfedb87f7', '2023-12-18 16:17:36.427309+00', '2023-12-18 16:17:36.427309+00'),
	(56, 'clean_data()', false, 46, 'c7001225-0857-4f70-9733-5a054a329d01', '2023-12-18 16:17:36.43995+00', '2023-12-18 16:17:36.43995+00'),
	(57, 'To increase the size of the dataset', false, 49, 'a77692fa-eb8f-4602-bdd6-592f426a7f0d', '2023-12-18 16:37:32.000386+00', '2023-12-18 16:37:32.000386+00'),
	(58, 'To introduce noise and variability', false, 49, 'aec5c244-5504-4aa5-a8db-4c16afb71e80', '2023-12-18 16:37:32.014911+00', '2023-12-18 16:37:32.014911+00'),
	(59, 'To remove errors and inconsistencies', true, 49, '6862b586-6250-4aa7-806c-1f23b965ff57', '2023-12-18 16:37:32.027257+00', '2023-12-18 16:37:32.027257+00'),
	(60, 'To speed up the data processing time', false, 49, 'ee6e12b1-dfce-47ee-94a7-7c9d60ad183c', '2023-12-18 16:37:32.039479+00', '2023-12-18 16:37:32.039479+00');


--
-- Data for Name: organization_contacts; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: organization_emaillist; Type: TABLE DATA; Schema: public; Owner: postgres
--





--
-- Data for Name: submission; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."submission" ("id", "reviewer_id", "status_id", "total", "created_at", "updated_at", "exercise_id", "submitted_by", "course_id") VALUES
	('b2a0eb23-3fed-4c3b-99a5-c1f9159d071b', NULL, 1, 0, '2024-01-22 18:53:12.526545+00', '2024-01-22 18:53:12.526545+00', '6f1063ed-3791-43fe-81e9-ad3b007834fa', '5840085d-0d0b-44ca-b6fb-6a758c9543ce', 'f0a85d18-aff4-412f-b8e6-3b34ef098dce'),
	('49fd0a90-0395-48a0-b052-3a305b604d8d', NULL, 1, 0, '2024-01-22 18:54:00.215345+00', '2024-01-22 18:54:00.215345+00', 'bd6e81c7-3d28-4037-acf0-a3028c583771', '5840085d-0d0b-44ca-b6fb-6a758c9543ce', 'f0a85d18-aff4-412f-b8e6-3b34ef098dce');


--
-- Data for Name: question_answer; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."question_answer" ("id", "answers", "question_id", "open_answer", "group_member_id", "submission_id", "point") VALUES
	(1, '{}', 44, 'The NumPy library helps to analyse numerical data.', '5840085d-0d0b-44ca-b6fb-6a758c9543ce', 'b2a0eb23-3fed-4c3b-99a5-c1f9159d071b', 0),
	(2, '{}', 45, 'The Pandas library is significant in the sense that it is used for working with data sets', '5840085d-0d0b-44ca-b6fb-6a758c9543ce', 'b2a0eb23-3fed-4c3b-99a5-c1f9159d071b', 0),
	(3, '{566afc22-5de0-4e6b-9c69-311dfedb87f7}', 46, '', '5840085d-0d0b-44ca-b6fb-6a758c9543ce', '49fd0a90-0395-48a0-b052-3a305b604d8d', 0);


--
-- Data for Name: quiz; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: quiz_play; Type: TABLE DATA; Schema: public; Owner: postgres
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
	('avatars', 'avatars', NULL, '2023-11-22 09:29:04.533114+00', '2023-11-22 09:29:04.533114+00', true, false, NULL, NULL, NULL);


--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

-- Get the sequence name from supabase database
SELECT PG_GET_SERIAL_SEQUENCE('organizationmember', 'id');
-- In my case i got "public.organizationmember_id_seq"
SELECT setval('public.organizationmember_id_seq', COALESCE((SELECT MAX(id)+1 FROM organizationmember), 1), false);