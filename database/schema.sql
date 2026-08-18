-- EstateAI database schema - implementation will be added step by step.
-- ============================================================
-- REAL ESTATE AI/ML PLATFORM
-- Database: estate_ai
-- Compatible with MySQL / MariaDB / XAMPP
-- ============================================================

CREATE DATABASE IF NOT EXISTS estate_ai
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE estate_ai;


-- ============================================================
-- 1. USERS
-- ============================================================

CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    full_name VARCHAR(100) NOT NULL,

    username VARCHAR(50) NOT NULL UNIQUE,

    email VARCHAR(150) NOT NULL UNIQUE,

    mobile VARCHAR(20) UNIQUE,

    password_hash VARCHAR(255) NOT NULL,

    role ENUM('buyer', 'seller', 'admin') NOT NULL DEFAULT 'buyer',

    status ENUM('active', 'inactive', 'suspended', 'pending') 
        NOT NULL DEFAULT 'active',

    profile_image VARCHAR(500) DEFAULT NULL,

    email_verified BOOLEAN NOT NULL DEFAULT FALSE,

    mobile_verified BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_users_role (role),
    INDEX idx_users_status (status),
    INDEX idx_users_created_at (created_at)
);


-- ============================================================
-- 2. PASSWORD RESET TOKENS
-- ============================================================

CREATE TABLE password_reset_tokens (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT UNSIGNED NOT NULL,

    token VARCHAR(255) NOT NULL UNIQUE,

    expires_at DATETIME NOT NULL,

    used BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_reset_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    INDEX idx_reset_user (user_id),
    INDEX idx_reset_token (token),
    INDEX idx_reset_expiry (expires_at)
);


-- ============================================================
-- 3. PROPERTIES
-- ============================================================

CREATE TABLE properties (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    seller_id BIGINT UNSIGNED NOT NULL,

    title VARCHAR(200) NOT NULL,

    description TEXT NOT NULL,

    property_type ENUM(
        'apartment',
        'villa',
        'house',
        'plot',
        'office',
        'shop',
        'warehouse',
        'commercial',
        'farmhouse',
        'other'
    ) NOT NULL,

    price DECIMAL(15,2) NOT NULL,

    property_size DECIMAL(12,2) NOT NULL,

    size_unit ENUM(
        'sq_ft',
        'sq_yd',
        'sq_m',
        'acre',
        'hectare'
    ) NOT NULL DEFAULT 'sq_ft',

    carpet_area DECIMAL(12,2) DEFAULT NULL,

    built_up_area DECIMAL(12,2) DEFAULT NULL,

    bedrooms TINYINT UNSIGNED DEFAULT NULL,

    bathrooms TINYINT UNSIGNED DEFAULT NULL,

    floors TINYINT UNSIGNED DEFAULT NULL,

    property_age SMALLINT UNSIGNED DEFAULT NULL,

    furnished_status ENUM(
        'unfurnished',
        'semi_furnished',
        'fully_furnished'
    ) DEFAULT NULL,

    parking_available BOOLEAN NOT NULL DEFAULT FALSE,

    parking_spaces TINYINT UNSIGNED DEFAULT NULL,

    city VARCHAR(100) NOT NULL,

    state VARCHAR(100) NOT NULL,

    area VARCHAR(150) NOT NULL,

    address VARCHAR(500) NOT NULL,

    pincode VARCHAR(20) DEFAULT NULL,

    latitude DECIMAL(10,8) DEFAULT NULL,

    longitude DECIMAL(11,8) DEFAULT NULL,

    status ENUM(
        'draft',
        'active',
        'sold',
        'reported',
        'removed'
    ) NOT NULL DEFAULT 'draft',

    report_count INT UNSIGNED NOT NULL DEFAULT 0,

    views_count INT UNSIGNED NOT NULL DEFAULT 0,

    listed_at TIMESTAMP NULL DEFAULT NULL,

    sold_at TIMESTAMP NULL DEFAULT NULL,

    removed_at TIMESTAMP NULL DEFAULT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_property_seller
        FOREIGN KEY (seller_id)
        REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    INDEX idx_properties_seller (seller_id),

    INDEX idx_properties_type (property_type),

    INDEX idx_properties_price (price),

    INDEX idx_properties_size (property_size),

    INDEX idx_properties_city (city),

    INDEX idx_properties_area (area),

    INDEX idx_properties_status (status),

    INDEX idx_properties_location (latitude, longitude),

    INDEX idx_properties_created (created_at)
);


-- ============================================================
-- 4. PROPERTY MEDIA
-- ============================================================

CREATE TABLE property_media (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    property_id BIGINT UNSIGNED NOT NULL,

    media_type ENUM('image', 'video') NOT NULL,

    media_url VARCHAR(500) NOT NULL,

    is_primary BOOLEAN NOT NULL DEFAULT FALSE,

    sort_order INT UNSIGNED NOT NULL DEFAULT 0,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_media_property
        FOREIGN KEY (property_id)
        REFERENCES properties(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    INDEX idx_media_property (property_id),

    INDEX idx_media_type (media_type)
);


-- ============================================================
-- 5. AMENITIES
-- ============================================================

CREATE TABLE amenities (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100) NOT NULL UNIQUE,

    icon VARCHAR(100) DEFAULT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 6. PROPERTY AMENITIES
-- ============================================================

CREATE TABLE property_amenities (
    property_id BIGINT UNSIGNED NOT NULL,

    amenity_id INT UNSIGNED NOT NULL,

    PRIMARY KEY (property_id, amenity_id),

    CONSTRAINT fk_property_amenity_property
        FOREIGN KEY (property_id)
        REFERENCES properties(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_property_amenity_amenity
        FOREIGN KEY (amenity_id)
        REFERENCES amenities(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);


-- ============================================================
-- 7. REPORTS
-- ============================================================

CREATE TABLE reports (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    property_id BIGINT UNSIGNED NOT NULL,

    reported_by BIGINT UNSIGNED NOT NULL,

    reason ENUM(
        'fake_property',
        'incorrect_information',
        'duplicate_listing',
        'wrong_price',
        'inappropriate_content',
        'scam',
        'other'
    ) NOT NULL,

    description TEXT DEFAULT NULL,

    status ENUM(
        'pending',
        'reviewed',
        'resolved',
        'rejected'
    ) NOT NULL DEFAULT 'pending',

    reviewed_by BIGINT UNSIGNED DEFAULT NULL,

    reviewed_at DATETIME DEFAULT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_report_property
        FOREIGN KEY (property_id)
        REFERENCES properties(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_report_user
        FOREIGN KEY (reported_by)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_report_reviewer
        FOREIGN KEY (reviewed_by)
        REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    INDEX idx_reports_property (property_id),

    INDEX idx_reports_user (reported_by),

    INDEX idx_reports_status (status)
);


-- ============================================================
-- 8. FAVORITES
-- ============================================================

CREATE TABLE favorites (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT UNSIGNED NOT NULL,

    property_id BIGINT UNSIGNED NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_favorite_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_favorite_property
        FOREIGN KEY (property_id)
        REFERENCES properties(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    UNIQUE KEY unique_favorite (user_id, property_id),

    INDEX idx_favorites_user (user_id),

    INDEX idx_favorites_property (property_id)
);


-- ============================================================
-- 9. PROPERTY COMPARISON
-- ============================================================

CREATE TABLE comparisons (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT UNSIGNED NOT NULL,

    property_id BIGINT UNSIGNED NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_comparison_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_comparison_property
        FOREIGN KEY (property_id)
        REFERENCES properties(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    UNIQUE KEY unique_comparison (user_id, property_id),

    INDEX idx_comparison_user (user_id),

    INDEX idx_comparison_property (property_id)
);


-- ============================================================
-- 10. ML PRICE PREDICTIONS
-- ============================================================

CREATE TABLE predictions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT UNSIGNED DEFAULT NULL,

    city VARCHAR(100) NOT NULL,

    state VARCHAR(100) DEFAULT NULL,

    area VARCHAR(150) NOT NULL,

    property_type VARCHAR(50) NOT NULL,

    property_size DECIMAL(12,2) NOT NULL,

    size_unit VARCHAR(20) NOT NULL DEFAULT 'sq_ft',

    bedrooms TINYINT UNSIGNED DEFAULT NULL,

    bathrooms TINYINT UNSIGNED DEFAULT NULL,

    property_age SMALLINT UNSIGNED DEFAULT NULL,

    furnished_status VARCHAR(50) DEFAULT NULL,

    parking_available BOOLEAN DEFAULT NULL,

    predicted_price DECIMAL(15,2) NOT NULL,

    lower_price DECIMAL(15,2) DEFAULT NULL,

    upper_price DECIMAL(15,2) DEFAULT NULL,

    model_name VARCHAR(100) DEFAULT NULL,

    model_version VARCHAR(50) DEFAULT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_prediction_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    INDEX idx_predictions_user (user_id),

    INDEX idx_predictions_city (city),

    INDEX idx_predictions_area (area),

    INDEX idx_predictions_created (created_at)
);


-- ============================================================
-- 11. CHATBOT CONVERSATIONS
-- ============================================================

CREATE TABLE chatbot_conversations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT UNSIGNED DEFAULT NULL,

    title VARCHAR(200) DEFAULT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_chat_conversation_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    INDEX idx_chat_conversation_user (user_id)
);


-- ============================================================
-- 12. CHATBOT MESSAGES
-- ============================================================

CREATE TABLE chatbot_messages (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    conversation_id BIGINT UNSIGNED NOT NULL,

    sender ENUM('user', 'assistant') NOT NULL,

    message TEXT NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_chat_message_conversation
        FOREIGN KEY (conversation_id)
        REFERENCES chatbot_conversations(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    INDEX idx_chat_messages_conversation (conversation_id),

    INDEX idx_chat_messages_created (created_at)
);


-- ============================================================
-- 13. LOGIN / ACTIVITY LOG
-- ============================================================

CREATE TABLE user_activity_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT UNSIGNED DEFAULT NULL,

    action VARCHAR(100) NOT NULL,

    ip_address VARCHAR(45) DEFAULT NULL,

    user_agent VARCHAR(500) DEFAULT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_activity_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    INDEX idx_activity_user (user_id),

    INDEX idx_activity_action (action),

    INDEX idx_activity_created (created_at)
);


-- ============================================================
-- 14. DEFAULT AMENITIES
-- ============================================================

INSERT INTO amenities (name, icon) VALUES
('Parking', 'parking'),
('Swimming Pool', 'pool'),
('Gym', 'gym'),
('Security', 'security'),
('Garden', 'garden'),
('Lift', 'lift'),
('Balcony', 'balcony'),
('CCTV', 'cctv'),
('Power Backup', 'power'),
('Water Supply', 'water'),
('Air Conditioning', 'ac'),
('Club House', 'club'),
('Playground', 'playground'),
('Fire Safety', 'fire'),
('WiFi', 'wifi');


-- ============================================================
-- DATABASE COMPLETE
-- ============================================================