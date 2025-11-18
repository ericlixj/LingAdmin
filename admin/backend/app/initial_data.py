import logging

from app.core.db import engine, init_db
from sqlmodel import Session

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def init() -> None:
    with Session(engine) as session:
        init_db(session)


def main() -> None:
    logger.info("Creating initial data...")
    # FIXME: Uncomment the following line when the init_db function is ready
    # init()
    logger.info("finish initial data created!")


if __name__ == "__main__":
    main()
