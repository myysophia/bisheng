import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/bs-ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/bs-ui/select";
import { Button } from "@/components/bs-ui/button";
import { Input } from "@/components/bs-ui/input";
import { Download, RefreshCw, Search, Pause, Play } from "lucide-react";
import { useToast } from "@/components/bs-ui/toast/use-toast";

interface DeploymentLogsProps {
    deploymentId: string;
}

export default function DeploymentLogs({ deploymentId }: DeploymentLogsProps) {
    const { t } = useTranslation('model');
    const { message } = useToast();
    const [selectedInstance, setSelectedInstance] = useState("all");
    const [logLevel, setLogLevel] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [logs, setLogs] = useState<string[]>([]);
    const [isAutoRefresh, setIsAutoRefresh] = useState(true);
    const [instances, setInstances] = useState([
        { id: "all", name: t('allInstances') },
        { id: "inst-1", name: "llama2-7b-deployment-6d4b8d4dd-xvh2f" },
        { id: "inst-2", name: "llama2-7b-deployment-6d4b8d4dd-k9p3m" }
    ]);
    
    const logsEndRef = useRef<HTMLDivElement>(null);
    const intervalRef = useRef<NodeJS.Timeout>();

    useEffect(() => {
        loadLogs();
        
        if (isAutoRefresh) {
            intervalRef.current = setInterval(loadLogs, 5000); // 每5秒刷新一次
        }
        
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [deploymentId, selectedInstance, logLevel, isAutoRefresh]);

    useEffect(() => {
        // 自动滚动到底部
        scrollToBottom();
    }, [logs]);

    const loadLogs = async () => {
        // TODO: 调用API获取日志
        // const data = await getDeploymentLogsApi(deploymentId, selectedInstance, logLevel);
        
        // 模拟日志数据
        const timestamp = new Date().toISOString();
        const newLogs = [
            `[${timestamp}] [INFO] Model loaded successfully`,
            `[${timestamp}] [INFO] Starting inference server on port 8080`,
            `[${timestamp}] [DEBUG] GPU memory allocated: 8192MB`,
            `[${timestamp}] [INFO] Health check passed`,
            `[${timestamp}] [INFO] Received request from client 192.168.1.100`,
            `[${timestamp}] [DEBUG] Processing tokens: 512`,
            `[${timestamp}] [INFO] Request completed in 120ms`,
            `[${timestamp}] [WARN] GPU utilization above 80%`,
            `[${timestamp}] [INFO] Auto-scaling triggered`,
            `[${timestamp}] [ERROR] Failed to connect to monitoring service (retrying...)`,
            `[${timestamp}] [INFO] Successfully reconnected to monitoring service`,
            `[${timestamp}] [DEBUG] Cache hit rate: 65%`,
            `[${timestamp}] [INFO] Model inference latency: 95ms (p95)`,
        ];
        
        setLogs(prevLogs => [...prevLogs, ...newLogs].slice(-1000)); // 保留最近1000条
    };

    const scrollToBottom = () => {
        logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleDownloadLogs = () => {
        const logsText = logs.join('\n');
        const blob = new Blob([logsText], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `deployment-${deploymentId}-logs-${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        message({
            variant: 'success',
            description: t('logsDownloaded')
        });
    };

    const toggleAutoRefresh = () => {
        setIsAutoRefresh(!isAutoRefresh);
    };

    const filteredLogs = logs.filter(log => {
        const matchesSearch = !searchTerm || log.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesLevel = logLevel === "all" || log.includes(`[${logLevel.toUpperCase()}]`);
        return matchesSearch && matchesLevel;
    });

    const getLogColor = (log: string) => {
        if (log.includes('[ERROR]')) return 'text-red-500';
        if (log.includes('[WARN]')) return 'text-yellow-500';
        if (log.includes('[DEBUG]')) return 'text-gray-500';
        return 'text-foreground';
    };

    return (
        <Card className="h-full">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>{t('deploymentLogs')}</CardTitle>
                    <div className="flex items-center gap-2">
                        {/* 实例选择 */}
                        <Select value={selectedInstance} onValueChange={setSelectedInstance}>
                            <SelectTrigger className="w-64">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {instances.map(instance => (
                                    <SelectItem key={instance.id} value={instance.id}>
                                        {instance.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* 日志级别选择 */}
                        <Select value={logLevel} onValueChange={setLogLevel}>
                            <SelectTrigger className="w-32">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('allLevels')}</SelectItem>
                                <SelectItem value="error">ERROR</SelectItem>
                                <SelectItem value="warn">WARN</SelectItem>
                                <SelectItem value="info">INFO</SelectItem>
                                <SelectItem value="debug">DEBUG</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* 搜索框 */}
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                className="pl-8 w-64"
                                placeholder={t('searchLogs')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* 操作按钮 */}
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={toggleAutoRefresh}
                            title={isAutoRefresh ? t('pauseRefresh') : t('startRefresh')}
                        >
                            {isAutoRefresh ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={loadLogs}
                            title={t('refresh')}
                        >
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleDownloadLogs}
                            title={t('downloadLogs')}
                        >
                            <Download className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {/* 日志内容区域 */}
                <div className="bg-black rounded-lg p-4 h-[600px] overflow-y-auto font-mono text-sm">
                    {filteredLogs.length === 0 ? (
                        <p className="text-gray-500">{t('noLogs')}</p>
                    ) : (
                        filteredLogs.map((log, index) => (
                            <div key={index} className={`${getLogColor(log)} hover:bg-gray-900 px-1`}>
                                {log}
                            </div>
                        ))
                    )}
                    <div ref={logsEndRef} />
                </div>
                
                {/* 状态栏 */}
                <div className="mt-4 flex justify-between items-center text-sm text-muted-foreground">
                    <span>{t('showingLogs', { count: filteredLogs.length })}</span>
                    <span>
                        {isAutoRefresh ? (
                            <span className="flex items-center gap-1">
                                <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></span>
                                {t('autoRefreshing')}
                            </span>
                        ) : (
                            t('paused')
                        )}
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}
