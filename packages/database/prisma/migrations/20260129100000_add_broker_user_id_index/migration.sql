-- Add index on BrokerCompanyLink.broker_user_id for faster broker queries
-- This index prevents full table scans when querying companies linked to a broker

-- CreateIndex
CREATE INDEX "broker_company_links_broker_user_id_idx" ON "broker_company_links"("broker_user_id");
