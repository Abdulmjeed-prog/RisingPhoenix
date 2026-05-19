"""Deletes all uploaded media files while preserving default avatars.

Run with:    python manage.py clear_media
             python manage.py clear_media --dry-run   (preview only)
"""

import os
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand

KEEP = {
    'images/avatars/default_avatar.png',
}


class Command(BaseCommand):
    help = 'Delete all media files except default avatars.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run', action='store_true',
            help='Print what would be deleted without deleting anything.',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        media_root = Path(settings.MEDIA_ROOT)

        if not media_root.exists():
            self.stdout.write('MEDIA_ROOT does not exist, nothing to do.')
            return

        deleted = 0
        kept = 0

        for path in sorted(media_root.rglob('*')):
            if not path.is_file():
                continue

            relative = path.relative_to(media_root).as_posix()

            if relative in KEEP:
                kept += 1
                continue

            if dry_run:
                self.stdout.write(f'  would delete: {relative}')
            else:
                path.unlink()
                self.stdout.write(f'  deleted: {relative}')
            deleted += 1

        if not dry_run:
            # Remove empty directories (leaves → root order via reversed sorted)
            for path in sorted(media_root.rglob('*'), reverse=True):
                if path.is_dir() and not any(path.iterdir()):
                    path.rmdir()

        action = 'Would delete' if dry_run else 'Deleted'
        self.stdout.write(self.style.SUCCESS(
            f'\n{action} {deleted} file(s), kept {kept} file(s).'
        ))
