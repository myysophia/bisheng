"""
安全版本的 linsight_sop 模型，移除了有问题的外键约束
"""

import os
from datetime import datetime
from typing import Optional, Dict, Any, List, Literal

from loguru import logger
from sqlalchemy import update
from sqlalchemy.dialects.mysql import LONGTEXT
from sqlmodel import Field, select, delete, col, or_, func, Column, Text, DateTime, text, CHAR

from bisheng.api.v1.schema.inspiration_schema import SOPManagementUpdateSchema
from bisheng.database.base import async_session_getter, async_get_count
from bisheng.database.models.base import SQLModelSerializable


class LinsightSOPBaseSafe(SQLModelSerializable):
    """
    安全版本的 Inspiration SOP模型基类（移除外键约束）
    """
    name: str = Field(..., description='SOP名称', sa_column=Column(Text, nullable=False))
    description: Optional[str] = Field(default=None, description='SOP描述', sa_column=Column(Text))
    user_id: int = Field(..., description='用户ID', nullable=False)
    content: str = Field(..., description='SOP内容',
                         sa_column=Column(LONGTEXT, nullable=False, comment="SOP内容"))

    rating: Optional[int] = Field(default=0, ge=0, le=5, description='SOP评分，范围0-5')

    vector_store_id: Optional[str] = Field(..., description='向量存储ID',
                                           sa_column=Column(CHAR(36), nullable=False, comment="向量存储ID"))

    # 移除外键约束，只保留字段
    linsight_session_id: Optional[str] = Field(default=None, description='灵思会话ID',
                                               sa_column=Column(CHAR(36), nullable=True))
    
    create_time: datetime = Field(default_factory=datetime.now, description='创建时间',
                                  sa_column=Column(DateTime, nullable=False, server_default=text('CURRENT_TIMESTAMP')))
    update_time: Optional[datetime] = Field(default=None, sa_column=Column(
        DateTime, nullable=True, server_default=text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')))


# 只有在不跳过linsight表时才定义这些类
if os.environ.get('SKIP_LINSIGHT_TABLES') != 'true':
    
    class LinsightSOPSafe(LinsightSOPBaseSafe, table=True):
        """
        安全版本的 Inspiration SOP模型
        """
        __tablename__ = "linsight_sop_safe"
        id: Optional[int] = Field(default=None, primary_key=True, description='SOP唯一ID')


    class LinsightSOPRecordSafe(SQLModelSerializable, table=True):
        """
        安全版本的灵思SOP运行记录表
        """
        __tablename__ = "linsight_sop_record_safe"
        id: Optional[int] = Field(default=None, primary_key=True, description='SOP记录唯一ID')
        name: str = Field(..., description='SOP名称', sa_column=Column(Text, nullable=False))
        description: Optional[str] = Field(default=None, description='SOP描述', sa_column=Column(Text))
        user_id: int = Field(..., description='用户ID', nullable=False)
        content: str = Field(..., description='SOP内容',
                             sa_column=Column(LONGTEXT, nullable=False, comment="SOP内容"))

        rating: Optional[int] = Field(default=0, ge=0, le=5, description='SOP评分，范围0-5')
        linsight_version_id: Optional[str] = Field(default=None, description='灵思会话版本id，同步评分')
        create_time: datetime = Field(default_factory=datetime.now, description='创建时间',
                                      sa_column=Column(DateTime, nullable=False, server_default=text('CURRENT_TIMESTAMP')))
        update_time: Optional[datetime] = Field(default=None, sa_column=Column(
            DateTime, nullable=True, server_default=text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')))

else:
    # 如果跳过linsight表，定义空的类
    class LinsightSOPSafe:
        pass
    
    class LinsightSOPRecordSafe:
        pass


print(f"SKIP_LINSIGHT_TABLES: {os.environ.get('SKIP_LINSIGHT_TABLES')}")
print(f"LinsightSOPSafe defined: {hasattr(LinsightSOPSafe, '__tablename__')}")