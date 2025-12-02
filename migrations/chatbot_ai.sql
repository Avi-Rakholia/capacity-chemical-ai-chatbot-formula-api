CREATE TABLE roles (
    role_id INT PRIMARY KEY AUTO_INCREMENT,
    role_name ENUM('Admin','Supervisor','Chemist','Sales','Worker') UNIQUE,
    permissions JSON
);

CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100),
    email VARCHAR(150) UNIQUE,
    role_id INT,
    last_login DATETIME,
    status ENUM('Active','Inactive'),
    FOREIGN KEY (role_id) REFERENCES roles(role_id)
);

CREATE TABLE formulas (
    formula_id INT PRIMARY KEY AUTO_INCREMENT,
    formula_name VARCHAR(200),
    created_by INT,
    density DECIMAL(10,3),
    total_cost DECIMAL(12,2),
    margin DECIMAL(5,2),
    container_cost DECIMAL(10,2),
    status ENUM('Draft','Pending','Approved','Rejected'),
    created_on DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(user_id),
    INDEX idx_created_by (created_by)
);

CREATE TABLE formula_components (
    id INT PRIMARY KEY AUTO_INCREMENT,
    formula_id INT,
    chemical_name VARCHAR(255),
    percentage DECIMAL(5,2),
    cost_per_lb DECIMAL(10,2),
    hazard_class VARCHAR(50),
    FOREIGN KEY (formula_id) REFERENCES formulas(formula_id),
    INDEX idx_formula_id (formula_id)
);

CREATE TABLE quote_templates (
    template_id INT PRIMARY KEY AUTO_INCREMENT,
    template_name VARCHAR(100),
    layout JSON,
    is_default BOOLEAN
);

CREATE TABLE quotes (
    quote_id INT PRIMARY KEY AUTO_INCREMENT,
    formula_id INT,
    created_by INT,
    customer_name VARCHAR(200),
    total_price DECIMAL(12,2),
    status ENUM('Draft','Pending Approval','Approved','Rejected'),
    template_id INT,
    created_on DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (formula_id) REFERENCES formulas(formula_id),
    FOREIGN KEY (created_by) REFERENCES users(user_id),
    FOREIGN KEY (template_id) REFERENCES quote_templates(template_id),
    INDEX idx_formula_id (formula_id),
    INDEX idx_created_by (created_by)
);

CREATE TABLE approvals (
    approval_id INT PRIMARY KEY AUTO_INCREMENT,
    entity_type ENUM('Formula','Quote'),
    entity_id INT,
    approver_id INT,
    decision ENUM('Pending','Approved','Rejected','Returned'),
    decision_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    comments TEXT,
    FOREIGN KEY (approver_id) REFERENCES users(user_id),
    INDEX idx_approver_id (approver_id)
);

CREATE TABLE chat_sessions (
    chat_session_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    session_title VARCHAR(200),
    start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    end_time DATETIME,
    status ENUM('Active','Completed','Pending Approval','Approved','Rejected','Archived'),
    linked_formula_id INT,
    summary TEXT,
    metadata JSON,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (linked_formula_id) REFERENCES formulas(formula_id),
    INDEX idx_user_id (user_id)
);

CREATE TABLE chat_interactions (
    interaction_id INT PRIMARY KEY AUTO_INCREMENT,
    chat_session_id INT,
    prompt TEXT,
    response TEXT,
    model_name VARCHAR(50),
    tokens_used INT,
    response_time_ms INT,
    created_on DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chat_session_id) REFERENCES chat_sessions(chat_session_id),
    INDEX idx_chat_session_id (chat_session_id)
);

CREATE TABLE api_logs (
    api_log_id INT PRIMARY KEY AUTO_INCREMENT,
    chat_session_id INT,
    endpoint VARCHAR(100),
    model VARCHAR(50),
    tokens_in INT,
    tokens_out INT,
    total_tokens INT,
    latency_ms INT,
    cost_usd DECIMAL(8,4),
    created_on DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chat_session_id) REFERENCES chat_sessions(chat_session_id),
    INDEX idx_chat_session_id (chat_session_id)
);

CREATE TABLE user_sessions (
    session_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    logout_time DATETIME,
    ip_address VARCHAR(45),
    device_info VARCHAR(255),
    auth_method ENUM('SSO','Password'),
    token_id VARCHAR(200),
    status ENUM('Active','Expired','Terminated'),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    INDEX idx_user_id (user_id)
);

CREATE TABLE activity_logs (
    log_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    module VARCHAR(100),
    action VARCHAR(255),
    record_id INT,
    timestamp DATETIME,
    ip_address VARCHAR(45),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE settings (
    setting_id INT PRIMARY KEY AUTO_INCREMENT,
    category ENUM('Branding','DecisionTree','QuoteTemplate','AIConfig'),
    `key` VARCHAR(100),
    value JSON,
    updated_by INT,
    FOREIGN KEY (updated_by) REFERENCES users(user_id)
);

```'below used in free sql server```

CREATE TABLE roles(
    role_id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    role_name ENUM(
        'Admin',
        'Supervisor',
        'Chemist',
        'Sales',
        'Worker'
    ) UNIQUE,
    permissions TEXT
);
CREATE TABLE users(
    user_id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    NAME VARCHAR(100),
    email VARCHAR(150) UNIQUE,
    role_id INT UNSIGNED,
    last_login DATETIME,
STATUS ENUM
    ('Active', 'Inactive'),
    FOREIGN KEY(role_id) REFERENCES roles(role_id)
);
CREATE TABLE formulas(
    formula_id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    formula_name VARCHAR(200),
    created_by INT UNSIGNED,
    density DECIMAL(10, 3),
    total_cost DECIMAL(12, 2),
    margin DECIMAL(5, 2),
    container_cost DECIMAL(10, 2),
STATUS ENUM
    (
        'Draft',
        'Pending',
        'Approved',
        'Rejected'
    ),
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(created_by) REFERENCES users(user_id),
    INDEX idx_created_by(created_by)
);
CREATE TABLE formula_components(
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    formula_id INT UNSIGNED,
    chemical_name VARCHAR(255),
    percentage DECIMAL(5, 2),
    cost_per_lb DECIMAL(10, 2),
    hazard_class VARCHAR(50),
    FOREIGN KEY(formula_id) REFERENCES formulas(formula_id),
    INDEX idx_formula_id(formula_id)
);
CREATE TABLE quote_templates(
    template_id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    template_name VARCHAR(100),
    layout TEXT,
    is_default BOOLEAN
);
CREATE TABLE quotes(
    quote_id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    formula_id INT UNSIGNED,
    created_by INT UNSIGNED,
    customer_name VARCHAR(200),
    total_price DECIMAL(12, 2),
STATUS ENUM
    (
        'Draft',
        'Pending_Approval',
        'Approved',
        'Rejected'
    ),
    template_id INT UNSIGNED,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(formula_id) REFERENCES formulas(formula_id),
    FOREIGN KEY(created_by) REFERENCES users(user_id),
    FOREIGN KEY(template_id) REFERENCES quote_templates(template_id),
    INDEX idx_formula_id(formula_id),
    INDEX idx_created_by(created_by)
);
CREATE TABLE approvals(
    approval_id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    entity_type ENUM('Formula', 'Quote'),
    entity_id INT UNSIGNED,
    approver_id INT UNSIGNED,
    decision ENUM(
        'Pending',
        'Approved',
        'Rejected',
        'Returned'
    ),
    decision_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    comments TEXT,
    FOREIGN KEY(approver_id) REFERENCES users(user_id),
    INDEX idx_approver_id(approver_id)
);
CREATE TABLE chat_sessions(
    chat_session_id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNSIGNED,
    session_title VARCHAR(200),
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
STATUS ENUM
    (
        'Active',
        'Completed',
        'Pending_Approval',
        'Approved',
        'Rejected',
        'Archived'
    ),
    linked_formula_id INT UNSIGNED,
    summary TEXT,
    metadata TEXT,
    FOREIGN KEY(user_id) REFERENCES users(user_id),
    FOREIGN KEY(linked_formula_id) REFERENCES formulas(formula_id),
    INDEX idx_user_id(user_id)
);
CREATE TABLE chat_interactions(
    interaction_id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    chat_session_id INT UNSIGNED,
    prompt TEXT,
    response TEXT,
    model_name VARCHAR(50),
    tokens_used INT,
    response_time_ms INT,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(chat_session_id) REFERENCES chat_sessions(chat_session_id),
    INDEX idx_chat_session_id(chat_session_id)
);
CREATE TABLE api_logs(
    api_log_id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    chat_session_id INT UNSIGNED,
    ENDPOINT VARCHAR(100),
    model VARCHAR(50),
    tokens_in INT,
    tokens_out INT,
    total_tokens INT,
    latency_ms INT,
    cost_usd DECIMAL(8, 4),
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(chat_session_id) REFERENCES chat_sessions(chat_session_id),
    INDEX idx_chat_session_id(chat_session_id)
);
CREATE TABLE user_sessions(
    session_id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNSIGNED,
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    logout_time TIMESTAMP,
    ip_address VARCHAR(45),
    device_info VARCHAR(255),
    auth_method ENUM('SSO', 'Password'),
    token_id VARCHAR(200),
STATUS ENUM
    ('Active', 'Expired', 'Terminated'),
    FOREIGN KEY(user_id) REFERENCES users(user_id),
    INDEX idx_user_id(user_id)
);
CREATE TABLE activity_logs(
    log_id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNSIGNED,
    module VARCHAR(100),
    ACTION VARCHAR(255),
    record_id INT,
    TIMESTAMP TIMESTAMP,
    ip_address VARCHAR(45),
    FOREIGN KEY(user_id) REFERENCES users(user_id)
);
CREATE TABLE settings(
    setting_id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    category ENUM(
        'Branding',
        'DecisionTree',
        'QuoteTemplate',
        'AIConfig'
    ),
    `key` VARCHAR(100),
VALUE TEXT
    ,
    updated_by INT UNSIGNED,
    FOREIGN KEY(updated_by) REFERENCES users(user_id)
);