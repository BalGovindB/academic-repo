-- =====================================================================
-- 02_seed.sql : sample data (all names, titles, DOIs, ISSNs are FICTIONAL)
-- Papers 1-6 are the six papers shown in the current UI.
-- 10.5555 is the DOI prefix reserved for test/demo use.
-- Designed to show: zero-journal publisher, zero-paper journal,
-- zero-paper author, zero-paper subject, a paper with no subject,
-- papers with several authors/subjects, NULL doi/affiliation,
-- and a 4-step citation chain (1 -> 5 -> 7 -> 14 -> 19).
-- Run AFTER 01_schema.sql.
-- =====================================================================
BEGIN;

INSERT INTO publisher (publisher_id, name) VALUES
 (1,'Meridian Academic Press'),
 (2,'Northbridge Scholarly Publishing'),
 (3,'Helix Open Science'),
 (4,'Cobalt University Press'),
 (5,'Lumen Humanities Group'),
 (6,'Atlas Independent Press');            -- publishes no journal yet

INSERT INTO journal (journal_id, name, issn, publisher_id) VALUES
 (1,'Computational Methods',        '2041-1006', 1),
 (2,'Environmental Systems',        '2052-3417', 3),
 (3,'Journal of Human Systems',     '1945-2208', 2),
 (4,'Research Practice Review',     '2189-7710', 4),
 (5,'Digital Humanities Quarterly', '1938-4122', 5),
 (6,'Applied Data Science',         '2310-5586', 1),
 (7,'Educational Futures',          '2415-9023', 4),
 (8,'Quantitative Social Review',   '2670-114X', 2);   -- carries no paper yet

INSERT INTO author (author_id, name, affiliation) VALUES
 (1,'Maya Chen',     'Northbridge Institute of Technology'),
 (2,'Liam Patel',    'Cobalt University'),
 (3,'Sofia Alvarez', 'Helix Research Centre'),
 (4,'Noah Williams', 'Cobalt University'),
 (5,'Amina Okafor',  'Lumen College'),
 (6,'Priya Raman',   'Northbridge Institute of Technology'),
 (7,'Daniel Brooks', 'Meridian Labs'),
 (8,'Elena Rossi',   'Helix Research Centre'),
 (9,'Kenji Sato',    'Cobalt University'),
 (10,'Fatima Noor',  NULL),                        -- affiliation unknown
 (11,'Tomas Novak',  'Atlas Institute');           -- has written no paper yet

INSERT INTO subject (subject_id, name) VALUES
 (1,'Computer Science'),
 (2,'Environmental Science'),
 (3,'Psychology'),
 (4,'Education'),
 (5,'Mathematics'),
 (6,'Humanities'),
 (7,'Public Policy'),
 (8,'Data Science'),
 (9,'Neuroscience');                              -- classifies no paper yet

INSERT INTO paper (paper_id, title, pub_year, doi, abstract, journal_id) VALUES
 (1,'Transparent methods for reproducible machine learning',2024,'10.5555/arm.2024.0001','A practical framework for reporting data, evaluation, and model decisions.',1),
 (2,'Urban heat islands and equitable cooling policy',2024,'10.5555/arm.2024.0002','An analysis of neighborhood-level heat exposure and public cooling access.',2),
 (3,'Trust calibration in human-AI decision support',2023,'10.5555/arm.2023.0003','How interface explanations change appropriate reliance on automated advice.',3),
 (4,'Open scholarship practices across early-career labs',2023,'10.5555/arm.2023.0004','A mixed-methods study of barriers and incentives for open research.',4),
 (5,'Network models of interdisciplinary collaboration',2022,'10.5555/arm.2022.0005','Graph measures that reveal durable cross-field research partnerships.',1),
 (6,'Community archives as living digital infrastructure',2022,'10.5555/arm.2022.0006','Design principles for participatory, sustainable digital archives.',5),
 (7,'Graph embeddings for scholarly citation networks',2021,'10.5555/arm.2021.0007','Learning vector representations of papers from citation structure.',1),
 (8,'Sampling bias in bibliometric datasets',2021,'10.5555/arm.2021.0008','How database coverage skews citation-based research metrics.',6),
 (9,'Reproducibility checklists in applied statistics',2020,'10.5555/arm.2020.0009','Do reporting checklists improve the replicability of published analyses?',4),
 (10,'Heat exposure mapping with satellite imagery',2021,'10.5555/arm.2021.0010','Estimating street-level temperature from remote-sensing data.',2),
 (11,'Explainable interfaces for clinical decision support',2022,'10.5555/arm.2022.0011','Evaluating explanation styles with practising clinicians.',3),
 (12,'Digitising oral history collections',2020,NULL,'Workflows for transcribing and cataloguing community recordings.',5),
 (13,'Peer review turnaround and journal prestige',2019,'10.5555/arm.2019.0013','Is slower peer review associated with higher-ranked journals?',4),
 (14,'Scalable algorithms for community detection',2019,'10.5555/arm.2019.0014','Near-linear-time clustering methods for large graphs.',1),
 (15,'Urban green space and thermal comfort',2019,'10.5555/arm.2019.0015','Measuring the cooling effect of parks in dense neighbourhoods.',2),
 (16,'Cognitive load in automated advice systems',2020,'10.5555/arm.2020.0016','Experiments on mental effort when following algorithmic recommendations.',3),
 (17,'Metadata standards for open research data',2018,NULL,'A survey of schemas used to describe shared datasets.',6),
 (18,'Learning analytics for first-year undergraduates',2021,'10.5555/arm.2021.0018','Early-warning indicators drawn from course-platform activity.',7),
 (19,'Statistical foundations of network sampling',2018,'10.5555/arm.2018.0019','Estimators for properties of partially observed graphs.',1),
 (20,'Heatwave mortality and neighbourhood inequality',2022,'10.5555/arm.2022.0020','Linking excess deaths to housing quality and income.',2),
 (21,'Language models for bibliographic record matching',2023,'10.5555/arm.2023.0021','Resolving duplicate references across metadata sources.',6),
 (22,'Archival description and linked open data',2021,'10.5555/arm.2021.0022','Publishing finding aids as interoperable linked data.',5),
 (23,'Student engagement and open educational resources',2022,'10.5555/arm.2022.0023','Does free course material change how students participate?',7),
 (24,'Typographical errors in academic search queries',2023,'10.5555/arm.2023.0024','How often researchers misspell titles and what search engines do.',6);

-- (paper_id, author_id, author_order)
INSERT INTO paper_author (paper_id, author_id, author_order) VALUES
 (1,1,1),(1,2,2),
 (2,3,1),(2,4,2),
 (3,2,1),(3,5,2),
 (4,1,1),(4,3,2),
 (5,4,1),(5,5,2),
 (6,5,1),
 (7,6,1),(7,1,2),(7,4,3),
 (8,7,1),(8,6,2),
 (9,9,1),(9,7,2),
 (10,8,1),(10,3,2),
 (11,2,1),(11,10,2),
 (12,5,1),(12,8,2),
 (13,7,1),
 (14,4,1),(14,6,2),(14,9,3),
 (15,8,1),(15,3,2),
 (16,10,1),(16,2,2),
 (17,7,1),(17,9,2),
 (18,1,1),(18,10,2),
 (19,4,1),(19,9,2),
 (20,3,1),(20,8,2),(20,4,3),
 (21,6,1),(21,7,2),(21,1,3),
 (22,5,1),(22,9,2),
 (23,1,1),(23,10,2),
 (24,6,1),(24,9,2);

-- Paper 19 deliberately has NO subject.
INSERT INTO paper_subject (paper_id, subject_id) VALUES
 (1,1),(1,8),
 (2,2),(2,7),
 (3,3),(3,1),
 (4,4),(4,7),
 (5,5),(5,1),
 (6,6),(6,1),
 (7,1),(7,5),(7,8),
 (8,8),(8,5),
 (9,4),(9,5),
 (10,2),(10,8),
 (11,3),(11,1),
 (12,6),
 (13,4),(13,7),
 (14,1),(14,5),
 (15,2),
 (16,3),
 (17,6),(17,8),
 (18,4),(18,8),
 (20,2),(20,7),
 (21,1),(21,8),
 (22,6),(22,1),
 (23,4),
 (24,1),(24,8);

-- (citing_paper_id, cited_paper_id): cited paper is always from an EARLIER year.
INSERT INTO citation (citing_paper_id, cited_paper_id) VALUES
 (1,5),(1,7),(1,14),(1,9),(1,21),(1,19),
 (2,20),(2,10),(2,15),
 (3,11),(3,16),(3,5),
 (4,9),(4,13),(4,23),(4,17),
 (21,8),(21,7),(21,17),
 (24,8),(24,17),(24,5),
 (5,7),(5,14),(5,19),
 (6,12),(6,22),(6,17),
 (11,16),
 (20,10),(20,15),
 (23,18),(23,13),
 (7,14),(7,19),
 (8,17),(8,13),
 (10,15),
 (18,13),
 (22,12),(22,17),
 (9,13),
 (12,17),
 (14,19),
 (13,17);

-- identity columns were given explicit ids: move the sequences past them
SELECT setval(pg_get_serial_sequence('publisher','publisher_id'), (SELECT max(publisher_id) FROM publisher));
SELECT setval(pg_get_serial_sequence('journal','journal_id'),     (SELECT max(journal_id)   FROM journal));
SELECT setval(pg_get_serial_sequence('author','author_id'),       (SELECT max(author_id)    FROM author));
SELECT setval(pg_get_serial_sequence('subject','subject_id'),     (SELECT max(subject_id)   FROM subject));
SELECT setval(pg_get_serial_sequence('paper','paper_id'),         (SELECT max(paper_id)     FROM paper));

COMMIT;

-- Row counts (verified): publisher 6, journal 8, author 11, subject 9,
-- paper 24, paper_author 50, paper_subject 43, citation 45
SELECT 'publisher' AS tbl, count(*) FROM publisher UNION ALL
SELECT 'journal',       count(*) FROM journal       UNION ALL
SELECT 'author',        count(*) FROM author        UNION ALL
SELECT 'subject',       count(*) FROM subject       UNION ALL
SELECT 'paper',         count(*) FROM paper         UNION ALL
SELECT 'paper_author',  count(*) FROM paper_author  UNION ALL
SELECT 'paper_subject', count(*) FROM paper_subject UNION ALL
SELECT 'citation',      count(*) FROM citation;
