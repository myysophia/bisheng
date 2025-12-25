import {
    ApplicationIcon,
    BookOpenIcon,
    EducationIcon,
    EnIcon,
    EvaluatingIcon,
    GithubIcon,
    KnowledgeIcon,
    LabelIcon,
    LogIcon,
    ModelIcon,
    QuitIcon,
    SystemIcon,
    TechnologyIcon
} from "@/components/bs-icons";
import { DatasetIcon } from "@/components/bs-icons/menu/dataset";
import { bsConfirm } from "@/components/bs-ui/alertDialog/useConfirm";
import { SelectHover, SelectHoverItem } from "@/components/bs-ui/select/hover";
import { locationContext } from "@/contexts/locationContext";
import { resolveWorkspaceUrl } from "@/util/workspace";
import i18next from "i18next";
import { Activity, ChevronDown, ChevronLeft, ChevronRight, Globe, Lock, MoonStar, Sun } from "lucide-react";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useTranslation } from "react-i18next";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import CrashErrorComponent from "../components/CrashErrorComponent";
import { Separator } from "../components/bs-ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../components/bs-ui/tooltip";
import { darkContext } from "../contexts/darkContext";
import { userContext } from "../contexts/userContext";
import { logoutApi } from "../controllers/API/user";
import { captureAndAlertRequestErrorHoc } from "../controllers/request";
import { User } from "../types/api/user";
import HeaderMenu from "./HeaderMenu";

type MenuItem = {
    key: string;
    label: string;
    icon: JSX.Element;
    to?: string;
    href?: string;
    target?: string;
    onClick?: (e: React.MouseEvent) => void;
};

type MenuGroup = {
    key: string;
    title: string;
    items: MenuItem[];
};

export default function MainLayout() {
    const { dark, setDark } = useContext(darkContext);
    const { appConfig } = useContext(locationContext)
    // 角色
    const { user, setUser } = useContext(userContext);
    const { language, options, changLanguage, t } = useLanguage(user)
    const [collapsed, setCollapsed] = useState(false)
    // 优化后的侧边栏样式
    const sidebarWidthClass = collapsed ? "w-[72px] min-w-[72px] px-2" : "w-[200px] min-w-[200px] px-3"
    const navBaseClass = "navlink group inline-flex items-center rounded-lg w-full h-9 transition-all duration-200 hover:translate-x-0.5"
    const navPaddingClass = collapsed ? "justify-center px-2" : "gap-2.5 px-3"
    const navTextClass = collapsed ? "hidden" : "text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis"
    const navHoverClass = "hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
    const toggleSidebar = () => setCollapsed(prev => !prev)
    const toggleLabel = collapsed ? t('menu.expandSidebar') : t('menu.collapseSidebar')

    const handleLogout = () => {
        bsConfirm({
            title: `${t('prompt')}!`,
            desc: `${t('menu.logoutContent')}？`,
            okTxt: t('system.confirm'),
            onOk(next) {
                captureAndAlertRequestErrorHoc(logoutApi()).then(() => {
                    setUser(null)
                    localStorage.removeItem('isLogin')
                })
                next()
            }
        })
    }

    // 重置密码
    const navigator = useNavigate()
    const JumpResetPage = () => {
        localStorage.setItem('account', user.user_name)
        navigator('/reset')
    }

    // 系统管理员(超管、组超管)
    const isAdmin = useMemo(() => {
        return ['admin', 'group_admin'].includes(user.role)
    }, [user])

    const isMenu = useCallback((menu: string) => {
        return user.web_menu.includes(menu) || user.role === 'admin'
    }, [user]);

    const getInitialExpandedState = () => {
        const defaults: Record<string, boolean> = {
            workspace: true,
            education: true,
            square: true,
            application: true,
            model: true,
            settings: true
        };

        if (typeof window === 'undefined') {
            return defaults;
        }

        try {
            const stored = localStorage.getItem('platform-sidebar-groups');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed && typeof parsed === 'object') {
                    return { ...defaults, ...parsed };
                }
            }
        } catch (error) {
            // 忽略解析异常，采用默认展开状态
        }

        return defaults;
    };

    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => getInitialExpandedState());
    const workspaceLink = useMemo(() => resolveWorkspaceUrl(appConfig.workspaceUrl), [appConfig.workspaceUrl]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }
        localStorage.setItem('platform-sidebar-groups', JSON.stringify(expandedGroups));
    }, [expandedGroups]);

    const handleToggleGroup = (key: string) => {
        setExpandedGroups(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const menuGroups = useMemo<MenuGroup[]>(() => {
        const groups: MenuGroup[] = [];

        if (appConfig.benchMenu) {
            groups.push({
                key: 'workspace',
                title: '工作台',
                items: [
                    {
                        key: 'workspace-main',
                        label: t('menu.workspace'),
                        icon: <ApplicationIcon className="h-5 w-5" />,
                        href: workspaceLink,
                        target: '_blank',
                        onClick: (e: React.MouseEvent) => {
                            e.preventDefault();
                            // 同步 token 和用户信息到工作台
                            const wsToken = localStorage.getItem('ws_token');
                            const userInfo = localStorage.getItem('userInfo');
                            
                            if (!wsToken) {
                                console.error('❌ 未找到认证token，请先登录');
                                alert('请先登录后再访问工作台');
                                return;
                            }
                            
                            // 同步token到客户端使用的key (同源情况下生效)
                            localStorage.setItem('token', wsToken);
                            console.log('✅ Token已同步到工作台');
                            
                            // 同步用户信息 (同源情况下生效)
                            let userDataStr = '';
                            if (userInfo) {
                                try {
                                    const user = JSON.parse(userInfo);
                                    const userData = {
                                        user_name: user.user_name,
                                        user_id: user.user_id,
                                        role: user.role || 'user'
                                    };
                                    localStorage.setItem('user', JSON.stringify(userData));
                                    userDataStr = JSON.stringify(userData);
                                    console.log('✅ 用户信息已同步');
                                } catch (error) {
                                    console.error('❌ 解析用户信息失败:', error);
                                }
                            }
                            
                            // 构建工作台链接
                            // 开发环境下跨端口访问，需要通过 URL 参数传递 token
                            const targetUrl = new URL(workspaceLink);
                            const currentUrl = new URL(window.location.href);
                            const isCrossOrigin = targetUrl.origin !== currentUrl.origin;
                            
                            if (isCrossOrigin) {
                                // 跨域情况：通过 URL 参数传递认证信息
                                targetUrl.searchParams.set('auth_token', wsToken);
                                if (userDataStr) {
                                    targetUrl.searchParams.set('auth_user', encodeURIComponent(userDataStr));
                                }
                                console.log('🔗 跨域访问，通过URL参数传递认证信息');
                            }
                            
                            // 打开工作台
                            window.open(targetUrl.toString(), '_blank');
                        }
                    }
                ]
            });
        }

        const teachingItems: MenuItem[] = [];

        if (isMenu('education')) {
            teachingItems.push({
                key: 'education-home',
                label: '智能体教学',
                icon: <EducationIcon className="h-5 w-5" />,
                to: '/education'
            });
        }

        if (isMenu('knowledge')) {
            teachingItems.push({
                key: 'knowledge',
                label: t('menu.knowledge'),
                icon: <KnowledgeIcon className="h-5 w-5" />,
                to: '/filelib'
            });
        }

        if (user.role === 'admin') {
            teachingItems.push({
                key: 'dataset',
                label: t('menu.dataset'),
                icon: <DatasetIcon className="h-5 w-5" />,
                to: '/dataset'
            });
        }

        if (teachingItems.length) {
            groups.push({
                key: 'education',
                title: '智能体教学',
                items: teachingItems
            });
        }

        groups.push({
            key: 'square',
            title: '智能体广场',
            items: [
                {
                    key: 'square-home',
                    label: '智能体广场',
                    icon: <ApplicationIcon className="h-5 w-5" />,
                    to: '/square'
                }
            ]
        });

        const applicationItems: MenuItem[] = [];
        if (isMenu('build')) {
            applicationItems.push({
                key: 'build',
                label: '智能体构建',
                icon: <TechnologyIcon className="h-5 w-5" />,
                to: '/build'
            });
        }

        if (applicationItems.length) {
            groups.push({
                key: 'application',
                title: '智能体应用',
                items: applicationItems
            });
        }

        const modelItems: MenuItem[] = [];
        if (isMenu('model')) {
            modelItems.push({
                key: 'model',
                label: t('menu.models'),
                icon: <ModelIcon className="h-5 w-5" />,
                to: '/model'
            });
        }
        if (isMenu('evaluation')) {
            modelItems.push({
                key: 'evaluation',
                label: t('menu.evaluation'),
                icon: <EvaluatingIcon className="h-5 w-5" />,
                to: '/evaluation'
            });
        }
        if (modelItems.length) {
            groups.push({
                key: 'model',
                title: '大模型应用',
                items: modelItems
            });
        }

        const settingItems: MenuItem[] = [];
        if (isAdmin) {
            settingItems.push({
                key: 'monitor',
                label: t('menu.monitor'),
                icon: <Activity className="h-5 w-5" />,
                to: '/monitor'
            });
        }
        settingItems.push({
            key: 'label',
            label: t('menu.annotation'),
            icon: <LabelIcon className="h-5 w-5" />,
            to: '/label'
        });
        if (isAdmin) {
            settingItems.push({
                key: 'log',
                label: t('menu.log'),
                icon: <LogIcon className="h-5 w-5" />,
                to: '/log'
            });
            settingItems.push({
                key: 'system',
                label: t('menu.system'),
                icon: <SystemIcon className="h-5 w-5" />,
                to: '/sys'
            });
        }
        if (settingItems.length) {
            groups.push({
                key: 'settings',
                title: '设置',
                items: settingItems
            });
        }

        return groups;
    }, [appConfig, isAdmin, isMenu, t, user.role]);

    return <div className="flex">
        <div className="bg-background-main w-full h-screen">
            <div className="flex justify-between items-center h-14 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 relative z-[21]">
                <div className="flex items-center">
                    <Link className="inline-block" to='/education'>
                        {/* @ts-ignore */}
                        <img src={__APP_ENV__.BASE_URL + '/login-logo-small.png'} className="h-8 rounded" alt="E-Agent" />
                    </Link>
                </div>
                <div>
                    <HeaderMenu />
                </div>
                <div className="flex items-center gap-3">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger 
                                className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer" 
                                onClick={() => setDark(!dark)}
                            >
                                {dark ? (
                                    <Sun className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                                ) : (
                                    <MoonStar className="w-4 h-4 text-gray-600" />
                                )}
                            </TooltipTrigger>
                            <TooltipContent><p>{t('menu.themeSwitch')}</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger 
                                className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer" 
                                onClick={changLanguage}
                            >
                                {language === 'en'
                                    ? <EnIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                                    : <span className="text-xs font-medium text-gray-600 dark:text-gray-300">中</span>}
                            </TooltipTrigger>
                            <TooltipContent><p>{options[language]}</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <div className="flex items-center gap-2 ml-2">
                        {/* @ts-ignore */}
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{user.user_name?.charAt(0)?.toUpperCase() || 'U'}</span>
                        </div>
                        <SelectHover
                            triagger={
                                <span className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer flex items-center gap-1 max-w-32 truncate">
                                    {user.user_name} <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                                </span>
                            }>
                            <SelectHoverItem onClick={JumpResetPage}><Lock className="w-4 h-4 mr-1" /><span>{t('menu.changePwd')}</span></SelectHoverItem>
                            <SelectHoverItem onClick={handleLogout}><QuitIcon className="w-4 h-4 mr-1" /><span>{t('menu.logout')}</span></SelectHoverItem>
                        </SelectHover>
                    </div>
                </div>
            </div>
            <div className="flex" style={{ height: "calc(100vh - 64px)" }}>
                <div className={`relative z-10 bg-white dark:bg-gray-900 h-full ${sidebarWidthClass} border-r border-gray-100 dark:border-gray-800 flex flex-col transition-all duration-300`}>
                    <nav className="flex-1 overflow-y-auto py-4">
                        {menuGroups.map(group => {
                            const isExpanded = collapsed ? true : expandedGroups[group.key] ?? true;
                            return (
                                <div className="mb-5" key={group.key}>
                                    {!collapsed ? (
                                        <button
                                            type="button"
                                            className="flex items-center justify-between w-full px-2 mb-2 group/title"
                                            onClick={() => handleToggleGroup(group.key)}
                                        >
                                            <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">{group.title}</span>
                                            <ChevronDown className={`w-3 h-3 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${isExpanded ? '' : '-rotate-90'}`} />
                                        </button>
                                    ) : (
                                        <div className="w-8 h-px bg-gradient-to-r from-gray-300 dark:from-gray-600 to-transparent mx-auto mb-3"></div>
                                    )}
                                    {isExpanded && (
                                        <div className="space-y-1">
                                            {group.items.map(item => {
                                                const iconElement = <div className="w-[18px] h-[18px] flex items-center justify-center shrink-0">{item.icon}</div>;
                                                const content = (
                                                    <>
                                                        {iconElement}
                                                        <span className={navTextClass} title={item.label}>{item.label}</span>
                                                    </>
                                                );

                                                if (item.href) {
                                                    return (
                                                        <a
                                                            key={item.key}
                                                            href={item.href}
                                                            target={item.target}
                                                            rel={item.target === '_blank' ? "noopener noreferrer" : undefined}
                                                            className={`${navBaseClass} ${navPaddingClass} ${navHoverClass}`}
                                                            onClick={item.onClick}
                                                        >
                                                            {content}
                                                        </a>
                                                    );
                                                }

                                                return (
                                                    <NavLink 
                                                        key={item.key} 
                                                        to={item.to!} 
                                                        className={({ isActive }) => 
                                                            `${navBaseClass} ${navPaddingClass} ${isActive 
                                                                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium border-l-[3px] border-blue-600 dark:border-blue-400 rounded-l-none' 
                                                                : navHoverClass}`
                                                        }
                                                    >
                                                        {content}
                                                    </NavLink>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </nav>
                    <div className="p-3 border-t border-gray-100 dark:border-gray-800">
                        <button
                            onClick={toggleSidebar}
                            aria-label={toggleLabel}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                        >
                            {collapsed ? (
                                <ChevronRight className="w-4 h-4 transition-transform" />
                            ) : (
                                <>
                                    <ChevronLeft className="w-4 h-4 transition-transform" />
                                    <span className="text-xs font-medium">{toggleLabel}</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
                <div className="flex-1 bg-gray-50 dark:bg-gray-950 min-w-0 overflow-y-auto">
                    <ErrorBoundary
                        onReset={() => window.location.href = window.location.href}
                        FallbackComponent={CrashErrorComponent}
                    >
                        <Outlet />
                    </ErrorBoundary>
                </div>
            </div>
        </div>

        {/* // mobile */}
        <div className="fixed w-full h-full top-0 left-0 bg-[rgba(0,0,0,0.4)] sm:hidden text-sm z-50">
            <div className="w-10/12 bg-gray-50 mx-auto mt-[30%] rounded-xl px-4 py-10">
                <p className=" text-sm text-center">{t('menu.forBestExperience')}</p>
                {
                    !appConfig.isPro && <div className="flex mt-8 justify-center gap-4">
                        <a href={"https://github.com/dataelement/bisheng"} target="_blank">
                            <GithubIcon className="side-bar-button-size mx-auto" />Github
                        </a>
                        <a href={"https://m7a7tqsztt.feishu.cn/wiki/ZxW6wZyAJicX4WkG0NqcWsbynde"} target="_blank">
                            <BookOpenIcon className="side-bar-button-size mx-auto" /> {t('menu.onlineDocumentation')}
                        </a>
                    </div>
                }
            </div>
        </div>
    </div >
};

const useLanguage = (user: User) => {
    const [language, setLanguage] = useState('zh')
    useEffect(() => {
        const lang = user.user_id ? localStorage.getItem('language-' + user.user_id) : null
        if (lang) {
            setLanguage(lang)
        }
    }, [user])

    const { t } = useTranslation()
    const changLanguage = () => {
        const ln = language === 'zh' ? 'en' : 'zh'
        setLanguage(ln)
        localStorage.setItem('language-' + user.user_id, ln)
        localStorage.setItem('language', ln)
        i18next.changeLanguage(ln)
    }
    return {
        language,
        options: { en: '使用中文', zh: 'English' },
        changLanguage,
        t
    }
}
