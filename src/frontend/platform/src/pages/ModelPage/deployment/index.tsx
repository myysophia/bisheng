import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/bs-ui/button";
import { Plus, RefreshCw } from "lucide-react";
import DeploymentList from "./components/DeploymentList";
import CreateDeployment from "./components/CreateDeployment";
import DeploymentDetail from "./components/DeploymentDetail";
import { LoadingIcon } from "@/components/bs-icons/loading";
import { getDeploymentListApi } from "@/controllers/API/deployment";

enum ViewMode {
    LIST = 'list',
    CREATE = 'create',
    DETAIL = 'detail'
}

export default function Deployment() {
    const { t, i18n } = useTranslation('model');
    const navigate = useNavigate();
    
    const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.LIST);
    const [selectedDeploymentId, setSelectedDeploymentId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [deployments, setDeployments] = useState([]);

    useEffect(() => {
        i18n.loadNamespaces('model');
    }, [i18n]);

    useEffect(() => {
        loadDeployments();
    }, []);

    const loadDeployments = async () => {
        setLoading(true);
        try {
            const response = await getDeploymentListApi();
            const items = Array.isArray(response?.items) ? response.items : [];
            const normalized = items.map((item: any) => ({
                ...item,
                modelId: item.modelId || item.modelID || item.model_id || item.id,
                createdAt: item.createdAt || item.created_at,
                updatedAt: item.updatedAt || item.updated_at,
                modelName: item.modelName || item.model_name || item.name,
                readyReplicas: item.readyReplicas ?? item.ready_replicas ?? 0,
                replicas: item.replicas ?? item.desiredReplicas ?? item.desired_replicas ?? 0,
            }));
            setDeployments(normalized);
        } catch (error) {
            console.error('Failed to load deployments:', error);
            // 如果API调用失败，显示空列表
            setDeployments([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateDeployment = () => {
        setViewMode(ViewMode.CREATE);
    };

    const handleViewDetail = (deploymentId: string) => {
        setSelectedDeploymentId(deploymentId);
        setViewMode(ViewMode.DETAIL);
    };

    const handleBack = () => {
        setViewMode(ViewMode.LIST);
        setSelectedDeploymentId(null);
        loadDeployments();
    };

    const handleDeploymentCreated = () => {
        setViewMode(ViewMode.LIST);
        loadDeployments();
    };

    if (viewMode === ViewMode.CREATE) {
        return <CreateDeployment onBack={handleBack} onSuccess={handleDeploymentCreated} />;
    }

    if (viewMode === ViewMode.DETAIL && selectedDeploymentId) {
        return <DeploymentDetail deploymentId={selectedDeploymentId} onBack={handleBack} />;
    }

    return (
        <div className="relative bg-background-login h-full px-2 py-4">
            {loading && (
                <div className="absolute left-0 top-0 z-10 flex h-full w-full items-center justify-center bg-[rgba(255,255,255,0.6)] dark:bg-blur-shared">
                    <LoadingIcon />
                </div>
            )}
            
            <div className="h-full overflow-y-auto">
                {/* 页面头部 */}
                <div className="flex justify-between items-center mb-6 px-4">
                    <h1 className="text-2xl font-bold">{t('modelDeployment')}</h1>
                    <div className="flex gap-4">
                        <Button variant="outline" onClick={loadDeployments}>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            {t('refresh')}
                        </Button>
                        <Button onClick={handleCreateDeployment}>
                            <Plus className="w-4 h-4 mr-2" />
                            {t('createDeployment')}
                        </Button>
                    </div>
                </div>

                {/* 部署列表 */}
                <DeploymentList 
                    deployments={deployments}
                    onViewDetail={handleViewDetail}
                    onRefresh={loadDeployments}
                />
            </div>

            {/* 页脚说明 */}
            <div className="bisheng-table-footer bg-background-login px-6">
                <p className="desc">{t('deploymentCaption')}</p>
            </div>
        </div>
    );
}
