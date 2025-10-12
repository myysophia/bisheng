import { useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/bs-ui/table";
import { Button } from "@/components/bs-ui/button";
import { Badge } from "@/components/bs-ui/badge";
import { useTranslation } from "react-i18next";
import { Eye, Play, Square, Trash2 } from "lucide-react";
import { useToast } from "@/components/bs-ui/toast/use-toast";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/bs-ui/alertDialog";

import {
    startDeploymentApi,
    stopDeploymentApi,
    deleteDeploymentApi,
} from "@/controllers/API/deployment";

interface Deployment {
    id: string;
    modelId?: string;
    name: string;
    modelName: string;
    source?: string;
    modelScopeModelId?: string;
    status: 'running' | 'stopped' | 'pending' | 'paused' | 'error';
    replicas: number;
    readyReplicas?: number;
    gpu?: string | number | null;
    memory?: string | null;
    createdAt: string;
    endpoint: string;
}

interface DeploymentListProps {
    deployments: Deployment[];
    onViewDetail: (id: string) => void;
    onRefresh: () => void;
}

export default function DeploymentList({ deployments, onViewDetail, onRefresh }: DeploymentListProps) {
    const { t } = useTranslation('model');
    const { message } = useToast();
    const [confirmContext, setConfirmContext] = useState<{ type: 'stop' | 'delete'; deployment: Deployment } | null>(null);
    const [confirmLoading, setConfirmLoading] = useState(false);

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            running: { variant: 'success' as const, label: t('statusRunning') },
            stopped: { variant: 'secondary' as const, label: t('statusStopped') },
            pending: { variant: 'warning' as const, label: t('statusPending') },
            paused: { variant: 'secondary' as const, label: t('statusPaused') },
            error: { variant: 'destructive' as const, label: t('statusError') }
        };

        const normalizedStatus = status.toLowerCase();
        const config = statusConfig[normalizedStatus] || statusConfig.error;
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    const handleStart = async (deployment: Deployment) => {
        try {
            await startDeploymentApi(deployment.modelId || deployment.id);
            message({
                variant: 'success',
                description: t('deploymentStarting', { name: deployment.name })
            });
            onRefresh();
        } catch (error) {
            message({
                variant: 'error',
                description: t('deploymentStartFailed')
            });
        }
    };

    const openConfirm = (type: 'stop' | 'delete', deployment: Deployment) => {
        setConfirmContext({ type, deployment });
    };

    const closeConfirm = () => {
        if (confirmLoading) return;
        setConfirmContext(null);
    };

    const confirmDialogContent = useMemo(() => {
        if (!confirmContext) return null;
        const name = confirmContext.deployment.name;
        if (confirmContext.type === 'stop') {
            return {
                title: t('confirmStopTitle', { name }),
                description: t('confirmStopDescription', { defaultValue: '停止后将释放计算资源，可随时重新启动。' }),
                confirmText: t('confirm'),
            };
        }
        return {
            title: t('confirmDeleteTitle', { name }),
            description: t('confirmDeleteDescription', { defaultValue: '删除后将无法恢复，该部署的访问地址会立即失效。' }),
            confirmText: t('confirm'),
        };
    }, [confirmContext, t]);

    const handleConfirmAction = async () => {
        if (!confirmContext) return;
        const { type, deployment } = confirmContext;
        setConfirmLoading(true);
        try {
            if (type === 'stop') {
                await stopDeploymentApi(deployment.modelId || deployment.id);
                message({
                    variant: 'success',
                    description: t('deploymentStopping', { name: deployment.name })
                });
            } else {
                await deleteDeploymentApi(deployment.modelId || deployment.id);
                message({
                    variant: 'success',
                    description: t('deploymentDeleted', { name: deployment.name })
                });
            }
            onRefresh();
        } catch (error) {
            const errorMessage = type === 'stop' ? t('deploymentStopFailed') : t('deploymentDeleteFailed');
            message({
                variant: 'error',
                description: errorMessage
            });
        } finally {
            setConfirmLoading(false);
            setConfirmContext(null);
        }
    };

    return (
        <div className="px-4">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>{t('deploymentName')}</TableHead>
                        <TableHead>{t('modelName')}</TableHead>
                        <TableHead>{t('source')}</TableHead>
                        <TableHead>{t('status')}</TableHead>
                        <TableHead>{t('createdTime')}</TableHead>
                        <TableHead className="text-right">{t('actions')}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {deployments.map((deployment) => {
                        const statusKey = (deployment.status ?? '').toLowerCase();
                        const canStart = statusKey === 'stopped' || statusKey === 'paused';
                        const canStop = statusKey === 'running';

                        return (
                            <TableRow key={deployment.id}>
                                <TableCell className="font-medium">{deployment.name}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span>{deployment.modelName}</span>
                                        {deployment.modelScopeModelId && (
                                            <span className="text-xs text-muted-foreground">{deployment.modelScopeModelId}</span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>{deployment.source || 'ModelScope'}</TableCell>
                                <TableCell>{getStatusBadge(statusKey)}</TableCell>
                                <TableCell>{deployment.createdAt}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onViewDetail(deployment.id)}
                                            title={t('viewDetail')}
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        {canStart ? (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleStart(deployment)}
                                                title={t('start')}
                                            >
                                                <Play className="h-4 w-4" />
                                            </Button>
                                        ) : canStop ? (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => openConfirm('stop', deployment)}
                                                title={t('stop')}
                                            >
                                                <Square className="h-4 w-4" />
                                            </Button>
                                        ) : null}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => openConfirm('delete', deployment)}
                                            title={t('delete')}
                                            className="text-destructive"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>

            {deployments.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    <p>{t('noDeployments')}</p>
                </div>
            )}

            <AlertDialog open={!!confirmContext} onOpenChange={(open) => (open ? null : closeConfirm())}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{confirmDialogContent?.title}</AlertDialogTitle>
                        <AlertDialogDescription>{confirmDialogContent?.description}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={closeConfirm} disabled={confirmLoading}>
                            {t('cancel')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(event) => {
                                event.preventDefault();
                                handleConfirmAction();
                            }}
                            disabled={confirmLoading}
                        >
                            {confirmLoading ? t('processing', { defaultValue: '处理中...' }) : (confirmDialogContent?.confirmText ?? t('confirm'))}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
