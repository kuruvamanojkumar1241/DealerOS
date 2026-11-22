from django.db import models


class Location(models.Model):
    """
    Location entity representing a physical branch.
    Belongs to exactly one tenant organization (org_id).
    locations.csv is the single source of truth for org mapping.
    """
    location_id = models.CharField(max_length=20, primary_key=True)
    org_id = models.CharField(max_length=20, db_index=True)
    location_name = models.CharField(max_length=100)

    class Meta:
        ordering = ['location_id']

    def __str__(self):
        return f"{self.location_id} ({self.org_id}) - {self.location_name}"


class SystemARecord(models.Model):
    """
    Record in System A.
    Represents business events as recorded by System A ledger.
    """
    record_id = models.CharField(max_length=50, unique=True, db_index=True)
    location = models.ForeignKey(
        Location,
        on_delete=models.PROTECT,
        related_name='system_a_records',
        db_column='location_id'
    )
    event_date = models.DateField()
    category_code = models.CharField(max_length=50)
    actor_id = models.CharField(max_length=50, null=True, blank=True)
    base_value = models.DecimalField(max_digits=15, decimal_places=2)
    adjustment = models.DecimalField(max_digits=15, decimal_places=2)
    total_value = models.DecimalField(max_digits=15, decimal_places=2)
    state = models.CharField(max_length=20, default='CONFIRMED')

    class Meta:
        ordering = ['record_id']

    def __str__(self):
        return f"{self.record_id} [{self.location_id}] - Total: {self.total_value}"


class SystemBEntry(models.Model):
    """
    Entry in System B.
    Represents entries pointing back to System A records via record_ref.
    Can contain orphans (unknown record_ref), multiple entries per record,
    or dirty/unparseable values (stored in value_raw).
    """
    entry_id = models.CharField(max_length=50, unique=True, db_index=True)
    record_ref_raw = models.CharField(max_length=100, blank=True, null=True)
    record_ref = models.CharField(max_length=50, db_index=True, blank=True, null=True)
    location = models.ForeignKey(
        Location,
        on_delete=models.PROTECT,
        related_name='system_b_entries',
        db_column='location_id'
    )
    recorded_on = models.DateField()
    value_raw = models.CharField(max_length=100, blank=True, null=True)
    value = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    label = models.CharField(max_length=255, blank=True, default='')

    class Meta:
        ordering = ['entry_id']

    def __str__(self):
        return f"{self.entry_id} -> {self.record_ref} [{self.location_id}] - Val: {self.value}"
