-- Cutoff Expense Tracker — MySQL schema
-- Charset/collation chosen for broad compatibility (emoji-safe too, in case notes ever need it)

CREATE DATABASE IF NOT EXISTS cutoff_tracker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cutoff_tracker;

-- ------------------------------------------------------------
-- Users (login with username + password)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    emoji VARCHAR(10) DEFAULT '🐷',
    password_hash VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Maintenance: Banks (per user)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS banks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uq_bank_per_user (user_id, name)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Maintenance: Must-haves (auto-added to every new cutoff list)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS must_haves (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uq_musthave_per_user (user_id, name)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Maintenance: Expense item status options (per user)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS item_statuses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uq_item_status_per_user (user_id, name)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Expense Lists (cutoff-based or other, each tagged Open/Pending/Closed)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS expense_lists (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    list_type ENUM('cutoff','other') NOT NULL DEFAULT 'cutoff',
    cutoff_month VARCHAR(20) NULL,          -- e.g. 'June' (NULL for 'other' type)
    cutoff_day ENUM('15','30') NULL,        -- NULL for 'other' type
    budget DECIMAL(12,2) NOT NULL DEFAULT 0,
    status ENUM('Open','Pending','Closed') NOT NULL DEFAULT 'Pending',
    icon VARCHAR(80) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_status (user_id, status),
    INDEX idx_user_type (user_id, list_type)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Expense Items (line items inside a list)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS expense_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    list_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    bank VARCHAR(100) NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending',
    due_date DATE NULL,                     -- mainly used by 'other' type lists
    remarks VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (list_id) REFERENCES expense_lists(id) ON DELETE CASCADE,
    INDEX idx_list (list_id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Savings entries (deposit log)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS savings_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    deposit_date DATE NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    bank VARCHAR(100) NULL,
    status ENUM('Deposited','Pending') NOT NULL DEFAULT 'Deposited',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_date (user_id, deposit_date)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Installment plans + scheduled payments
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS installment_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    months INT NULL,
    total_count INT NOT NULL,
    frequency VARCHAR(20) NOT NULL DEFAULT 'biweekly',
    start_date DATE NOT NULL,
    bank VARCHAR(100) NULL,
    notes VARCHAR(255) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_status (user_id, status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS installment_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plan_id INT NOT NULL,
    installment_number INT NOT NULL,
    due_date DATE NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending',
    paid_date DATE NULL,
    is_advance TINYINT(1) NOT NULL DEFAULT 0,
    FOREIGN KEY (plan_id) REFERENCES installment_plans(id) ON DELETE CASCADE,
    INDEX idx_plan (plan_id),
    INDEX idx_due (due_date, status)
) ENGINE=InnoDB;
