
"""create points tables

Revision ID: a1b2c3d4e5f6
Revises: 772fcbcdadb4
Create Date: 2025-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = '1bb54938e0db'
branch_labels = None
depends_on = None


def upgrade():
    # 创建用户积分表
    op.create_table(
        'user_points',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('balance', sa.Numeric(20, 2), nullable=False, server_default='0'),
        sa.Column('total_earned', sa.Numeric(20, 2), nullable=False, server_default='0'),
        sa.Column('total_spent', sa.Numeric(20, 2), nullable=False, server_default='0'),
        sa.Column('total_adjusted', sa.Numeric(20, 2), nullable=False, server_default='0'),
        sa.Column('creator', sa.String(64), nullable=True),
        sa.Column('updater', sa.String(64), nullable=True),
        sa.Column('deleted', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('create_time', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('update_time', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_user_points_user_id', 'user_points', ['user_id'], unique=True)
    
    # 创建积分交易记录表
    op.create_table(
        'points_transaction',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('transaction_type', sa.String(20), nullable=False),
        sa.Column('amount', sa.Numeric(20, 2), nullable=False),
        sa.Column('balance_before', sa.Numeric(20, 2), nullable=False),
        sa.Column('balance_after', sa.Numeric(20, 2), nullable=False),
        sa.Column('source_type', sa.String(50), nullable=True),
        sa.Column('source_id', sa.Integer(), nullable=True),
        sa.Column('source_table', sa.String(100), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('remark', sa.Text(), nullable=True),
        sa.Column('operator_id', sa.Integer(), nullable=True),
        sa.Column('creator', sa.String(64), nullable=True),
        sa.Column('deleted', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('create_time', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_points_transaction_user_id', 'points_transaction', ['user_id'])
    op.create_index('ix_points_transaction_create_time', 'points_transaction', ['create_time'])
    
    # 创建积分规则表
    op.create_table(
        'points_rule',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('rule_code', sa.String(50), nullable=False),
        sa.Column('rule_name', sa.String(100), nullable=False),
        sa.Column('source_type', sa.String(50), nullable=False),
        sa.Column('trigger_event', sa.String(50), nullable=False),
        sa.Column('points_amount', sa.Numeric(20, 2), nullable=False),
        sa.Column('condition_config', sa.Text(), nullable=True),
        sa.Column('max_daily_limit', sa.Integer(), nullable=True),
        sa.Column('max_total_limit', sa.Integer(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('priority', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('creator', sa.String(64), nullable=True),
        sa.Column('updater', sa.String(64), nullable=True),
        sa.Column('deleted', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('create_time', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('update_time', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_points_rule_rule_code', 'points_rule', ['rule_code'], unique=True)


def downgrade():
    op.drop_index('ix_points_rule_rule_code', table_name='points_rule')
    op.drop_table('points_rule')
    op.drop_index('ix_points_transaction_create_time', table_name='points_transaction')
    op.drop_index('ix_points_transaction_user_id', table_name='points_transaction')
    op.drop_table('points_transaction')
    op.drop_index('ix_user_points_user_id', table_name='user_points')
    op.drop_table('user_points')

