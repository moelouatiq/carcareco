alter table domain.pricing
    add column snapshotissuername varchar,
    add column snapshotissueraddress varchar,
    add column snapshotissuerphone varchar,
    add column snapshotissueremail varchar,
    add column snapshotissuerregnr varchar,
    add column snapshotissuerkmkr varchar,
    add column snapshotissuerbankaccount varchar,
    add column snapshotvatrate integer,
    add column snapshotsurcharge varchar,
    add column snapshotdisclaimer varchar,
    add column snapshotsignatureline boolean;

-- Intentionally no UPDATE/backfill: null identifies invoices and estimates created before this
-- snapshot existed, whose original tenant settings cannot be reconstructed truthfully.
