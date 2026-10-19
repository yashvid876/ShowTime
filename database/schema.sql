-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: showtime
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `booking_seats`
--

DROP TABLE IF EXISTS `booking_seats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `booking_seats` (
  `booking_id` bigint unsigned NOT NULL,
  `show_seat_id` bigint unsigned NOT NULL,
  `price` decimal(10,2) unsigned NOT NULL,
  `active_show_seat_id` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`booking_id`,`show_seat_id`),
  UNIQUE KEY `uq_booking_active_show_seat` (`active_show_seat_id`),
  KEY `ix_booking_seats_show_seat_id` (`show_seat_id`),
  CONSTRAINT `fk_booking_seats_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`booking_id`),
  CONSTRAINT `fk_booking_seats_inventory` FOREIGN KEY (`show_seat_id`) REFERENCES `show_seats` (`show_seat_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `booking_seats`
--

LOCK TABLES `booking_seats` WRITE;
/*!40000 ALTER TABLE `booking_seats` DISABLE KEYS */;
INSERT INTO `booking_seats` VALUES (1,1,250.00,NULL),(3,2,250.00,2),(4,4,250.00,NULL),(4,5,250.00,NULL),(8,3,250.00,NULL),(15,6,250.00,NULL),(16,7,250.00,NULL),(18,5,250.00,NULL),(19,16,250.00,NULL),(20,16,250.00,NULL),(20,17,250.00,NULL),(20,18,250.00,NULL),(20,19,250.00,NULL),(20,20,250.00,NULL),(20,21,250.00,NULL),(20,22,250.00,NULL),(20,23,250.00,NULL),(20,24,250.00,NULL),(20,25,250.00,NULL),(22,3,250.00,NULL),(24,1,250.00,NULL),(25,1,250.00,1),(26,19,250.00,19),(27,21,250.00,21),(28,100,600.00,100),(28,101,600.00,101);
/*!40000 ALTER TABLE `booking_seats` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bookings`
--

DROP TABLE IF EXISTS `bookings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bookings` (
  `booking_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `show_id` bigint unsigned NOT NULL,
  `total_amount` decimal(10,2) unsigned NOT NULL,
  `status` enum('pending','confirmed','failed','cancelled') NOT NULL DEFAULT 'pending',
  `stripe_session_id` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `ticket_token_hash` char(64) DEFAULT NULL,
  `checked_in_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`booking_id`),
  UNIQUE KEY `stripe_session_id` (`stripe_session_id`),
  KEY `fk_bookings_user` (`user_id`),
  KEY `fk_bookings_show` (`show_id`),
  CONSTRAINT `fk_bookings_show` FOREIGN KEY (`show_id`) REFERENCES `shows` (`show_id`),
  CONSTRAINT `fk_bookings_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bookings`
--

LOCK TABLES `bookings` WRITE;
/*!40000 ALTER TABLE `bookings` DISABLE KEYS */;
INSERT INTO `bookings` VALUES (1,3,1,250.00,'cancelled','order_TmfnpOIwvaQ8S4','2026-10-11 16:50:50','2026-10-12 08:20:14',NULL,NULL),(3,4,1,250.00,'pending','order_Tmg9xizo220Uye','2026-10-11 17:11:48','2026-10-11 17:11:48',NULL,NULL),(4,6,1,500.00,'cancelled','order_TmrpQ3d9PMgfBE','2026-10-12 04:36:40','2026-10-12 04:37:06',NULL,NULL),(8,3,1,250.00,'cancelled','order_TmsYJIyJ79AkG8','2026-10-12 05:19:10','2026-10-12 05:20:27',NULL,NULL),(15,3,1,250.00,'cancelled','order_TmvcCxWTyeaiAb','2026-10-12 08:18:57','2026-10-12 08:19:26',NULL,NULL),(16,3,1,250.00,'cancelled','order_Tmvoh9cYAquvbK','2026-10-12 08:30:46','2026-10-12 08:30:51',NULL,NULL),(18,3,1,250.00,'cancelled','order_Tmw4LpuycM5ta4','2026-10-12 08:45:35','2026-10-12 08:45:38',NULL,NULL),(19,3,1,250.00,'cancelled','order_Tmwk5j2Q4NNbGQ','2026-10-12 09:25:06','2026-10-12 09:25:14',NULL,NULL),(20,3,1,2500.00,'cancelled','order_TmwnXIu1babWsU','2026-10-12 09:28:22','2026-10-12 09:30:09',NULL,NULL),(22,3,1,250.00,'cancelled','order_Tmxr1t5aPa8f8h','2026-10-12 10:30:21','2026-10-12 10:33:48',NULL,NULL),(24,3,1,250.00,'cancelled','order_TmxuKYPjAZbArQ','2026-10-12 10:33:29','2026-10-12 10:33:43',NULL,NULL),(25,3,1,250.00,'pending','order_Tmxv9xg0MmjusD','2026-10-12 10:34:16','2026-10-12 10:34:16',NULL,NULL),(26,3,1,250.00,'confirmed','order_TmxyLUjO46jAql','2026-10-12 10:37:17','2026-10-12 10:38:11',NULL,NULL),(27,3,1,250.00,'pending','order_Tmxzt6oDt1f96F','2026-10-12 10:38:44','2026-10-12 10:38:44',NULL,NULL),(28,3,3,1200.00,'confirmed','order_TnfMmEzD32hVPO','2026-10-14 05:04:14','2026-10-14 05:04:40',NULL,NULL);
/*!40000 ALTER TABLE `bookings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `movies`
--

DROP TABLE IF EXISTS `movies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `movies` (
  `movie_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL,
  `description` text,
  `duration_minutes` smallint unsigned NOT NULL,
  `language` varchar(50) NOT NULL,
  `release_date` date DEFAULT NULL,
  `genre` varchar(100) NOT NULL,
  `poster_url` varchar(500) DEFAULT NULL,
  `status` enum('upcoming','now_showing','ended') NOT NULL DEFAULT 'upcoming',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`movie_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `movies`
--

LOCK TABLES `movies` WRITE;
/*!40000 ALTER TABLE `movies` DISABLE KEYS */;
INSERT INTO `movies` VALUES (1,'Interstellar','A team of explorers travels through a wormhole to find a new home for humanity.',169,'English','2014-11-05','Sci-Fi','https://m.media-amazon.com/images/M/MV5BYzdjMDAxZGItMjI2My00ODA1LTlkNzItOWFjMDU5ZDJlYWY3XkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg','now_showing','2026-10-11 13:56:46','2026-10-12 04:42:11'),(2,'Lagaan',NULL,160,'Hindi','2027-10-27','Sports, History','https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcTnNILjl9pie7DMlQHJ_Cr3AIIM0fuEvQN2ixs0unJMo623JIbC','upcoming','2026-10-12 04:40:12','2026-10-12 04:40:12'),(3,'Drishyam 3',NULL,180,'Hindi','2026-10-02','Suspense, Thriller','https://thumb.wikimedia.org/wikipedia/en/thumb/d/d9/Drishyam-_The_Conclusion_poster.jpg/250px-Drishyam-_The_Conclusion_poster.jpg?utm_source=en.wikipedia.org&utm_campaign=parser&utm_content=thumbnail','now_showing','2026-10-12 05:17:51','2026-10-12 05:17:51');
/*!40000 ALTER TABLE `movies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `refresh_sessions`
--

DROP TABLE IF EXISTS `refresh_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `refresh_sessions` (
  `session_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `token_hash` char(64) NOT NULL,
  `expires_at` timestamp NOT NULL,
  `revoked_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`session_id`),
  UNIQUE KEY `token_hash` (`token_hash`),
  KEY `fk_refresh_sessions_user` (`user_id`),
  CONSTRAINT `fk_refresh_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `refresh_sessions`
--

LOCK TABLES `refresh_sessions` WRITE;
/*!40000 ALTER TABLE `refresh_sessions` DISABLE KEYS */;
INSERT INTO `refresh_sessions` VALUES (1,3,'beae70e0ac0287f74edf6a11e8382b42034e51d4088b1d016895b1c49dfb6f93','2026-10-18 17:05:57',NULL,'2026-10-11 13:42:14'),(2,5,'d566e06bc56da9320d53158c305de89b3c73823a1b0f4588de47a681cc0b218e','2026-10-19 04:20:26',NULL,'2026-10-12 04:20:26'),(3,3,'b97b434acecefcc52b6b6a0e6d00600e975bb65ae19627aab7c06bd701dd0132','2026-10-19 04:22:10',NULL,'2026-10-12 04:22:10'),(4,6,'e03d1710c676c2182c3cbcf8c5014fbc7f973aad9da48871b94c737bb2a1d5ad','2026-10-19 04:29:33','2026-10-12 04:29:35','2026-10-12 04:29:33'),(5,6,'4dc7a3040be2bf97d44f23a0501e1ea087c2a772d1484c7110af066202c6b9e2','2026-10-19 04:36:16','2026-10-12 04:37:50','2026-10-12 04:29:54'),(6,3,'0d741fc1ee36791ae746830bcf03ec15ca79af76d4ad8c6bee4f2e08d426a2a8','2026-10-19 04:37:57',NULL,'2026-10-12 04:37:56'),(7,3,'165d14d9ba42af997265c79ca7ebcdc9be5502b49476bd216f588fbcafbc490e','2026-10-21 04:48:37',NULL,'2026-10-12 08:01:20'),(8,3,'7bcb3d77f9a0e7da35f087c18b01acdbf33bfcbf901fcc9195f3378b09cb9b16','2026-10-21 05:04:10',NULL,'2026-10-14 04:51:09');
/*!40000 ALTER TABLE `refresh_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `screens`
--

DROP TABLE IF EXISTS `screens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `screens` (
  `screen_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `theatre_id` bigint unsigned NOT NULL,
  `name` varchar(100) NOT NULL,
  `total_seats` int unsigned NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`screen_id`),
  UNIQUE KEY `uq_screen_name` (`theatre_id`,`name`),
  CONSTRAINT `fk_screens_theatre` FOREIGN KEY (`theatre_id`) REFERENCES `theatres` (`theatre_id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `screens`
--

LOCK TABLES `screens` WRITE;
/*!40000 ALTER TABLE `screens` DISABLE KEYS */;
INSERT INTO `screens` VALUES (1,1,'Screen 1',35,'2026-10-11 13:50:37','2026-10-12 10:45:05');
/*!40000 ALTER TABLE `screens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `seats`
--

DROP TABLE IF EXISTS `seats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `seats` (
  `seat_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `screen_id` bigint unsigned NOT NULL,
  `row_label` varchar(5) NOT NULL,
  `seat_number` smallint unsigned NOT NULL,
  `seat_type` enum('regular','premium','recliner') NOT NULL DEFAULT 'regular',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`seat_id`),
  UNIQUE KEY `uq_screen_seat` (`screen_id`,`row_label`,`seat_number`),
  CONSTRAINT `fk_seats_screen` FOREIGN KEY (`screen_id`) REFERENCES `screens` (`screen_id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=47 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `seats`
--

LOCK TABLES `seats` WRITE;
/*!40000 ALTER TABLE `seats` DISABLE KEYS */;
INSERT INTO `seats` VALUES (1,1,'A',1,'regular',1),(2,1,'A',2,'regular',1),(3,1,'A',3,'premium',1),(4,1,'B',1,'regular',1),(5,1,'B',2,'recliner',1),(7,1,'E',1,'regular',1),(8,1,'E',2,'regular',1),(9,1,'E',3,'regular',1),(10,1,'E',4,'regular',1),(11,1,'E',5,'regular',1),(12,1,'E',6,'regular',1),(13,1,'E',7,'regular',1),(14,1,'E',8,'regular',1),(15,1,'E',9,'regular',1),(16,1,'E',10,'regular',1),(17,1,'F',1,'regular',0),(18,1,'F',2,'regular',0),(19,1,'F',3,'regular',0),(20,1,'F',4,'regular',0),(21,1,'F',5,'regular',0),(22,1,'F',6,'regular',0),(23,1,'F',7,'regular',0),(24,1,'F',8,'regular',0),(25,1,'F',9,'regular',0),(26,1,'F',10,'regular',0),(27,1,'C',1,'regular',1),(28,1,'C',2,'regular',1),(29,1,'C',3,'regular',1),(30,1,'C',4,'regular',1),(31,1,'C',5,'regular',1),(32,1,'C',6,'regular',1),(33,1,'C',7,'regular',1),(34,1,'C',8,'regular',1),(35,1,'C',9,'regular',1),(36,1,'C',10,'regular',1),(37,1,'G',1,'regular',1),(38,1,'G',2,'regular',1),(39,1,'G',3,'regular',1),(40,1,'G',4,'regular',1),(41,1,'G',5,'regular',1),(42,1,'G',6,'regular',1),(43,1,'G',7,'regular',1),(44,1,'G',8,'regular',1),(45,1,'G',9,'regular',1),(46,1,'G',10,'regular',1);
/*!40000 ALTER TABLE `seats` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `show_seats`
--

DROP TABLE IF EXISTS `show_seats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `show_seats` (
  `show_seat_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `show_id` bigint unsigned NOT NULL,
  `seat_id` bigint unsigned NOT NULL,
  `status` enum('available','booked') NOT NULL DEFAULT 'available',
  `price` decimal(10,2) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`show_seat_id`),
  UNIQUE KEY `uq_show_seat` (`show_id`,`seat_id`),
  KEY `fk_show_seats_seat` (`seat_id`),
  CONSTRAINT `fk_show_seats_seat` FOREIGN KEY (`seat_id`) REFERENCES `seats` (`seat_id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_show_seats_show` FOREIGN KEY (`show_id`) REFERENCES `shows` (`show_id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=106 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `show_seats`
--

LOCK TABLES `show_seats` WRITE;
/*!40000 ALTER TABLE `show_seats` DISABLE KEYS */;
INSERT INTO `show_seats` VALUES (1,1,1,'available',250.00,'2026-10-11 16:31:55','2026-10-11 16:31:55'),(2,1,2,'available',250.00,'2026-10-11 16:31:55','2026-10-11 16:31:55'),(3,1,3,'available',250.00,'2026-10-11 16:31:55','2026-10-11 16:31:55'),(4,1,4,'available',250.00,'2026-10-11 16:31:55','2026-10-11 16:31:55'),(5,1,5,'available',250.00,'2026-10-11 16:31:55','2026-10-11 16:31:55'),(6,1,17,'available',250.00,'2026-10-12 08:18:39','2026-10-12 08:18:39'),(7,1,18,'available',250.00,'2026-10-12 08:18:39','2026-10-12 08:18:39'),(8,1,19,'available',250.00,'2026-10-12 08:18:39','2026-10-12 08:18:39'),(9,1,20,'available',250.00,'2026-10-12 08:18:39','2026-10-12 08:18:39'),(10,1,21,'available',250.00,'2026-10-12 08:18:39','2026-10-12 08:18:39'),(11,1,22,'available',250.00,'2026-10-12 08:18:39','2026-10-12 08:18:39'),(12,1,23,'available',250.00,'2026-10-12 08:18:39','2026-10-12 08:18:39'),(13,1,24,'available',250.00,'2026-10-12 08:18:39','2026-10-12 08:18:39'),(14,1,25,'available',250.00,'2026-10-12 08:18:39','2026-10-12 08:18:39'),(15,1,26,'available',250.00,'2026-10-12 08:18:39','2026-10-12 08:18:39'),(16,1,27,'available',250.00,'2026-10-12 09:24:10','2026-10-12 09:24:10'),(17,1,28,'available',250.00,'2026-10-12 09:24:10','2026-10-12 09:24:10'),(18,1,29,'available',250.00,'2026-10-12 09:24:10','2026-10-12 09:24:10'),(19,1,30,'booked',250.00,'2026-10-12 09:24:10','2026-10-12 10:38:11'),(20,1,31,'available',250.00,'2026-10-12 09:24:10','2026-10-12 09:24:10'),(21,1,32,'available',250.00,'2026-10-12 09:24:10','2026-10-12 09:24:10'),(22,1,33,'available',250.00,'2026-10-12 09:24:10','2026-10-12 09:24:10'),(23,1,34,'available',250.00,'2026-10-12 09:24:10','2026-10-12 09:24:10'),(24,1,35,'available',250.00,'2026-10-12 09:24:10','2026-10-12 09:24:10'),(25,1,36,'available',250.00,'2026-10-12 09:24:10','2026-10-12 09:24:10'),(26,1,37,'available',250.00,'2026-10-12 10:45:05','2026-10-12 10:45:05'),(27,1,38,'available',250.00,'2026-10-12 10:45:05','2026-10-12 10:45:05'),(28,1,39,'available',250.00,'2026-10-12 10:45:05','2026-10-12 10:45:05'),(29,1,40,'available',250.00,'2026-10-12 10:45:05','2026-10-12 10:45:05'),(30,1,41,'available',250.00,'2026-10-12 10:45:05','2026-10-12 10:45:05'),(31,1,42,'available',250.00,'2026-10-12 10:45:05','2026-10-12 10:45:05'),(32,1,43,'available',250.00,'2026-10-12 10:45:05','2026-10-12 10:45:05'),(33,1,44,'available',250.00,'2026-10-12 10:45:05','2026-10-12 10:45:05'),(34,1,45,'available',250.00,'2026-10-12 10:45:05','2026-10-12 10:45:05'),(35,1,46,'available',250.00,'2026-10-12 10:45:05','2026-10-12 10:45:05'),(36,2,1,'available',600.00,'2026-10-14 04:53:37','2026-10-14 04:53:37'),(37,2,2,'available',600.00,'2026-10-14 04:53:37','2026-10-14 04:53:37'),(38,2,3,'available',600.00,'2026-10-14 04:53:37','2026-10-14 04:53:37'),(39,2,4,'available',600.00,'2026-10-14 04:53:37','2026-10-14 04:53:37'),(40,2,5,'available',600.00,'2026-10-14 04:53:37','2026-10-14 04:53:37'),(41,2,27,'available',600.00,'2026-10-14 04:53:37','2026-10-14 04:53:37'),(42,2,28,'available',600.00,'2026-10-14 04:53:37','2026-10-14 04:53:37'),(43,2,29,'available',600.00,'2026-10-14 04:53:37','2026-10-14 04:53:37'),(44,2,30,'available',600.00,'2026-10-14 04:53:37','2026-10-14 04:53:37'),(45,2,31,'available',600.00,'2026-10-14 04:53:37','2026-10-14 04:53:37'),(46,2,32,'available',600.00,'2026-10-14 04:53:37','2026-10-14 04:53:37'),(47,2,33,'available',600.00,'2026-10-14 04:53:37','2026-10-14 04:53:37'),(48,2,34,'available',600.00,'2026-10-14 04:53:37','2026-10-14 04:53:37'),(49,2,35,'available',600.00,'2026-10-14 04:53:37','2026-10-14 04:53:37'),(50,2,36,'available',600.00,'2026-10-14 04:53:37','2026-10-14 04:53:37'),(51,2,7,'available',600.00,'2026-10-14 04:53:37','2026-10-14 04:53:37'),(52,2,8,'available',600.00,'2026-10-14 04:53:37','2026-10-14 04:53:37'),(53,2,9,'available',600.00,'2026-10-14 04:53:37','2026-10-14 04:53:37'),(54,2,10,'available',600.00,'2026-10-14 04:53:37','2026-10-14 04:53:37'),(55,2,11,'available',600.00,'2026-10-14 04:53:37','2026-10-14 04:53:37'),(56,2,12,'available',600.00,'2026-10-14 04:53:37','2026-10-14 04:53:37'),(57,2,13,'available',600.00,'2026-10-14 04:53:37','2026-10-14 04:53:37'),(58,2,14,'available',600.00,'2026-10-14 04:53:37','2026-10-14 04:53:37'),(59,2,15,'available',600.00,'2026-10-14 04:53:37','2026-10-14 04:53:37'),(60,2,16,'available',600.00,'2026-10-14 04:53:37','2026-10-14 04:53:37'),(61,2,37,'available',600.00,'2026-10-14 04:53:37','2026-10-14 04:53:37'),(62,2,38,'available',600.00,'2026-10-14 04:53:37','2026-10-14 04:53:37'),(63,2,39,'available',600.00,'2026-10-14 04:53:37','2026-10-14 04:53:37'),(64,2,40,'available',600.00,'2026-10-14 04:53:37','2026-10-14 04:53:37'),(65,2,41,'available',600.00,'2026-10-14 04:53:37','2026-10-14 04:53:37'),(66,2,42,'available',600.00,'2026-10-14 04:53:37','2026-10-14 04:53:37'),(67,2,43,'available',600.00,'2026-10-14 04:53:37','2026-10-14 04:53:37'),(68,2,44,'available',600.00,'2026-10-14 04:53:37','2026-10-14 04:53:37'),(69,2,45,'available',600.00,'2026-10-14 04:53:37','2026-10-14 04:53:37'),(70,2,46,'available',600.00,'2026-10-14 04:53:37','2026-10-14 04:53:37'),(71,3,1,'available',600.00,'2026-10-14 04:54:54','2026-10-14 04:54:54'),(72,3,2,'available',600.00,'2026-10-14 04:54:54','2026-10-14 04:54:54'),(73,3,3,'available',600.00,'2026-10-14 04:54:54','2026-10-14 04:54:54'),(74,3,4,'available',600.00,'2026-10-14 04:54:54','2026-10-14 04:54:54'),(75,3,5,'available',600.00,'2026-10-14 04:54:54','2026-10-14 04:54:54'),(76,3,27,'available',600.00,'2026-10-14 04:54:54','2026-10-14 04:54:54'),(77,3,28,'available',600.00,'2026-10-14 04:54:54','2026-10-14 04:54:54'),(78,3,29,'available',600.00,'2026-10-14 04:54:54','2026-10-14 04:54:54'),(79,3,30,'available',600.00,'2026-10-14 04:54:54','2026-10-14 04:54:54'),(80,3,31,'available',600.00,'2026-10-14 04:54:54','2026-10-14 04:54:54'),(81,3,32,'available',600.00,'2026-10-14 04:54:54','2026-10-14 04:54:54'),(82,3,33,'available',600.00,'2026-10-14 04:54:54','2026-10-14 04:54:54'),(83,3,34,'available',600.00,'2026-10-14 04:54:54','2026-10-14 04:54:54'),(84,3,35,'available',600.00,'2026-10-14 04:54:54','2026-10-14 04:54:54'),(85,3,36,'available',600.00,'2026-10-14 04:54:54','2026-10-14 04:54:54'),(86,3,7,'available',600.00,'2026-10-14 04:54:54','2026-10-14 04:54:54'),(87,3,8,'available',600.00,'2026-10-14 04:54:54','2026-10-14 04:54:54'),(88,3,9,'available',600.00,'2026-10-14 04:54:54','2026-10-14 04:54:54'),(89,3,10,'available',600.00,'2026-10-14 04:54:54','2026-10-14 04:54:54'),(90,3,11,'available',600.00,'2026-10-14 04:54:54','2026-10-14 04:54:54'),(91,3,12,'available',600.00,'2026-10-14 04:54:54','2026-10-14 04:54:54'),(92,3,13,'available',600.00,'2026-10-14 04:54:54','2026-10-14 04:54:54'),(93,3,14,'available',600.00,'2026-10-14 04:54:54','2026-10-14 04:54:54'),(94,3,15,'available',600.00,'2026-10-14 04:54:54','2026-10-14 04:54:54'),(95,3,16,'available',600.00,'2026-10-14 04:54:54','2026-10-14 04:54:54'),(96,3,37,'available',600.00,'2026-10-14 04:54:54','2026-10-14 04:54:54'),(97,3,38,'available',600.00,'2026-10-14 04:54:54','2026-10-14 04:54:54'),(98,3,39,'available',600.00,'2026-10-14 04:54:54','2026-10-14 04:54:54'),(99,3,40,'available',600.00,'2026-10-14 04:54:54','2026-10-14 04:54:54'),(100,3,41,'booked',600.00,'2026-10-14 04:54:54','2026-10-14 05:04:40'),(101,3,42,'booked',600.00,'2026-10-14 04:54:54','2026-10-14 05:04:40'),(102,3,43,'available',600.00,'2026-10-14 04:54:54','2026-10-14 04:54:54'),(103,3,44,'available',600.00,'2026-10-14 04:54:54','2026-10-14 04:54:54'),(104,3,45,'available',600.00,'2026-10-14 04:54:54','2026-10-14 04:54:54'),(105,3,46,'available',600.00,'2026-10-14 04:54:54','2026-10-14 04:54:54');
/*!40000 ALTER TABLE `show_seats` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shows`
--

DROP TABLE IF EXISTS `shows`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shows` (
  `show_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `movie_id` bigint unsigned NOT NULL,
  `screen_id` bigint unsigned NOT NULL,
  `start_time` datetime NOT NULL,
  `end_time` datetime NOT NULL,
  `base_price` decimal(10,2) unsigned NOT NULL,
  `status` enum('scheduled','cancelled','completed') NOT NULL DEFAULT 'scheduled',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`show_id`),
  KEY `idx_shows_movie` (`movie_id`),
  KEY `idx_shows_screen_time` (`screen_id`,`start_time`),
  KEY `idx_shows_status_time` (`status`,`start_time`),
  CONSTRAINT `fk_shows_movie` FOREIGN KEY (`movie_id`) REFERENCES `movies` (`movie_id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_shows_screen` FOREIGN KEY (`screen_id`) REFERENCES `screens` (`screen_id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_show_price` CHECK ((`base_price` >= 0)),
  CONSTRAINT `chk_show_time` CHECK ((`end_time` > `start_time`))
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shows`
--

LOCK TABLES `shows` WRITE;
/*!40000 ALTER TABLE `shows` DISABLE KEYS */;
INSERT INTO `shows` VALUES (1,1,1,'2026-10-12 18:00:00','2026-10-12 21:04:00',250.00,'scheduled','2026-10-11 13:57:09','2026-10-11 13:57:09'),(2,3,1,'2026-10-20 10:30:00','2026-10-20 13:45:00',600.00,'cancelled','2026-10-14 04:53:24','2026-10-14 04:54:36'),(3,3,1,'2026-10-15 10:30:00','2026-10-15 13:45:00',600.00,'scheduled','2026-10-14 04:54:54','2026-10-14 04:54:54');
/*!40000 ALTER TABLE `shows` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `theatres`
--

DROP TABLE IF EXISTS `theatres`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `theatres` (
  `theatre_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `address` varchar(500) NOT NULL,
  `city` varchar(100) NOT NULL,
  `pincode` varchar(10) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`theatre_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `theatres`
--

LOCK TABLES `theatres` WRITE;
/*!40000 ALTER TABLE `theatres` DISABLE KEYS */;
INSERT INTO `theatres` VALUES (1,'ShowTime Cinemas','Example Mall, Main Road','Mumbai','400001','2026-10-11 13:49:05','2026-10-11 13:49:05');
/*!40000 ALTER TABLE `theatres` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ticket_email_outbox`
--

DROP TABLE IF EXISTS `ticket_email_outbox`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ticket_email_outbox` (
  `booking_id` bigint unsigned NOT NULL,
  `status` enum('pending','sent','failed') NOT NULL DEFAULT 'pending',
  `attempts` int unsigned NOT NULL DEFAULT '0',
  `last_error` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `sent_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`booking_id`),
  CONSTRAINT `fk_ticket_outbox_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`booking_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ticket_email_outbox`
--

LOCK TABLES `ticket_email_outbox` WRITE;
/*!40000 ALTER TABLE `ticket_email_outbox` DISABLE KEYS */;
/*!40000 ALTER TABLE `ticket_email_outbox` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `role` enum('customer','admin') NOT NULL DEFAULT 'customer',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (3,'chinmaydalvi','dchinmay2003@gmail.com','$2b$10$72vbJTfKq.YgW2u5hLdYD.4nVSbG72VERB0aB8q4uCeuHJWICSYMK','2026-10-11 08:54:50','admin'),(4,'Test Customer','customer@example.com','$2b$10$uJGa4E3Bo5HPClXb/osbB.heCkBcBRUrCFEU6DdkuONnUR/TgBNK.','2026-10-11 17:07:41','customer'),(5,'Test User','testuser@example.com','$2b$10$OB/EWjVRccLPO/ActAwRPuepCqpSqut2Uo8vteBBfQvfjTqrUN24K','2026-10-12 04:18:51','customer'),(6,'Yashvi Dalal','yashvi.dalal24@spit.ac.in','$2b$10$dl9ytej0OFmMe4BQuxcnReiDcKreYmq7jCscq0TlzXblrr/o0k/kG','2026-10-12 04:29:01','customer');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-19 10:43:35
