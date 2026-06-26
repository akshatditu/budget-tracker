"""Application-layer encryption for money values (encrypt-at-rest, server-held key).

Amounts are stored as opaque Fernet tokens (Text) so anyone with only database
access — a stolen dump, a backup, a DBA — sees ciphertext, never numbers. The key
lives only in `settings.encryption_key` (server env), never in the database. The
server decrypts transparently on read, so all existing rollup math is unchanged.

`MultiFernet` is used so a future key rotation is a one-line change: prepend a new
key to the list (new writes use it; old tokens still decrypt with the trailing keys).

WARNING: losing the key makes every stored amount permanently unreadable.
"""
from __future__ import annotations

from decimal import Decimal

from cryptography.fernet import Fernet, MultiFernet
from sqlalchemy import Text
from sqlalchemy.types import TypeDecorator

from app.core.config import settings


def _build_cipher() -> MultiFernet:
    keys = [k.strip() for k in settings.encryption_key.split(",") if k.strip()]
    if not keys:
        raise RuntimeError(
            "encryption_key is not set. Generate one with "
            '`python -c "from cryptography.fernet import Fernet; '
            "print(Fernet.generate_key().decode())\"` and put it in your .env "
            "(ENCRYPTION_KEY=...). Losing it makes stored amounts unreadable."
        )
    return MultiFernet([Fernet(k.encode()) for k in keys])


# Built once at import. The first key encrypts; any key can decrypt (rotation).
cipher = _build_cipher()


def encrypt_amount(value) -> str:
    """Decimal | float | int -> Fernet token (str). Stores a canonical decimal string."""
    token = cipher.encrypt(str(Decimal(str(value))).encode())
    return token.decode()


def decrypt_amount(token: str) -> Decimal:
    """Fernet token (str) -> Decimal."""
    return Decimal(cipher.decrypt(token.encode()).decode())


class EncryptedNumeric(TypeDecorator):
    """A money column that is transparently encrypted at rest.

    Binds `Decimal | float | None` -> Fernet token text; returns token text ->
    `Decimal | None`. Downstream code (rollup.f(), the float schemas) keeps working
    because reads yield a Decimal just like the old Numeric column did.
    """

    impl = Text
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        return encrypt_amount(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        return decrypt_amount(value)
