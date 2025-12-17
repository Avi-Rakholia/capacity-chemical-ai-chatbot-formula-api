-- ============================================================
-- Capacity Chemical AI Chatbot - Complete Database Schema
-- ============================================================
-- Version: 1.0
-- Date: December 10, 2025
-- Convention: lowercase table names with underscores
-- ============================================================

-- Drop existing tables (in correct order to handle foreign keys)
DROP TABLE IF EXISTS chat_attachments;
DROP TABLE IF EXISTS chat_interactions;
DROP TABLE IF EXISTS chat_sessions;
DROP TABLE IF EXISTS api_logs;
DROP TABLE IF EXISTS approvals;
DROP TABLE IF EXISTS resources;
DROP TABLE IF EXISTS activity_logs;
DROP TABLE IF EXISTS user_sessions;
DROP TABLE IF EXISTS settings;
DROP TABLE IF EXISTS formula_components;
DROP TABLE IF EXISTS quotes;
DROP TABLE IF EXISTS formulas;
DROP TABLE IF EXISTS quote_templates;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;

-- ============================================================
-- 1. ROLES TABLE
-- ============================================================
CREATE TABLE roles (
    role_id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    role_name ENUM('capacity_admin', 'nsight_admin', 'user') UNIQUE NOT NULL,
    permissions TEXT,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 2. USERS TABLE
-- ============================================================
CREATE TABLE users (
    user_id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    role_id INT UNSIGNED,
    last_login DATETIME,
    status ENUM('Active', 'Inactive') DEFAULT 'Active',
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE SET NULL,
    INDEX idx_role_id (role_id),
    INDEX idx_status (status),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3. FORMULAS TABLE
-- ============================================================
CREATE TABLE formulas (
    formula_id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    formula_name VARCHAR(200) NOT NULL,
    created_by INT UNSIGNED,
    density DECIMAL(10, 3),
    total_cost DECIMAL(12, 2),
    margin DECIMAL(5, 2),
    container_cost DECIMAL(10, 2),
    status ENUM('Draft', 'Pending', 'Approved', 'Rejected') DEFAULT 'Draft',
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_created_by (created_by),
    INDEX idx_status (status),
    INDEX idx_created_on (created_on)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. FORMULA COMPONENTS TABLE
-- ============================================================
CREATE TABLE formula_components (
    component_id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    formula_id INT UNSIGNED NOT NULL,
    chemical_name VARCHAR(255) NOT NULL,
    percentage DECIMAL(5, 2) NOT NULL,
    cost_per_lb DECIMAL(10, 2),
    hazard_class VARCHAR(50),
    
    FOREIGN KEY (formula_id) REFERENCES formulas(formula_id) ON DELETE CASCADE,
    INDEX idx_formula_id (formula_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 5. QUOTE TEMPLATES TABLE
-- ============================================================
CREATE TABLE quote_templates (
    template_id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    template_name VARCHAR(100) NOT NULL,
    layout TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 6. QUOTES TABLE
-- ============================================================
CREATE TABLE quotes (
    quote_id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    formula_id INT UNSIGNED,
    created_by INT UNSIGNED,
    customer_name VARCHAR(200),
    total_price DECIMAL(12, 2),
    status ENUM('Draft', 'Pending_Approval', 'Approved', 'Rejected') DEFAULT 'Draft',
    template_id INT UNSIGNED,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (formula_id) REFERENCES formulas(formula_id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (template_id) REFERENCES quote_templates(template_id) ON DELETE SET NULL,
    INDEX idx_formula_id (formula_id),
    INDEX idx_created_by (created_by),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 7. RESOURCES TABLE (with approval workflow)
-- ============================================================
CREATE TABLE resources (
    resource_id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size VARCHAR(50) NOT NULL,
    file_url TEXT NOT NULL,
    category ENUM('formulas', 'quotes', 'knowledge', 'other') NOT NULL DEFAULT 'other',
    uploaded_by INT UNSIGNED NOT NULL,
    uploaded_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    approval_status ENUM('Approved', 'Pending', 'Rejected') NOT NULL DEFAULT 'Pending',
    approved_by INT UNSIGNED NULL,
    approved_on TIMESTAMP NULL,
    
    FOREIGN KEY (uploaded_by) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_category (category),
    INDEX idx_uploaded_by (uploaded_by),
    INDEX idx_uploaded_on (uploaded_on),
    INDEX idx_approval_status (approval_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 8. APPROVALS TABLE (supports Formula, Quote, Resource)
-- ============================================================
CREATE TABLE approvals (
    approval_id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    entity_type ENUM('Formula', 'Quote', 'Resource') NOT NULL,
    entity_id INT UNSIGNED NOT NULL,
    approver_id INT UNSIGNED NOT NULL,
    decision ENUM('Pending', 'Approved', 'Rejected', 'Returned') NOT NULL DEFAULT 'Pending',
    decision_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    comments TEXT,
    
    FOREIGN KEY (approver_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_approver_id (approver_id),
    INDEX idx_decision (decision),
    INDEX idx_decision_date (decision_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 9. CHAT SESSIONS TABLE
-- ============================================================
CREATE TABLE chat_sessions (
    chat_session_id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNSIGNED NOT NULL,
    session_title VARCHAR(200),
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP NULL,
    status ENUM('Active', 'Completed', 'Pending_Approval', 'Approved', 'Rejected', 'Archived') DEFAULT 'Active',
    linked_formula_id INT UNSIGNED NULL,
    summary TEXT,
    metadata TEXT,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (linked_formula_id) REFERENCES formulas(formula_id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_start_time (start_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 10. CHAT INTERACTIONS TABLE
-- ============================================================
CREATE TABLE chat_interactions (
    interaction_id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    chat_session_id INT UNSIGNED NOT NULL,
    prompt TEXT NOT NULL,
    response TEXT NULL,
    model_name VARCHAR(50),
    tokens_used INT NULL,
    response_time_ms INT NULL,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (chat_session_id) REFERENCES chat_sessions(chat_session_id) ON DELETE CASCADE,
    INDEX idx_chat_session_id (chat_session_id),
    INDEX idx_created_on (created_on)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 11. CHAT ATTACHMENTS TABLE (files & resource references)
-- ============================================================
CREATE TABLE chat_attachments (
    attachment_id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    interaction_id INT UNSIGNED NOT NULL,
    attachment_type ENUM('local_file', 'resource_reference') NOT NULL,
    file_name VARCHAR(255),
    file_url TEXT,
    resource_id INT UNSIGNED NULL,
    file_size VARCHAR(50),
    mime_type VARCHAR(100),
    uploaded_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (interaction_id) REFERENCES chat_interactions(interaction_id) ON DELETE CASCADE,
    FOREIGN KEY (resource_id) REFERENCES resources(resource_id) ON DELETE SET NULL,
    INDEX idx_interaction_id (interaction_id),
    INDEX idx_resource_id (resource_id),
    INDEX idx_attachment_type (attachment_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 12. API LOGS TABLE
-- ============================================================
CREATE TABLE api_logs (
    api_log_id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    chat_session_id INT UNSIGNED,
    endpoint VARCHAR(100),
    model VARCHAR(50),
    tokens_in INT,
    tokens_out INT,
    total_tokens INT,
    latency_ms INT,
    cost_usd DECIMAL(8, 4),
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (chat_session_id) REFERENCES chat_sessions(chat_session_id) ON DELETE SET NULL,
    INDEX idx_chat_session_id (chat_session_id),
    INDEX idx_created_on (created_on)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 13. USER SESSIONS TABLE
-- ============================================================
CREATE TABLE user_sessions (
    session_id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNSIGNED NOT NULL,
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    logout_time TIMESTAMP NULL,
    ip_address VARCHAR(45),
    device_info VARCHAR(255),
    auth_method ENUM('SSO', 'Password'),
    token_id VARCHAR(200),
    status ENUM('Active', 'Expired', 'Terminated') DEFAULT 'Active',
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_login_time (login_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 14. ACTIVITY LOGS TABLE
-- ============================================================
CREATE TABLE activity_logs (
    log_id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNSIGNED,
    module VARCHAR(100),
    action VARCHAR(255),
    record_id INT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    details TEXT,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_timestamp (timestamp),
    INDEX idx_module (module)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 15. SETTINGS TABLE
-- ============================================================
CREATE TABLE settings (
    setting_id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    category ENUM('Branding', 'DecisionTree', 'QuoteTemplate', 'AIConfig'),
    `key` VARCHAR(100) NOT NULL,
    value TEXT,
    updated_by INT UNSIGNED,
    updated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL,
    UNIQUE KEY unique_category_key (category, `key`),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-approve knowledge base resources
DELIMITER //
CREATE TRIGGER before_resource_insert
BEFORE INSERT ON resources
FOR EACH ROW
BEGIN
    IF NEW.category = 'knowledge' THEN
        SET NEW.approval_status = 'Approved';
        SET NEW.approved_by = NEW.uploaded_by;
        SET NEW.approved_on = NOW();
    END IF;
END//
DELIMITER ;

ALTER TABLE users 
ADD COLUMN supabase_id VARCHAR(255) UNIQUE AFTER user_id,
ADD INDEX idx_supabase_id (supabase_id);

-- ============================================================
-- SAMPLE DATA
-- ============================================================

-- Insert default roles
INSERT INTO roles (role_name, permissions) VALUES
('capacity_admin', '{"all": true, "can_approve_resources": true, "can_manage_users": true, "can_view_all_data": true}'),
('nsight_admin', '{"all": true, "can_approve_resources": true, "can_manage_users": true, "can_view_all_data": true}'),
('user', '{"formulas": ["read", "create"], "quotes": ["read"], "chat": ["read", "create"]}');

-- Insert default users
INSERT INTO users (username, email, password_hash, role_id, status) VALUES
('Capacity Admin', 'admin@capacitychemical.com', '$2a$10$placeholder_hash_here', 1, 'Active'),
('Nsight Admin', 'admin@nsight.com', '$2a$10$placeholder_hash_here', 2, 'Active'),
('User', 'user@capacitychemical.com', '$2a$10$placeholder_hash_here', 3, 'Active');

-- Insert sample resources
-- INSERT INTO resources (file_name, file_type, file_size, file_url, category, uploaded_by, description, approval_status, approved_by, approved_on) VALUES
-- ('Chemical Formulas Handbook', 'PDF Document', '24 MB', 'https://example.com/files/formulas-handbook.pdf', 'knowledge', 1, 'Comprehensive guide to chemical formulas', 'Approved', 1, NOW()),
-- ('Safety Datasheet', 'PDF Document', '3.2 MB', 'https://example.com/files/safety-datasheet.pdf', 'knowledge', 1, 'Safety protocols and guidelines', 'Approved', 1, NOW()),
-- ('Mixing Guide', 'PDF Document', '7.1 MB', 'https://example.com/files/mixing-guide.pdf', 'knowledge', 1, 'Step-by-step mixing procedures', 'Approved', 1, NOW()),
-- ('Supplier Quotes Q4', 'Excel Spreadsheet', '120 KB', 'https://example.com/files/quotes-q4.xlsx', 'quotes', 1, 'Q4 2024 supplier quotes', 'Pending', NULL, NULL),
-- ('Application Notes', 'PDF Document', '1.1 MB', 'https://example.com/files/app-notes.pdf', 'knowledge', 1, 'Product application guidelines', 'Approved', 1, NOW());

-- Insert default quote template
-- INSERT INTO quote_templates (template_name, layout, is_default) VALUES
-- ('Standard Quote Template', '{"header": "Capacity Chemical", "footer": "Terms & Conditions"}', TRUE);

-- ============================================================
-- END OF SCHEMA
-- ============================================================
