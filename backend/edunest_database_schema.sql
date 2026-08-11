-- ============================================================================
-- THE EDUNEST — B2B PRESCHOOL & SCHOOL PROCUREMENT PLATFORM
-- Production MySQL 8+ Database Schema
-- Engine: InnoDB | Charset: utf8mb4 | Collation: utf8mb4_0900_ai_ci
-- ============================================================================
-- NAMING CONVENTIONS
--   - Tables: snake_case, plural (e.g. schools, order_items)
--   - Columns: snake_case
--   - PK: `id` BIGINT UNSIGNED AUTO_INCREMENT (fast joins, clustered index)
--   - Public/external ref: `uuid` CHAR(36) UNIQUE, DEFAULT (UUID())
--   - FK columns: `<referenced_table_singular>_id`
--   - Booleans: `is_<state>` TINYINT(1)
--   - Timestamps: created_at, updated_at (auto), deleted_at (soft delete)
--   - Money: DECIMAL(12,2) minor-unit-safe; currency stored alongside
--   - Enumerations implemented as ENUM for small closed sets; lookup tables
--     used where the set of values is business-managed / needs metadata
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ENGINE_SUBSTITUTION';

CREATE DATABASE IF NOT EXISTS edunest
  CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE edunest;

-- ============================================================================
-- MODULE 1: AUTHENTICATION & ACCESS CONTROL
-- ============================================================================

CREATE TABLE roles (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid          CHAR(36) NOT NULL DEFAULT (UUID()),
  name          VARCHAR(60)  NOT NULL,                 -- e.g. school_admin, dealer, super_admin
  slug          VARCHAR(60)  NOT NULL,
  description   VARCHAR(255) NULL,
  is_system     TINYINT(1)   NOT NULL DEFAULT 0,        -- protects built-in roles from deletion
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at    TIMESTAMP    NULL,
  UNIQUE KEY uq_roles_slug (slug),
  UNIQUE KEY uq_roles_uuid (uuid)
) ENGINE=InnoDB;

CREATE TABLE permissions (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid          CHAR(36) NOT NULL DEFAULT (UUID()),
  name          VARCHAR(100) NOT NULL,                  -- e.g. products.create
  module        VARCHAR(60)  NOT NULL,                  -- e.g. products
  description   VARCHAR(255) NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_permissions_name (name),
  KEY idx_permissions_module (module)
) ENGINE=InnoDB;

CREATE TABLE role_permissions (
  role_id       BIGINT UNSIGNED NOT NULL,
  permission_id BIGINT UNSIGNED NOT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (role_id, permission_id),
  CONSTRAINT fk_rp_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_rp_permission FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE users (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid              CHAR(36) NOT NULL DEFAULT (UUID()),
  full_name         VARCHAR(150) NOT NULL,
  email             VARCHAR(190) NOT NULL,
  phone             VARCHAR(20)  NULL,
  password_hash     VARCHAR(255) NOT NULL,              -- bcrypt/argon2id hash, never plaintext
  user_type         ENUM('school','dealer','admin','staff') NOT NULL,
  status            ENUM('active','inactive','suspended','pending_verification') NOT NULL DEFAULT 'pending_verification',
  email_verified_at TIMESTAMP NULL,
  phone_verified_at TIMESTAMP NULL,
  last_login_at     TIMESTAMP NULL,
  failed_login_count SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  locked_until      TIMESTAMP NULL,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at        TIMESTAMP NULL,
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_uuid (uuid),
  KEY idx_users_phone (phone),
  KEY idx_users_type_status (user_type, status)
) ENGINE=InnoDB;

CREATE TABLE user_roles (
  user_id    BIGINT UNSIGNED NOT NULL,
  role_id    BIGINT UNSIGNED NOT NULL,
  assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, role_id),
  CONSTRAINT fk_ur_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_ur_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE sessions (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid          CHAR(36) NOT NULL DEFAULT (UUID()),
  user_id       BIGINT UNSIGNED NOT NULL,
  refresh_token_hash VARCHAR(255) NOT NULL,
  ip_address    VARCHAR(45) NULL,
  user_agent    VARCHAR(255) NULL,
  expires_at    TIMESTAMP NOT NULL,
  revoked_at    TIMESTAMP NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_sessions_uuid (uuid),
  KEY idx_sessions_user (user_id),
  KEY idx_sessions_expires (expires_at),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE password_resets (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     BIGINT UNSIGNED NOT NULL,
  token_hash  VARCHAR(255) NOT NULL,
  expires_at  TIMESTAMP NOT NULL,
  used_at     TIMESTAMP NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_pwreset_user (user_id),
  KEY idx_pwreset_token (token_hash),
  CONSTRAINT fk_pwreset_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE otps (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     BIGINT UNSIGNED NULL,
  identifier  VARCHAR(190) NOT NULL,                    -- email or phone (pre-signup OTP too)
  otp_hash    VARCHAR(255) NOT NULL,
  purpose     ENUM('login','signup','password_reset','phone_verify','email_verify','transaction') NOT NULL,
  expires_at  TIMESTAMP NOT NULL,
  consumed_at TIMESTAMP NULL,
  attempt_count TINYINT UNSIGNED NOT NULL DEFAULT 0,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_otps_identifier (identifier, purpose),
  CONSTRAINT fk_otps_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE login_history (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     BIGINT UNSIGNED NOT NULL,
  ip_address  VARCHAR(45) NULL,
  user_agent  VARCHAR(255) NULL,
  status      ENUM('success','failed') NOT NULL,
  reason      VARCHAR(120) NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_loginhist_user_date (user_id, created_at),
  CONSTRAINT fk_loginhist_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE device_tokens (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     BIGINT UNSIGNED NOT NULL,
  device_token VARCHAR(255) NOT NULL,
  platform    ENUM('android','ios','web') NOT NULL,
  is_active   TINYINT(1) NOT NULL DEFAULT 1,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_device_token (device_token),
  KEY idx_devicetok_user (user_id),
  CONSTRAINT fk_devicetok_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ============================================================================
-- MODULE 2: SCHOOLS
-- ============================================================================

CREATE TABLE schools (
  id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid             CHAR(36) NOT NULL DEFAULT (UUID()),
  user_id          BIGINT UNSIGNED NOT NULL,             -- primary login/owner account
  school_name      VARCHAR(200) NOT NULL,
  school_code      VARCHAR(30)  NOT NULL,                -- internal unique code
  school_type      ENUM('preschool','k12','play_school','montessori','other') NOT NULL DEFAULT 'preschool',
  board_affiliation VARCHAR(80) NULL,                    -- CBSE, ICSE, State Board, IB, etc.
  registration_number VARCHAR(80) NULL,
  gstin            VARCHAR(15) NULL,
  status           ENUM('active','inactive','pending_approval','blocked') NOT NULL DEFAULT 'pending_approval',
  logo_file_id     BIGINT UNSIGNED NULL,
  created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at       TIMESTAMP NULL,
  UNIQUE KEY uq_schools_code (school_code),
  UNIQUE KEY uq_schools_uuid (uuid),
  KEY idx_schools_user (user_id),
  KEY idx_schools_status (status),
  CONSTRAINT fk_schools_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE school_profiles (
  id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  school_id        BIGINT UNSIGNED NOT NULL,
  established_year YEAR NULL,
  website_url      VARCHAR(255) NULL,
  contact_email    VARCHAR(190) NULL,
  contact_phone    VARCHAR(20) NULL,
  alt_phone        VARCHAR(20) NULL,
  about            TEXT NULL,
  student_count    INT UNSIGNED NULL,
  teacher_count    INT UNSIGNED NULL,
  branch_count     INT UNSIGNED NOT NULL DEFAULT 1,
  created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_school_profile_school (school_id),
  CONSTRAINT fk_schoolprofile_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE school_addresses (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  school_id    BIGINT UNSIGNED NOT NULL,
  address_type ENUM('registered','billing','shipping','branch') NOT NULL DEFAULT 'registered',
  address_line1 VARCHAR(255) NOT NULL,
  address_line2 VARCHAR(255) NULL,
  city         VARCHAR(100) NOT NULL,
  state        VARCHAR(100) NOT NULL,
  country      VARCHAR(100) NOT NULL DEFAULT 'India',
  pincode      VARCHAR(12) NOT NULL,
  latitude     DECIMAL(10,7) NULL,
  longitude    DECIMAL(10,7) NULL,
  is_default   TINYINT(1) NOT NULL DEFAULT 0,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_school_addr_school (school_id),
  KEY idx_school_addr_pincode (pincode),
  CONSTRAINT fk_schooladdr_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE branches (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid         CHAR(36) NOT NULL DEFAULT (UUID()),
  school_id    BIGINT UNSIGNED NOT NULL,
  branch_name  VARCHAR(150) NOT NULL,
  branch_code  VARCHAR(30) NOT NULL,
  address_id   BIGINT UNSIGNED NULL,
  contact_phone VARCHAR(20) NULL,
  is_active    TINYINT(1) NOT NULL DEFAULT 1,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at   TIMESTAMP NULL,
  UNIQUE KEY uq_branch_code (school_id, branch_code),
  KEY idx_branches_school (school_id),
  CONSTRAINT fk_branches_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_branches_address FOREIGN KEY (address_id) REFERENCES school_addresses(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE school_documents (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  school_id    BIGINT UNSIGNED NOT NULL,
  document_type ENUM('registration_certificate','gst_certificate','pan_card','affiliation_letter','other') NOT NULL,
  file_id      BIGINT UNSIGNED NOT NULL,
  verified     TINYINT(1) NOT NULL DEFAULT 0,
  verified_at  TIMESTAMP NULL,
  verified_by  BIGINT UNSIGNED NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_schooldocs_school (school_id),
  CONSTRAINT fk_schooldocs_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_schooldocs_verifier FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;
-- Note: file_id FK to uploaded_files added in Module: File Storage (deferred FK below)

-- ============================================================================
-- MODULE 3: DEALERS
-- ============================================================================

CREATE TABLE dealers (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid          CHAR(36) NOT NULL DEFAULT (UUID()),
  user_id       BIGINT UNSIGNED NOT NULL,
  business_name VARCHAR(200) NOT NULL,
  dealer_code   VARCHAR(30) NOT NULL,
  gstin         VARCHAR(15) NULL,
  pan_number    VARCHAR(10) NULL,
  business_type ENUM('manufacturer','distributor','wholesaler','retailer') NOT NULL DEFAULT 'distributor',
  status        ENUM('active','inactive','pending_approval','blocked') NOT NULL DEFAULT 'pending_approval',
  commission_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  average_rating  DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  logo_file_id  BIGINT UNSIGNED NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at    TIMESTAMP NULL,
  UNIQUE KEY uq_dealers_code (dealer_code),
  UNIQUE KEY uq_dealers_uuid (uuid),
  KEY idx_dealers_user (user_id),
  KEY idx_dealers_status (status),
  CONSTRAINT fk_dealers_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE dealer_addresses (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  dealer_id     BIGINT UNSIGNED NOT NULL,
  address_type  ENUM('registered','warehouse','billing') NOT NULL DEFAULT 'registered',
  address_line1 VARCHAR(255) NOT NULL,
  address_line2 VARCHAR(255) NULL,
  city          VARCHAR(100) NOT NULL,
  state         VARCHAR(100) NOT NULL,
  country       VARCHAR(100) NOT NULL DEFAULT 'India',
  pincode       VARCHAR(12) NOT NULL,
  latitude      DECIMAL(10,7) NULL,
  longitude     DECIMAL(10,7) NULL,
  is_default    TINYINT(1) NOT NULL DEFAULT 0,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_dealer_addr_dealer (dealer_id),
  KEY idx_dealer_addr_pincode (pincode),
  CONSTRAINT fk_dealeraddr_dealer FOREIGN KEY (dealer_id) REFERENCES dealers(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Bridge table: dealers <-> products (many-to-many, a dealer can list many products,
-- a product can be sold by many dealers, each with their own price/stock)
CREATE TABLE dealer_products (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  dealer_id     BIGINT UNSIGNED NOT NULL,
  product_id    BIGINT UNSIGNED NOT NULL,
  dealer_sku    VARCHAR(60) NULL,
  dealer_price  DECIMAL(12,2) NOT NULL,
  stock_qty     INT UNSIGNED NOT NULL DEFAULT 0,
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_dealer_product (dealer_id, product_id),
  KEY idx_dealerprod_product (product_id),
  CONSTRAINT fk_dealerprod_dealer FOREIGN KEY (dealer_id) REFERENCES dealers(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_dealerprod_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE dealer_ratings (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  dealer_id     BIGINT UNSIGNED NOT NULL,
  school_id     BIGINT UNSIGNED NOT NULL,
  order_id      BIGINT UNSIGNED NULL,
  rating        TINYINT UNSIGNED NOT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_dealerrating_school_order (dealer_id, school_id, order_id),
  KEY idx_dealerratings_dealer (dealer_id),
  CONSTRAINT chk_dealer_rating_range CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT fk_dealerratings_dealer FOREIGN KEY (dealer_id) REFERENCES dealers(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_dealerratings_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE dealer_reviews (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  dealer_rating_id BIGINT UNSIGNED NOT NULL,
  review_text   TEXT NOT NULL,
  is_visible    TINYINT(1) NOT NULL DEFAULT 1,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_dealerreview_rating (dealer_rating_id),
  CONSTRAINT fk_dealerreviews_rating FOREIGN KEY (dealer_rating_id) REFERENCES dealer_ratings(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE dealer_documents (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  dealer_id     BIGINT UNSIGNED NOT NULL,
  document_type ENUM('gst_certificate','pan_card','trade_license','bank_proof','other') NOT NULL,
  file_id       BIGINT UNSIGNED NOT NULL,
  verified      TINYINT(1) NOT NULL DEFAULT 0,
  verified_at   TIMESTAMP NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_dealerdocs_dealer (dealer_id),
  CONSTRAINT fk_dealerdocs_dealer FOREIGN KEY (dealer_id) REFERENCES dealers(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE dealer_availability (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  dealer_id     BIGINT UNSIGNED NOT NULL,
  day_of_week   TINYINT UNSIGNED NOT NULL,               -- 0=Sunday .. 6=Saturday
  opens_at      TIME NULL,
  closes_at     TIME NULL,
  is_closed     TINYINT(1) NOT NULL DEFAULT 0,
  UNIQUE KEY uq_dealer_availability_day (dealer_id, day_of_week),
  CONSTRAINT chk_dealer_dow CHECK (day_of_week BETWEEN 0 AND 6),
  CONSTRAINT fk_dealeravail_dealer FOREIGN KEY (dealer_id) REFERENCES dealers(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ============================================================================
-- MODULE 4: CATALOG — CATEGORIES, BRANDS, PRODUCTS, VARIANTS, INVENTORY
-- ============================================================================

CREATE TABLE categories (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid          CHAR(36) NOT NULL DEFAULT (UUID()),
  parent_id     BIGINT UNSIGNED NULL,                    -- self-referencing: category / sub-category / sub-sub-category
  name          VARCHAR(120) NOT NULL,
  slug          VARCHAR(140) NOT NULL,
  icon_file_id  BIGINT UNSIGNED NULL,
  display_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at    TIMESTAMP NULL,
  UNIQUE KEY uq_categories_slug (slug),
  KEY idx_categories_parent (parent_id),
  CONSTRAINT fk_categories_parent FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;
-- Sub Categories requirement satisfied via categories.parent_id self-reference (unlimited depth, avoids table duplication)

CREATE TABLE brands (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid        CHAR(36) NOT NULL DEFAULT (UUID()),
  name        VARCHAR(120) NOT NULL,
  slug        VARCHAR(140) NOT NULL,
  logo_file_id BIGINT UNSIGNED NULL,
  is_active   TINYINT(1) NOT NULL DEFAULT 1,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_brands_slug (slug)
) ENGINE=InnoDB;

CREATE TABLE products (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid            CHAR(36) NOT NULL DEFAULT (UUID()),
  sku             VARCHAR(60) NOT NULL,
  name            VARCHAR(220) NOT NULL,
  slug            VARCHAR(250) NOT NULL,
  category_id     BIGINT UNSIGNED NOT NULL,
  brand_id        BIGINT UNSIGNED NULL,
  short_description VARCHAR(500) NULL,
  description     MEDIUMTEXT NULL,
  base_price      DECIMAL(12,2) NOT NULL,
  mrp             DECIMAL(12,2) NULL,
  tax_id          BIGINT UNSIGNED NULL,
  min_order_qty   INT UNSIGNED NOT NULL DEFAULT 1,
  weight_kg       DECIMAL(8,3) NULL,
  status          ENUM('draft','active','inactive','discontinued') NOT NULL DEFAULT 'draft',
  is_featured     TINYINT(1) NOT NULL DEFAULT 0,
  is_customizable TINYINT(1) NOT NULL DEFAULT 0,             -- gates the "Customize Product" flow (see customization_requests)
  avg_rating      DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  created_by      BIGINT UNSIGNED NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP NULL,
  UNIQUE KEY uq_products_sku (sku),
  UNIQUE KEY uq_products_slug (slug),
  KEY idx_products_category (category_id),
  KEY idx_products_brand (brand_id),
  KEY idx_products_status (status),
  FULLTEXT KEY ftx_products_name_desc (name, short_description),
  CONSTRAINT chk_products_price CHECK (base_price >= 0),
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_products_brand FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_products_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE product_images (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id  BIGINT UNSIGNED NOT NULL,
  file_id     BIGINT UNSIGNED NOT NULL,
  alt_text    VARCHAR(150) NULL,
  display_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  is_primary  TINYINT(1) NOT NULL DEFAULT 0,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_prodimg_product (product_id),
  CONSTRAINT fk_prodimg_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE product_videos (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id  BIGINT UNSIGNED NOT NULL,
  file_id     BIGINT UNSIGNED NULL,
  video_url   VARCHAR(500) NULL,                          -- external (YouTube/Vimeo) link
  title       VARCHAR(150) NULL,
  display_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_prodvid_product (product_id),
  CONSTRAINT fk_prodvid_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE specifications (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id  BIGINT UNSIGNED NOT NULL,
  spec_name   VARCHAR(100) NOT NULL,                      -- e.g. Material, Age Group, Dimensions
  spec_value  VARCHAR(255) NOT NULL,
  display_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  KEY idx_specs_product (product_id),
  CONSTRAINT fk_specs_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE attributes (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,                      -- e.g. Color, Size
  input_type  ENUM('select','text','number','boolean') NOT NULL DEFAULT 'select',
  UNIQUE KEY uq_attributes_name (name)
) ENGINE=InnoDB;

CREATE TABLE attribute_values (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  attribute_id  BIGINT UNSIGNED NOT NULL,
  value         VARCHAR(150) NOT NULL,
  UNIQUE KEY uq_attrval (attribute_id, value),
  CONSTRAINT fk_attrval_attribute FOREIGN KEY (attribute_id) REFERENCES attributes(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE product_variants (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid           CHAR(36) NOT NULL DEFAULT (UUID()),
  product_id     BIGINT UNSIGNED NOT NULL,
  variant_sku    VARCHAR(60) NOT NULL,
  attribute_summary VARCHAR(255) NULL,                    -- e.g. "Color: Red, Size: M" (denormalized for fast display)
  price_delta    DECIMAL(12,2) NOT NULL DEFAULT 0.00,      -- +/- vs product.base_price
  is_active      TINYINT(1) NOT NULL DEFAULT 1,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_variant_sku (variant_sku),
  KEY idx_variants_product (product_id),
  CONSTRAINT fk_variants_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Bridge table: variant <-> attribute value (many-to-many composite selection)
CREATE TABLE product_variant_attributes (
  variant_id        BIGINT UNSIGNED NOT NULL,
  attribute_value_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (variant_id, attribute_value_id),
  CONSTRAINT fk_pva_variant FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_pva_attrvalue FOREIGN KEY (attribute_value_id) REFERENCES attribute_values(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE inventory (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id    BIGINT UNSIGNED NOT NULL,
  variant_id    BIGINT UNSIGNED NULL,
  dealer_id     BIGINT UNSIGNED NULL,                     -- NULL = platform-owned stock
  warehouse_location VARCHAR(150) NULL,
  quantity_available INT NOT NULL DEFAULT 0,
  quantity_reserved  INT NOT NULL DEFAULT 0,               -- held for pending orders
  reorder_level INT UNSIGNED NOT NULL DEFAULT 10,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_inventory_scope (product_id, variant_id, dealer_id),
  KEY idx_inventory_dealer (dealer_id),
  CONSTRAINT chk_inventory_qty CHECK (quantity_available >= 0),
  CONSTRAINT fk_inventory_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_inventory_variant FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_inventory_dealer FOREIGN KEY (dealer_id) REFERENCES dealers(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- NOTE: MySQL/InnoDB does not permit FOREIGN KEY constraints on partitioned
-- tables. stock_history is partitioned by year for write-heavy performance,
-- so inventory_id / created_by referential integrity is enforced at the
-- application/ORM layer instead of by the database.
-- id is AUTO_INCREMENT but not globally unique alone once partitioned (MySQL
-- requires the partitioning column in every unique key, including the PK) —
-- PRIMARY KEY is therefore composite (id, created_at).
CREATE TABLE stock_history (
  id            BIGINT UNSIGNED AUTO_INCREMENT,
  inventory_id  BIGINT UNSIGNED NOT NULL,
  change_qty    INT NOT NULL,                              -- +ve = stock in, -ve = stock out
  reason        ENUM('purchase','sale','return','adjustment','damage') NOT NULL,
  reference_type VARCHAR(60) NULL,                          -- e.g. 'order', 'return'
  reference_id  BIGINT UNSIGNED NULL,
  created_by    BIGINT UNSIGNED NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id, created_at),
  KEY idx_stockhist_inventory (inventory_id, created_at),
  KEY idx_stockhist_creator (created_by)
) ENGINE=InnoDB
  PARTITION BY RANGE (UNIX_TIMESTAMP(created_at)) (
    PARTITION p_2025 VALUES LESS THAN (UNIX_TIMESTAMP('2026-01-01')),
    PARTITION p_2026 VALUES LESS THAN (UNIX_TIMESTAMP('2027-01-01')),
    PARTITION p_future VALUES LESS THAN MAXVALUE
  );

CREATE TABLE price_history (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id  BIGINT UNSIGNED NOT NULL,
  variant_id  BIGINT UNSIGNED NULL,
  old_price   DECIMAL(12,2) NOT NULL,
  new_price   DECIMAL(12,2) NOT NULL,
  changed_by  BIGINT UNSIGNED NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_pricehist_product (product_id, created_at),
  CONSTRAINT fk_pricehist_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_pricehist_variant FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_pricehist_user FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE tags (
  id    BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name  VARCHAR(60) NOT NULL,
  slug  VARCHAR(70) NOT NULL,
  UNIQUE KEY uq_tags_slug (slug)
) ENGINE=InnoDB;

CREATE TABLE product_tags (
  product_id BIGINT UNSIGNED NOT NULL,
  tag_id     BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (product_id, tag_id),
  CONSTRAINT fk_prodtags_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_prodtags_tag FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE collections (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid        CHAR(36) NOT NULL DEFAULT (UUID()),
  name        VARCHAR(150) NOT NULL,
  slug        VARCHAR(170) NOT NULL,
  description VARCHAR(500) NULL,
  banner_file_id BIGINT UNSIGNED NULL,
  is_active   TINYINT(1) NOT NULL DEFAULT 1,
  starts_at   TIMESTAMP NULL,
  ends_at     TIMESTAMP NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_collections_slug (slug)
) ENGINE=InnoDB;

CREATE TABLE collection_products (
  collection_id BIGINT UNSIGNED NOT NULL,
  product_id    BIGINT UNSIGNED NOT NULL,
  display_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (collection_id, product_id),
  CONSTRAINT fk_collprod_collection FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_collprod_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ============================================================================
-- MODULE 5: PRESCHOOL KITS
-- ============================================================================

CREATE TABLE kit_categories (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(120) NOT NULL,
  slug        VARCHAR(140) NOT NULL,
  display_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  is_active   TINYINT(1) NOT NULL DEFAULT 1,
  UNIQUE KEY uq_kitcat_slug (slug)
) ENGINE=InnoDB;

CREATE TABLE kits (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid            CHAR(36) NOT NULL DEFAULT (UUID()),
  kit_category_id BIGINT UNSIGNED NOT NULL,
  name            VARCHAR(200) NOT NULL,
  slug            VARCHAR(220) NOT NULL,
  age_group       VARCHAR(50) NULL,                        -- e.g. "3-4 years"
  description     MEDIUMTEXT NULL,
  status          ENUM('draft','active','inactive') NOT NULL DEFAULT 'draft',
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP NULL,
  UNIQUE KEY uq_kits_slug (slug),
  KEY idx_kits_category (kit_category_id),
  CONSTRAINT fk_kits_category FOREIGN KEY (kit_category_id) REFERENCES kit_categories(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Bridge table: kits <-> products (a kit bundles many products; a product can appear in many kits)
CREATE TABLE kit_products (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  kit_id      BIGINT UNSIGNED NOT NULL,
  product_id  BIGINT UNSIGNED NOT NULL,
  quantity    INT UNSIGNED NOT NULL DEFAULT 1,
  is_optional TINYINT(1) NOT NULL DEFAULT 0,
  UNIQUE KEY uq_kit_product (kit_id, product_id),
  KEY idx_kitprod_product (product_id),
  CONSTRAINT fk_kitprod_kit FOREIGN KEY (kit_id) REFERENCES kits(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_kitprod_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE kit_pricing (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  kit_id        BIGINT UNSIGNED NOT NULL,
  min_quantity  INT UNSIGNED NOT NULL DEFAULT 1,           -- tiered/bulk pricing
  price_per_unit DECIMAL(12,2) NOT NULL,
  effective_from DATE NOT NULL,
  effective_to  DATE NULL,
  KEY idx_kitpricing_kit (kit_id),
  CONSTRAINT fk_kitpricing_kit FOREIGN KEY (kit_id) REFERENCES kits(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE kit_images (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  kit_id      BIGINT UNSIGNED NOT NULL,
  file_id     BIGINT UNSIGNED NOT NULL,
  display_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  is_primary  TINYINT(1) NOT NULL DEFAULT 0,
  KEY idx_kitimg_kit (kit_id),
  CONSTRAINT fk_kitimg_kit FOREIGN KEY (kit_id) REFERENCES kits(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ============================================================================
-- MODULE 6: CURRICULUM
-- ============================================================================

CREATE TABLE curriculum_solutions (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid        CHAR(36) NOT NULL DEFAULT (UUID()),
  name        VARCHAR(200) NOT NULL,
  slug        VARCHAR(220) NOT NULL,
  age_group   VARCHAR(50) NULL,
  description MEDIUMTEXT NULL,
  status      ENUM('draft','active','inactive') NOT NULL DEFAULT 'draft',
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_curriculum_slug (slug)
) ENGINE=InnoDB;

CREATE TABLE books (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  curriculum_id BIGINT UNSIGNED NOT NULL,
  title         VARCHAR(200) NOT NULL,
  author        VARCHAR(150) NULL,
  isbn          VARCHAR(20) NULL,
  file_id       BIGINT UNSIGNED NULL,                      -- digital sample/preview
  price         DECIMAL(12,2) NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_books_curriculum (curriculum_id),
  CONSTRAINT fk_books_curriculum FOREIGN KEY (curriculum_id) REFERENCES curriculum_solutions(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE worksheets (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  curriculum_id BIGINT UNSIGNED NOT NULL,
  title         VARCHAR(200) NOT NULL,
  subject       VARCHAR(100) NULL,
  file_id       BIGINT UNSIGNED NOT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_worksheets_curriculum (curriculum_id),
  CONSTRAINT fk_worksheets_curriculum FOREIGN KEY (curriculum_id) REFERENCES curriculum_solutions(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE teacher_kits (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  curriculum_id BIGINT UNSIGNED NOT NULL,
  title         VARCHAR(200) NOT NULL,
  description   TEXT NULL,
  file_id       BIGINT UNSIGNED NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_teacherkits_curriculum (curriculum_id),
  CONSTRAINT fk_teacherkits_curriculum FOREIGN KEY (curriculum_id) REFERENCES curriculum_solutions(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE assessments (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  curriculum_id BIGINT UNSIGNED NOT NULL,
  title         VARCHAR(200) NOT NULL,
  file_id       BIGINT UNSIGNED NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_assessments_curriculum (curriculum_id),
  CONSTRAINT fk_assessments_curriculum FOREIGN KEY (curriculum_id) REFERENCES curriculum_solutions(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE certificates (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid          CHAR(36) NOT NULL DEFAULT (UUID()),
  certificate_type ENUM('curriculum_completion','event_participation','training_completion') NOT NULL,
  reference_type VARCHAR(60) NOT NULL,                     -- 'curriculum','event','teacher_training'
  reference_id  BIGINT UNSIGNED NOT NULL,
  school_id     BIGINT UNSIGNED NULL,
  user_id       BIGINT UNSIGNED NULL,
  file_id       BIGINT UNSIGNED NULL,
  issued_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_certificates_school (school_id),
  CONSTRAINT fk_certificates_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_certificates_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE downloads (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id       BIGINT UNSIGNED NOT NULL,
  file_id       BIGINT UNSIGNED NOT NULL,
  resource_type VARCHAR(60) NOT NULL,                      -- 'book','worksheet','invoice','resource', etc.
  resource_id   BIGINT UNSIGNED NOT NULL,
  downloaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_downloads_user (user_id, downloaded_at),
  CONSTRAINT fk_downloads_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ============================================================================
-- MODULE 7: BRANDING SERVICES
-- ============================================================================

CREATE TABLE branding_services (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid        CHAR(36) NOT NULL DEFAULT (UUID()),
  service_type ENUM('uniform','id_card','printing','website','other') NOT NULL,
  name        VARCHAR(150) NOT NULL,
  description TEXT NULL,
  base_price  DECIMAL(12,2) NULL,
  is_active   TINYINT(1) NOT NULL DEFAULT 1,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE uniform_designs (
  id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  branding_service_id BIGINT UNSIGNED NOT NULL,
  school_id           BIGINT UNSIGNED NULL,
  design_name         VARCHAR(150) NOT NULL,
  file_id             BIGINT UNSIGNED NULL,
  status              ENUM('proposed','approved','in_production','delivered') NOT NULL DEFAULT 'proposed',
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_uniform_school (school_id),
  CONSTRAINT fk_uniform_service FOREIGN KEY (branding_service_id) REFERENCES branding_services(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_uniform_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE id_cards (
  id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  branding_service_id BIGINT UNSIGNED NOT NULL,
  school_id           BIGINT UNSIGNED NOT NULL,
  template_file_id    BIGINT UNSIGNED NULL,
  quantity            INT UNSIGNED NOT NULL DEFAULT 0,
  status              ENUM('proposed','approved','in_production','delivered') NOT NULL DEFAULT 'proposed',
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_idcards_school (school_id),
  CONSTRAINT fk_idcards_service FOREIGN KEY (branding_service_id) REFERENCES branding_services(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_idcards_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE printing_services (
  id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  branding_service_id BIGINT UNSIGNED NOT NULL,
  school_id           BIGINT UNSIGNED NOT NULL,
  item_description    VARCHAR(255) NOT NULL,
  quantity            INT UNSIGNED NOT NULL DEFAULT 0,
  status              ENUM('requested','approved','in_production','delivered') NOT NULL DEFAULT 'requested',
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_printing_school (school_id),
  CONSTRAINT fk_printing_service FOREIGN KEY (branding_service_id) REFERENCES branding_services(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_printing_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE website_services (
  id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  branding_service_id BIGINT UNSIGNED NOT NULL,
  school_id           BIGINT UNSIGNED NOT NULL,
  domain_name         VARCHAR(150) NULL,
  status              ENUM('requested','in_design','in_development','live') NOT NULL DEFAULT 'requested',
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_website_school (school_id),
  CONSTRAINT fk_website_service FOREIGN KEY (branding_service_id) REFERENCES branding_services(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_website_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE branding_gallery (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  service_type  ENUM('uniform','id_card','printing','website','other') NOT NULL,
  file_id       BIGINT UNSIGNED NOT NULL,
  caption       VARCHAR(200) NULL,
  display_order SMALLINT UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB;

-- ============================================================================
-- MODULE 8: CART, WISHLIST, RECENTLY VIEWED
-- ============================================================================

CREATE TABLE shopping_carts (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid        CHAR(36) NOT NULL DEFAULT (UUID()),
  school_id   BIGINT UNSIGNED NOT NULL,
  status      ENUM('active','converted','abandoned') NOT NULL DEFAULT 'active',
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_carts_school_status (school_id, status),
  CONSTRAINT fk_carts_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE cart_items (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cart_id       BIGINT UNSIGNED NOT NULL,
  item_type     ENUM('product','kit') NOT NULL DEFAULT 'product',
  product_id    BIGINT UNSIGNED NULL,
  variant_id    BIGINT UNSIGNED NULL,
  kit_id        BIGINT UNSIGNED NULL,
  dealer_id     BIGINT UNSIGNED NULL,
  quantity      INT UNSIGNED NOT NULL DEFAULT 1,
  unit_price_snapshot DECIMAL(12,2) NOT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_cartitems_cart (cart_id),
  CONSTRAINT chk_cartitem_qty CHECK (quantity > 0),
  CONSTRAINT fk_cartitems_cart FOREIGN KEY (cart_id) REFERENCES shopping_carts(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_cartitems_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_cartitems_variant FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_cartitems_kit FOREIGN KEY (kit_id) REFERENCES kits(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_cartitems_dealer FOREIGN KEY (dealer_id) REFERENCES dealers(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE wishlists (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  school_id   BIGINT UNSIGNED NOT NULL,
  name        VARCHAR(100) NOT NULL DEFAULT 'My Wishlist',
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_wishlist_school_name (school_id, name),
  CONSTRAINT fk_wishlists_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE wishlist_items (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  wishlist_id   BIGINT UNSIGNED NOT NULL,
  product_id    BIGINT UNSIGNED NULL,
  kit_id        BIGINT UNSIGNED NULL,
  added_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_wishlist_product (wishlist_id, product_id, kit_id),
  CONSTRAINT fk_wishlistitems_wishlist FOREIGN KEY (wishlist_id) REFERENCES wishlists(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_wishlistitems_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_wishlistitems_kit FOREIGN KEY (kit_id) REFERENCES kits(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE recently_viewed (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  school_id   BIGINT UNSIGNED NOT NULL,
  product_id  BIGINT UNSIGNED NOT NULL,
  viewed_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_recentview (school_id, product_id),
  KEY idx_recentview_school_date (school_id, viewed_at),
  CONSTRAINT fk_recentview_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_recentview_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ============================================================================
-- MODULE 8B: PRODUCT CUSTOMIZATION (added post-Phase-1)
-- Schema gap identified while implementing the Design Requirement Handbook's
-- Product Customization screen: logo/artwork upload, branding & printing
-- specs, and a Pending Review -> Reviewed -> Approved/Rejected workflow that
-- gates what may enter the cart. None of this had backing tables in the
-- original 138-table schema, so it is added here rather than dropped.
-- ============================================================================

CREATE TABLE customization_requests (
  id                     BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid                   CHAR(36) NOT NULL DEFAULT (UUID()),
  school_id              BIGINT UNSIGNED NOT NULL,
  product_id             BIGINT UNSIGNED NOT NULL,
  status                 ENUM('pending_review','reviewed','approved','rejected') NOT NULL DEFAULT 'pending_review',
  quantity               INT UNSIGNED NOT NULL DEFAULT 1,
  school_name            VARCHAR(150) NULL,                 -- may auto-fill from school profile; editable per request
  custom_text            VARCHAR(255) NULL,                  -- e.g. text for ID cards / diaries
  color                  VARCHAR(60) NULL,
  size                   VARCHAR(60) NULL,
  material               VARCHAR(100) NULL,
  branding_requirements  TEXT NULL,                          -- logo placement, embroidery vs. print, etc.
  printing_requirements  TEXT NULL,
  special_instructions   TEXT NULL,
  review_notes           TEXT NULL,                          -- reviewer comments; doubles as the rejection reason
  reviewed_by            BIGINT UNSIGNED NULL,
  reviewed_at            TIMESTAMP NULL,
  converted_cart_item_id BIGINT UNSIGNED NULL,               -- set once an Approved request becomes a cart line item
  created_at             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at             TIMESTAMP NULL,
  KEY idx_customreq_school (school_id, status),
  KEY idx_customreq_product (product_id),
  CONSTRAINT chk_customreq_qty CHECK (quantity > 0),
  CONSTRAINT fk_customreq_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_customreq_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_customreq_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_customreq_cartitem FOREIGN KEY (converted_cart_item_id) REFERENCES cart_items(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE customization_files (
  id                        BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  customization_request_id BIGINT UNSIGNED NOT NULL,
  file_type                 ENUM('logo','artwork','reference') NOT NULL,
  file_id                   BIGINT UNSIGNED NOT NULL,        -- FK added in DEFERRED FOREIGN KEYS block (uploaded_files is created later)
  display_order              SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_at                TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_customfiles_request (customization_request_id),
  CONSTRAINT fk_customfiles_request FOREIGN KEY (customization_request_id) REFERENCES customization_requests(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE customization_status_history (
  id                        BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  customization_request_id BIGINT UNSIGNED NOT NULL,
  status                    VARCHAR(30) NOT NULL,
  changed_by                BIGINT UNSIGNED NULL,
  note                      VARCHAR(255) NULL,
  created_at                TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_customstatushist_request (customization_request_id, created_at),
  CONSTRAINT fk_customstatushist_request FOREIGN KEY (customization_request_id) REFERENCES customization_requests(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_customstatushist_user FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ============================================================================
-- MODULE 9: ORDERS
-- ============================================================================

-- Added in Phase 3 (Checkout): the handbook's Checkout screen requires a
-- Delivery Method selector (Standard / Express / Bulk Freight) with distinct
-- pricing and estimated delivery windows per method. The original schema had
-- only a flat `orders.shipping_amount` with no source of truth to compute it
-- from — a lookup table (same pattern as `taxes`) instead of hardcoding
-- prices in application code.
CREATE TABLE shipping_methods (
  id                 BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name               VARCHAR(60) NOT NULL,
  rate               DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  estimated_days_min SMALLINT UNSIGNED NOT NULL,
  estimated_days_max SMALLINT UNSIGNED NOT NULL,
  is_active          TINYINT(1) NOT NULL DEFAULT 1,
  UNIQUE KEY uq_shippingmethods_name (name)
) ENGINE=InnoDB;

CREATE TABLE orders (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid            CHAR(36) NOT NULL DEFAULT (UUID()),
  order_number    VARCHAR(30) NOT NULL,
  school_id       BIGINT UNSIGNED NOT NULL,
  dealer_id       BIGINT UNSIGNED NULL,
  billing_address_id BIGINT UNSIGNED NULL,
  shipping_address_id BIGINT UNSIGNED NULL,
  shipping_method_id BIGINT UNSIGNED NULL,
  subtotal        DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  tax_amount      DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  shipping_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  total_amount    DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  currency        CHAR(3) NOT NULL DEFAULT 'INR',
  status          ENUM('pending','confirmed','processing','shipped','delivered','completed','cancelled','returned') NOT NULL DEFAULT 'pending',
  payment_status  ENUM('unpaid','partially_paid','paid','refunded') NOT NULL DEFAULT 'unpaid',
  -- Added Phase 4 (Section 5 — Priority Management). `remaining_days` is
  -- intentionally NOT stored: it is production_deadline - CURRENT_DATE,
  -- computed at query time so it's never stale.
  production_deadline DATE NULL,
  expected_delivery_date DATE NULL,
  priority        ENUM('critical','high','medium','normal') NOT NULL DEFAULT 'normal',
  placed_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP NULL,
  UNIQUE KEY uq_orders_number (order_number),
  UNIQUE KEY uq_orders_uuid (uuid),
  KEY idx_orders_school (school_id, status),
  KEY idx_orders_dealer (dealer_id, status),
  KEY idx_orders_placed (placed_at),
  CONSTRAINT fk_orders_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_orders_dealer FOREIGN KEY (dealer_id) REFERENCES dealers(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_orders_billaddr FOREIGN KEY (billing_address_id) REFERENCES school_addresses(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_orders_shipaddr FOREIGN KEY (shipping_address_id) REFERENCES school_addresses(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_orders_shipmethod FOREIGN KEY (shipping_method_id) REFERENCES shipping_methods(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE order_items (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id      BIGINT UNSIGNED NOT NULL,
  item_type     ENUM('product','kit') NOT NULL DEFAULT 'product',
  product_id    BIGINT UNSIGNED NULL,
  variant_id    BIGINT UNSIGNED NULL,
  kit_id        BIGINT UNSIGNED NULL,
  item_name_snapshot VARCHAR(220) NOT NULL,                -- preserve historical name even if product renamed
  quantity      INT UNSIGNED NOT NULL,
  unit_price    DECIMAL(12,2) NOT NULL,
  tax_amount    DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  line_total    DECIMAL(12,2) NOT NULL,
  KEY idx_orderitems_order (order_id),
  KEY idx_orderitems_product (product_id),
  CONSTRAINT chk_orderitem_qty CHECK (quantity > 0),
  CONSTRAINT fk_orderitems_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_orderitems_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_orderitems_variant FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_orderitems_kit FOREIGN KEY (kit_id) REFERENCES kits(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE order_status_history (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id    BIGINT UNSIGNED NOT NULL,
  status      VARCHAR(30) NOT NULL,
  changed_by  BIGINT UNSIGNED NULL,
  note        VARCHAR(255) NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_orderstatushist_order (order_id, created_at),
  CONSTRAINT fk_orderstatushist_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_orderstatushist_user FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE order_timeline (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id    BIGINT UNSIGNED NOT NULL,
  event_type  VARCHAR(60) NOT NULL,                        -- 'order_placed','payment_received','shipped', etc.
  event_description VARCHAR(255) NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_ordertimeline_order (order_id, created_at),
  CONSTRAINT fk_ordertimeline_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE order_notes (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id    BIGINT UNSIGNED NOT NULL,
  author_id   BIGINT UNSIGNED NULL,
  note        TEXT NOT NULL,
  is_internal TINYINT(1) NOT NULL DEFAULT 1,               -- internal admin note vs customer-visible
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_ordernotes_order (order_id),
  CONSTRAINT fk_ordernotes_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_ordernotes_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Added Phase 4 (Section 6 — Production Tracking). `order_timeline` already
-- logs free-text events, but production analytics (time-per-checkpoint,
-- delays) need a constrained, structured checkpoint enum with completion
-- percentage — a dedicated append-only table, never updated in place, so
-- the full history survives (Section 6: "Maintain complete history. Never
-- overwrite previous records.").
CREATE TABLE production_checkpoints (
  id                     BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id               BIGINT UNSIGNED NOT NULL,
  stage                  ENUM('order_received','cutting','stitching','logo','printing','color_matching','quality_check','ready','packed','dispatched','delivered','completed') NOT NULL,
  completion_percentage  TINYINT UNSIGNED NOT NULL DEFAULT 0,
  notes                  TEXT NULL,
  updated_by             BIGINT UNSIGNED NULL,              -- the dealer/staff user who logged this checkpoint
  created_at             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_prodcheckpoint_order (order_id, created_at),
  CONSTRAINT chk_prodcheckpoint_pct CHECK (completion_percentage BETWEEN 0 AND 100),
  CONSTRAINT fk_prodcheckpoint_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_prodcheckpoint_user FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE production_checkpoint_images (
  id                       BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  production_checkpoint_id BIGINT UNSIGNED NOT NULL,
  file_id                  BIGINT UNSIGNED NOT NULL,        -- FK added in DEFERRED FOREIGN KEYS block (uploaded_files is created later)
  created_at               TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_prodcheckpointimg_checkpoint (production_checkpoint_id),
  CONSTRAINT fk_prodcheckpointimg_checkpoint FOREIGN KEY (production_checkpoint_id) REFERENCES production_checkpoints(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE returns (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid          CHAR(36) NOT NULL DEFAULT (UUID()),
  order_id      BIGINT UNSIGNED NOT NULL,
  order_item_id BIGINT UNSIGNED NOT NULL,
  quantity      INT UNSIGNED NOT NULL,
  reason        VARCHAR(255) NOT NULL,
  status        ENUM('requested','approved','rejected','picked_up','completed') NOT NULL DEFAULT 'requested',
  requested_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at   TIMESTAMP NULL,
  KEY idx_returns_order (order_id),
  CONSTRAINT fk_returns_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_returns_orderitem FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE cancellations (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id    BIGINT UNSIGNED NOT NULL,
  cancelled_by BIGINT UNSIGNED NULL,
  reason      VARCHAR(255) NOT NULL,
  cancelled_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_cancellations_order (order_id),
  CONSTRAINT fk_cancellations_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_cancellations_user FOREIGN KEY (cancelled_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE refunds (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid          CHAR(36) NOT NULL DEFAULT (UUID()),
  order_id      BIGINT UNSIGNED NOT NULL,
  return_id     BIGINT UNSIGNED NULL,
  amount        DECIMAL(12,2) NOT NULL,
  refund_method ENUM('original_payment','wallet','bank_transfer') NOT NULL DEFAULT 'original_payment',
  status        ENUM('initiated','processing','completed','failed') NOT NULL DEFAULT 'initiated',
  processed_at  TIMESTAMP NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_refunds_order (order_id),
  CONSTRAINT fk_refunds_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_refunds_return FOREIGN KEY (return_id) REFERENCES returns(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE invoices (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid          CHAR(36) NOT NULL DEFAULT (UUID()),
  invoice_number VARCHAR(30) NOT NULL,
  order_id      BIGINT UNSIGNED NOT NULL,
  school_id     BIGINT UNSIGNED NOT NULL,
  subtotal      DECIMAL(12,2) NOT NULL,
  tax_amount    DECIMAL(12,2) NOT NULL,
  total_amount  DECIMAL(12,2) NOT NULL,
  file_id       BIGINT UNSIGNED NULL,                      -- generated PDF
  invoice_type  ENUM('advance_receipt','final_invoice') NOT NULL DEFAULT 'final_invoice', -- added Phase 3: handbook distinguishes an immediate Advance Receipt from the Final GST Invoice issued once fully settled
  issued_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  due_date      DATE NULL,
  status        ENUM('issued','paid','overdue','void') NOT NULL DEFAULT 'issued',
  UNIQUE KEY uq_invoices_number (invoice_number),
  KEY idx_invoices_order (order_id),
  KEY idx_invoices_school (school_id),
  CONSTRAINT fk_invoices_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_invoices_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE invoice_items (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  invoice_id  BIGINT UNSIGNED NOT NULL,
  order_item_id BIGINT UNSIGNED NOT NULL,
  description VARCHAR(255) NOT NULL,
  quantity    INT UNSIGNED NOT NULL,
  unit_price  DECIMAL(12,2) NOT NULL,
  tax_rate    DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  line_total  DECIMAL(12,2) NOT NULL,
  KEY idx_invoiceitems_invoice (invoice_id),
  CONSTRAINT fk_invoiceitems_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_invoiceitems_orderitem FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE shipments (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid          CHAR(36) NOT NULL DEFAULT (UUID()),
  order_id      BIGINT UNSIGNED NOT NULL,
  carrier_name  VARCHAR(100) NULL,
  tracking_number VARCHAR(100) NULL,
  status        ENUM('pending','picked_up','in_transit','out_for_delivery','delivered','failed') NOT NULL DEFAULT 'pending',
  shipped_at    TIMESTAMP NULL,
  delivered_at  TIMESTAMP NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_shipments_order (order_id),
  KEY idx_shipments_tracking (tracking_number),
  CONSTRAINT fk_shipments_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE tracking (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  shipment_id BIGINT UNSIGNED NOT NULL,
  location    VARCHAR(200) NULL,
  status_text VARCHAR(255) NOT NULL,
  recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_tracking_shipment (shipment_id, recorded_at),
  CONSTRAINT fk_tracking_shipment FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE delivery_updates (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  shipment_id BIGINT UNSIGNED NOT NULL,
  update_type ENUM('note','reschedule','failed_attempt','delivered') NOT NULL,
  message     VARCHAR(255) NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_deliveryupdates_shipment (shipment_id),
  CONSTRAINT fk_deliveryupdates_shipment FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ============================================================================
-- MODULE 10: QUOTATIONS
-- ============================================================================

CREATE TABLE quotation_requests (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid          CHAR(36) NOT NULL DEFAULT (UUID()),
  request_number VARCHAR(30) NOT NULL,
  school_id     BIGINT UNSIGNED NOT NULL,
  title         VARCHAR(200) NULL,
  notes         TEXT NULL,
  status        ENUM('open','in_review','quoted','closed','expired') NOT NULL DEFAULT 'open',
  expires_at    TIMESTAMP NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_quotreq_number (request_number),
  KEY idx_quotreq_school (school_id, status),
  CONSTRAINT fk_quotreq_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE quotation_request_products (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  quotation_request_id BIGINT UNSIGNED NOT NULL,
  product_id    BIGINT UNSIGNED NULL,
  kit_id        BIGINT UNSIGNED NULL,
  custom_item_description VARCHAR(255) NULL,               -- for items not in catalog
  quantity      INT UNSIGNED NOT NULL DEFAULT 1,
  KEY idx_quotreqprod_request (quotation_request_id),
  CONSTRAINT fk_quotreqprod_request FOREIGN KEY (quotation_request_id) REFERENCES quotation_requests(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_quotreqprod_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_quotreqprod_kit FOREIGN KEY (kit_id) REFERENCES kits(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- One quotation request can be sent to / answered by many dealers (many-to-many via this table)
CREATE TABLE dealer_quotations (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid          CHAR(36) NOT NULL DEFAULT (UUID()),
  quotation_request_id BIGINT UNSIGNED NOT NULL,
  dealer_id     BIGINT UNSIGNED NOT NULL,
  total_amount  DECIMAL(12,2) NOT NULL,
  validity_days SMALLINT UNSIGNED NOT NULL DEFAULT 7,
  notes         TEXT NULL,
  -- Added Phase 4: admin-driven assignment metadata (Section 4 — "Dealer
  -- Assignment"). Reusing this table rather than adding a new one: it
  -- already models "one dealer's slice of a quotation request" exactly,
  -- just previously for competitive bidding. `status` is reinterpreted for
  -- the assignment flow: 'submitted' = assignment created / awaiting dealer
  -- acknowledgement, 'accepted'/'rejected' = dealer's response, 'shortlisted'/
  -- 'withdrawn' remain available but unused by the assignment flow.
  assigned_by   BIGINT UNSIGNED NULL,
  assigned_at   TIMESTAMP NULL,
  expected_completion_date DATE NULL,
  status        ENUM('submitted','shortlisted','accepted','rejected','withdrawn') NOT NULL DEFAULT 'submitted',
  submitted_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_dealerquot_request_dealer (quotation_request_id, dealer_id),
  KEY idx_dealerquot_dealer (dealer_id),
  CONSTRAINT fk_dealerquot_request FOREIGN KEY (quotation_request_id) REFERENCES quotation_requests(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_dealerquot_dealer FOREIGN KEY (dealer_id) REFERENCES dealers(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_dealerquot_assignedby FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE dealer_quotation_items (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  dealer_quotation_id BIGINT UNSIGNED NOT NULL,
  quotation_request_product_id BIGINT UNSIGNED NOT NULL,
  quoted_unit_price DECIMAL(12,2) NOT NULL,
  quoted_quantity   INT UNSIGNED NOT NULL,
  KEY idx_dealerquotitems_quot (dealer_quotation_id),
  -- Added Phase 4: a requested product/kit line may be assigned to exactly
  -- one dealer (Section 3 — "Dealers must never see another dealer's
  -- quotation"); this UNIQUE enforces that exclusivity at the DB level.
  UNIQUE KEY uq_dealerquotitems_reqprod (quotation_request_product_id),
  CONSTRAINT fk_dealerquotitems_quot FOREIGN KEY (dealer_quotation_id) REFERENCES dealer_quotations(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_dealerquotitems_reqprod FOREIGN KEY (quotation_request_product_id) REFERENCES quotation_request_products(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE quotation_comparisons (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  quotation_request_id BIGINT UNSIGNED NOT NULL,
  school_id     BIGINT UNSIGNED NOT NULL,
  compared_dealer_quotation_ids JSON NOT NULL,             -- array of dealer_quotation ids compared side-by-side
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_quotcompare_request (quotation_request_id),
  CONSTRAINT fk_quotcompare_request FOREIGN KEY (quotation_request_id) REFERENCES quotation_requests(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_quotcompare_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE quotation_status_history (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  dealer_quotation_id BIGINT UNSIGNED NOT NULL,
  status        VARCHAR(30) NOT NULL,
  changed_by    BIGINT UNSIGNED NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_quotstatushist_quot (dealer_quotation_id),
  CONSTRAINT fk_quotstatushist_quot FOREIGN KEY (dealer_quotation_id) REFERENCES dealer_quotations(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_quotstatushist_user FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE accepted_quotations (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  dealer_quotation_id BIGINT UNSIGNED NOT NULL,
  order_id          BIGINT UNSIGNED NULL,                  -- linked once converted to an order
  accepted_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_acceptedquot_quot (dealer_quotation_id),
  CONSTRAINT fk_acceptedquot_quot FOREIGN KEY (dealer_quotation_id) REFERENCES dealer_quotations(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_acceptedquot_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ============================================================================
-- MODULE 11: PAYMENTS, WALLET, REWARDS, COUPONS, TAX
-- ============================================================================

CREATE TABLE payment_methods (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  school_id   BIGINT UNSIGNED NOT NULL,
  method_type ENUM('card','upi','netbanking','bank_transfer','wallet') NOT NULL,
  provider_token VARCHAR(255) NULL,                        -- tokenized reference from payment gateway; never raw card data
  display_label VARCHAR(100) NULL,                         -- e.g. "Visa ****1234"
  is_default  TINYINT(1) NOT NULL DEFAULT 0,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_paymethods_school (school_id),
  CONSTRAINT fk_paymethods_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE payments (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid            CHAR(36) NOT NULL DEFAULT (UUID()),
  order_id        BIGINT UNSIGNED NULL,
  subscription_id BIGINT UNSIGNED NULL,
  school_id       BIGINT UNSIGNED NOT NULL,
  payment_method_id BIGINT UNSIGNED NULL,
  amount          DECIMAL(12,2) NOT NULL,
  currency        CHAR(3) NOT NULL DEFAULT 'INR',
  payment_type    ENUM('advance','balance','full','refund') NOT NULL DEFAULT 'full', -- added Phase 3: distinguishes the 50%-advance payment from the later balance settlement
  status          ENUM('initiated','pending','success','failed','refunded') NOT NULL DEFAULT 'initiated',
  gateway         VARCHAR(50) NULL,                        -- e.g. razorpay, stripe
  gateway_reference VARCHAR(150) NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_payments_order (order_id),
  KEY idx_payments_school (school_id),
  KEY idx_payments_gatewayref (gateway_reference),
  CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_payments_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_payments_method FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE payment_transactions (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  payment_id    BIGINT UNSIGNED NOT NULL,
  transaction_type ENUM('authorization','capture','refund','chargeback') NOT NULL,
  amount        DECIMAL(12,2) NOT NULL,
  status        ENUM('success','failed','pending') NOT NULL,
  gateway_response JSON NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_paytxn_payment (payment_id),
  CONSTRAINT fk_paytxn_payment FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE wallets (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  school_id   BIGINT UNSIGNED NOT NULL,
  balance     DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_wallets_school (school_id),
  CONSTRAINT chk_wallet_balance CHECK (balance >= 0),
  CONSTRAINT fk_wallets_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE wallet_history (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  wallet_id   BIGINT UNSIGNED NOT NULL,
  change_amount DECIMAL(12,2) NOT NULL,                    -- +credit / -debit
  balance_after DECIMAL(12,2) NOT NULL,
  reason      VARCHAR(150) NOT NULL,
  reference_type VARCHAR(60) NULL,
  reference_id   BIGINT UNSIGNED NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_wallethist_wallet (wallet_id, created_at),
  CONSTRAINT fk_wallethist_wallet FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE reward_points (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  school_id   BIGINT UNSIGNED NOT NULL,
  points_balance INT UNSIGNED NOT NULL DEFAULT 0,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_rewardpoints_school (school_id),
  CONSTRAINT fk_rewardpoints_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE reward_history (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  reward_points_id BIGINT UNSIGNED NOT NULL,
  points_change INT NOT NULL,
  reason      VARCHAR(150) NOT NULL,
  reference_type VARCHAR(60) NULL,
  reference_id   BIGINT UNSIGNED NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_rewardhist_points (reward_points_id, created_at),
  CONSTRAINT fk_rewardhist_points FOREIGN KEY (reward_points_id) REFERENCES reward_points(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE coupons (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code          VARCHAR(40) NOT NULL,
  discount_type ENUM('percentage','flat') NOT NULL,
  discount_value DECIMAL(10,2) NOT NULL,
  max_discount  DECIMAL(12,2) NULL,
  min_order_value DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  usage_limit_total INT UNSIGNED NULL,
  usage_limit_per_school SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  starts_at     TIMESTAMP NOT NULL,
  ends_at       TIMESTAMP NOT NULL,
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_coupons_code (code),
  CONSTRAINT chk_coupon_dates CHECK (ends_at > starts_at)
) ENGINE=InnoDB;

CREATE TABLE coupon_usage (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  coupon_id   BIGINT UNSIGNED NOT NULL,
  school_id   BIGINT UNSIGNED NOT NULL,
  order_id    BIGINT UNSIGNED NOT NULL,
  discount_applied DECIMAL(12,2) NOT NULL,
  used_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_couponusage_order (coupon_id, order_id),
  KEY idx_couponusage_school (school_id),
  CONSTRAINT fk_couponusage_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_couponusage_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_couponusage_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE taxes (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(60) NOT NULL,                        -- e.g. "GST 18%"
  tax_type    ENUM('gst','vat','other') NOT NULL DEFAULT 'gst',
  rate        DECIMAL(5,2) NOT NULL,
  hsn_code    VARCHAR(20) NULL,
  is_active   TINYINT(1) NOT NULL DEFAULT 1,
  UNIQUE KEY uq_taxes_name (name)
) ENGINE=InnoDB;

-- ============================================================================
-- MODULE 12: SUBSCRIPTIONS
-- ============================================================================

CREATE TABLE plans (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid          CHAR(36) NOT NULL DEFAULT (UUID()),
  name          VARCHAR(100) NOT NULL,
  slug          VARCHAR(120) NOT NULL,
  billing_cycle ENUM('monthly','quarterly','yearly') NOT NULL DEFAULT 'yearly',
  price         DECIMAL(12,2) NOT NULL,
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_plans_slug (slug)
) ENGINE=InnoDB;

CREATE TABLE plan_features (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  plan_id     BIGINT UNSIGNED NOT NULL,
  feature_name VARCHAR(150) NOT NULL,
  feature_value VARCHAR(150) NULL,                         -- e.g. "Unlimited quotations", or a numeric limit
  KEY idx_planfeatures_plan (plan_id),
  CONSTRAINT fk_planfeatures_plan FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE subscriptions (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid          CHAR(36) NOT NULL DEFAULT (UUID()),
  school_id     BIGINT UNSIGNED NOT NULL,
  plan_id       BIGINT UNSIGNED NOT NULL,
  status        ENUM('active','cancelled','expired','past_due') NOT NULL DEFAULT 'active',
  starts_at     TIMESTAMP NOT NULL,
  ends_at       TIMESTAMP NOT NULL,
  auto_renew    TINYINT(1) NOT NULL DEFAULT 1,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_subs_school (school_id, status),
  CONSTRAINT fk_subs_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_subs_plan FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE subscription_payments (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  subscription_id BIGINT UNSIGNED NOT NULL,
  payment_id      BIGINT UNSIGNED NULL,
  amount          DECIMAL(12,2) NOT NULL,
  billing_period_start DATE NOT NULL,
  billing_period_end   DATE NOT NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_subpay_sub (subscription_id),
  CONSTRAINT fk_subpay_sub FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_subpay_payment FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE renewals (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  subscription_id BIGINT UNSIGNED NOT NULL,
  previous_end_date DATE NOT NULL,
  new_end_date      DATE NOT NULL,
  renewed_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_renewals_sub (subscription_id),
  CONSTRAINT fk_renewals_sub FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ============================================================================
-- MODULE 13: LEARNING RESOURCES
-- ============================================================================

CREATE TABLE learning_categories (
  id    BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name  VARCHAR(100) NOT NULL,
  slug  VARCHAR(120) NOT NULL,
  UNIQUE KEY uq_learncat_slug (slug)
) ENGINE=InnoDB;

CREATE TABLE blogs (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid          CHAR(36) NOT NULL DEFAULT (UUID()),
  category_id   BIGINT UNSIGNED NULL,
  author_id     BIGINT UNSIGNED NULL,
  title         VARCHAR(220) NOT NULL,
  slug          VARCHAR(250) NOT NULL,
  excerpt       VARCHAR(500) NULL,
  content       MEDIUMTEXT NOT NULL,
  cover_file_id BIGINT UNSIGNED NULL,
  status        ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  published_at  TIMESTAMP NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_blogs_slug (slug),
  KEY idx_blogs_category (category_id),
  FULLTEXT KEY ftx_blogs_title_excerpt (title, excerpt),
  CONSTRAINT fk_blogs_category FOREIGN KEY (category_id) REFERENCES learning_categories(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_blogs_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE learning_videos (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id BIGINT UNSIGNED NULL,
  title       VARCHAR(200) NOT NULL,
  video_url   VARCHAR(500) NOT NULL,
  thumbnail_file_id BIGINT UNSIGNED NULL,
  duration_seconds INT UNSIGNED NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_learnvideos_category (category_id),
  CONSTRAINT fk_learnvideos_category FOREIGN KEY (category_id) REFERENCES learning_categories(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE learning_downloads (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id BIGINT UNSIGNED NULL,
  title       VARCHAR(200) NOT NULL,
  file_id     BIGINT UNSIGNED NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_learndownloads_category (category_id),
  CONSTRAINT fk_learndownloads_category FOREIGN KEY (category_id) REFERENCES learning_categories(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE teacher_trainings (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid        CHAR(36) NOT NULL DEFAULT (UUID()),
  title       VARCHAR(200) NOT NULL,
  description TEXT NULL,
  mode        ENUM('online','offline','hybrid') NOT NULL DEFAULT 'online',
  starts_at   TIMESTAMP NULL,
  ends_at     TIMESTAMP NULL,
  status      ENUM('scheduled','ongoing','completed','cancelled') NOT NULL DEFAULT 'scheduled',
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE success_stories (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  school_id   BIGINT UNSIGNED NULL,
  title       VARCHAR(220) NOT NULL,
  slug        VARCHAR(250) NOT NULL,
  content     MEDIUMTEXT NOT NULL,
  cover_file_id BIGINT UNSIGNED NULL,
  status      ENUM('draft','published') NOT NULL DEFAULT 'draft',
  published_at TIMESTAMP NULL,
  UNIQUE KEY uq_successstories_slug (slug),
  CONSTRAINT fk_successstories_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE resources (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id BIGINT UNSIGNED NULL,
  title       VARCHAR(200) NOT NULL,
  resource_type ENUM('article','template','guide','checklist','other') NOT NULL DEFAULT 'article',
  file_id     BIGINT UNSIGNED NULL,
  content     MEDIUMTEXT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_resources_category (category_id),
  CONSTRAINT fk_resources_category FOREIGN KEY (category_id) REFERENCES learning_categories(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ============================================================================
-- MODULE 14: EVENTS
-- ============================================================================

CREATE TABLE events (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid          CHAR(36) NOT NULL DEFAULT (UUID()),
  title         VARCHAR(200) NOT NULL,
  slug          VARCHAR(220) NOT NULL,
  description   MEDIUMTEXT NULL,
  event_type    ENUM('webinar','workshop','expo','conference','other') NOT NULL DEFAULT 'webinar',
  mode          ENUM('online','offline','hybrid') NOT NULL DEFAULT 'online',
  venue         VARCHAR(255) NULL,
  starts_at     TIMESTAMP NOT NULL,
  ends_at       TIMESTAMP NOT NULL,
  capacity      INT UNSIGNED NULL,
  status        ENUM('scheduled','ongoing','completed','cancelled') NOT NULL DEFAULT 'scheduled',
  banner_file_id BIGINT UNSIGNED NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_events_slug (slug),
  KEY idx_events_starts (starts_at),
  CONSTRAINT chk_events_dates CHECK (ends_at >= starts_at)
) ENGINE=InnoDB;

CREATE TABLE event_registrations (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid        CHAR(36) NOT NULL DEFAULT (UUID()),
  event_id    BIGINT UNSIGNED NOT NULL,
  school_id   BIGINT UNSIGNED NULL,
  user_id     BIGINT UNSIGNED NOT NULL,
  status      ENUM('registered','waitlisted','cancelled') NOT NULL DEFAULT 'registered',
  registered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_eventreg_event_user (event_id, user_id),
  KEY idx_eventreg_school (school_id),
  CONSTRAINT fk_eventreg_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_eventreg_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_eventreg_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE event_attendance (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  event_registration_id BIGINT UNSIGNED NOT NULL,
  checked_in_at     TIMESTAMP NULL,
  checked_out_at    TIMESTAMP NULL,
  UNIQUE KEY uq_eventattendance_reg (event_registration_id),
  CONSTRAINT fk_eventattendance_reg FOREIGN KEY (event_registration_id) REFERENCES event_registrations(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE event_certificates (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  event_registration_id BIGINT UNSIGNED NOT NULL,
  file_id           BIGINT UNSIGNED NULL,
  issued_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_eventcert_reg (event_registration_id),
  CONSTRAINT fk_eventcert_reg FOREIGN KEY (event_registration_id) REFERENCES event_registrations(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ============================================================================
-- MODULE 15: SUPPORT
-- ============================================================================

CREATE TABLE support_tickets (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid          CHAR(36) NOT NULL DEFAULT (UUID()),
  ticket_number VARCHAR(30) NOT NULL,
  raised_by     BIGINT UNSIGNED NOT NULL,
  school_id     BIGINT UNSIGNED NULL,
  dealer_id     BIGINT UNSIGNED NULL,
  subject       VARCHAR(200) NOT NULL,
  description   TEXT NOT NULL,
  category      ENUM('order','payment','product','account','technical','other') NOT NULL DEFAULT 'other',
  priority      ENUM('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
  status        ENUM('open','in_progress','waiting_on_customer','resolved','closed') NOT NULL DEFAULT 'open',
  assigned_to   BIGINT UNSIGNED NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  resolved_at   TIMESTAMP NULL,
  UNIQUE KEY uq_tickets_number (ticket_number),
  KEY idx_tickets_status (status, priority),
  KEY idx_tickets_raisedby (raised_by),
  CONSTRAINT fk_tickets_raisedby FOREIGN KEY (raised_by) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_tickets_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_tickets_dealer FOREIGN KEY (dealer_id) REFERENCES dealers(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_tickets_assignee FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE ticket_replies (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ticket_id   BIGINT UNSIGNED NOT NULL,
  author_id   BIGINT UNSIGNED NOT NULL,
  message     TEXT NOT NULL,
  is_internal_note TINYINT(1) NOT NULL DEFAULT 0,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_ticketreplies_ticket (ticket_id, created_at),
  CONSTRAINT fk_ticketreplies_ticket FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_ticketreplies_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE faqs (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category    VARCHAR(80) NULL,
  question    VARCHAR(300) NOT NULL,
  answer      TEXT NOT NULL,
  display_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  is_active   TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB;

CREATE TABLE live_chats (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid        CHAR(36) NOT NULL DEFAULT (UUID()),
  user_id     BIGINT UNSIGNED NOT NULL,
  agent_id    BIGINT UNSIGNED NULL,
  status      ENUM('open','active','closed') NOT NULL DEFAULT 'open',
  started_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  closed_at   TIMESTAMP NULL,
  KEY idx_livechats_user (user_id),
  CONSTRAINT fk_livechats_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_livechats_agent FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE live_chat_messages (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  live_chat_id BIGINT UNSIGNED NOT NULL,
  sender_id   BIGINT UNSIGNED NOT NULL,
  message     TEXT NOT NULL,
  sent_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_chatmsg_chat (live_chat_id, sent_at),
  CONSTRAINT fk_chatmsg_chat FOREIGN KEY (live_chat_id) REFERENCES live_chats(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_chatmsg_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE feedback (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     BIGINT UNSIGNED NOT NULL,
  feedback_type ENUM('platform','order','support','feature_request') NOT NULL DEFAULT 'platform',
  rating      TINYINT UNSIGNED NULL,
  message     TEXT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_feedback_user (user_id),
  CONSTRAINT chk_feedback_rating CHECK (rating IS NULL OR rating BETWEEN 1 AND 5),
  CONSTRAINT fk_feedback_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ============================================================================
-- MODULE 16: NOTIFICATIONS
-- ============================================================================

-- NOTE: partitioned table -> no FK on user_id (enforce at app layer), and
-- PRIMARY KEY must be composite (id, created_at) to include the partition column.
CREATE TABLE notifications (
  id          BIGINT UNSIGNED AUTO_INCREMENT,
  uuid        CHAR(36) NOT NULL DEFAULT (UUID()),
  user_id     BIGINT UNSIGNED NOT NULL,
  title       VARCHAR(200) NOT NULL,
  body        VARCHAR(500) NULL,
  notif_type  VARCHAR(60) NOT NULL,                        -- 'order_update','quotation','payment', etc.
  reference_type VARCHAR(60) NULL,
  reference_id   BIGINT UNSIGNED NULL,
  is_read     TINYINT(1) NOT NULL DEFAULT 0,
  read_at     TIMESTAMP NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id, created_at),
  KEY idx_notifications_user (user_id, is_read, created_at)
) ENGINE=InnoDB
  PARTITION BY RANGE (UNIX_TIMESTAMP(created_at)) (
    PARTITION p_2025 VALUES LESS THAN (UNIX_TIMESTAMP('2026-01-01')),
    PARTITION p_2026 VALUES LESS THAN (UNIX_TIMESTAMP('2027-01-01')),
    PARTITION p_future VALUES LESS THAN MAXVALUE
  );

CREATE TABLE notification_settings (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     BIGINT UNSIGNED NOT NULL,
  channel     ENUM('email','sms','push','in_app') NOT NULL,
  notif_type  VARCHAR(60) NOT NULL,
  is_enabled  TINYINT(1) NOT NULL DEFAULT 1,
  UNIQUE KEY uq_notifsettings (user_id, channel, notif_type),
  CONSTRAINT fk_notifsettings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE email_queue (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  to_email    VARCHAR(190) NOT NULL,
  subject     VARCHAR(250) NOT NULL,
  body        MEDIUMTEXT NOT NULL,
  status      ENUM('queued','sending','sent','failed') NOT NULL DEFAULT 'queued',
  attempts    TINYINT UNSIGNED NOT NULL DEFAULT 0,
  send_after  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sent_at     TIMESTAMP NULL,
  error_message VARCHAR(500) NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_emailqueue_status (status, send_after)
) ENGINE=InnoDB;

CREATE TABLE sms_queue (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  to_phone    VARCHAR(20) NOT NULL,
  message     VARCHAR(500) NOT NULL,
  status      ENUM('queued','sending','sent','failed') NOT NULL DEFAULT 'queued',
  attempts    TINYINT UNSIGNED NOT NULL DEFAULT 0,
  send_after  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sent_at     TIMESTAMP NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_smsqueue_status (status, send_after)
) ENGINE=InnoDB;

CREATE TABLE push_queue (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  device_token_id BIGINT UNSIGNED NOT NULL,
  title       VARCHAR(200) NOT NULL,
  body        VARCHAR(500) NULL,
  status      ENUM('queued','sending','sent','failed') NOT NULL DEFAULT 'queued',
  attempts    TINYINT UNSIGNED NOT NULL DEFAULT 0,
  sent_at     TIMESTAMP NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_pushqueue_status (status),
  CONSTRAINT fk_pushqueue_devicetoken FOREIGN KEY (device_token_id) REFERENCES device_tokens(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ============================================================================
-- MODULE 17: SCHOOL DASHBOARD / ANALYTICS
-- ============================================================================

CREATE TABLE analytics_snapshots (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  scope_type    ENUM('platform','school','dealer') NOT NULL,
  scope_id      BIGINT UNSIGNED NULL,                      -- NULL for platform-wide
  metric_name   VARCHAR(100) NOT NULL,                     -- e.g. 'total_orders','revenue'
  metric_value  DECIMAL(18,2) NOT NULL,
  snapshot_date DATE NOT NULL,
  UNIQUE KEY uq_analytics_scope_metric_date (scope_type, scope_id, metric_name, snapshot_date),
  KEY idx_analytics_date (snapshot_date)
) ENGINE=InnoDB;

CREATE TABLE dashboard_widgets (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     BIGINT UNSIGNED NOT NULL,
  widget_key  VARCHAR(60) NOT NULL,                        -- e.g. 'recent_orders','spend_chart'
  position    SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  is_visible  TINYINT(1) NOT NULL DEFAULT 1,
  config      JSON NULL,
  UNIQUE KEY uq_dashwidget_user_key (user_id, widget_key),
  CONSTRAINT fk_dashwidget_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE recent_activity (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     BIGINT UNSIGNED NOT NULL,
  activity_type VARCHAR(60) NOT NULL,
  description VARCHAR(255) NOT NULL,
  reference_type VARCHAR(60) NULL,
  reference_id   BIGINT UNSIGNED NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_recentactivity_user (user_id, created_at),
  CONSTRAINT fk_recentactivity_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE announcements (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(200) NOT NULL,
  body        TEXT NOT NULL,
  audience    ENUM('all','schools','dealers','admins') NOT NULL DEFAULT 'all',
  starts_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ends_at     TIMESTAMP NULL,
  is_active   TINYINT(1) NOT NULL DEFAULT 1,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_announcements_audience (audience, is_active)
) ENGINE=InnoDB;

-- ============================================================================
-- MODULE 18: FILE STORAGE
-- ============================================================================

CREATE TABLE uploaded_files (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid          CHAR(36) NOT NULL DEFAULT (UUID()),
  uploaded_by   BIGINT UNSIGNED NULL,
  file_name     VARCHAR(255) NOT NULL,
  file_path     VARCHAR(500) NOT NULL,                     -- S3/object-storage key or CDN path
  mime_type     VARCHAR(100) NOT NULL,
  file_size_bytes BIGINT UNSIGNED NOT NULL,
  storage_provider ENUM('s3','gcs','azure_blob','local') NOT NULL DEFAULT 's3',
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at    TIMESTAMP NULL,
  UNIQUE KEY uq_uploadedfiles_uuid (uuid),
  KEY idx_uploadedfiles_uploader (uploaded_by),
  CONSTRAINT fk_uploadedfiles_user FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE media (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  file_id     BIGINT UNSIGNED NOT NULL,
  media_type  ENUM('image','video','audio') NOT NULL,
  width_px    INT UNSIGNED NULL,
  height_px   INT UNSIGNED NULL,
  duration_seconds INT UNSIGNED NULL,
  KEY idx_media_file (file_id),
  CONSTRAINT fk_media_file FOREIGN KEY (file_id) REFERENCES uploaded_files(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE documents (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  file_id     BIGINT UNSIGNED NOT NULL,
  document_category VARCHAR(80) NULL,                      -- 'invoice','certificate','contract', etc.
  KEY idx_documents_file (file_id),
  CONSTRAINT fk_documents_file FOREIGN KEY (file_id) REFERENCES uploaded_files(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE attachments (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  file_id         BIGINT UNSIGNED NOT NULL,
  attachable_type VARCHAR(60) NOT NULL,                    -- polymorphic: 'support_ticket','ticket_reply', etc.
  attachable_id   BIGINT UNSIGNED NOT NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_attachments_polymorphic (attachable_type, attachable_id),
  CONSTRAINT fk_attachments_file FOREIGN KEY (file_id) REFERENCES uploaded_files(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ============================================================================
-- MODULE 19: SETTINGS
-- ============================================================================

CREATE TABLE application_settings (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL,
  setting_value TEXT NULL,
  value_type  ENUM('string','number','boolean','json') NOT NULL DEFAULT 'string',
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_appsettings_key (setting_key)
) ENGINE=InnoDB;

CREATE TABLE school_settings (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  school_id   BIGINT UNSIGNED NOT NULL,
  setting_key VARCHAR(100) NOT NULL,
  setting_value TEXT NULL,
  UNIQUE KEY uq_schoolsettings (school_id, setting_key),
  CONSTRAINT fk_schoolsettings_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE dealer_settings (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  dealer_id   BIGINT UNSIGNED NOT NULL,
  setting_key VARCHAR(100) NOT NULL,
  setting_value TEXT NULL,
  UNIQUE KEY uq_dealersettings (dealer_id, setting_key),
  CONSTRAINT fk_dealersettings_dealer FOREIGN KEY (dealer_id) REFERENCES dealers(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE payment_settings (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  provider_name VARCHAR(60) NOT NULL,
  config_key    VARCHAR(100) NOT NULL,
  config_value  TEXT NULL,                                 -- store secrets via app-level encryption, not plaintext
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  UNIQUE KEY uq_paysettings (provider_name, config_key)
) ENGINE=InnoDB;

CREATE TABLE email_settings (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  config_key  VARCHAR(100) NOT NULL,
  config_value TEXT NULL,
  UNIQUE KEY uq_emailsettings_key (config_key)
) ENGINE=InnoDB;

CREATE TABLE sms_settings (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  config_key  VARCHAR(100) NOT NULL,
  config_value TEXT NULL,
  UNIQUE KEY uq_smssettings_key (config_key)
) ENGINE=InnoDB;

CREATE TABLE theme_settings (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  scope_type  ENUM('platform','school') NOT NULL DEFAULT 'platform',
  scope_id    BIGINT UNSIGNED NULL,
  config_key  VARCHAR(100) NOT NULL,
  config_value TEXT NULL,
  UNIQUE KEY uq_themesettings (scope_type, scope_id, config_key)
) ENGINE=InnoDB;

-- ============================================================================
-- MODULE 20: AUDIT & LOGGING
-- ============================================================================

-- NOTE: partitioned table -> no FK on user_id (enforce at app layer), and
-- PRIMARY KEY must be composite (id, created_at) to include the partition column.
CREATE TABLE audit_logs (
  id            BIGINT UNSIGNED AUTO_INCREMENT,
  user_id       BIGINT UNSIGNED NULL,
  action        VARCHAR(100) NOT NULL,                     -- e.g. 'product.updated'
  entity_type   VARCHAR(60) NOT NULL,
  entity_id     BIGINT UNSIGNED NOT NULL,
  old_values    JSON NULL,
  new_values    JSON NULL,
  ip_address    VARCHAR(45) NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id, created_at),
  KEY idx_auditlogs_entity (entity_type, entity_id),
  KEY idx_auditlogs_user (user_id, created_at)
) ENGINE=InnoDB
  PARTITION BY RANGE (UNIX_TIMESTAMP(created_at)) (
    PARTITION p_2025 VALUES LESS THAN (UNIX_TIMESTAMP('2026-01-01')),
    PARTITION p_2026 VALUES LESS THAN (UNIX_TIMESTAMP('2027-01-01')),
    PARTITION p_future VALUES LESS THAN MAXVALUE
  );

CREATE TABLE activity_logs (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     BIGINT UNSIGNED NULL,
  activity    VARCHAR(150) NOT NULL,
  metadata    JSON NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_activitylogs_user (user_id, created_at),
  CONSTRAINT fk_activitylogs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE error_logs (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  error_level ENUM('info','warning','error','critical') NOT NULL DEFAULT 'error',
  message     TEXT NOT NULL,
  stack_trace MEDIUMTEXT NULL,
  context     JSON NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_errorlogs_level_date (error_level, created_at)
) ENGINE=InnoDB;

-- NOTE: partitioned table -> no FK on user_id (enforce at app layer), and
-- PRIMARY KEY must be composite (id, created_at) to include the partition column.
CREATE TABLE api_logs (
  id            BIGINT UNSIGNED AUTO_INCREMENT,
  user_id       BIGINT UNSIGNED NULL,
  method        VARCHAR(10) NOT NULL,
  endpoint      VARCHAR(255) NOT NULL,
  status_code   SMALLINT UNSIGNED NOT NULL,
  response_time_ms INT UNSIGNED NULL,
  ip_address    VARCHAR(45) NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id, created_at),
  KEY idx_apilogs_endpoint (endpoint, created_at),
  KEY idx_apilogs_user (user_id)
) ENGINE=InnoDB
  PARTITION BY RANGE (UNIX_TIMESTAMP(created_at)) (
    PARTITION p_2025 VALUES LESS THAN (UNIX_TIMESTAMP('2026-01-01')),
    PARTITION p_2026 VALUES LESS THAN (UNIX_TIMESTAMP('2027-01-01')),
    PARTITION p_future VALUES LESS THAN MAXVALUE
  );

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- DEFERRED FOREIGN KEYS
-- File-reference columns (file_id / logo_file_id / cover_file_id, etc.) point
-- to uploaded_files, which is defined late in the load order (Module 18).
-- Applying these as ALTER TABLE statements after all tables exist keeps the
-- CREATE TABLE order readable top-to-bottom by business module while still
-- guaranteeing full referential integrity. Same treatment for products.tax_id
-- -> taxes, defined in Module 11.
-- ============================================================================

ALTER TABLE schools            ADD CONSTRAINT fk_schools_logo            FOREIGN KEY (logo_file_id) REFERENCES uploaded_files(id) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE school_documents   ADD CONSTRAINT fk_schooldocs_file          FOREIGN KEY (file_id) REFERENCES uploaded_files(id) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE dealers            ADD CONSTRAINT fk_dealers_logo             FOREIGN KEY (logo_file_id) REFERENCES uploaded_files(id) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE dealer_documents   ADD CONSTRAINT fk_dealerdocs_file          FOREIGN KEY (file_id) REFERENCES uploaded_files(id) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE categories         ADD CONSTRAINT fk_categories_icon          FOREIGN KEY (icon_file_id) REFERENCES uploaded_files(id) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE brands             ADD CONSTRAINT fk_brands_logo              FOREIGN KEY (logo_file_id) REFERENCES uploaded_files(id) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE products           ADD CONSTRAINT fk_products_tax             FOREIGN KEY (tax_id) REFERENCES taxes(id) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE product_images     ADD CONSTRAINT fk_prodimg_file             FOREIGN KEY (file_id) REFERENCES uploaded_files(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE product_videos     ADD CONSTRAINT fk_prodvid_file             FOREIGN KEY (file_id) REFERENCES uploaded_files(id) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE collections        ADD CONSTRAINT fk_collections_banner       FOREIGN KEY (banner_file_id) REFERENCES uploaded_files(id) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE kit_images         ADD CONSTRAINT fk_kitimg_file              FOREIGN KEY (file_id) REFERENCES uploaded_files(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE books              ADD CONSTRAINT fk_books_file               FOREIGN KEY (file_id) REFERENCES uploaded_files(id) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE worksheets         ADD CONSTRAINT fk_worksheets_file          FOREIGN KEY (file_id) REFERENCES uploaded_files(id) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE teacher_kits       ADD CONSTRAINT fk_teacherkits_file         FOREIGN KEY (file_id) REFERENCES uploaded_files(id) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE assessments        ADD CONSTRAINT fk_assessments_file         FOREIGN KEY (file_id) REFERENCES uploaded_files(id) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE certificates       ADD CONSTRAINT fk_certificates_file        FOREIGN KEY (file_id) REFERENCES uploaded_files(id) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE downloads          ADD CONSTRAINT fk_downloads_file           FOREIGN KEY (file_id) REFERENCES uploaded_files(id) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE uniform_designs    ADD CONSTRAINT fk_uniform_file             FOREIGN KEY (file_id) REFERENCES uploaded_files(id) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE id_cards           ADD CONSTRAINT fk_idcards_templatefile     FOREIGN KEY (template_file_id) REFERENCES uploaded_files(id) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE branding_gallery   ADD CONSTRAINT fk_brandinggallery_file     FOREIGN KEY (file_id) REFERENCES uploaded_files(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE customization_files ADD CONSTRAINT fk_customfiles_file        FOREIGN KEY (file_id) REFERENCES uploaded_files(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE production_checkpoint_images ADD CONSTRAINT fk_prodcheckpointimg_file FOREIGN KEY (file_id) REFERENCES uploaded_files(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE invoices           ADD CONSTRAINT fk_invoices_file            FOREIGN KEY (file_id) REFERENCES uploaded_files(id) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE blogs              ADD CONSTRAINT fk_blogs_coverfile          FOREIGN KEY (cover_file_id) REFERENCES uploaded_files(id) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE learning_videos    ADD CONSTRAINT fk_learnvideos_thumbfile    FOREIGN KEY (thumbnail_file_id) REFERENCES uploaded_files(id) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE learning_downloads ADD CONSTRAINT fk_learndownloads_file      FOREIGN KEY (file_id) REFERENCES uploaded_files(id) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE success_stories    ADD CONSTRAINT fk_successstories_coverfile FOREIGN KEY (cover_file_id) REFERENCES uploaded_files(id) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE resources          ADD CONSTRAINT fk_resources_file           FOREIGN KEY (file_id) REFERENCES uploaded_files(id) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE events             ADD CONSTRAINT fk_events_bannerfile        FOREIGN KEY (banner_file_id) REFERENCES uploaded_files(id) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE event_certificates ADD CONSTRAINT fk_eventcert_file           FOREIGN KEY (file_id) REFERENCES uploaded_files(id) ON DELETE SET NULL ON UPDATE CASCADE;
