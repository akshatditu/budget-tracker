"""Encryption-at-rest round-trip tests for money values (no DB)."""
from decimal import Decimal

from app.core.crypto import EncryptedNumeric, decrypt_amount, encrypt_amount


def test_round_trip_preserves_value():
    for v in [Decimal("0"), Decimal("1234.56"), Decimal("99999999.99")]:
        token = encrypt_amount(v)
        assert token != str(v)              # stored value is not the plaintext number
        assert decrypt_amount(token) == v   # decrypt restores it exactly


def test_ciphertext_is_non_deterministic():
    """Fernet uses a random IV, so equal amounts encrypt to different tokens."""
    a = encrypt_amount(Decimal("100"))
    b = encrypt_amount(Decimal("100"))
    assert a != b
    assert decrypt_amount(a) == decrypt_amount(b) == Decimal("100")


def test_type_decorator_bind_and_result():
    t = EncryptedNumeric()
    bound = t.process_bind_param(Decimal("4200.00"), None)
    assert isinstance(bound, str)
    assert t.process_result_value(bound, None) == Decimal("4200.00")
    # None passes through for nullable columns (spend_limit, opening_carry_forward).
    assert t.process_bind_param(None, None) is None
    assert t.process_result_value(None, None) is None


def test_accepts_float_and_int():
    assert decrypt_amount(encrypt_amount(50)) == Decimal("50")
    assert decrypt_amount(encrypt_amount(3.5)) == Decimal("3.5")
