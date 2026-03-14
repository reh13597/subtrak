-- SubTrak Database Dump
-- MySQL 8.x compatible
-- Run against your database to create tables and populate with sample data.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Drop existing tables (reverse dependency order)
-- ----------------------------
DROP TABLE IF EXISTS `ExtractedSubscription`;
DROP TABLE IF EXISTS `StatementUpload`;
DROP TABLE IF EXISTS `Subscription`;
DROP TABLE IF EXISTS `PendingEmailChange`;
DROP TABLE IF EXISTS `User`;

-- ----------------------------
-- Table structure for User
-- ----------------------------
CREATE TABLE `User` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `cognitoId` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `firstName` VARCHAR(100) DEFAULT NULL,
  `lastName` VARCHAR(100) DEFAULT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `User_cognitoId_key` (`cognitoId`),
  UNIQUE KEY `User_email_key` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table structure for PendingEmailChange
-- ----------------------------
CREATE TABLE `PendingEmailChange` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userId` INT NOT NULL,
  `newEmail` VARCHAR(255) NOT NULL,
  `code` VARCHAR(6) NOT NULL,
  `expiresAt` DATETIME NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `PendingEmailChange_userId_idx` (`userId`),
  CONSTRAINT `PendingEmailChange_userId_fk` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table structure for Subscription
-- ----------------------------
CREATE TABLE `Subscription` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userId` INT NOT NULL,
  `name` VARCHAR(200) NOT NULL,
  `price` DECIMAL(10,2) NOT NULL,
  `currency` VARCHAR(3) NOT NULL DEFAULT 'CAD',
  `billingCycle` ENUM('MONTHLY','YEARLY','WEEKLY','CUSTOM') NOT NULL DEFAULT 'MONTHLY',
  `status` ENUM('ACTIVE','PAUSED','CANCELLED') NOT NULL DEFAULT 'ACTIVE',
  `category` VARCHAR(100) DEFAULT NULL,
  `providerUrl` VARCHAR(500) DEFAULT NULL,
  `nextBillingDate` DATETIME DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `icon` VARCHAR(500) DEFAULT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `Subscription_userId_idx` (`userId`),
  CONSTRAINT `Subscription_userId_fk` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table structure for StatementUpload
-- ----------------------------
CREATE TABLE `StatementUpload` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userId` INT NOT NULL,
  `fileName` VARCHAR(500) NOT NULL,
  `fileData` LONGBLOB DEFAULT NULL,
  `mimeType` VARCHAR(100) DEFAULT NULL,
  `status` ENUM('PENDING','PROCESSING','DONE','FAILED') NOT NULL DEFAULT 'PENDING',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `StatementUpload_userId_idx` (`userId`),
  CONSTRAINT `StatementUpload_userId_fk` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table structure for ExtractedSubscription
-- ----------------------------
CREATE TABLE `ExtractedSubscription` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `uploadId` INT NOT NULL,
  `name` VARCHAR(200) NOT NULL,
  `price` DECIMAL(10,2) NOT NULL,
  `currency` VARCHAR(3) NOT NULL DEFAULT 'CAD',
  `billingCycle` ENUM('MONTHLY','YEARLY','WEEKLY','CUSTOM') NOT NULL DEFAULT 'MONTHLY',
  `providerUrl` VARCHAR(500) DEFAULT NULL,
  `lastChargeDate` DATETIME DEFAULT NULL,
  `nextBillingDate` DATETIME DEFAULT NULL,
  `confidenceScore` FLOAT NOT NULL DEFAULT 0,
  `reviewStatus` ENUM('PENDING','ACCEPTED','REJECTED') NOT NULL DEFAULT 'PENDING',
  `rawJson` JSON DEFAULT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ExtractedSubscription_uploadId_idx` (`uploadId`),
  CONSTRAINT `ExtractedSubscription_uploadId_fk` FOREIGN KEY (`uploadId`) REFERENCES `StatementUpload` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ----------------------------
-- Records of User
-- ----------------------------
INSERT INTO `User` (`id`, `cognitoId`, `email`, `firstName`, `lastName`, `createdAt`, `updatedAt`) VALUES
(1, 'us-east-1_abc111', 'alice@example.com', 'Alice', 'Johnson', NOW(), NOW()),
(2, 'us-east-1_def222', 'bob@example.com', 'Bob', 'Smith', NOW(), NOW()),
(3, 'us-east-1_ghi333', 'carol@example.com', 'Carol', 'Williams', NOW(), NOW()),
(4, 'us-east-1_jkl444', 'dave@example.com', 'Dave', 'Brown', NOW(), NOW()),
(5, 'us-east-1_mno555', 'eve@example.com', 'Eve', 'Davis', NOW(), NOW());

-- ----------------------------
-- Records of PendingEmailChange
-- ----------------------------
INSERT INTO `PendingEmailChange` (`id`, `userId`, `newEmail`, `code`, `expiresAt`, `createdAt`) VALUES
(1, 1, 'alice.new@example.com', '123456', DATE_ADD(NOW(), INTERVAL 1 HOUR), NOW()),
(2, 2, 'bob.new@example.com', '234567', DATE_ADD(NOW(), INTERVAL 1 HOUR), NOW()),
(3, 3, 'carol.new@example.com', '345678', DATE_ADD(NOW(), INTERVAL 1 HOUR), NOW()),
(4, 4, 'dave.new@example.com', '456789', DATE_ADD(NOW(), INTERVAL 1 HOUR), NOW()),
(5, 5, 'eve.new@example.com', '567890', DATE_ADD(NOW(), INTERVAL 1 HOUR), NOW());

-- ----------------------------
-- Records of Subscription
-- ----------------------------
INSERT INTO `Subscription` (`id`, `userId`, `name`, `price`, `currency`, `billingCycle`, `status`, `category`, `providerUrl`, `nextBillingDate`, `notes`, `icon`, `createdAt`, `updatedAt`) VALUES
(1, 1, 'Netflix', 15.99, 'CAD', 'MONTHLY', 'ACTIVE', 'Streaming', 'https://netflix.com', DATE_ADD(NOW(), INTERVAL 1 MONTH), NULL, NULL, NOW(), NOW()),
(2, 1, 'Spotify', 10.99, 'CAD', 'MONTHLY', 'ACTIVE', 'Music', 'https://spotify.com', DATE_ADD(NOW(), INTERVAL 1 MONTH), NULL, NULL, NOW(), NOW()),
(3, 2, 'Adobe Creative Cloud', 64.99, 'CAD', 'MONTHLY', 'ACTIVE', 'Software', 'https://adobe.com', DATE_ADD(NOW(), INTERVAL 1 MONTH), NULL, NULL, NOW(), NOW()),
(4, 3, 'AWS', 42.50, 'CAD', 'MONTHLY', 'ACTIVE', 'Cloud', 'https://aws.amazon.com', DATE_ADD(NOW(), INTERVAL 1 MONTH), NULL, NULL, NOW(), NOW()),
(5, 4, 'GitHub Pro', 7.00, 'USD', 'MONTHLY', 'PAUSED', 'Dev Tools', 'https://github.com', NULL, 'Paused for 3 months', NULL, NOW(), NOW());

-- ----------------------------
-- Records of StatementUpload
-- ----------------------------
INSERT INTO `StatementUpload` (`id`, `userId`, `fileName`, `fileData`, `mimeType`, `status`, `createdAt`) VALUES
(1, 1, 'bank_statement_jan.pdf', NULL, 'application/pdf', 'DONE', NOW()),
(2, 1, 'cc_statement_feb.pdf', NULL, 'application/pdf', 'DONE', NOW()),
(3, 2, 'statement_q1.csv', NULL, 'text/csv', 'PROCESSING', NOW()),
(4, 3, 'march_bills.pdf', NULL, 'application/pdf', 'PENDING', NOW()),
(5, 4, 'expenses_2024.csv', NULL, 'text/csv', 'FAILED', NOW());

-- ----------------------------
-- Records of ExtractedSubscription
-- ----------------------------
INSERT INTO `ExtractedSubscription` (`id`, `uploadId`, `name`, `price`, `currency`, `billingCycle`, `providerUrl`, `lastChargeDate`, `nextBillingDate`, `confidenceScore`, `reviewStatus`, `rawJson`, `createdAt`) VALUES
(1, 1, 'Netflix', 15.99, 'CAD', 'MONTHLY', 'https://netflix.com', DATE_SUB(NOW(), INTERVAL 1 MONTH), DATE_ADD(NOW(), INTERVAL 1 MONTH), 0.95, 'ACCEPTED', '{"name":"Netflix","price":15.99}', NOW()),
(2, 1, 'Disney+', 11.99, 'CAD', 'MONTHLY', 'https://disneyplus.com', DATE_SUB(NOW(), INTERVAL 1 MONTH), DATE_ADD(NOW(), INTERVAL 1 MONTH), 0.88, 'PENDING', '{"name":"Disney+","price":11.99}', NOW()),
(3, 2, 'Spotify Premium', 10.99, 'CAD', 'MONTHLY', 'https://spotify.com', DATE_SUB(NOW(), INTERVAL 2 MONTH), DATE_ADD(NOW(), INTERVAL 1 MONTH), 0.92, 'ACCEPTED', '{"name":"Spotify Premium","price":10.99}', NOW()),
(4, 3, 'iCloud Storage', 2.99, 'CAD', 'MONTHLY', 'https://icloud.com', DATE_SUB(NOW(), INTERVAL 1 MONTH), DATE_ADD(NOW(), INTERVAL 1 MONTH), 0.78, 'REJECTED', '{"name":"iCloud Storage","price":2.99}', NOW()),
(5, 4, 'Google One', 9.99, 'CAD', 'MONTHLY', 'https://one.google.com', NULL, NULL, 0.65, 'PENDING', '{"name":"Google One","price":9.99}', NOW());
