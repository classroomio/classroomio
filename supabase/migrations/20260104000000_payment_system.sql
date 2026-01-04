-- Payment System Migration
-- Supports multiple payment providers (Stripe for USD, Paystack for NGN)
-- with course payments and creator payouts

-- Create enum types for payment system
DO $$ BEGIN
    CREATE TYPE payment_provider AS ENUM ('stripe', 'paystack');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pending', 'succeeded', 'failed', 'refunded', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payout_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Payment Account: Stores creator's connected payment accounts (Stripe Connect, Paystack Subaccount)
CREATE TABLE IF NOT EXISTS payment_account (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY NOT NULL,
    organization_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    provider payment_provider NOT NULL,
    provider_account_id text NOT NULL, -- Stripe Connect ID or Paystack subaccount code
    account_name text, -- Display name for the account
    country text NOT NULL DEFAULT 'US',
    currency text NOT NULL DEFAULT 'USD',
    is_active boolean DEFAULT true NOT NULL,
    is_verified boolean DEFAULT false NOT NULL,
    metadata jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);

-- Unique constraint: one account per org per provider
CREATE UNIQUE INDEX IF NOT EXISTS payment_account_org_provider_unique 
    ON payment_account(organization_id, provider);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_payment_account_org_id ON payment_account(organization_id);
CREATE INDEX IF NOT EXISTS idx_payment_account_provider ON payment_account(provider);

-- Course Payment: Records of course purchases
CREATE TABLE IF NOT EXISTS course_payment (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY NOT NULL,
    course_id uuid NOT NULL REFERENCES course(id) ON DELETE CASCADE,
    profile_id uuid NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
    organization_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    amount bigint NOT NULL, -- Amount in smallest currency unit (cents, kobo)
    currency text NOT NULL,
    provider payment_provider NOT NULL,
    provider_payment_id text, -- Stripe PaymentIntent ID or Paystack reference
    provider_checkout_id text, -- Stripe Checkout Session ID or Paystack transaction reference
    status payment_status DEFAULT 'pending' NOT NULL,
    customer_email text,
    customer_name text,
    platform_fee bigint DEFAULT 0, -- Platform fee in smallest currency unit
    creator_amount bigint DEFAULT 0, -- Amount going to creator after fees
    refund_reason text,
    metadata jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);

-- Indexes for course_payment
CREATE INDEX IF NOT EXISTS idx_course_payment_course_id ON course_payment(course_id);
CREATE INDEX IF NOT EXISTS idx_course_payment_profile_id ON course_payment(profile_id);
CREATE INDEX IF NOT EXISTS idx_course_payment_organization_id ON course_payment(organization_id);
CREATE INDEX IF NOT EXISTS idx_course_payment_provider ON course_payment(provider);
CREATE INDEX IF NOT EXISTS idx_course_payment_status ON course_payment(status);
CREATE INDEX IF NOT EXISTS idx_course_payment_provider_payment_id ON course_payment(provider_payment_id);
CREATE INDEX IF NOT EXISTS idx_course_payment_provider_checkout_id ON course_payment(provider_checkout_id);

-- Unique constraint: prevent duplicate payments
CREATE UNIQUE INDEX IF NOT EXISTS course_payment_provider_payment_unique 
    ON course_payment(provider_payment_id) WHERE provider_payment_id IS NOT NULL;

-- Payout: Tracks payouts to creators
CREATE TABLE IF NOT EXISTS payout (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY NOT NULL,
    payment_account_id uuid NOT NULL REFERENCES payment_account(id) ON DELETE RESTRICT,
    organization_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    amount bigint NOT NULL, -- Total payout amount in smallest currency unit
    currency text NOT NULL,
    provider payment_provider NOT NULL,
    provider_payout_id text, -- Stripe Transfer ID or Paystack transfer code
    status payout_status DEFAULT 'pending' NOT NULL,
    failure_reason text,
    scheduled_at timestamp with time zone,
    completed_at timestamp with time zone,
    metadata jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);

-- Indexes for payout
CREATE INDEX IF NOT EXISTS idx_payout_payment_account_id ON payout(payment_account_id);
CREATE INDEX IF NOT EXISTS idx_payout_organization_id ON payout(organization_id);
CREATE INDEX IF NOT EXISTS idx_payout_status ON payout(status);
CREATE INDEX IF NOT EXISTS idx_payout_provider ON payout(provider);
CREATE INDEX IF NOT EXISTS idx_payout_scheduled_at ON payout(scheduled_at);

-- Payout Item: Links individual payments to payouts (for tracking which sales are included)
CREATE TABLE IF NOT EXISTS payout_item (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY NOT NULL,
    payout_id uuid NOT NULL REFERENCES payout(id) ON DELETE CASCADE,
    course_payment_id uuid NOT NULL REFERENCES course_payment(id) ON DELETE RESTRICT,
    amount bigint NOT NULL, -- Amount from this payment going to creator
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Indexes for payout_item
CREATE INDEX IF NOT EXISTS idx_payout_item_payout_id ON payout_item(payout_id);
CREATE INDEX IF NOT EXISTS idx_payout_item_course_payment_id ON payout_item(course_payment_id);

-- Unique constraint: each payment can only be in one payout
CREATE UNIQUE INDEX IF NOT EXISTS payout_item_course_payment_unique 
    ON payout_item(course_payment_id);

-- Enable Row Level Security
ALTER TABLE payment_account ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_payment ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_item ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_account
-- Organization admins can view and manage their payment accounts
CREATE POLICY "Organization admins can manage payment accounts" ON payment_account
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM organizationmember om
            WHERE om.organization_id = payment_account.organization_id
            AND om.profile_id = auth.uid()
            AND om.role_id = 1 -- Admin role
        )
    );

-- RLS Policies for course_payment
-- Students can view their own payments
CREATE POLICY "Users can view their own payments" ON course_payment
    FOR SELECT USING (profile_id = auth.uid());

-- Organization admins can view all payments for their org
CREATE POLICY "Organization admins can view org payments" ON course_payment
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM organizationmember om
            WHERE om.organization_id = course_payment.organization_id
            AND om.profile_id = auth.uid()
            AND om.role_id = 1
        )
    );

-- RLS Policies for payout
-- Organization admins can view payouts for their org
CREATE POLICY "Organization admins can view payouts" ON payout
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM organizationmember om
            WHERE om.organization_id = payout.organization_id
            AND om.profile_id = auth.uid()
            AND om.role_id = 1
        )
    );

-- RLS Policies for payout_item
-- Organization admins can view payout items
CREATE POLICY "Organization admins can view payout items" ON payout_item
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM payout p
            JOIN organizationmember om ON om.organization_id = p.organization_id
            WHERE p.id = payout_item.payout_id
            AND om.profile_id = auth.uid()
            AND om.role_id = 1
        )
    );

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_payment_account_updated_at ON payment_account;
CREATE TRIGGER update_payment_account_updated_at
    BEFORE UPDATE ON payment_account
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_course_payment_updated_at ON course_payment;
CREATE TRIGGER update_course_payment_updated_at
    BEFORE UPDATE ON course_payment
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payout_updated_at ON payout;
CREATE TRIGGER update_payout_updated_at
    BEFORE UPDATE ON payout
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create view for organization payment analytics
CREATE OR REPLACE VIEW organization_payment_stats AS
SELECT 
    cp.organization_id,
    COUNT(DISTINCT cp.id) FILTER (WHERE cp.status = 'succeeded') as total_sales,
    COALESCE(SUM(cp.amount) FILTER (WHERE cp.status = 'succeeded'), 0) as total_revenue,
    COALESCE(SUM(cp.creator_amount) FILTER (WHERE cp.status = 'succeeded'), 0) as total_creator_earnings,
    COALESCE(SUM(cp.platform_fee) FILTER (WHERE cp.status = 'succeeded'), 0) as total_platform_fees,
    COUNT(DISTINCT cp.profile_id) FILTER (WHERE cp.status = 'succeeded') as unique_customers,
    COUNT(DISTINCT cp.course_id) FILTER (WHERE cp.status = 'succeeded') as courses_with_sales
FROM course_payment cp
GROUP BY cp.organization_id;

-- Create view for course payment analytics
CREATE OR REPLACE VIEW course_payment_stats AS
SELECT 
    cp.course_id,
    cp.organization_id,
    COUNT(*) FILTER (WHERE cp.status = 'succeeded') as total_sales,
    COALESCE(SUM(cp.amount) FILTER (WHERE cp.status = 'succeeded'), 0) as total_revenue,
    COALESCE(SUM(cp.creator_amount) FILTER (WHERE cp.status = 'succeeded'), 0) as creator_earnings,
    COUNT(DISTINCT cp.profile_id) FILTER (WHERE cp.status = 'succeeded') as unique_customers
FROM course_payment cp
GROUP BY cp.course_id, cp.organization_id;

COMMENT ON TABLE payment_account IS 'Stores creator connected payment accounts for Stripe Connect and Paystack Subaccounts';
COMMENT ON TABLE course_payment IS 'Records of all course purchases with payment provider details';
COMMENT ON TABLE payout IS 'Tracks payouts to course creators';
COMMENT ON TABLE payout_item IS 'Links individual course payments to payouts for tracking';
