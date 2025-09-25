import {
    ApplicationIcon,
    BookOpenIcon,
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
import i18next from "i18next";
import { Activity, ChevronDown, ChevronLeft, ChevronRight, Globe, Lock, MoonStar, Sun } from "lucide-react";
import { useContext, useEffect, useMemo, useState } from "react";
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

export default function MainLayout() {
    const { dark, setDark } = useContext(darkContext);
    const { appConfig } = useContext(locationContext)
    // 角色
    const { user, setUser } = useContext(userContext);
    const { language, options, changLanguage, t } = useLanguage(user)
    const [collapsed, setCollapsed] = useState(false)
    const sidebarWidthClass = collapsed ? "w-[72px] min-w-[72px] px-2" : "w-[184px] min-w-[184px] px-3"
    const navBaseClass = "navlink inline-flex rounded-lg w-full hover:bg-nav-hover h-12 mb-[3.5px]"
    const navPaddingClass = collapsed ? "justify-center px-2" : "px-6"
    const navTextClass = collapsed ? "hidden" : "mx-[14px] max-w-[48px] text-[14px] leading-[48px]"
    const toggleSidebar = () => setCollapsed(prev => !prev)
    const toggleLabel = collapsed ? t('menu.expandSidebar') : t('menu.collapseSidebar')

    const handleLogout = () => {
        bsConfirm({
            title: `${t('prompt')}!`,
            desc: `${t('menu.logoutContent')}？`,
            okTxt: t('system.confirm'),
            onOk(next) {
                captureAndAlertRequestErrorHoc(logoutApi()).then(_ => {
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

    const isMenu = (menu) => {
        return user.web_menu.includes(menu) || user.role === 'admin'
    }

    return <div className="flex">
        <div className="bg-background-main w-full h-screen">
            <div className="flex justify-between h-[64px] bg-background-main relative z-[21]">
                <div className="flex h-9 my-[14px]">
                    <Link className="inline-block" to='/'>
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
                    <nav className="flex-1 overflow-y-auto">
                        {appConfig.benchMenu && (
                            <a
                                href="/workspace/"  // 直接使用根路径
                                target="_blank"
                                className={`${navBaseClass} ${navPaddingClass}`}
                            >
                                <ApplicationIcon className="h-6 w-6 my-[12px]" />
                                <span className={navTextClass}>
                                    {t('menu.workspace')}
                                </span>
                            </a>
                        )}
                        <NavLink to='/' className={`${navBaseClass} ${navPaddingClass}`}>
                            <ApplicationIcon className="h-6 w-6 my-[12px]" /><span className={navTextClass}>{t('menu.app')}</span>
                        </NavLink>
                        {
                            isMenu('build') &&
                            <NavLink to='/build' className={`${navBaseClass} ${navPaddingClass}`} >
                                <TechnologyIcon className="h-6 w-6 my-[12px]" /><span className={navTextClass}>{t('menu.skills')}</span>
                            </NavLink>
                        }
                        {
                            isMenu('knowledge') &&
                            <NavLink to='/filelib' className={`${navBaseClass} ${navPaddingClass}`}>
                                <KnowledgeIcon className="h-6 w-6 my-[12px]" /><span className={navTextClass}>{t('menu.knowledge')}</span>
                            </NavLink>
                        }
                        {
                            user.role === 'admin' && <>
                                <NavLink to='/dataset' className={`${navBaseClass} ${navPaddingClass}`}>
                                    <DatasetIcon className="h-6 w-6 my-[12px]" /><span className={navTextClass}>{t('menu.dataset')}</span>
                                </NavLink>
                            </>
                        }
                        {
                            isMenu('model') &&
                            <NavLink to='/model' className={`${navBaseClass} ${navPaddingClass}`}>
                                <ModelIcon className="h-6 w-6 my-[12px]" /><span className={navTextClass}>{t('menu.models')}</span>
                            </NavLink>
                        }
                        {
                            isAdmin && (
                                <NavLink to='/monitor' className={`${navBaseClass} ${navPaddingClass}`}>
                                    <Activity className="h-6 w-6 my-[12px]" />
                                    <span className={navTextClass}>{t('menu.monitor')}</span>
                                </NavLink>
                            )
                        }
                        {
                            isMenu('evaluation') &&
                            <NavLink to='/evaluation' className={`${navBaseClass} ${navPaddingClass}`}>
                                <EvaluatingIcon className="h-6 w-6 my-[12px]" /><span className={navTextClass}>{t('menu.evaluation')}</span>
                            </NavLink>
                        }
                        {
                            <NavLink to='/label' className={`${navBaseClass} ${navPaddingClass}`}>
                                <LabelIcon className="h-6 w-6 my-[12px]" /><span className={navTextClass}>{t('menu.annotation')}</span>
                            </NavLink>
                        }
                        {
                            isAdmin && <>
                                <NavLink to='/log' className={`${navBaseClass} ${navPaddingClass}`}>
                                    <LogIcon className="h-6 w-6 my-[12px]" /><span className={navTextClass}>{t('menu.log')}</span>
                                </NavLink>
                            </>
                        }
                        {
                            isAdmin && <>
                                <NavLink to='/sys' className={`${navBaseClass} ${navPaddingClass}`}>
                                    <SystemIcon className="h-6 w-6 my-[12px]" /><span className={navTextClass}>{t('menu.system')}</span>
                                </NavLink>
                            </>
                        }
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
                <div className="flex-1 bg-background-main-content rounded-lg min-w-0">
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
