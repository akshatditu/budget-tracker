--
-- PostgreSQL database dump
--

\restrict UinWrVfxVKuaaahqT7imfY2gtvS2BeLoRQ2IWqUz4o1Ujtlz5iZa3uY5fenj2ZH

-- Dumped from database version 16.14 (Debian 16.14-1.pgdg13+1)
-- Dumped by pg_dump version 16.14 (Debian 16.14-1.pgdg13+1)

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
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: budget
--

INSERT INTO public.users VALUES (1, 'me@budget.local', NULL, 'Me', 'INR', '2026-06-23 11:17:03.598977+00');


--
-- Data for Name: budget_years; Type: TABLE DATA; Schema: public; Owner: budget
--

INSERT INTO public.budget_years VALUES (1, 1, 2026, '2026-06-23 11:17:03.598977+00');


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: budget
--

INSERT INTO public.categories VALUES (1, 1, 'Bills', 0);
INSERT INTO public.categories VALUES (2, 1, 'Needs', 1);
INSERT INTO public.categories VALUES (3, 1, 'Wants', 2);
INSERT INTO public.categories VALUES (4, 1, 'Investments', 3);


--
-- Data for Name: subcategories; Type: TABLE DATA; Schema: public; Owner: budget
--

INSERT INTO public.subcategories VALUES (1, 1, 1, 'Term Insurance', 0, false);
INSERT INTO public.subcategories VALUES (2, 1, 1, 'Bike+Car Insurance', 1, false);
INSERT INTO public.subcategories VALUES (3, 1, 1, 'Phone/Wifi Bill', 2, false);
INSERT INTO public.subcategories VALUES (4, 1, 1, 'OTT+Subscriptions', 3, false);
INSERT INTO public.subcategories VALUES (5, 1, 1, 'Gym+Protein', 4, false);
INSERT INTO public.subcategories VALUES (6, 1, 1, 'Auto Maintenance', 5, false);
INSERT INTO public.subcategories VALUES (7, 1, 1, 'Rent + Electricity', 6, false);
INSERT INTO public.subcategories VALUES (8, 1, 2, 'Personal Care', 0, false);
INSERT INTO public.subcategories VALUES (9, 1, 2, 'Clothing', 1, false);
INSERT INTO public.subcategories VALUES (10, 1, 2, 'Fuel+Fastag', 2, false);
INSERT INTO public.subcategories VALUES (11, 1, 2, 'Grocery', 3, false);
INSERT INTO public.subcategories VALUES (12, 1, 2, 'Medicine', 4, false);
INSERT INTO public.subcategories VALUES (13, 1, 2, 'Dog Food', 5, false);
INSERT INTO public.subcategories VALUES (14, 1, 3, 'Miscellaneous', 0, false);
INSERT INTO public.subcategories VALUES (15, 1, 3, 'Going Out/Gifts', 1, false);
INSERT INTO public.subcategories VALUES (16, 1, 3, 'Trips', 2, false);
INSERT INTO public.subcategories VALUES (17, 1, 3, 'Swiggy/Zomato', 3, false);
INSERT INTO public.subcategories VALUES (18, 1, 4, 'SIPs', 0, false);
INSERT INTO public.subcategories VALUES (19, 1, 4, 'Anjali Study', 1, false);
INSERT INTO public.subcategories VALUES (20, 1, 4, 'Car', 2, false);
INSERT INTO public.subcategories VALUES (21, 1, 2, 'Initial Home Setup', 0, false);
INSERT INTO public.subcategories VALUES (22, 1, 1, 'Tax', 0, false);
INSERT INTO public.subcategories VALUES (23, 1, 1, 'Spouse Health Insurance', 0, false);


--
-- Data for Name: annual_budgets; Type: TABLE DATA; Schema: public; Owner: budget
--

INSERT INTO public.annual_budgets VALUES (1, 1, 1, 47016.00);
INSERT INTO public.annual_budgets VALUES (2, 1, 2, 10800.00);
INSERT INTO public.annual_budgets VALUES (3, 1, 3, 27000.00);
INSERT INTO public.annual_budgets VALUES (4, 1, 4, 16000.00);
INSERT INTO public.annual_budgets VALUES (5, 1, 5, 85000.00);
INSERT INTO public.annual_budgets VALUES (6, 1, 6, 15000.00);
INSERT INTO public.annual_budgets VALUES (7, 1, 7, 100000.00);
INSERT INTO public.annual_budgets VALUES (8, 1, 8, 17256.00);
INSERT INTO public.annual_budgets VALUES (9, 1, 9, 60000.00);
INSERT INTO public.annual_budgets VALUES (10, 1, 10, 29200.00);
INSERT INTO public.annual_budgets VALUES (11, 1, 11, 120000.00);
INSERT INTO public.annual_budgets VALUES (12, 1, 12, 3000.00);
INSERT INTO public.annual_budgets VALUES (13, 1, 13, 32264.00);
INSERT INTO public.annual_budgets VALUES (14, 1, 14, 118232.00);
INSERT INTO public.annual_budgets VALUES (15, 1, 15, 21352.00);
INSERT INTO public.annual_budgets VALUES (16, 1, 16, 200000.00);
INSERT INTO public.annual_budgets VALUES (17, 1, 17, 25000.00);
INSERT INTO public.annual_budgets VALUES (18, 1, 18, 600000.00);
INSERT INTO public.annual_budgets VALUES (19, 1, 19, 900000.00);
INSERT INTO public.annual_budgets VALUES (20, 1, 20, 300000.00);
INSERT INTO public.annual_budgets VALUES (21, 1, 21, 150000.00);
INSERT INTO public.annual_budgets VALUES (22, 1, 22, 18160.00);
INSERT INTO public.annual_budgets VALUES (23, 1, 23, 16676.00);


--
-- Data for Name: incomes; Type: TABLE DATA; Schema: public; Owner: budget
--

INSERT INTO public.incomes VALUES (1, 1, 1, 6, 'Salary', 208063.00, NULL, NULL);
INSERT INTO public.incomes VALUES (2, 1, 1, 1, 'Salary', 208063.00, NULL, NULL);
INSERT INTO public.incomes VALUES (3, 1, 1, 2, 'Salary', 208063.00, NULL, NULL);


--
-- Data for Name: monthly_budgets; Type: TABLE DATA; Schema: public; Owner: budget
--

INSERT INTO public.monthly_budgets VALUES (3, 1, 1, 3, 3918.00, 3918.00);
INSERT INTO public.monthly_budgets VALUES (4, 1, 1, 4, 3918.00, 3918.00);
INSERT INTO public.monthly_budgets VALUES (5, 1, 1, 5, 3918.00, 3918.00);
INSERT INTO public.monthly_budgets VALUES (7, 1, 1, 7, 3918.00, 3918.00);
INSERT INTO public.monthly_budgets VALUES (8, 1, 1, 8, 3918.00, 3918.00);
INSERT INTO public.monthly_budgets VALUES (9, 1, 1, 9, 3918.00, 3918.00);
INSERT INTO public.monthly_budgets VALUES (10, 1, 1, 10, 3918.00, 3918.00);
INSERT INTO public.monthly_budgets VALUES (11, 1, 1, 11, 3918.00, 3918.00);
INSERT INTO public.monthly_budgets VALUES (12, 1, 1, 12, 3918.00, 3918.00);
INSERT INTO public.monthly_budgets VALUES (13, 1, 2, 1, 900.00, 900.00);
INSERT INTO public.monthly_budgets VALUES (14, 1, 2, 2, 900.00, 900.00);
INSERT INTO public.monthly_budgets VALUES (15, 1, 2, 3, 900.00, 900.00);
INSERT INTO public.monthly_budgets VALUES (16, 1, 2, 4, 900.00, 900.00);
INSERT INTO public.monthly_budgets VALUES (17, 1, 2, 5, 900.00, 900.00);
INSERT INTO public.monthly_budgets VALUES (19, 1, 2, 7, 900.00, 900.00);
INSERT INTO public.monthly_budgets VALUES (20, 1, 2, 8, 900.00, 900.00);
INSERT INTO public.monthly_budgets VALUES (21, 1, 2, 9, 900.00, 900.00);
INSERT INTO public.monthly_budgets VALUES (22, 1, 2, 10, 900.00, 900.00);
INSERT INTO public.monthly_budgets VALUES (23, 1, 2, 11, 900.00, 900.00);
INSERT INTO public.monthly_budgets VALUES (24, 1, 2, 12, 900.00, 900.00);
INSERT INTO public.monthly_budgets VALUES (27, 1, 3, 3, 2250.00, 2250.00);
INSERT INTO public.monthly_budgets VALUES (28, 1, 3, 4, 2250.00, 2250.00);
INSERT INTO public.monthly_budgets VALUES (29, 1, 3, 5, 2250.00, 2250.00);
INSERT INTO public.monthly_budgets VALUES (31, 1, 3, 7, 2250.00, 2250.00);
INSERT INTO public.monthly_budgets VALUES (32, 1, 3, 8, 2250.00, 2250.00);
INSERT INTO public.monthly_budgets VALUES (33, 1, 3, 9, 2250.00, 2250.00);
INSERT INTO public.monthly_budgets VALUES (34, 1, 3, 10, 2250.00, 2250.00);
INSERT INTO public.monthly_budgets VALUES (35, 1, 3, 11, 2250.00, 2250.00);
INSERT INTO public.monthly_budgets VALUES (36, 1, 3, 12, 2250.00, 2250.00);
INSERT INTO public.monthly_budgets VALUES (39, 1, 4, 3, 1333.33, 1333.33);
INSERT INTO public.monthly_budgets VALUES (40, 1, 4, 4, 1333.33, 1333.33);
INSERT INTO public.monthly_budgets VALUES (41, 1, 4, 5, 1333.33, 1333.33);
INSERT INTO public.monthly_budgets VALUES (43, 1, 4, 7, 1333.33, 1333.33);
INSERT INTO public.monthly_budgets VALUES (44, 1, 4, 8, 1333.33, 1333.33);
INSERT INTO public.monthly_budgets VALUES (45, 1, 4, 9, 1333.33, 1333.33);
INSERT INTO public.monthly_budgets VALUES (46, 1, 4, 10, 1333.33, 1333.33);
INSERT INTO public.monthly_budgets VALUES (47, 1, 4, 11, 1333.33, 1333.33);
INSERT INTO public.monthly_budgets VALUES (48, 1, 4, 12, 1333.33, 1333.33);
INSERT INTO public.monthly_budgets VALUES (51, 1, 5, 3, 7083.33, 7083.33);
INSERT INTO public.monthly_budgets VALUES (52, 1, 5, 4, 7083.33, 7083.33);
INSERT INTO public.monthly_budgets VALUES (53, 1, 5, 5, 7083.33, 7083.33);
INSERT INTO public.monthly_budgets VALUES (55, 1, 5, 7, 7083.33, 7083.33);
INSERT INTO public.monthly_budgets VALUES (56, 1, 5, 8, 7083.33, 7083.33);
INSERT INTO public.monthly_budgets VALUES (57, 1, 5, 9, 7083.33, 7083.33);
INSERT INTO public.monthly_budgets VALUES (58, 1, 5, 10, 7083.33, 7083.33);
INSERT INTO public.monthly_budgets VALUES (59, 1, 5, 11, 7083.33, 7083.33);
INSERT INTO public.monthly_budgets VALUES (60, 1, 5, 12, 7083.33, 7083.33);
INSERT INTO public.monthly_budgets VALUES (63, 1, 6, 3, 1250.00, 1250.00);
INSERT INTO public.monthly_budgets VALUES (64, 1, 6, 4, 1250.00, 1250.00);
INSERT INTO public.monthly_budgets VALUES (65, 1, 6, 5, 1250.00, 1250.00);
INSERT INTO public.monthly_budgets VALUES (67, 1, 6, 7, 1250.00, 1250.00);
INSERT INTO public.monthly_budgets VALUES (68, 1, 6, 8, 1250.00, 1250.00);
INSERT INTO public.monthly_budgets VALUES (69, 1, 6, 9, 1250.00, 1250.00);
INSERT INTO public.monthly_budgets VALUES (70, 1, 6, 10, 1250.00, 1250.00);
INSERT INTO public.monthly_budgets VALUES (71, 1, 6, 11, 1250.00, 1250.00);
INSERT INTO public.monthly_budgets VALUES (72, 1, 6, 12, 1250.00, 1250.00);
INSERT INTO public.monthly_budgets VALUES (75, 1, 7, 3, 8333.33, 8333.33);
INSERT INTO public.monthly_budgets VALUES (76, 1, 7, 4, 8333.33, 8333.33);
INSERT INTO public.monthly_budgets VALUES (77, 1, 7, 5, 8333.33, 8333.33);
INSERT INTO public.monthly_budgets VALUES (79, 1, 7, 7, 8333.33, 8333.33);
INSERT INTO public.monthly_budgets VALUES (80, 1, 7, 8, 8333.33, 8333.33);
INSERT INTO public.monthly_budgets VALUES (81, 1, 7, 9, 8333.33, 8333.33);
INSERT INTO public.monthly_budgets VALUES (82, 1, 7, 10, 8333.33, 8333.33);
INSERT INTO public.monthly_budgets VALUES (83, 1, 7, 11, 8333.33, 8333.33);
INSERT INTO public.monthly_budgets VALUES (84, 1, 7, 12, 8333.33, 8333.33);
INSERT INTO public.monthly_budgets VALUES (87, 1, 8, 3, 1438.00, 1438.00);
INSERT INTO public.monthly_budgets VALUES (88, 1, 8, 4, 1438.00, 1438.00);
INSERT INTO public.monthly_budgets VALUES (89, 1, 8, 5, 1438.00, 1438.00);
INSERT INTO public.monthly_budgets VALUES (91, 1, 8, 7, 1438.00, 1438.00);
INSERT INTO public.monthly_budgets VALUES (92, 1, 8, 8, 1438.00, 1438.00);
INSERT INTO public.monthly_budgets VALUES (93, 1, 8, 9, 1438.00, 1438.00);
INSERT INTO public.monthly_budgets VALUES (94, 1, 8, 10, 1438.00, 1438.00);
INSERT INTO public.monthly_budgets VALUES (95, 1, 8, 11, 1438.00, 1438.00);
INSERT INTO public.monthly_budgets VALUES (96, 1, 8, 12, 1438.00, 1438.00);
INSERT INTO public.monthly_budgets VALUES (99, 1, 9, 3, 5000.00, 5000.00);
INSERT INTO public.monthly_budgets VALUES (100, 1, 9, 4, 5000.00, 5000.00);
INSERT INTO public.monthly_budgets VALUES (101, 1, 9, 5, 5000.00, 5000.00);
INSERT INTO public.monthly_budgets VALUES (103, 1, 9, 7, 5000.00, 5000.00);
INSERT INTO public.monthly_budgets VALUES (104, 1, 9, 8, 5000.00, 5000.00);
INSERT INTO public.monthly_budgets VALUES (105, 1, 9, 9, 5000.00, 5000.00);
INSERT INTO public.monthly_budgets VALUES (106, 1, 9, 10, 5000.00, 5000.00);
INSERT INTO public.monthly_budgets VALUES (107, 1, 9, 11, 5000.00, 5000.00);
INSERT INTO public.monthly_budgets VALUES (108, 1, 9, 12, 5000.00, 5000.00);
INSERT INTO public.monthly_budgets VALUES (111, 1, 10, 3, 2433.33, 2433.33);
INSERT INTO public.monthly_budgets VALUES (112, 1, 10, 4, 2433.33, 2433.33);
INSERT INTO public.monthly_budgets VALUES (113, 1, 10, 5, 2433.33, 2433.33);
INSERT INTO public.monthly_budgets VALUES (115, 1, 10, 7, 2433.33, 2433.33);
INSERT INTO public.monthly_budgets VALUES (116, 1, 10, 8, 2433.33, 2433.33);
INSERT INTO public.monthly_budgets VALUES (117, 1, 10, 9, 2433.33, 2433.33);
INSERT INTO public.monthly_budgets VALUES (118, 1, 10, 10, 2433.33, 2433.33);
INSERT INTO public.monthly_budgets VALUES (119, 1, 10, 11, 2433.33, 2433.33);
INSERT INTO public.monthly_budgets VALUES (120, 1, 10, 12, 2433.33, 2433.33);
INSERT INTO public.monthly_budgets VALUES (123, 1, 11, 3, 10000.00, 10000.00);
INSERT INTO public.monthly_budgets VALUES (124, 1, 11, 4, 10000.00, 10000.00);
INSERT INTO public.monthly_budgets VALUES (125, 1, 11, 5, 10000.00, 10000.00);
INSERT INTO public.monthly_budgets VALUES (126, 1, 11, 6, 10000.00, 10000.00);
INSERT INTO public.monthly_budgets VALUES (127, 1, 11, 7, 10000.00, 10000.00);
INSERT INTO public.monthly_budgets VALUES (128, 1, 11, 8, 10000.00, 10000.00);
INSERT INTO public.monthly_budgets VALUES (129, 1, 11, 9, 10000.00, 10000.00);
INSERT INTO public.monthly_budgets VALUES (130, 1, 11, 10, 10000.00, 10000.00);
INSERT INTO public.monthly_budgets VALUES (131, 1, 11, 11, 10000.00, 10000.00);
INSERT INTO public.monthly_budgets VALUES (132, 1, 11, 12, 10000.00, 10000.00);
INSERT INTO public.monthly_budgets VALUES (135, 1, 12, 3, 250.00, 250.00);
INSERT INTO public.monthly_budgets VALUES (136, 1, 12, 4, 250.00, 250.00);
INSERT INTO public.monthly_budgets VALUES (18, 1, 2, 6, 900.00, 0.00);
INSERT INTO public.monthly_budgets VALUES (30, 1, 3, 6, 2250.00, 2720.00);
INSERT INTO public.monthly_budgets VALUES (42, 1, 4, 6, 1333.33, 1448.00);
INSERT INTO public.monthly_budgets VALUES (54, 1, 5, 6, 7083.33, 6000.00);
INSERT INTO public.monthly_budgets VALUES (90, 1, 8, 6, 1438.00, 1500.00);
INSERT INTO public.monthly_budgets VALUES (102, 1, 9, 6, 5000.00, 4706.00);
INSERT INTO public.monthly_budgets VALUES (114, 1, 10, 6, 2433.33, 3500.00);
INSERT INTO public.monthly_budgets VALUES (78, 1, 7, 6, 8333.33, 14285.00);
INSERT INTO public.monthly_budgets VALUES (1, 1, 1, 1, 3918.00, 0.00);
INSERT INTO public.monthly_budgets VALUES (25, 1, 3, 1, 2250.00, 4000.00);
INSERT INTO public.monthly_budgets VALUES (37, 1, 4, 1, 1333.33, 3797.00);
INSERT INTO public.monthly_budgets VALUES (49, 1, 5, 1, 7083.33, 5500.00);
INSERT INTO public.monthly_budgets VALUES (61, 1, 6, 1, 1250.00, 850.00);
INSERT INTO public.monthly_budgets VALUES (73, 1, 7, 1, 8333.33, 0.00);
INSERT INTO public.monthly_budgets VALUES (85, 1, 8, 1, 1438.00, 1000.00);
INSERT INTO public.monthly_budgets VALUES (97, 1, 9, 1, 5000.00, 19410.00);
INSERT INTO public.monthly_budgets VALUES (109, 1, 10, 1, 2433.33, 2000.00);
INSERT INTO public.monthly_budgets VALUES (121, 1, 11, 1, 10000.00, 15000.00);
INSERT INTO public.monthly_budgets VALUES (133, 1, 12, 1, 250.00, 0.00);
INSERT INTO public.monthly_budgets VALUES (2, 1, 1, 2, 3918.00, 7000.00);
INSERT INTO public.monthly_budgets VALUES (26, 1, 3, 2, 2250.00, 833.00);
INSERT INTO public.monthly_budgets VALUES (86, 1, 8, 2, 1438.00, 1116.00);
INSERT INTO public.monthly_budgets VALUES (62, 1, 6, 2, 1250.00, 1300.00);
INSERT INTO public.monthly_budgets VALUES (74, 1, 7, 2, 8333.33, 0.00);
INSERT INTO public.monthly_budgets VALUES (38, 1, 4, 2, 1333.33, 2065.00);
INSERT INTO public.monthly_budgets VALUES (98, 1, 9, 2, 5000.00, 7200.00);
INSERT INTO public.monthly_budgets VALUES (110, 1, 10, 2, 2433.33, 2000.00);
INSERT INTO public.monthly_budgets VALUES (122, 1, 11, 2, 10000.00, 10835.00);
INSERT INTO public.monthly_budgets VALUES (134, 1, 12, 2, 250.00, 0.00);
INSERT INTO public.monthly_budgets VALUES (137, 1, 12, 5, 250.00, 250.00);
INSERT INTO public.monthly_budgets VALUES (139, 1, 12, 7, 250.00, 250.00);
INSERT INTO public.monthly_budgets VALUES (140, 1, 12, 8, 250.00, 250.00);
INSERT INTO public.monthly_budgets VALUES (141, 1, 12, 9, 250.00, 250.00);
INSERT INTO public.monthly_budgets VALUES (142, 1, 12, 10, 250.00, 250.00);
INSERT INTO public.monthly_budgets VALUES (143, 1, 12, 11, 250.00, 250.00);
INSERT INTO public.monthly_budgets VALUES (144, 1, 12, 12, 250.00, 250.00);
INSERT INTO public.monthly_budgets VALUES (147, 1, 13, 3, 2688.67, 2688.67);
INSERT INTO public.monthly_budgets VALUES (148, 1, 13, 4, 2688.67, 2688.67);
INSERT INTO public.monthly_budgets VALUES (149, 1, 13, 5, 2688.67, 2688.67);
INSERT INTO public.monthly_budgets VALUES (151, 1, 13, 7, 2688.67, 2688.67);
INSERT INTO public.monthly_budgets VALUES (152, 1, 13, 8, 2688.67, 2688.67);
INSERT INTO public.monthly_budgets VALUES (153, 1, 13, 9, 2688.67, 2688.67);
INSERT INTO public.monthly_budgets VALUES (154, 1, 13, 10, 2688.67, 2688.67);
INSERT INTO public.monthly_budgets VALUES (155, 1, 13, 11, 2688.67, 2688.67);
INSERT INTO public.monthly_budgets VALUES (156, 1, 13, 12, 2688.67, 2688.67);
INSERT INTO public.monthly_budgets VALUES (159, 1, 14, 3, 9852.67, 9852.67);
INSERT INTO public.monthly_budgets VALUES (160, 1, 14, 4, 9852.67, 9852.67);
INSERT INTO public.monthly_budgets VALUES (161, 1, 14, 5, 9852.67, 9852.67);
INSERT INTO public.monthly_budgets VALUES (163, 1, 14, 7, 9852.67, 9852.67);
INSERT INTO public.monthly_budgets VALUES (164, 1, 14, 8, 9852.67, 9852.67);
INSERT INTO public.monthly_budgets VALUES (165, 1, 14, 9, 9852.67, 9852.67);
INSERT INTO public.monthly_budgets VALUES (166, 1, 14, 10, 9852.67, 9852.67);
INSERT INTO public.monthly_budgets VALUES (167, 1, 14, 11, 9852.67, 9852.67);
INSERT INTO public.monthly_budgets VALUES (168, 1, 14, 12, 9852.67, 9852.67);
INSERT INTO public.monthly_budgets VALUES (171, 1, 15, 3, 1779.33, 1779.33);
INSERT INTO public.monthly_budgets VALUES (172, 1, 15, 4, 1779.33, 1779.33);
INSERT INTO public.monthly_budgets VALUES (173, 1, 15, 5, 1779.33, 1779.33);
INSERT INTO public.monthly_budgets VALUES (175, 1, 15, 7, 1779.33, 1779.33);
INSERT INTO public.monthly_budgets VALUES (176, 1, 15, 8, 1779.33, 1779.33);
INSERT INTO public.monthly_budgets VALUES (177, 1, 15, 9, 1779.33, 1779.33);
INSERT INTO public.monthly_budgets VALUES (178, 1, 15, 10, 1779.33, 1779.33);
INSERT INTO public.monthly_budgets VALUES (179, 1, 15, 11, 1779.33, 1779.33);
INSERT INTO public.monthly_budgets VALUES (180, 1, 15, 12, 1779.33, 1779.33);
INSERT INTO public.monthly_budgets VALUES (193, 1, 17, 1, 2083.33, 3120.00);
INSERT INTO public.monthly_budgets VALUES (194, 1, 17, 2, 2083.33, 1348.00);
INSERT INTO public.monthly_budgets VALUES (183, 1, 16, 3, 16666.67, 166666.67);
INSERT INTO public.monthly_budgets VALUES (184, 1, 16, 4, 16666.67, 166666.67);
INSERT INTO public.monthly_budgets VALUES (185, 1, 16, 5, 16666.67, 166666.67);
INSERT INTO public.monthly_budgets VALUES (198, 1, 17, 6, 2083.33, 2000.00);
INSERT INTO public.monthly_budgets VALUES (187, 1, 16, 7, 16666.67, 166666.67);
INSERT INTO public.monthly_budgets VALUES (188, 1, 16, 8, 16666.67, 166666.67);
INSERT INTO public.monthly_budgets VALUES (189, 1, 16, 9, 16666.67, 166666.67);
INSERT INTO public.monthly_budgets VALUES (190, 1, 16, 10, 16666.67, 166666.67);
INSERT INTO public.monthly_budgets VALUES (191, 1, 16, 11, 16666.67, 166666.67);
INSERT INTO public.monthly_budgets VALUES (192, 1, 16, 12, 16666.67, 166666.67);
INSERT INTO public.monthly_budgets VALUES (195, 1, 17, 3, 2083.33, 2083.33);
INSERT INTO public.monthly_budgets VALUES (196, 1, 17, 4, 2083.33, 2083.33);
INSERT INTO public.monthly_budgets VALUES (197, 1, 17, 5, 2083.33, 2083.33);
INSERT INTO public.monthly_budgets VALUES (199, 1, 17, 7, 2083.33, 2083.33);
INSERT INTO public.monthly_budgets VALUES (200, 1, 17, 8, 2083.33, 2083.33);
INSERT INTO public.monthly_budgets VALUES (201, 1, 17, 9, 2083.33, 2083.33);
INSERT INTO public.monthly_budgets VALUES (202, 1, 17, 10, 2083.33, 2083.33);
INSERT INTO public.monthly_budgets VALUES (203, 1, 17, 11, 2083.33, 2083.33);
INSERT INTO public.monthly_budgets VALUES (204, 1, 17, 12, 2083.33, 2083.33);
INSERT INTO public.monthly_budgets VALUES (206, 1, 18, 2, 50000.00, 50000.00);
INSERT INTO public.monthly_budgets VALUES (207, 1, 18, 3, 50000.00, 50000.00);
INSERT INTO public.monthly_budgets VALUES (208, 1, 18, 4, 50000.00, 50000.00);
INSERT INTO public.monthly_budgets VALUES (209, 1, 18, 5, 50000.00, 50000.00);
INSERT INTO public.monthly_budgets VALUES (211, 1, 18, 7, 50000.00, 50000.00);
INSERT INTO public.monthly_budgets VALUES (212, 1, 18, 8, 50000.00, 50000.00);
INSERT INTO public.monthly_budgets VALUES (213, 1, 18, 9, 50000.00, 50000.00);
INSERT INTO public.monthly_budgets VALUES (214, 1, 18, 10, 50000.00, 50000.00);
INSERT INTO public.monthly_budgets VALUES (215, 1, 18, 11, 50000.00, 50000.00);
INSERT INTO public.monthly_budgets VALUES (216, 1, 18, 12, 50000.00, 50000.00);
INSERT INTO public.monthly_budgets VALUES (217, 1, 19, 1, 75000.00, 75000.00);
INSERT INTO public.monthly_budgets VALUES (219, 1, 19, 3, 75000.00, 75000.00);
INSERT INTO public.monthly_budgets VALUES (220, 1, 19, 4, 75000.00, 75000.00);
INSERT INTO public.monthly_budgets VALUES (221, 1, 19, 5, 75000.00, 75000.00);
INSERT INTO public.monthly_budgets VALUES (223, 1, 19, 7, 75000.00, 75000.00);
INSERT INTO public.monthly_budgets VALUES (224, 1, 19, 8, 75000.00, 75000.00);
INSERT INTO public.monthly_budgets VALUES (225, 1, 19, 9, 75000.00, 75000.00);
INSERT INTO public.monthly_budgets VALUES (226, 1, 19, 10, 75000.00, 75000.00);
INSERT INTO public.monthly_budgets VALUES (227, 1, 19, 11, 75000.00, 75000.00);
INSERT INTO public.monthly_budgets VALUES (228, 1, 19, 12, 75000.00, 75000.00);
INSERT INTO public.monthly_budgets VALUES (231, 1, 20, 3, 25000.00, 25000.00);
INSERT INTO public.monthly_budgets VALUES (232, 1, 20, 4, 25000.00, 25000.00);
INSERT INTO public.monthly_budgets VALUES (233, 1, 20, 5, 25000.00, 25000.00);
INSERT INTO public.monthly_budgets VALUES (235, 1, 20, 7, 25000.00, 25000.00);
INSERT INTO public.monthly_budgets VALUES (236, 1, 20, 8, 25000.00, 25000.00);
INSERT INTO public.monthly_budgets VALUES (237, 1, 20, 9, 25000.00, 25000.00);
INSERT INTO public.monthly_budgets VALUES (238, 1, 20, 10, 25000.00, 25000.00);
INSERT INTO public.monthly_budgets VALUES (239, 1, 20, 11, 25000.00, 25000.00);
INSERT INTO public.monthly_budgets VALUES (240, 1, 20, 12, 25000.00, 25000.00);
INSERT INTO public.monthly_budgets VALUES (6, 1, 1, 6, 3918.00, 3542.00);
INSERT INTO public.monthly_budgets VALUES (66, 1, 6, 6, 1250.00, 850.00);
INSERT INTO public.monthly_budgets VALUES (243, 1, 21, 3, 12500.00, 12500.00);
INSERT INTO public.monthly_budgets VALUES (244, 1, 21, 4, 12500.00, 12500.00);
INSERT INTO public.monthly_budgets VALUES (245, 1, 21, 5, 12500.00, 12500.00);
INSERT INTO public.monthly_budgets VALUES (247, 1, 21, 7, 12500.00, 12500.00);
INSERT INTO public.monthly_budgets VALUES (248, 1, 21, 8, 12500.00, 12500.00);
INSERT INTO public.monthly_budgets VALUES (249, 1, 21, 9, 12500.00, 12500.00);
INSERT INTO public.monthly_budgets VALUES (250, 1, 21, 10, 12500.00, 12500.00);
INSERT INTO public.monthly_budgets VALUES (251, 1, 21, 11, 12500.00, 12500.00);
INSERT INTO public.monthly_budgets VALUES (252, 1, 21, 12, 12500.00, 12500.00);
INSERT INTO public.monthly_budgets VALUES (162, 1, 14, 6, 9852.67, 17671.00);
INSERT INTO public.monthly_budgets VALUES (174, 1, 15, 6, 1779.33, 16245.00);
INSERT INTO public.monthly_budgets VALUES (186, 1, 16, 6, 16666.67, 4408.00);
INSERT INTO public.monthly_budgets VALUES (210, 1, 18, 6, 50000.00, 31642.00);
INSERT INTO public.monthly_budgets VALUES (150, 1, 13, 6, 2688.67, 2500.00);
INSERT INTO public.monthly_budgets VALUES (138, 1, 12, 6, 250.00, 522.00);
INSERT INTO public.monthly_budgets VALUES (255, 1, 22, 3, 1513.33, 1513.33);
INSERT INTO public.monthly_budgets VALUES (256, 1, 22, 4, 1513.33, 1513.33);
INSERT INTO public.monthly_budgets VALUES (257, 1, 22, 5, 1513.33, 1513.33);
INSERT INTO public.monthly_budgets VALUES (259, 1, 22, 7, 1513.33, 1513.33);
INSERT INTO public.monthly_budgets VALUES (260, 1, 22, 8, 1513.33, 1513.33);
INSERT INTO public.monthly_budgets VALUES (261, 1, 22, 9, 1513.33, 1513.33);
INSERT INTO public.monthly_budgets VALUES (262, 1, 22, 10, 1513.33, 1513.33);
INSERT INTO public.monthly_budgets VALUES (263, 1, 22, 11, 1513.33, 1513.33);
INSERT INTO public.monthly_budgets VALUES (264, 1, 22, 12, 1513.33, 1513.33);
INSERT INTO public.monthly_budgets VALUES (258, 1, 22, 6, 1513.33, 18160.00);
INSERT INTO public.monthly_budgets VALUES (234, 1, 20, 6, 25000.00, 0.00);
INSERT INTO public.monthly_budgets VALUES (222, 1, 19, 6, 75000.00, 90000.00);
INSERT INTO public.monthly_budgets VALUES (246, 1, 21, 6, 12500.00, 21428.00);
INSERT INTO public.monthly_budgets VALUES (253, 1, 22, 1, 1513.33, 0.00);
INSERT INTO public.monthly_budgets VALUES (267, 1, 23, 3, 1389.67, 1389.67);
INSERT INTO public.monthly_budgets VALUES (241, 1, 21, 1, 12500.00, 0.00);
INSERT INTO public.monthly_budgets VALUES (157, 1, 14, 1, 9852.67, 21637.00);
INSERT INTO public.monthly_budgets VALUES (169, 1, 15, 1, 1779.33, 2000.00);
INSERT INTO public.monthly_budgets VALUES (181, 1, 16, 1, 16666.67, 8300.00);
INSERT INTO public.monthly_budgets VALUES (205, 1, 18, 1, 50000.00, 27000.00);
INSERT INTO public.monthly_budgets VALUES (229, 1, 20, 1, 25000.00, 0.00);
INSERT INTO public.monthly_budgets VALUES (254, 1, 22, 2, 1513.33, 0.00);
INSERT INTO public.monthly_budgets VALUES (266, 1, 23, 2, 1389.67, 0.00);
INSERT INTO public.monthly_budgets VALUES (242, 1, 21, 2, 12500.00, 0.00);
INSERT INTO public.monthly_budgets VALUES (146, 1, 13, 2, 2688.67, 2540.00);
INSERT INTO public.monthly_budgets VALUES (218, 1, 19, 2, 75000.00, 77000.00);
INSERT INTO public.monthly_budgets VALUES (230, 1, 20, 2, 25000.00, 6000.00);
INSERT INTO public.monthly_budgets VALUES (158, 1, 14, 2, 9852.67, 27000.00);
INSERT INTO public.monthly_budgets VALUES (170, 1, 15, 2, 1779.33, 1295.00);
INSERT INTO public.monthly_budgets VALUES (182, 1, 16, 2, 16666.67, 3800.00);
INSERT INTO public.monthly_budgets VALUES (268, 1, 23, 4, 1389.67, 1389.67);
INSERT INTO public.monthly_budgets VALUES (269, 1, 23, 5, 1389.67, 1389.67);
INSERT INTO public.monthly_budgets VALUES (270, 1, 23, 6, 1389.67, 1389.67);
INSERT INTO public.monthly_budgets VALUES (271, 1, 23, 7, 1389.67, 1389.67);
INSERT INTO public.monthly_budgets VALUES (272, 1, 23, 8, 1389.67, 1389.67);
INSERT INTO public.monthly_budgets VALUES (273, 1, 23, 9, 1389.67, 1389.67);
INSERT INTO public.monthly_budgets VALUES (274, 1, 23, 10, 1389.67, 1389.67);
INSERT INTO public.monthly_budgets VALUES (275, 1, 23, 11, 1389.67, 1389.67);
INSERT INTO public.monthly_budgets VALUES (276, 1, 23, 12, 1389.67, 1389.67);
INSERT INTO public.monthly_budgets VALUES (145, 1, 13, 1, 2688.67, 3393.00);
INSERT INTO public.monthly_budgets VALUES (265, 1, 23, 1, 1389.67, 16676.00);
INSERT INTO public.monthly_budgets VALUES (50, 1, 5, 2, 7083.33, 6458.00);


--
-- Data for Name: monthly_settings; Type: TABLE DATA; Schema: public; Owner: budget
--



--
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: budget
--

INSERT INTO public.transactions VALUES (1, 1, 1, 1, '2026-06-01', 2759.00, NULL, '2026-06-23 11:42:41.272726+00');
INSERT INTO public.transactions VALUES (2, 1, 1, 3, '2026-06-01', 2720.00, NULL, '2026-06-23 11:43:27.809276+00');
INSERT INTO public.transactions VALUES (3, 1, 1, 4, '2026-06-01', 1448.00, NULL, '2026-06-23 11:43:41.271858+00');
INSERT INTO public.transactions VALUES (4, 1, 1, 6, '2026-06-01', 250.00, NULL, '2026-06-23 11:44:20.120654+00');
INSERT INTO public.transactions VALUES (5, 1, 1, 8, '2026-06-01', 1236.00, NULL, '2026-06-23 11:44:39.159853+00');
INSERT INTO public.transactions VALUES (6, 1, 1, 9, '2026-06-01', 4706.00, NULL, '2026-06-23 11:45:06.865823+00');
INSERT INTO public.transactions VALUES (7, 1, 1, 14, '2026-06-01', 17671.00, NULL, '2026-06-23 11:46:25.329431+00');
INSERT INTO public.transactions VALUES (8, 1, 1, 15, '2026-06-01', 16245.00, NULL, '2026-06-23 11:46:46.104477+00');
INSERT INTO public.transactions VALUES (9, 1, 1, 16, '2026-06-01', 4408.00, NULL, '2026-06-23 11:47:03.594267+00');
INSERT INTO public.transactions VALUES (10, 1, 1, 17, '2026-06-01', 1606.00, NULL, '2026-06-23 11:47:16.686695+00');
INSERT INTO public.transactions VALUES (12, 1, 1, 12, '2026-06-01', 522.00, NULL, '2026-06-23 11:48:12.612829+00');
INSERT INTO public.transactions VALUES (13, 1, 1, 11, '2026-06-01', 9111.00, NULL, '2026-06-23 11:48:22.3524+00');
INSERT INTO public.transactions VALUES (14, 1, 1, 10, '2026-06-01', 3000.00, NULL, '2026-06-23 11:48:37.117683+00');
INSERT INTO public.transactions VALUES (15, 1, 1, 22, '2026-06-01', 18160.00, NULL, '2026-06-23 11:49:41.186084+00');
INSERT INTO public.transactions VALUES (16, 1, 1, 3, '2026-01-01', 4000.00, NULL, '2026-06-23 11:53:03.942005+00');
INSERT INTO public.transactions VALUES (17, 1, 1, 4, '2026-01-01', 3797.00, NULL, '2026-06-23 11:53:28.563635+00');
INSERT INTO public.transactions VALUES (18, 1, 1, 5, '2026-01-01', 5500.00, NULL, '2026-06-23 11:53:40.485872+00');
INSERT INTO public.transactions VALUES (19, 1, 1, 23, '2026-01-01', 16676.00, NULL, '2026-06-23 11:54:51.355626+00');
INSERT INTO public.transactions VALUES (20, 1, 1, 9, '2026-01-01', 19410.00, NULL, '2026-06-23 11:56:16.221487+00');
INSERT INTO public.transactions VALUES (21, 1, 1, 10, '2026-01-01', 2000.00, NULL, '2026-06-23 11:56:27.249771+00');
INSERT INTO public.transactions VALUES (22, 1, 1, 11, '2026-01-01', 14861.00, NULL, '2026-06-23 11:56:41.133875+00');
INSERT INTO public.transactions VALUES (23, 1, 1, 14, '2026-01-01', 21637.00, NULL, '2026-06-23 11:57:54.595439+00');
INSERT INTO public.transactions VALUES (24, 1, 1, 13, '2026-01-01', 3393.00, NULL, '2026-06-23 11:58:23.155515+00');
INSERT INTO public.transactions VALUES (25, 1, 1, 15, '2026-01-01', 2000.00, NULL, '2026-06-23 11:58:36.263877+00');
INSERT INTO public.transactions VALUES (26, 1, 1, 16, '2026-01-01', 8300.00, NULL, '2026-06-23 11:58:47.926237+00');
INSERT INTO public.transactions VALUES (27, 1, 1, 17, '2026-01-01', 3120.00, NULL, '2026-06-23 11:58:57.765669+00');
INSERT INTO public.transactions VALUES (28, 1, 1, 1, '2026-02-01', 7000.00, NULL, '2026-06-23 12:01:03.761831+00');
INSERT INTO public.transactions VALUES (29, 1, 1, 4, '2026-02-01', 649.00, NULL, '2026-06-23 12:02:13.58841+00');
INSERT INTO public.transactions VALUES (30, 1, 1, 5, '2026-02-01', 6458.00, NULL, '2026-06-23 12:02:29.35862+00');
INSERT INTO public.transactions VALUES (31, 1, 1, 4, '2026-02-01', 700.00, 'Copilot', '2026-06-23 12:03:25.861602+00');
INSERT INTO public.transactions VALUES (32, 1, 1, 8, '2026-02-01', 1116.00, NULL, '2026-06-23 12:03:42.760756+00');
INSERT INTO public.transactions VALUES (33, 1, 1, 9, '2026-02-01', 7200.00, NULL, '2026-06-23 12:04:21.215368+00');
INSERT INTO public.transactions VALUES (34, 1, 1, 11, '2026-02-01', 10835.00, NULL, '2026-06-23 12:04:56.23796+00');
INSERT INTO public.transactions VALUES (36, 1, 1, 13, '2026-02-01', 2540.00, NULL, '2026-06-23 12:05:18.281831+00');
INSERT INTO public.transactions VALUES (39, 1, 1, 14, '2026-02-01', 27000.00, NULL, '2026-06-23 12:06:11.707843+00');
INSERT INTO public.transactions VALUES (40, 1, 1, 16, '2026-02-01', 3800.00, NULL, '2026-06-23 12:06:29.236706+00');
INSERT INTO public.transactions VALUES (41, 1, 1, 17, '2026-02-01', 1348.00, NULL, '2026-06-23 12:06:39.582817+00');


--
-- Name: annual_budgets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: budget
--

SELECT pg_catalog.setval('public.annual_budgets_id_seq', 23, true);


--
-- Name: budget_years_id_seq; Type: SEQUENCE SET; Schema: public; Owner: budget
--

SELECT pg_catalog.setval('public.budget_years_id_seq', 1, true);


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: budget
--

SELECT pg_catalog.setval('public.categories_id_seq', 4, true);


--
-- Name: incomes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: budget
--

SELECT pg_catalog.setval('public.incomes_id_seq', 3, true);


--
-- Name: monthly_budgets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: budget
--

SELECT pg_catalog.setval('public.monthly_budgets_id_seq', 276, true);


--
-- Name: monthly_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: budget
--

SELECT pg_catalog.setval('public.monthly_settings_id_seq', 1, false);


--
-- Name: subcategories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: budget
--

SELECT pg_catalog.setval('public.subcategories_id_seq', 23, true);


--
-- Name: transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: budget
--

SELECT pg_catalog.setval('public.transactions_id_seq', 41, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: budget
--

SELECT pg_catalog.setval('public.users_id_seq', 1, true);


--
-- PostgreSQL database dump complete
--

\unrestrict UinWrVfxVKuaaahqT7imfY2gtvS2BeLoRQ2IWqUz4o1Ujtlz5iZa3uY5fenj2ZH

