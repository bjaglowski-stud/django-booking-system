import os

import MySQLdb
from django.conf import settings
from django.contrib.auth.models import Group
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Initialize the database if it does not exist (supports MySQL) and create required groups."

    def handle(self, *args, **options):  # noqa: C901
        self._init_database()
        self._create_groups()

    def _create_groups(self):
        """Create doctor and administrator groups if they don't exist."""
        doctor_group, created = Group.objects.get_or_create(name="doctor")
        if created:
            self.stdout.write(self.style.SUCCESS("Created 'doctor' group"))
        else:
            self.stdout.write(self.style.SUCCESS("'doctor' group already exists"))

        admin_group, created = Group.objects.get_or_create(name="administrator")
        if created:
            self.stdout.write(self.style.SUCCESS("Created 'administrator' group"))
        else:
            self.stdout.write(self.style.SUCCESS("'administrator' group already exists"))

    def _init_database(self):  # noqa: C901
        """Initialize database - original handle logic."""
        db = settings.DATABASES.get("default")
        if not db:
            self.stdout.write(self.style.ERROR("No default database configured in settings."))
            return

        engine = db.get("ENGINE", "").lower()
        name = db.get("NAME")
        user = db.get("USER")
        password = db.get("PASSWORD")
        host = db.get("HOST") or "localhost"
        port = db.get("PORT") or None

        if "mysql" in engine:
            # Simple flow:
            # 1. Try connecting with application user (common in managed DBs).
            # 2. If that fails, try root credentials from env `MYSQL_ROOT_USER`/`MYSQL_ROOT_PASSWORD`.
            # 3. If connected, run CREATE DATABASE IF NOT EXISTS and return.

            root_user = os.environ.get("MYSQL_ROOT_USER", "root")
            root_password = os.environ.get("MYSQL_ROOT_PASSWORD")

            def try_connect(u, p):
                try:
                    conn = MySQLdb.connect(host=host, port=int(port) if port else 3306, user=u, passwd=p)
                    # prefer autocommit
                    try:
                        conn.autocommit(True)
                    except Exception:
                        try:
                            conn.autocommit = True
                        except Exception:
                            pass
                    return conn, None
                except Exception as exc:
                    return None, str(exc)

            # 1) try application user first
            conn, err = try_connect(user, password)
            if conn:
                try:
                    cur = conn.cursor()
                    cur.execute(f"CREATE DATABASE IF NOT EXISTS `{name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
                    self.stdout.write(self.style.SUCCESS(f"Ensured database `{name}` exists (connected as app user)."))
                except Exception as exc:
                    self.stdout.write(self.style.ERROR(f"Failed to ensure database exists as app user: {exc}"))
                finally:
                    try:
                        conn.close()
                    except Exception:
                        pass
                return

            # 2) try root from env
            conn, err_root = try_connect(root_user, root_password)
            if conn:
                try:
                    cur = conn.cursor()
                    cur.execute(f"CREATE DATABASE IF NOT EXISTS `{name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
                    self.stdout.write(self.style.SUCCESS(f"Ensured database `{name}` exists (connected as root)."))
                    # best-effort grant to application user
                    try:
                        if user:
                            cur.execute("GRANT ALL PRIVILEGES ON `%s`.* TO %s@'%%' IDENTIFIED BY %%s;" % (name, "'" + user + "'"), (password or ""))
                            cur.execute("FLUSH PRIVILEGES;")
                            self.stdout.write(self.style.SUCCESS(f"Attempted to grant privileges to `{user}` (best-effort)."))
                    except Exception:
                        self.stdout.write(self.style.WARNING("Could not grant privileges to application user; you may need to set them manually."))
                except Exception as exc:
                    self.stdout.write(self.style.ERROR(f"Failed to ensure database exists as root: {exc}"))
                finally:
                    try:
                        conn.close()
                    except Exception:
                        pass
                return

            # If we reach here both attempts failed
            self.stdout.write(self.style.ERROR("Failed to connect to MySQL server with both application user and root credentials."))
            if err:
                self.stdout.write(self.style.ERROR(f"App user error: {err}"))
            if err_root:
                self.stdout.write(self.style.ERROR(f"Root user error: {err_root}"))
            self.stdout.write("")
            self.stdout.write(
                self.style.WARNING(
                    "Set `MYSQL_ROOT_PASSWORD` (and optionally `MYSQL_ROOT_USER`) in your .env and retry, or create the database manually inside the DB container."  # noqa: E501
                )
            )
            self.stdout.write(self.style.WARNING('Manual example: docker compose exec db mysql -uroot -p -e "CREATE DATABASE booking_db;"'))
            return

        # For other engines (postgres etc.) just print instructions
        self.stdout.write(self.style.WARNING(f"Database engine '{engine}' is not explicitly supported by this command."))
        self.stdout.write("Please create the database manually or run an equivalent command for your database engine.")


def connect_user_is_root(user, conn):
    """Heuristic: check current_user() or is_superuser privilege for MySQL root-like accounts."""
    try:
        cur = conn.cursor()
        cur.execute("SELECT CURRENT_USER();")
        row = cur.fetchone()
        if row:
            cur_user = row[0]
            # root@localhost or root@% patterns
            if cur_user.startswith("root@"):
                return True
        # fallback: try a privileged command
        try:
            cur.execute("SHOW GRANTS FOR CURRENT_USER();")
            grants = " ".join([str(r) for r in cur.fetchall()])
            if "ALL PRIVILEGES" in grants or "GRANT ALL" in grants:
                return True
        except Exception:
            pass
    except Exception:
        pass
    return False
