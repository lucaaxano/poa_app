-- Complete schema setup from all migrations

-- Migration 1: Init (main tables)
CREATE TABLE IF NOT EXISTS companies (
    id TEXT NOT NULL PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    city TEXT,
    postal_code TEXT,
    country TEXT DEFAULT 'DE',
    phone TEXT,
    website TEXT,
    logo_url TEXT,
    num_employees INTEGER,
    num_vehicles INTEGER,
    settings JSONB DEFAULT '{}',
    stripe_customer_id TEXT UNIQUE,
    subscription_status TEXT,
    subscription_id TEXT,
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
    id TEXT NOT NULL PRIMARY KEY,
    company_id TEXT REFERENCES companies(id),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'EMPLOYEE',
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    position TEXT,
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    email_verified_at TIMESTAMP(3),
    last_login_at TIMESTAMP(3),
    notification_settings JSONB DEFAULT '{}',
    two_factor_secret TEXT,
    two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
    two_factor_backup_codes TEXT[],
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS password_resets (
    id TEXT NOT NULL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    token_hash TEXT NOT NULL UNIQUE,
    token_prefix TEXT,
    expires_at TIMESTAMP(3) NOT NULL,
    used_at TIMESTAMP(3),
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS email_verifications (
    id TEXT NOT NULL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    token_hash TEXT NOT NULL UNIQUE,
    token_prefix TEXT,
    expires_at TIMESTAMP(3) NOT NULL,
    used_at TIMESTAMP(3),
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS invitations (
    id TEXT NOT NULL PRIMARY KEY,
    company_id TEXT NOT NULL REFERENCES companies(id),
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'EMPLOYEE',
    token_hash TEXT NOT NULL UNIQUE,
    token_prefix TEXT,
    invited_by_user_id TEXT NOT NULL REFERENCES users(id),
    target_user_id TEXT REFERENCES users(id),
    expires_at TIMESTAMP(3) NOT NULL,
    accepted_at TIMESTAMP(3),
    rejected_at TIMESTAMP(3),
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS broker_company_links (
    id TEXT NOT NULL PRIMARY KEY,
    broker_user_id TEXT NOT NULL REFERENCES users(id),
    company_id TEXT NOT NULL REFERENCES companies(id),
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE(broker_user_id, company_id)
);

CREATE TABLE IF NOT EXISTS insurers (
    id TEXT NOT NULL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    claims_email TEXT NOT NULL,
    contact_phone TEXT,
    website TEXT,
    logo_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS vehicles (
    id TEXT NOT NULL PRIMARY KEY,
    company_id TEXT NOT NULL REFERENCES companies(id),
    license_plate TEXT NOT NULL,
    brand TEXT,
    model TEXT,
    year INTEGER,
    vin TEXT,
    hsn TEXT,
    tsn TEXT,
    internal_name TEXT,
    vehicle_type TEXT NOT NULL DEFAULT 'CAR',
    color TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE(company_id, license_plate)
);

CREATE TABLE IF NOT EXISTS policies (
    id TEXT NOT NULL PRIMARY KEY,
    company_id TEXT NOT NULL REFERENCES companies(id),
    insurer_id TEXT NOT NULL REFERENCES insurers(id),
    policy_number TEXT NOT NULL,
    coverage_type TEXT NOT NULL DEFAULT 'FLEET',
    pricing_model TEXT,
    annual_premium DECIMAL(10,2),
    deductible DECIMAL(10,2),
    quota_threshold DECIMAL(5,2),
    valid_from TIMESTAMP(3) NOT NULL,
    valid_to TIMESTAMP(3),
    is_active BOOLEAN NOT NULL DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE(company_id, policy_number)
);

CREATE TABLE IF NOT EXISTS claims (
    id TEXT NOT NULL PRIMARY KEY,
    company_id TEXT NOT NULL REFERENCES companies(id),
    vehicle_id TEXT NOT NULL REFERENCES vehicles(id),
    policy_id TEXT REFERENCES policies(id),
    reporter_user_id TEXT NOT NULL REFERENCES users(id),
    driver_user_id TEXT REFERENCES users(id),
    status TEXT NOT NULL DEFAULT 'DRAFT',
    claim_number TEXT NOT NULL UNIQUE,
    insurer_claim_number TEXT,
    accident_date DATE NOT NULL,
    accident_time TIME,
    accident_location TEXT,
    gps_lat DECIMAL(10,8),
    gps_lng DECIMAL(11,8),
    damage_category TEXT NOT NULL,
    damage_subcategory TEXT,
    description TEXT,
    police_involved BOOLEAN NOT NULL DEFAULT false,
    police_file_number TEXT,
    has_injuries BOOLEAN NOT NULL DEFAULT false,
    injury_details TEXT,
    third_party_info JSONB,
    witness_info JSONB,
    estimated_cost DECIMAL(10,2),
    final_cost DECIMAL(10,2),
    claim_data JSONB,
    rejection_reason TEXT,
    sent_at TIMESTAMP(3),
    acknowledged_at TIMESTAMP(3),
    closed_at TIMESTAMP(3),
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS claim_attachments (
    id TEXT NOT NULL PRIMARY KEY,
    claim_id TEXT NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS claim_events (
    id TEXT NOT NULL PRIMARY KEY,
    claim_id TEXT NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id),
    event_type TEXT NOT NULL,
    old_value JSONB,
    new_value JSONB,
    meta JSONB,
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS claim_comments (
    id TEXT NOT NULL PRIMARY KEY,
    claim_id TEXT NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS notifications (
    id TEXT NOT NULL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    read_at TIMESTAMP(3),
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS email_logs (
    id TEXT NOT NULL PRIMARY KEY,
    claim_id TEXT,
    recipient TEXT NOT NULL,
    subject TEXT NOT NULL,
    message_id TEXT,
    status TEXT NOT NULL,
    error_message TEXT,
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS _prisma_migrations (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    checksum VARCHAR(64) NOT NULL,
    finished_at TIMESTAMP(3),
    migration_name VARCHAR(255) NOT NULL,
    logs TEXT,
    rolled_back_at TIMESTAMP(3),
    started_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    applied_steps_count INTEGER NOT NULL DEFAULT 0
);

-- Create indexes
CREATE INDEX IF NOT EXISTS users_company_id_idx ON users(company_id);
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE INDEX IF NOT EXISTS vehicles_company_id_idx ON vehicles(company_id);
CREATE INDEX IF NOT EXISTS policies_company_id_idx ON policies(company_id);
CREATE INDEX IF NOT EXISTS claims_company_id_idx ON claims(company_id);
CREATE INDEX IF NOT EXISTS claims_vehicle_id_idx ON claims(vehicle_id);
CREATE INDEX IF NOT EXISTS claims_status_idx ON claims(status);
CREATE INDEX IF NOT EXISTS claims_accident_date_idx ON claims(accident_date);
CREATE INDEX IF NOT EXISTS claim_attachments_claim_id_idx ON claim_attachments(claim_id);
CREATE INDEX IF NOT EXISTS claim_events_claim_id_idx ON claim_events(claim_id);
CREATE INDEX IF NOT EXISTS claim_comments_claim_id_idx ON claim_comments(claim_id);
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_read_at_idx ON notifications(read_at);
CREATE INDEX IF NOT EXISTS email_logs_claim_id_idx ON email_logs(claim_id);
CREATE INDEX IF NOT EXISTS invitations_email_idx ON invitations(email);
CREATE INDEX IF NOT EXISTS invitations_token_hash_idx ON invitations(token_hash);
CREATE INDEX IF NOT EXISTS invitations_target_user_id_idx ON invitations(target_user_id);
CREATE INDEX IF NOT EXISTS invitations_token_prefix_idx ON invitations(token_prefix);
CREATE INDEX IF NOT EXISTS invitations_expires_at_idx ON invitations(expires_at);
CREATE INDEX IF NOT EXISTS password_resets_token_hash_idx ON password_resets(token_hash);
CREATE INDEX IF NOT EXISTS password_resets_token_prefix_idx ON password_resets(token_prefix);
CREATE INDEX IF NOT EXISTS password_resets_expires_at_idx ON password_resets(expires_at);
CREATE INDEX IF NOT EXISTS email_verifications_token_hash_idx ON email_verifications(token_hash);
CREATE INDEX IF NOT EXISTS email_verifications_token_prefix_idx ON email_verifications(token_prefix);
CREATE INDEX IF NOT EXISTS email_verifications_expires_at_idx ON email_verifications(expires_at);

-- Record all migrations
INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
VALUES
  (gen_random_uuid(), 'init', NOW(), '20251216135439_init', NULL, NULL, NOW(), 1),
  (gen_random_uuid(), 'manual', NOW(), '20260107120000_add_2fa_and_logo_fields', NULL, NULL, NOW(), 1),
  (gen_random_uuid(), 'manual', NOW(), '20260112080000_add_email_verification', NULL, NULL, NOW(), 1),
  (gen_random_uuid(), 'manual', NOW(), '20260112122312_add_broker_invitation_fields', NULL, NULL, NOW(), 1),
  (gen_random_uuid(), 'manual', NOW(), '20260113130000_add_token_prefix_and_indexes', NULL, NULL, NOW(), 1)
ON CONFLICT DO NOTHING;
