import { Tabs, TabsList, TabsTrigger } from '@/components/bs-ui/tabs';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

const tabs = [
  { label: '教学首页', path: '/education' },
  { label: '学习进度', path: '/education/progress' },
  { label: '实践环境', path: '/education/practice' },
  { label: '引导构建', path: '/education/guided-builder' },
];

const getActiveTab = (pathname: string) => {
  const matched = [...tabs]
    .sort((a, b) => b.path.length - a.path.length)
    .find((tab) => pathname.startsWith(tab.path));
  return matched?.path ?? '/education';
};

const getBreadcrumbs = (pathname: string) => {
  const crumbs: Array<{ label: string; path: string }> = [];

  if (pathname.startsWith('/education/progress')) {
    crumbs.push({ label: '学习进度', path: '/education/progress' });
    return crumbs;
  }
  if (pathname.startsWith('/education/practice')) {
    crumbs.push({ label: '实践环境', path: '/education/practice' });
    return crumbs;
  }
  if (pathname.startsWith('/education/guided-builder')) {
    crumbs.push({ label: '引导构建', path: '/education/guided-builder' });
    return crumbs;
  }
  if (pathname.startsWith('/education/success')) {
    crumbs.push({ label: '构建完成', path: '/education/success' });
    return crumbs;
  }

  const courseMatch = pathname.match(/^\/education\/courses\/([^/]+)(?:\/chapters\/([^/]+))?/);
  if (courseMatch) {
    crumbs.push({ label: '课程详情', path: `/education/courses/${courseMatch[1]}` });
    if (courseMatch[2]) {
      crumbs.push({ label: '章节学习', path: pathname });
    }
  }

  return crumbs;
};

export default function EducationLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = getActiveTab(location.pathname);
  const breadcrumbs = getBreadcrumbs(location.pathname);

  return (
    <div className="min-h-full bg-background">
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4 space-y-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-xl font-semibold text-foreground">智能体教学</h1>
            </div>
            <Tabs
              value={activeTab}
              onValueChange={(nextPath) => {
                navigate(nextPath);
              }}
              className="w-full sm:w-auto"
            >
              <TabsList className="flex-wrap h-auto w-full sm:w-auto">
                {tabs.map((tab) => (
                  <TabsTrigger key={tab.path} value={tab.path}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
          {breadcrumbs.length ? (
            <nav className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {breadcrumbs.map((crumb, index) => (
                <div key={crumb.path} className="flex items-center gap-2">
                  <button
                    type="button"
                    className="hover:text-primary transition-colors"
                    onClick={() => navigate(crumb.path)}
                  >
                    {crumb.label}
                  </button>
                  {index < breadcrumbs.length - 1 ? <span>/</span> : null}
                </div>
              ))}
            </nav>
          ) : null}
        </div>
      </div>
      <Outlet />
    </div>
  );
}
