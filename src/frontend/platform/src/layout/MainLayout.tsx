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
    const sidebarWidthClass = collapsed ? "w-[72px] min-w-[72px] px-2" : "w-[200px] min-w-[200px] px-3"
    const navBaseClass = "navlink inline-flex items-center rounded-lg w-full hover:bg-nav-hover h-10 mb-1"
    const navPaddingClass = collapsed ? "justify-center px-2" : "px-3"
    const navTextClass = collapsed ? "hidden" : "ml-3 text-sm font-normal whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]"
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
                        target: '_blank'
                    }
                ]
            });
        }

        const teachingItems: MenuItem[] = [
            {
                key: 'education-home',
                label: '智能体教学',
                icon: <EducationIcon className="h-5 w-5" />,
                to: '/education'
            }
        ];

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
            <div className="flex justify-between h-[64px] bg-background-main relative z-[21]">
                <div className="flex h-9 my-[14px]">
                    <Link className="inline-block" to='/education'>
                        {/* @ts-ignore */}
                        <img src={__APP_ENV__.BASE_URL + '/login-logo-small.png'} className="w-[104px] ml-[38px] rounded dark:w-[104px]" alt="" />
                    </Link>
                </div>
                <div>
                    <HeaderMenu />
                </div>
                <div className="flex w-fit relative z-10">
                    <div className="flex">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger className="h-8 w-8 bg-header-icon rounded-lg cursor-pointer my-4" onClick={() => setDark(!dark)}>
                                    <div className="">
                                        {dark ? (
                                            <Sun className="side-bar-button-size dark:text-slate-50 mx-auto w-[13px] h-[13px]" />
                                        ) : (
                                            <MoonStar className="side-bar-button-size mx-auto w-[17px] h-[17px]" />
                                        )}
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('menu.themeSwitch')}</p></TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <Separator className="mx-[4px] dark:bg-[#111111]" orientation="vertical" />
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger className="h-8 w-8 bg-header-icon rounded-lg cursor-pointer my-4" onClick={changLanguage}>
                                    <div className="">
                                        {language === 'en'
                                            ? <EnIcon className="side-bar-button-size dark:text-slate-50 mx-auto w-[19px] h-[19px]" />
                                            : <Globe className="side-bar-button-size dark:text-slate-50 mx-auto w-[17px] h-[17px]" />}
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent><p>{options[language]}</p></TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <Separator className="mx-[23px] h-6 border-l my-5 border-[#dddddd]" orientation="vertical" />
                    </div>
                    <div className="flex items-center h-7 my-4">
                        {/* @ts-ignore */}
                        <img className="h-7 w-7 rounded-2xl mr-4" src={__APP_ENV__.BASE_URL + '/user.png'} alt="" />
                        <SelectHover
                            triagger={
                                <span className="leading-8 text-[14px] mr-8 max-w-40 cursor-pointer text-ellipsis overflow-hidden whitespace-nowrap">
                                    {user.user_name} <ChevronDown className="inline-block mt-[-2px]" />
                                </span>
                            }>
                            <SelectHoverItem onClick={JumpResetPage}><Lock className="w-4 h-4 mr-1" /><span>{t('menu.changePwd')}</span></SelectHoverItem>
                            <SelectHoverItem onClick={handleLogout}><QuitIcon className="w-4 h-4 mr-1" /><span>{t('menu.logout')}</span></SelectHoverItem>
                        </SelectHover>
                    </div>
                </div>
            </div>
            <div className="flex" style={{ height: "calc(100vh - 64px)" }}>
                <div className={`relative z-10 bg-background-main h-full ${sidebarWidthClass} shadow-x1 flex flex-col`}>
                    <nav className="flex-1 overflow-y-auto py-2">
                        {menuGroups.map(group => {
                            const isExpanded = collapsed ? true : expandedGroups[group.key] ?? true;
                            return (
                                <div className="mb-4" key={group.key}>
                                    {!collapsed ? (
                                        <button
                                            type="button"
                                            className="flex items-center w-full px-3 py-2 mb-1 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                                            onClick={() => handleToggleGroup(group.key)}
                                        >
                                            <span className="flex-1 text-left truncate">{group.title}</span>
                                            <ChevronDown className={`w-3 h-3 ml-2 shrink-0 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
                                        </button>
                                    ) : (
                                        <div className="w-full h-px bg-gray-200 dark:bg-gray-700 mb-2"></div>
                                    )}
                                    {isExpanded && (
                                        <div className="space-y-0.5">
                                            {group.items.map(item => {
                                                const iconElement = collapsed ? item.icon : <div className="w-5 h-5 flex items-center justify-center shrink-0">{item.icon}</div>;
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
                                                            className={`${navBaseClass} ${navPaddingClass}`}
                                                        >
                                                            {content}
                                                        </a>
                                                    );
                                                }

                                                return (
                                                    <NavLink key={item.key} to={item.to!} className={`${navBaseClass} ${navPaddingClass}`}>
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
                    <div className="pb-4 flex flex-col items-center gap-3">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger
                                    className="h-8 w-8 bg-header-icon rounded-lg flex items-center justify-center cursor-pointer"
                                    onClick={toggleSidebar}
                                    aria-label={toggleLabel}
                                >
                                    {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                                </TooltipTrigger>
                                <TooltipContent side="right"><p>{toggleLabel}</p></TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        {!collapsed && !appConfig.noFace && (
                            <div className="help flex items-center justify-between w-full px-1">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger className="h-[72px] flex-1 cursor-pointer bg-background-tip rounded-lg hover:bg-[#1b1f23] hover:text-[white] transition-all dark:hover:bg-background-tip-darkhover mx-1">
                                            <Link className="block" to={"https://github.com/dataelement/bisheng"} target="_blank">
                                                <GithubIcon className="side-bar-button-size mx-auto w-5 h-5 " />
                                                <span className="block text-[12px] mt-[8px] font-bold">{t("menu.github")}</span>
                                            </Link>
                                        </TooltipTrigger>
                                        <TooltipContent><p>{t("menu.github")}</p></TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <Separator className="mx-1 h-10" orientation="vertical" />
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger className="h-[72px] flex-1 cursor-pointer bg-background-tip rounded-lg p-0 align-top hover:bg-[#0055e3] hover:text-[white]  transition-all mx-1">
                                            <Link className="block m-0 p-0" to={"https://m7a7tqsztt.feishu.cn/wiki/ZxW6wZyAJicX4WkG0NqcWsbynde"} target="_blank">
                                                <BookOpenIcon className=" mx-auto w-5 h-5" />
                                                <span className="block text-[12px] mt-[8px] font-bold">{t("menu.bookopen")}</span>
                                            </Link>
                                        </TooltipTrigger>
                                        <TooltipContent><p>{t('menu.document')}</p></TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex-1 bg-background-main-content rounded-lg min-w-0 overflow-y-auto">
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
