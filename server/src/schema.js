import { query } from "./db.js";

const schemaStatements = [
  `
    CREATE TABLE IF NOT EXISTS owners (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      phone_number VARCHAR(32) NULL,
      email VARCHAR(191) NULL UNIQUE,
      password_hash VARCHAR(255) NULL,
      phone_verified_at TIMESTAMP NULL,
      is_admin TINYINT(1) NOT NULL DEFAULT 0,
      can_manage_multiple_restaurants TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  `
    CREATE TABLE IF NOT EXISTS pending_owner_registrations (
      phone_number VARCHAR(32) NOT NULL PRIMARY KEY,
      restaurant_name VARCHAR(191) NOT NULL,
      city VARCHAR(191) NULL,
      country VARCHAR(191) NULL,
      image_path VARCHAR(255) NULL,
      image_position_x DECIMAL(5, 2) NOT NULL DEFAULT 50,
      image_position_y DECIMAL(5, 2) NOT NULL DEFAULT 50,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  `
    CREATE TABLE IF NOT EXISTS owner_auth_otps (
      id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      phone_number VARCHAR(32) NOT NULL,
      purpose VARCHAR(32) NOT NULL,
      request_ip VARCHAR(64) NULL,
      user_agent VARCHAR(255) NULL,
      code_hash CHAR(64) NOT NULL,
      expires_at DATETIME NOT NULL,
      consumed_at DATETIME NULL,
      attempt_count INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_owner_auth_otps_lookup (phone_number, purpose, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  `
    CREATE TABLE IF NOT EXISTS owner_auth_tokens (
      id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      owner_id INT NOT NULL,
      token_hash CHAR(64) NOT NULL UNIQUE,
      user_agent VARCHAR(255) NULL,
      expires_at DATETIME NOT NULL,
      revoked_at DATETIME NULL,
      last_used_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_owner_auth_tokens_owner
        FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE,
      INDEX idx_owner_auth_tokens_owner (owner_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  `
    CREATE TABLE IF NOT EXISTS restaurants (
      id VARCHAR(80) NOT NULL PRIMARY KEY,
      name VARCHAR(191) NOT NULL,
      public_slug VARCHAR(191) NOT NULL UNIQUE,
      address VARCHAR(255) NULL,
      city VARCHAR(191) NULL,
      country VARCHAR(191) NULL,
      phone VARCHAR(80) NULL,
      active TINYINT(1) NOT NULL DEFAULT 1,
      image_path VARCHAR(255) NULL,
      image_position_x DECIMAL(5, 2) NOT NULL DEFAULT 50,
      image_position_y DECIMAL(5, 2) NOT NULL DEFAULT 50,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  `
    CREATE TABLE IF NOT EXISTS owner_restaurants (
      owner_id INT NOT NULL,
      restaurant_id VARCHAR(80) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (owner_id, restaurant_id),
      CONSTRAINT fk_owner_restaurants_owner
        FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE,
      CONSTRAINT fk_owner_restaurants_restaurant
        FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  `
    CREATE TABLE IF NOT EXISTS menu_items (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      restaurant_id VARCHAR(80) NOT NULL,
      name VARCHAR(191) NOT NULL,
      description TEXT NULL,
      price DECIMAL(10, 2) NOT NULL,
      category VARCHAR(191) NOT NULL,
      active TINYINT(1) NOT NULL DEFAULT 1,
      image_path VARCHAR(255) NULL,
      image_position_x DECIMAL(5, 2) NOT NULL DEFAULT 50,
      image_position_y DECIMAL(5, 2) NOT NULL DEFAULT 50,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_menu_items_restaurant
        FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
      INDEX idx_menu_items_restaurant (restaurant_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  `
    CREATE TABLE IF NOT EXISTS restaurant_tables (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      restaurant_id VARCHAR(80) NOT NULL,
      table_number VARCHAR(120) NOT NULL,
      qr_code_path VARCHAR(255) NULL,
      qr_target_url VARCHAR(255) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_restaurant_tables_restaurant
        FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
      UNIQUE KEY uniq_restaurant_table (restaurant_id, table_number)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  `
    CREATE TABLE IF NOT EXISTS orders (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      restaurant_id VARCHAR(80) NOT NULL,
      table_number VARCHAR(120) NULL,
      status VARCHAR(40) NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_orders_restaurant
        FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
      INDEX idx_orders_restaurant (restaurant_id),
      INDEX idx_orders_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  `
    CREATE TABLE IF NOT EXISTS order_items (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      menu_item_id INT NOT NULL,
      quantity INT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_order_items_order
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      CONSTRAINT fk_order_items_menu_item
        FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE RESTRICT,
      INDEX idx_order_items_order (order_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
];

const migrationStatements = [
  "ALTER TABLE owners MODIFY email VARCHAR(191) NULL",
  "ALTER TABLE owners MODIFY password_hash VARCHAR(255) NULL",
  "ALTER TABLE owners ADD COLUMN phone_number VARCHAR(32) NULL AFTER id",
  "ALTER TABLE owners ADD COLUMN phone_verified_at TIMESTAMP NULL AFTER phone_number",
  "ALTER TABLE owners ADD UNIQUE KEY uniq_owners_phone_number (phone_number)",
  "ALTER TABLE owner_auth_otps ADD COLUMN request_ip VARCHAR(64) NULL AFTER purpose",
  "ALTER TABLE owner_auth_otps ADD COLUMN user_agent VARCHAR(255) NULL AFTER request_ip",
  "ALTER TABLE menu_items ADD COLUMN active TINYINT(1) NOT NULL DEFAULT 1 AFTER category",
  "ALTER TABLE restaurants ADD COLUMN image_position_x DECIMAL(5, 2) NOT NULL DEFAULT 50 AFTER image_path",
  "ALTER TABLE restaurants ADD COLUMN image_position_y DECIMAL(5, 2) NOT NULL DEFAULT 50 AFTER image_position_x",
  "ALTER TABLE menu_items ADD COLUMN image_position_x DECIMAL(5, 2) NOT NULL DEFAULT 50 AFTER image_path",
  "ALTER TABLE menu_items ADD COLUMN image_position_y DECIMAL(5, 2) NOT NULL DEFAULT 50 AFTER image_position_x",
];

export async function ensureSchema() {
  for (const statement of schemaStatements) {
    await query(statement);
  }

  for (const statement of migrationStatements) {
    try {
      await query(statement);
    } catch (error) {
      if (!["ER_DUP_FIELDNAME", "ER_DUP_KEYNAME"].includes(error?.code)) {
        throw error;
      }
    }
  }
}
