import hashlib
import json
import os
from typing import List

from bisheng.database.models.template import Template
from bisheng.utils.minio_client import MinioClient
from loguru import logger
from sqlmodel import select, update, text

from bisheng.database.init_config import init_config
from bisheng.database.base import db_service, async_session_getter
from bisheng.settings import settings
from bisheng.cache.redis import redis_client
from bisheng.database.constants import AdminRole, DefaultRole
from bisheng.database.models.component import Component
from bisheng.database.models.role import Role
from bisheng.database.models.user import User
from bisheng.database.models.gpts_tools import GptsTools
from bisheng.database.models.gpts_tools import GptsToolsType
from bisheng.database.models.sft_model import SftModel
from bisheng.database.models.flow_version import FlowVersion
from bisheng.database.models.user_role import UserRoleDao
from bisheng.database.models.group import Group, DefaultGroup
from bisheng.database.models.role_access import RoleAccess, AccessType
from bisheng.api.v1.education.models import Course, Chapter


async def init_default_data():
    """初始化数据库"""

    if await redis_client.asetNx('init_default_data', '1'):
        try:
            await db_service.create_db_and_tables()
            async with async_session_getter() as session:
                db_role = await session.exec(select(Role).limit(1))
                db_role = db_role.all()
                if not db_role:
                    # 初始化系统配置, 管理员拥有所有权限
                    db_role = Role(id=AdminRole, role_name='系统管理员', remark='系统所有权限管理员',
                                   group_id=DefaultGroup)
                    session.add(db_role)
                    db_role_normal = Role(id=DefaultRole, role_name='普通用户', remark='默认用户',
                                          group_id=DefaultGroup)
                    session.add(db_role_normal)
                    # 给普通用户赋予 构建、知识、模型菜单栏的查看权限
                    session.add_all([
                        RoleAccess(role_id=DefaultRole, type=AccessType.WEB_MENU.value, third_id='build'),
                        RoleAccess(role_id=DefaultRole, type=AccessType.WEB_MENU.value, third_id='knowledge'),
                        RoleAccess(role_id=DefaultRole, type=AccessType.WEB_MENU.value, third_id='model'),
                    ])
                    await session.commit()
                # 添加默认用户组
                group = await session.exec(select(Group).limit(1))
                group = group.all()
                if not group:
                    group = Group(id=DefaultGroup, group_name='默认用户组', create_user=1, update_user=1)
                    session.add(group)
                    await session.commit()
                    await session.refresh(group)

                user = await session.exec(select(User).limit(1))
                user = user.all()
                if not user and settings.admin:
                    md5 = hashlib.md5()
                    md5.update(settings.admin.get('password').encode('utf-8'))
                    user = User(
                        user_id=1,
                        user_name=settings.admin.get('user_name'),
                        password=md5.hexdigest(),
                    )
                    session.add(user)
                    await session.commit()
                    await session.refresh(user)
                    await UserRoleDao.set_admin_user(user.user_id)

                component_db = await session.exec(select(Component).limit(1))
                component_db = component_db.all()
                if not component_db:
                    db_components = []
                    json_items = json.loads(read_from_conf('data/component.json'))
                    for item in json_items:
                        for k, v in item.items():
                            db_component = Component(name=k, user_id=1, user_name='admin', data=v)
                            db_components.append(db_component)
                    session.add_all(db_components)
                    await session.commit()

                # 初始化预置技能模板
                templates = await session.exec(select(Template).limit(1))
                templates = templates.all()
                if not templates:
                    json_items = json.loads(read_from_conf('data/template.json'))
                    for item in json_items:
                        session.add(Template(**item))
                    await session.commit()

                # 初始化预置工具列表
                preset_tools = await session.exec(select(GptsTools).limit(1))
                preset_tools = preset_tools.all()
                if not preset_tools:
                    preset_tools = []
                    json_items = json.loads(read_from_conf('data/t_gpts_tools.json'))
                    for item in json_items:
                        preset_tool = GptsTools(**item)
                        preset_tools.append(preset_tool)
                    session.add_all(preset_tools)
                    await session.commit()
                # 初始化预置工具类别
                preset_tools_type = await session.exec(select(GptsToolsType).limit(1))
                preset_tools_type = preset_tools_type.all()
                if not preset_tools_type:
                    preset_tools_type = []
                    json_items = json.loads(read_from_conf('data/t_gpts_tools_type.json'))
                    for item in json_items:
                        preset_tool_type = GptsToolsType(**item)
                        preset_tools_type.append(preset_tool_type)
                    session.add_all(preset_tools_type)
                    await session.commit()
                    # 设置预置工具所属的类别, 需要和预置数据一致，所以id是固定的
                    for i in range(1, 7):
                        await session.exec(update(GptsTools).where(GptsTools.id == i).values(type=i))
                    # 属于天眼查类别下的工具
                    tyc_types: List[int] = list(range(7, 18))
                    await session.exec(
                        update(GptsTools).where(GptsTools.id.in_(tyc_types)).values(type=7))
                    # 属于金融类别下的工具
                    jr_types: List[int] = list(range(18, 28))
                    await session.exec(
                        update(GptsTools).where(GptsTools.id.in_(jr_types)).values(type=8))
                    await session.commit()
                # 初始化配置可用于微调的基准模型
                preset_models = await session.exec(select(SftModel).limit(1))
                preset_models = preset_models.all()
                if not preset_models:
                    preset_models = []
                    json_items = json.loads(read_from_conf('data/sft_model.json'))
                    for item in json_items:
                        preset_model = SftModel(**item)
                        preset_models.append(preset_model)
                    session.add_all(preset_models)
                    await session.commit()

                # 初始化补充默认的技能版本表
                flow_version = await session.exec(select(FlowVersion).limit(1))
                flow_version = flow_version.all()
                if not flow_version:
                    sql_query = text(
                        "INSERT INTO `flowversion` (`name`, `flow_id`, `data`, `user_id`, `is_current`, `is_delete`) \
                     select 'v0', `id` as flow_id, `data`, `user_id`, 1, 0 from `flow`;")
                    await session.execute(sql_query)
                    await session.commit()
                    # 修改表单数据表
                    sql_query = text(
                        'UPDATE `t_variable_value` a SET a.version_id=(SELECT `id` from `flowversion` '
                        'WHERE flow_id=a.flow_id and is_current=1)'
                    )
                    await session.execute(sql_query)
                    await session.commit()
                
                # 初始化教育系统数据
                await init_education_data(session)
            # 初始化数据库config
            await init_config()
        except Exception as exc:
            # if the exception involves tables already existing
            # we can ignore it
            if 'already exists' not in str(exc):
                logger.exception(f'Error creating DB and tables: {exc}')
                raise RuntimeError('Error creating DB and tables') from exc
        finally:
            await redis_client.adelete('init_default_data')


def read_from_conf(file_path: str) -> str:
    # Get current path
    current_path = os.path.dirname(os.path.abspath(__file__))

    file_path = os.path.join(current_path, file_path)

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    return content


async def init_education_data(session):
    """初始化教育系统数据"""
    # 检查是否已经有教育数据
    existing_courses = await session.exec(select(Course).limit(1))
    existing_courses = existing_courses.all()
    
    if not existing_courses:
        # 创建示例课程
        courses_data = [
            {
                'id': 'course-001',
                'title': '智能体基础入门',
                'description': '学习智能体的基本概念、原理和应用场景，为后续深入学习打下基础',
                'level': 'beginner',
                'category': 'theory',
                'duration': 120,
                'thumbnail': 'https://cdn.example.com/education/thumbnails/course-001.jpg'
            },
            {
                'id': 'course-002',
                'title': '智能体进阶开发',
                'description': '深入学习智能体的高级功能和开发技巧，包括复杂场景的处理方法',
                'level': 'intermediate',
                'category': 'development',
                'duration': 180,
                'thumbnail': 'https://cdn.example.com/education/thumbnails/course-002.jpg'
            },
            {
                'id': 'course-003',
                'title': '智能体实战应用',
                'description': '通过实际项目案例学习智能体在不同行业的应用实践',
                'level': 'advanced',
                'category': 'practice',
                'duration': 240,
                'thumbnail': 'https://cdn.example.com/education/thumbnails/course-003.jpg'
            }
        ]
        
        # 创建示例章节
        chapters_data = [
            # 课程1的章节
            {
                'id': 'chapter-001-01',
                'course_id': 'course-001',
                'title': '第一章：智能体概述',
                'description': '介绍智能体的基本概念和发展历程',
                'video_url': 'https://cdn.example.com/education/videos/course-001/chapter-01.mp4',
                'duration': 1500,
                'order_index': 1
            },
            {
                'id': 'chapter-001-02',
                'course_id': 'course-001',
                'title': '第二章：智能体架构',
                'description': '详细讲解智能体的系统架构和核心组件',
                'video_url': 'https://cdn.example.com/education/videos/course-001/chapter-02.mp4',
                'duration': 1800,
                'order_index': 2
            },
            {
                'id': 'chapter-001-03',
                'course_id': 'course-001',
                'title': '第三章：智能体类型',
                'description': '介绍不同类型的智能体及其特点',
                'video_url': 'https://cdn.example.com/education/videos/course-001/chapter-03.mp4',
                'duration': 1200,
                'order_index': 3
            },
            {
                'id': 'chapter-001-04',
                'course_id': 'course-001',
                'title': '第四章：智能体应用',
                'description': '展示智能体在各个领域的应用案例',
                'video_url': 'https://cdn.example.com/education/videos/course-001/chapter-04.mp4',
                'duration': 2100,
                'order_index': 4
            },
            {
                'id': 'chapter-001-05',
                'course_id': 'course-001',
                'title': '第五章：智能体未来',
                'description': '探讨智能体技术的发展趋势和前景',
                'video_url': 'https://cdn.example.com/education/videos/course-001/chapter-05.mp4',
                'duration': 1500,
                'order_index': 5
            },
            # 课程2的章节
            {
                'id': 'chapter-002-01',
                'course_id': 'course-002',
                'title': '第一章：高级配置',
                'description': '学习智能体的高级配置选项和优化技巧',
                'video_url': 'https://cdn.example.com/education/videos/course-002/chapter-01.mp4',
                'duration': 2400,
                'order_index': 1
            },
            {
                'id': 'chapter-002-02',
                'course_id': 'course-002',
                'title': '第二章：模型集成',
                'description': '掌握多种AI模型的集成和调用方法',
                'video_url': 'https://cdn.example.com/education/videos/course-002/chapter-02.mp4',
                'duration': 2700,
                'order_index': 2
            },
            {
                'id': 'chapter-002-03',
                'course_id': 'course-002',
                'title': '第三章：工具链开发',
                'description': '开发和集成外部工具链提升智能体能力',
                'video_url': 'https://cdn.example.com/education/videos/course-002/chapter-03.mp4',
                'duration': 3000,
                'order_index': 3
            },
            {
                'id': 'chapter-002-04',
                'course_id': 'course-002',
                'title': '第四章：性能优化',
                'description': '优化智能体的响应速度和处理效率',
                'video_url': 'https://cdn.example.com/education/videos/course-002/chapter-04.mp4',
                'duration': 2100,
                'order_index': 4
            },
            # 课程3的章节
            {
                'id': 'chapter-003-01',
                'course_id': 'course-003',
                'title': '第一章：客服机器人',
                'description': '构建智能客服系统的完整实战项目',
                'video_url': 'https://cdn.example.com/education/videos/course-003/chapter-01.mp4',
                'duration': 3600,
                'order_index': 1
            },
            {
                'id': 'chapter-003-02',
                'course_id': 'course-003',
                'title': '第二章：内容生成助手',
                'description': '开发自动化内容创作和编辑助手',
                'video_url': 'https://cdn.example.com/education/videos/course-003/chapter-02.mp4',
                'duration': 4200,
                'order_index': 2
            },
            {
                'id': 'chapter-003-03',
                'course_id': 'course-003',
                'title': '第三章：数据分析智能体',
                'description': '构建专业的数据分析和报告生成系统',
                'video_url': 'https://cdn.example.com/education/videos/course-003/chapter-03.mp4',
                'duration': 3900,
                'order_index': 3
            },
            {
                'id': 'chapter-003-04',
                'course_id': 'course-003',
                'title': '第四章：多智能体协作',
                'description': '实现多个智能体协同工作的复杂系统',
                'video_url': 'https://cdn.example.com/education/videos/course-003/chapter-04.mp4',
                'duration': 4500,
                'order_index': 4
            }
        ]
        
        # 插入课程数据
        for course_data in courses_data:
            course = Course(**course_data)
            session.add(course)
        
        # 插入章节数据
        for chapter_data in chapters_data:
            chapter = Chapter(**chapter_data)
            session.add(chapter)
        
        await session.commit()
        logger.info("Education system data initialized successfully")


def upload_preset_minio_file():
    """ 上传预置文件到minio, 为了和工作流模板配合 """
    minio_client = MinioClient()
    # 上传 「多助手并行+串行报告生成」 工作流模板需要的docx文件
    template_data = read_from_conf('data/0254d1808a5247d2a3ee0d0011819acb.docx')
    minio_client.upload_minio_data('workflow/report/0254d1808a5247d2a3ee0d0011819acb.docx', template_data,
                                   len(template_data),
                                   'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
