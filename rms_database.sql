-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: localhost    Database: rms
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `coach`
--

DROP TABLE IF EXISTS `coach`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `coach` (
  `Train_no` int NOT NULL,
  `Coach_no` int NOT NULL,
  `Coach_class` varchar(50) NOT NULL,
  PRIMARY KEY (`Train_no`,`Coach_no`,`Coach_class`),
  CONSTRAINT `coach_ibfk_1` FOREIGN KEY (`Train_no`) REFERENCES `train` (`Train_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `coach`
--

LOCK TABLES `coach` WRITE;
/*!40000 ALTER TABLE `coach` DISABLE KEYS */;
INSERT INTO `coach` VALUES (12301,1,'AC First Class'),(12301,2,'AC 2-Tier'),(12301,3,'AC 3-Tier'),(12301,4,'AC 3-Tier'),(12430,1,'AC Chair Car'),(12430,2,'AC Chair Car');
/*!40000 ALTER TABLE `coach` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `goesto`
--

DROP TABLE IF EXISTS `goesto`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `goesto` (
  `Train_no` int NOT NULL,
  `Station_name` varchar(100) NOT NULL,
  `Arrival_time` time NOT NULL,
  `Departure_time` time NOT NULL,
  PRIMARY KEY (`Train_no`,`Station_name`),
  KEY `Station_name` (`Station_name`),
  CONSTRAINT `goesto_ibfk_1` FOREIGN KEY (`Train_no`) REFERENCES `train` (`Train_no`),
  CONSTRAINT `goesto_ibfk_2` FOREIGN KEY (`Station_name`) REFERENCES `station` (`Station_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `goesto`
--

LOCK TABLES `goesto` WRITE;
/*!40000 ALTER TABLE `goesto` DISABLE KEYS */;
INSERT INTO `goesto` VALUES (12301,'Agra','21:45:00','21:47:00'),(12301,'Bhopal','03:45:00','03:47:00'),(12301,'Gwalior','23:15:00','23:17:00'),(12301,'Jhansi','01:20:00','01:22:00'),(12301,'Khandwa','06:10:00','06:12:00'),(12301,'Mathura','20:30:00','20:32:00'),(12301,'Mumbai Central','08:35:00','08:35:00'),(12301,'New Delhi','16:55:00','16:55:00'),(12430,'Aligarh','08:15:00','08:17:00'),(12430,'Etawah','10:45:00','10:47:00'),(12430,'Ghaziabad','06:45:00','06:47:00'),(12430,'Lucknow','12:35:00','12:35:00'),(12430,'New Delhi','06:10:00','06:10:00'),(12430,'Tundla','09:30:00','09:32:00');
/*!40000 ALTER TABLE `goesto` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `route`
--

DROP TABLE IF EXISTS `route`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `route` (
  `Route_ID` int NOT NULL,
  `Distance` int NOT NULL,
  `StopNumbers` int NOT NULL,
  PRIMARY KEY (`Route_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `route`
--

LOCK TABLES `route` WRITE;
/*!40000 ALTER TABLE `route` DISABLE KEYS */;
INSERT INTO `route` VALUES (1,1384,8),(2,1384,8),(3,512,6),(4,2180,12),(5,2150,10),(6,2648,15),(7,1534,9),(8,1702,11);
/*!40000 ALTER TABLE `route` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `route_station`
--

DROP TABLE IF EXISTS `route_station`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `route_station` (
  `Route_ID` int NOT NULL,
  `Station_name` varchar(100) NOT NULL,
  `Stop_Order` int NOT NULL,
  PRIMARY KEY (`Route_ID`,`Station_name`),
  KEY `Station_name` (`Station_name`),
  CONSTRAINT `route_station_ibfk_1` FOREIGN KEY (`Route_ID`) REFERENCES `route` (`Route_ID`),
  CONSTRAINT `route_station_ibfk_2` FOREIGN KEY (`Station_name`) REFERENCES `station` (`Station_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `route_station`
--

LOCK TABLES `route_station` WRITE;
/*!40000 ALTER TABLE `route_station` DISABLE KEYS */;
INSERT INTO `route_station` VALUES (1,'Agra',3),(1,'Bhopal',6),(1,'Gwalior',4),(1,'Jhansi',5),(1,'Khandwa',7),(1,'Mathura',2),(1,'Mumbai Central',8),(1,'New Delhi',1);
/*!40000 ALTER TABLE `route_station` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `schedule`
--

DROP TABLE IF EXISTS `schedule`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `schedule` (
  `Route_ID` int NOT NULL,
  `Train_no` int NOT NULL,
  `Date` date NOT NULL,
  `Start_time` time NOT NULL,
  `End_time` time NOT NULL,
  `WeekDay` varchar(20) NOT NULL,
  PRIMARY KEY (`Route_ID`,`Train_no`,`Date`,`Start_time`,`End_time`),
  KEY `Train_no` (`Train_no`),
  CONSTRAINT `schedule_ibfk_1` FOREIGN KEY (`Route_ID`) REFERENCES `route` (`Route_ID`),
  CONSTRAINT `schedule_ibfk_2` FOREIGN KEY (`Train_no`) REFERENCES `train` (`Train_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `schedule`
--

LOCK TABLES `schedule` WRITE;
/*!40000 ALTER TABLE `schedule` DISABLE KEYS */;
INSERT INTO `schedule` VALUES (1,12301,'2025-10-20','16:55:00','08:35:00','Mon'),(1,12301,'2025-10-21','16:55:00','08:35:00','Tue'),(2,12951,'2025-10-20','17:00:00','09:15:00','Mon'),(3,12430,'2025-10-20','06:10:00','12:35:00','Mon');
/*!40000 ALTER TABLE `schedule` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `seat`
--

DROP TABLE IF EXISTS `seat`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `seat` (
  `Train_no` int NOT NULL,
  `Coach_no` int NOT NULL,
  `Coach_class` varchar(50) NOT NULL,
  `Seat_no` int NOT NULL,
  `Available_seats` int NOT NULL,
  PRIMARY KEY (`Train_no`,`Coach_no`,`Coach_class`,`Seat_no`),
  CONSTRAINT `seat_ibfk_1` FOREIGN KEY (`Train_no`, `Coach_no`, `Coach_class`) REFERENCES `coach` (`Train_no`, `Coach_no`, `Coach_class`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `seat`
--

LOCK TABLES `seat` WRITE;
/*!40000 ALTER TABLE `seat` DISABLE KEYS */;
INSERT INTO `seat` VALUES (12301,2,'AC 2-Tier',1,1),(12301,2,'AC 2-Tier',2,1),(12301,2,'AC 2-Tier',3,0),(12301,2,'AC 2-Tier',4,1);
/*!40000 ALTER TABLE `seat` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `station`
--

DROP TABLE IF EXISTS `station`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `station` (
  `Station_name` varchar(100) NOT NULL,
  `Latitude` int NOT NULL,
  `Longitude` int NOT NULL,
  PRIMARY KEY (`Station_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `station`
--

LOCK TABLES `station` WRITE;
/*!40000 ALTER TABLE `station` DISABLE KEYS */;
INSERT INTO `station` VALUES ('Agra',270000,780000),('Aligarh',272000,781000),('Bangalore',129678,775698),('Bhopal',230000,775000),('Chennai Central',131678,795698),('Etawah',265000,790000),('Ghaziabad',285000,775000),('Gwalior',260000,782000),('Howrah',225678,881245),('Jhansi',255000,785000),('Khandwa',220000,760000),('Lucknow',269450,808750),('Mathura',275000,775000),('Mumbai Central',189789,728945),('New Delhi',286147,773887),('Puri',198745,858745),('Trivandrum',86745,769845),('Tundla',268000,782500);
/*!40000 ALTER TABLE `station` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ticket`
--

DROP TABLE IF EXISTS `ticket`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ticket` (
  `PNR_No` varchar(20) NOT NULL,
  `Fare` int NOT NULL,
  `No_of_seats_booked` int NOT NULL,
  `Username` varchar(50) DEFAULT NULL,
  `Train_no` int DEFAULT NULL,
  PRIMARY KEY (`PNR_No`),
  KEY `Username` (`Username`),
  KEY `Train_no` (`Train_no`),
  CONSTRAINT `ticket_ibfk_1` FOREIGN KEY (`Username`) REFERENCES `user` (`Username`),
  CONSTRAINT `ticket_ibfk_2` FOREIGN KEY (`Train_no`) REFERENCES `train` (`Train_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ticket`
--

LOCK TABLES `ticket` WRITE;
/*!40000 ALTER TABLE `ticket` DISABLE KEYS */;
INSERT INTO `ticket` VALUES ('PNR123456',4800,2,'john_doe',12301),('PNR789012',550,1,'jane_smith',12430);
/*!40000 ALTER TABLE `ticket` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `train`
--

DROP TABLE IF EXISTS `train`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `train` (
  `Train_no` int NOT NULL,
  `Train_name` varchar(100) NOT NULL,
  `Route_ID` int DEFAULT NULL,
  PRIMARY KEY (`Train_no`),
  KEY `Route_ID` (`Route_ID`),
  CONSTRAINT `train_ibfk_1` FOREIGN KEY (`Route_ID`) REFERENCES `route` (`Route_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `train`
--

LOCK TABLES `train` WRITE;
/*!40000 ALTER TABLE `train` DISABLE KEYS */;
INSERT INTO `train` VALUES (11111,'idea',8),(12269,'Duronto Express',4),(12301,'Rajdhani Express',1),(12302,'Kolkata Rajdhani',7),(12430,'Shatabdi Express',3),(12626,'Kerala Express',6),(12650,'Karnataka Sampark Kranti',5),(12802,'Purushottam Express',8),(12951,'Mumbai Rajdhani',2);
/*!40000 ALTER TABLE `train` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `Username` varchar(50) NOT NULL,
  `First_name` varchar(50) NOT NULL,
  `Last_name` varchar(50) NOT NULL,
  `DOB` date NOT NULL,
  `Age` int NOT NULL,
  `Passkey` varchar(255) NOT NULL,
  PRIMARY KEY (`Username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES ('jane_smith','Jane','Smith','1995-08-22',28,'password456'),('john_doe','John','Doe','1990-05-15',33,'password123'),('thecatunknown','thecat','Unknown','1990-01-01',35,'pass123');
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `useremail`
--

DROP TABLE IF EXISTS `useremail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `useremail` (
  `Username` varchar(50) NOT NULL,
  `Email` varchar(100) NOT NULL,
  PRIMARY KEY (`Username`,`Email`),
  CONSTRAINT `useremail_ibfk_1` FOREIGN KEY (`Username`) REFERENCES `user` (`Username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `useremail`
--

LOCK TABLES `useremail` WRITE;
/*!40000 ALTER TABLE `useremail` DISABLE KEYS */;
INSERT INTO `useremail` VALUES ('jane_smith','jane.smith@email.com'),('john_doe','john.doe@email.com'),('thecatunknown','thecat@email.com');
/*!40000 ALTER TABLE `useremail` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `userphone`
--

DROP TABLE IF EXISTS `userphone`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `userphone` (
  `Username` varchar(50) NOT NULL,
  `Mobile_no` bigint NOT NULL,
  PRIMARY KEY (`Username`,`Mobile_no`),
  CONSTRAINT `userphone_ibfk_1` FOREIGN KEY (`Username`) REFERENCES `user` (`Username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `userphone`
--

LOCK TABLES `userphone` WRITE;
/*!40000 ALTER TABLE `userphone` DISABLE KEYS */;
INSERT INTO `userphone` VALUES ('jane_smith',9123456789),('john_doe',9876543210),('thecatunknown',1234567890);
/*!40000 ALTER TABLE `userphone` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `waiting_list`
--

DROP TABLE IF EXISTS `waiting_list`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `waiting_list` (
  `Waiting_List_ID` int NOT NULL,
  `PNR_No` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`Waiting_List_ID`),
  KEY `PNR_No` (`PNR_No`),
  CONSTRAINT `waiting_list_ibfk_1` FOREIGN KEY (`PNR_No`) REFERENCES `ticket` (`PNR_No`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `waiting_list`
--

LOCK TABLES `waiting_list` WRITE;
/*!40000 ALTER TABLE `waiting_list` DISABLE KEYS */;
INSERT INTO `waiting_list` VALUES (1,'PNR123456'),(2,'PNR789012');
/*!40000 ALTER TABLE `waiting_list` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-26 22:11:10
