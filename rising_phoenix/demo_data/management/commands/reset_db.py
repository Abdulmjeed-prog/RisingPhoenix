"""Flushes the database and recreates superuser accounts.

Run with:    python manage.py reset_db
             python manage.py reset_db --no-input   (skip confirmation prompt)
"""

from django.contrib.auth.models import User
from django.core.management import call_command
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Flush all database data and recreate superusers.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--no-input', '--noinput', action='store_true',
            help='Skip the confirmation prompt.',
        )

    def handle(self, *args, **options):
        no_input = options['no_input']

        if not no_input:
            confirm = input(
                'This will DELETE ALL DATA in the database. Type "yes" to continue: '
            )
            if confirm.strip().lower() != 'yes':
                self.stdout.write('Aborted.')
                return

        # Save superusers before flush wipes them.
        superusers = list(
            User.objects.filter(is_superuser=True).values(
                'username', 'email', 'password',
                'first_name', 'last_name',
            )
        )

        self.stdout.write('Flushing database...')
        call_command('flush', '--no-input', verbosity=0)

        # Recreate superusers with their original hashed passwords.
        for data in superusers:
            u = User(**data)
            u.is_staff = True
            u.is_superuser = True
            u.save()
            self.stdout.write(f'  recreated superuser: {u.username}')

        self.stdout.write(self.style.SUCCESS(
            f'\nDone. {len(superusers)} superuser(s) restored. '
            'Run "python manage.py load_demo_data" to repopulate.'
        ))
