from django.core.management.base import BaseCommand
from reconcile.importer import DataImporter


class Command(BaseCommand):
    help = "Import locations.csv, system_a.csv, and system_b.csv into database idempotently"

    def handle(self, *args, **options):
        self.stdout.write("Starting data import from CSV files...")
        importer = DataImporter()
        results = importer.import_all()

        loc = results["locations"]
        a = results["system_a"]
        b = results["system_b"]

        self.stdout.write(
            self.style.SUCCESS(
                f"Locations: {loc['read']} read, {loc['saved']} saved.\n"
                f"System A: {a['read']} read, {a['saved']} saved (blank actors stored as null: {a['null_actors']}).\n"
                f"System B: {b['read']} read, {b['saved']} saved (values left empty/null: {b['null_values']}, refs cleaned: {b['cleaned_refs']})."
            )
        )
