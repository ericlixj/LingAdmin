"""add_daily_new_limit_to_study_session

Revision ID: add_daily_new_limit
Revises: create_flashcard_progress
Create Date: 2025-01-15 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes
from sqlalchemy.dialects import mysql


# revision identifiers, used by Alembic.
revision = 'add_daily_new_limit'
down_revision = 'create_flashcard_progress'
branch_labels = None
depends_on = None


def upgrade():
    # 添加 daily_new_limit 字段到 study_session 表
    op.add_column('study_session', sa.Column('daily_new_limit', sa.Integer(), nullable=True))


def downgrade():
    # 删除 daily_new_limit 字段
    op.drop_column('study_session', 'daily_new_limit')
