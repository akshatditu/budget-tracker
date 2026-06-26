"""Test bootstrap. Money columns are encrypted at rest, and importing the models
pulls in `app.core.crypto`, which needs an ENCRYPTION_KEY. Provide a throwaway key
for the test run (a real env key, if present, is respected)."""
import os

from cryptography.fernet import Fernet

os.environ.setdefault("ENCRYPTION_KEY", Fernet.generate_key().decode())
