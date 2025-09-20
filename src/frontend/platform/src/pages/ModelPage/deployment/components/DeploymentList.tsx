import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/bs-ui/table";
import { Button } from "@/components/bs-ui/button";
import { Badge } from "@/components/bs-ui/badge";
import { useTranslation } from "react-i18next";
import { Eye, Play, Square, Trash2, Copy, ExternalLink } from "lucide-react";
import { useToast } from "@/components/bs-ui/toast/use-toast";

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
    status: 'running' | 'stopped' | 'pending' | 'error';
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

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            running: { variant: 'success' as const, label: t('statusRunning') },
            stopped: { variant: 'secondary' as const, label: t('statusStopped') },
            pending: { variant: 'warning' as const, label: t('statusPending') },
            error: { variant: 'destructive' as const, label: t('statusError') }
        };

        const config = statusConfig[status] || statusConfig.error;
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

    const handleStop = async (deployment: Deployment) => {
        try {
            await stopDeploymentApi(deployment.modelId || deployment.id);
            message({
                variant: 'success',
                description: t('deploymentStopping', { name: deployment.name })
            });
            onRefresh();
        } catch (error) {
            message({
                variant: 'error',
                description: t('deploymentStopFailed')
            });
        }
    };

    const handleDelete = async (deployment: Deployment) => {
        // TODO: 添加确认对话框
        try {
            await deleteDeploymentApi(deployment.modelId || deployment.id);
            message({
                variant: 'success',
                description: t('deploymentDeleted', { name: deployment.name })
            });
            onRefresh();
        } catch (error) {
            message({
                variant: 'error',
                description: t('deploymentDeleteFailed')
            });
        }
    };

    const copyEndpoint = (endpoint: string) => {
        navigator.clipboard.writeText(endpoint);
        message({
            variant: 'success',
            description: t('endpointCopied')
        });
    };

    return (
        <div className="px-4">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>{t('deploymentName')}</TableHead>
                        <TableHead>{t('modelName')}</TableHead>
                        <TableHead>{t('status')}</TableHead>
                        <TableHead>{t('replicas')}</TableHead>
                        <TableHead>{t('gpuCount')}</TableHead>
                        <TableHead>{t('memory')}</TableHead>
                        <TableHead>{t('endpoint')}</TableHead>
                        <TableHead>{t('createdTime')}</TableHead>
                        <TableHead className="text-right">{t('actions')}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {deployments.map((deployment) => (
                        <TableRow key={deployment.id}>
                            <TableCell className="font-medium">{deployment.name}</TableCell>
                            <TableCell>{deployment.modelName}</TableCell>
                            <TableCell>{getStatusBadge(deployment.status)}</TableCell>
                            <TableCell>{deployment.replicas}</TableCell>
                            <TableCell>{deployment.gpu ?? '-'}</TableCell>
                            <TableCell>{deployment.memory ?? '-'}</TableCell>
                            <TableCell>
                                {deployment.endpoint ? (
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs truncate max-w-[200px]">{deployment.endpoint}</span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={() => copyEndpoint(deployment.endpoint)}
                                        >
                                            <Copy className="h-3 w-3" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={() => window.open(deployment.endpoint, '_blank')}
                                        >
                                            <ExternalLink className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ) : (
                                    <span className="text-muted-foreground">-</span>
                                )}
                            </TableCell>
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
                                    {deployment.status === 'stopped' ? (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleStart(deployment)}
                                            title={t('start')}
                                        >
                                            <Play className="h-4 w-4" />
                                        </Button>
                                    ) : deployment.status === 'running' ? (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleStop(deployment)}
                                            title={t('stop')}
                                        >
                                            <Square className="h-4 w-4" />
                                        </Button>
                                    ) : null}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDelete(deployment)}
                                        title={t('delete')}
                                        className="text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            {deployments.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    <p>{t('noDeployments')}</p>
                </div>
            )}
        </div>
    );
}
