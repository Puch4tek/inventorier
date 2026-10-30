BEGIN;

LOCK TABLE "Item" IN ACCESS EXCLUSIVE MODE;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "Item" AS source
    JOIN "Item" AS target
      ON target."barcode" = 'I-' || substr(source."barcode", 5)
    WHERE left(source."barcode", 4) = 'INV-'
      AND source."id" <> target."id"
  ) THEN
    RAISE EXCEPTION
      'Barcode prefix migration aborted: replacing INV- with I- would create a duplicate Item.barcode.';
  END IF;
END;
$$;

UPDATE "Item"
SET "barcode" = 'I-' || substr("barcode", 5)
WHERE left("barcode", 4) = 'INV-';

COMMIT;
