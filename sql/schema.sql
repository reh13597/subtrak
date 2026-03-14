-- SubTrak Database Schema
-- MySQL 8.x compatible
-- This file is the source of truth for the database structure.
-- Run this against your RDS instance to create/recreate tables.

CREATE TABLE IF NOT EXISTS `User` (
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

CREATE TABLE IF NOT EXISTS `PendingEmailChange` (
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

CREATE TABLE IF NOT EXISTS `Subscription` (
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

CREATE TABLE IF NOT EXISTS `StatementUpload` (
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

CREATE TABLE IF NOT EXISTS `ExtractedSubscription` (
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
