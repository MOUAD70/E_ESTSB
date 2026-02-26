"""
ML service — singleton pipeline loader.

The model is loaded once on first use and cached for the lifetime of the
process. Thread-safe for CPython's GIL; add a lock if you ever move to
a multi-threaded/multi-process setup without forking.
"""
import logging
import os

import joblib

logger = logging.getLogger(__name__)

_pipeline = None


def get_pipeline():
    """Return the cached sklearn pipeline, loading it on first call."""
    global _pipeline
    if _pipeline is None:
        _pipeline = _load_pipeline()
    return _pipeline


def _load_pipeline():
    from flask import current_app

    model_path = current_app.config.get("MODEL_PATH") or os.getenv("MODEL_PATH")

    if not model_path:
        raise RuntimeError("MODEL_PATH is not configured.")

    if not os.path.exists(model_path):
        raise FileNotFoundError(f"ML model not found at: {model_path}")

    logger.info("Loading ML pipeline from %s", model_path)
    return joblib.load(model_path)
