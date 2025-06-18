# app/core/logger.py
import logging
import logging.config

from app.logging_config import LOGGING_CONFIG


def init_logger():
    logging.config.dictConfig(LOGGING_CONFIG)
