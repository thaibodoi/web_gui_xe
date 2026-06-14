CREATE TABLE IF NOT EXISTS `account` (
  `account_id` varchar(36) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('ADMIN','STAFF') NOT NULL,
  `username` varchar(50) NOT NULL,
  PRIMARY KEY (`account_id`),
  UNIQUE KEY `UKgex1lmaqpg0ir5g1f5eftyaa1` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `customer` (
  `customer_id` varchar(36) NOT NULL,
  `address` varchar(200) NOT NULL,
  `customer_type` enum('LECTURER','STUDENT') NOT NULL,
  `dob` date NOT NULL,
  `email` varchar(100) NOT NULL,
  `gender` enum('FEMALE','MALE') NOT NULL,
  `name` varchar(100) NOT NULL,
  `phone_number` varchar(15) NOT NULL,
  PRIMARY KEY (`customer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `parking_card` (
  `card_id` INT NOT NULL,
  PRIMARY KEY (`card_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `vehicle_type` (
  `id` varchar(36) NOT NULL,
  `name` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKelm7dknfxeji1hh96tdy7d5qh` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `staff` (
  `account_id` varchar(36) NOT NULL,
  `address` varchar(200) NOT NULL,
  `dob` date NOT NULL,
  `email` varchar(100) NOT NULL,
  `gender` enum('FEMALE','MALE') NOT NULL,
  `identification` varchar(20) NOT NULL,
  `is_active` bit(1) NOT NULL,
  `name` varchar(100) NOT NULL,
  `phone_number` varchar(15) NOT NULL,
  PRIMARY KEY (`account_id`),
  UNIQUE KEY `UK7qv9ryrnvl4iwe136f4g6e5gi` (`identification`),
  CONSTRAINT `FKs9jl798sgmtrl79dm4svocvaw` FOREIGN KEY (`account_id`) REFERENCES `account` (`account_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `student_information` (
  `customer_id` varchar(36) NOT NULL,
  `class_info` varchar(50) NOT NULL,
  `faculty` varchar(100) NOT NULL,
  `major` varchar(100) NOT NULL,
  `student_id` varchar(20) NOT NULL,
  PRIMARY KEY (`customer_id`),
  CONSTRAINT `FKf4db6ubq8g9u8unvan07knmno` FOREIGN KEY (`customer_id`) REFERENCES `customer` (`customer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `lecturer_information` (
  `customer_id` varchar(36) NOT NULL,
  `lecturer_id` varchar(20) NOT NULL,
  PRIMARY KEY (`customer_id`),
  CONSTRAINT `FK9hfipt89m60y41q71pao9rsxb` FOREIGN KEY (`customer_id`) REFERENCES `customer` (`customer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `payment` (
  `payment_id` varchar(36) NOT NULL,
  `amount` int NOT NULL,
  `create_at` datetime(6) NOT NULL,
  `payment_type` enum('MISSING','MONTHLY','PARKING') NOT NULL,
  PRIMARY KEY (`payment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `price` (
  `type_id` varchar(36) NOT NULL,
  `day_price` int NOT NULL,
  `monthly_price` int NOT NULL,
  `night_price` int NOT NULL,
  PRIMARY KEY (`type_id`),
  CONSTRAINT `FKblceji9k39ms73tup3pmga5m6` FOREIGN KEY (`type_id`) REFERENCES `vehicle_type` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `vehicle` (
  `vehicle_id` varchar(36) NOT NULL,
  `brand` varchar(50) DEFAULT NULL,
  `color` varchar(30) DEFAULT NULL,
  `license_plate` varchar(20) DEFAULT NULL,
  `type_id` varchar(36) NOT NULL,
  PRIMARY KEY (`vehicle_id`),
  UNIQUE KEY `UKj5v3su3bdx4bvsk1t9dga4bsq` (`license_plate`),
  KEY `FK8qlgtkjao0ig1k8ky1ocnp4dx` (`type_id`),
  CONSTRAINT `FK8qlgtkjao0ig1k8ky1ocnp4dx` FOREIGN KEY (`type_id`) REFERENCES `vehicle_type` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `active_monthly_registration` (
  `id` varchar(36) NOT NULL,
  `expiration_date` datetime(6) NOT NULL,
  `issue_date` datetime(6) NOT NULL,
  `create_by` varchar(36) NOT NULL,
  `customer_id` varchar(36) NOT NULL,
  `payment_id` varchar(36) NOT NULL,
  `vehicle_id` varchar(36) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKit4ie9ugapu9w12rgpuut6tvm` (`payment_id`),
  KEY `FKgnj8ynbkhqvri5bnqxgi43vh6` (`create_by`),
  KEY `FKelmthpw1o7rw4lvq6jtw4qggl` (`customer_id`),
  KEY `FKdce2icjt2dd0jqs8avesd6cb8` (`vehicle_id`),
  CONSTRAINT `FK342547ublvnwhte7f8lxxm2p8` FOREIGN KEY (`payment_id`) REFERENCES `payment` (`payment_id`),
  CONSTRAINT `FKdce2icjt2dd0jqs8avesd6cb8` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicle` (`vehicle_id`),
  CONSTRAINT `FKelmthpw1o7rw4lvq6jtw4qggl` FOREIGN KEY (`customer_id`) REFERENCES `customer` (`customer_id`),
  CONSTRAINT `FKgnj8ynbkhqvri5bnqxgi43vh6` FOREIGN KEY (`create_by`) REFERENCES `account` (`account_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `expire_monthly_registration` (
  `id` varchar(36) NOT NULL,
  `expiration_date` datetime(6) NOT NULL,
  `issue_date` datetime(6) NOT NULL,
  `create_by` varchar(36) NOT NULL,
  `customer_id` varchar(36) NOT NULL,
  `payment_id` varchar(36) NOT NULL,
  `vehicle_id` varchar(36) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKsl2ix355e4lgkgsppo43rpln2` (`payment_id`),
  KEY `FKa43iiquysjfgmbo3o8wegmlmr` (`create_by`),
  KEY `FK1gm62p13tphn9tfmwapnmlsn0` (`customer_id`),
  KEY `FK77u5imfic4866pf69xu3qlvln` (`vehicle_id`),
  CONSTRAINT `FK1gm62p13tphn9tfmwapnmlsn0` FOREIGN KEY (`customer_id`) REFERENCES `customer` (`customer_id`),
  CONSTRAINT `FK77u5imfic4866pf69xu3qlvln` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicle` (`vehicle_id`),
  CONSTRAINT `FKa43iiquysjfgmbo3o8wegmlmr` FOREIGN KEY (`create_by`) REFERENCES `account` (`account_id`),
  CONSTRAINT `FKjarbkbqethybvhkcohlejxou5` FOREIGN KEY (`payment_id`) REFERENCES `payment` (`payment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `parking_record_history` (
  `history_id` varchar(36) NOT NULL,
  `entry_time` datetime(6) NOT NULL,
  `exit_time` datetime(6) DEFAULT NULL,
  `identifier` varchar(50) DEFAULT NULL,
  `license_plate` varchar(20) DEFAULT NULL,
  `type` enum('DAILY','MONTHLY') NOT NULL,
  `card_id` INT NOT NULL,
  `payment_id` varchar(36) NOT NULL,
  `staff_in` varchar(36) NOT NULL,
  `staff_out` varchar(36) DEFAULT NULL,
  `vehicle_type` varchar(36) NOT NULL,
  PRIMARY KEY (`history_id`),
  UNIQUE KEY `UKhi4a2ck8ahcvx21o01povrmhm` (`payment_id`),
  KEY `FKl1gi672twsn0n6y22ti82n8lm` (`card_id`),
  KEY `FK3ovo03gvld9qq5si1y69vxwlb` (`staff_in`),
  KEY `FK4oiac8bsjeuj0fg9mv388pngj` (`staff_out`),
  KEY `FKa1jqtneimrtfij2kolov59c5x` (`vehicle_type`),
  CONSTRAINT `FK3ovo03gvld9qq5si1y69vxwlb` FOREIGN KEY (`staff_in`) REFERENCES `account` (`account_id`),
  CONSTRAINT `FK4oiac8bsjeuj0fg9mv388pngj` FOREIGN KEY (`staff_out`) REFERENCES `account` (`account_id`),
  CONSTRAINT `FKa1jqtneimrtfij2kolov59c5x` FOREIGN KEY (`vehicle_type`) REFERENCES `vehicle_type` (`id`),
  CONSTRAINT `FKkad160e6mtf3qpew4g5jm2p6w` FOREIGN KEY (`payment_id`) REFERENCES `payment` (`payment_id`),
  CONSTRAINT `FKl1gi672twsn0n6y22ti82n8lm` FOREIGN KEY (`card_id`) REFERENCES `parking_card` (`card_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `missing_report` (
  `report_id` varchar(36) NOT NULL,
  `address` varchar(200) NOT NULL,
  `brand` varchar(50) NOT NULL,
  `color` varchar(30) NOT NULL,
  `create_at` datetime(6) NOT NULL,
  `gender` enum('FEMALE','MALE') NOT NULL,
  `identification` varchar(30) NOT NULL,
  `identifier` varchar(20) DEFAULT NULL,
  `license_plate` varchar(20) DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `phone_number` varchar(15) NOT NULL,
  `create_by` varchar(36) NOT NULL,
  `payment_id` varchar(36) NOT NULL,
  `record_id` varchar(36) DEFAULT NULL,
  `vehicle_type` varchar(36) NOT NULL,
  PRIMARY KEY (`report_id`),
  UNIQUE KEY `UKlr2ve30rdljmi349yoruryeh2` (`payment_id`),
  UNIQUE KEY `UK5ubcv413nir5mmur4ayoyvtle` (`record_id`),
  KEY `FK7cn32xjlgnrehx02y0kk6vt7o` (`create_by`),
  KEY `FK52y3gqmneqflq694ne7dwekyk` (`vehicle_type`),
  CONSTRAINT `FK52y3gqmneqflq694ne7dwekyk` FOREIGN KEY (`vehicle_type`) REFERENCES `vehicle_type` (`id`),
  CONSTRAINT `FK72sydl9n785u9unfeom0f5g0w` FOREIGN KEY (`record_id`) REFERENCES `parking_record_history` (`history_id`),
  CONSTRAINT `FK7cn32xjlgnrehx02y0kk6vt7o` FOREIGN KEY (`create_by`) REFERENCES `account` (`account_id`),
  CONSTRAINT `FKqd690tenygtiby1c8wtkbark5` FOREIGN KEY (`payment_id`) REFERENCES `payment` (`payment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `parking_record` (
  `record_id` varchar(36) NOT NULL,
  `entry_time` datetime(6) NOT NULL,
  `identifier` varchar(50) DEFAULT NULL,
  `license_plate` varchar(20) DEFAULT NULL,
  `type` enum('DAILY','MONTHLY') NOT NULL,
  `card_id` INT NOT NULL,
  `staff_in` varchar(36) NOT NULL,
  `vehicle_type` varchar(36) NOT NULL,
  PRIMARY KEY (`record_id`),
  KEY `FK9t4vmdvklcb6v8sdnp3k2mgnp` (`card_id`),
  KEY `FKmu1r46roucvicourn2l7ockdd` (`staff_in`),
  KEY `FKpajdqpdlcnvwyvek1cjujh129` (`vehicle_type`),
  CONSTRAINT `FK9t4vmdvklcb6v8sdnp3k2mgnp` FOREIGN KEY (`card_id`) REFERENCES `parking_card` (`card_id`),
  CONSTRAINT `FKmu1r46roucvicourn2l7ockdd` FOREIGN KEY (`staff_in`) REFERENCES `account` (`account_id`),
  CONSTRAINT `FKpajdqpdlcnvwyvek1cjujh129` FOREIGN KEY (`vehicle_type`) REFERENCES `vehicle_type` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `system_config` (
  `config_key` varchar(255) NOT NULL,
  `config_value` varchar(255) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
