import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Rocket } from "lucide-react";

import { Button } from "@/components/bs-ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/bs-ui/card";
import { Input } from "@/components/bs-ui/input";
import { Label } from "@/components/bs-ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/bs-ui/select";
import { Slider } from "@/components/bs-ui/slider";
import { Switch } from "@/components/bs-ui/switch";
import { Textarea } from "@/components/bs-ui/input";
import { useToast } from "@/components/bs-ui/toast/use-toast";

import { createDeploymentApi } from "@/controllers/API/deployment";

interface CreateDeploymentProps {
    onBack: () => void;
    onSuccess: () => void;
}

const backendOptions = [
    { value: "llama-box", label: "Llama Box" },
    { value: "vllm", label: "vLLM" },
    { value: "tgi", label: "Text Generation Inference" },
    { value: "triton", label: "Triton Inference Server" },
];

const placementOptions = [
    { value: "spread", label: "Spread" },
    { value: "binpack", label: "Binpack" },
];

export default function CreateDeployment({ onBack, onSuccess }: CreateDeploymentProps) {
    const { t } = useTranslation("model");
    const { message } = useToast();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        modelScopeModelId: "",
        modelScopeFilePath: "",
        backend: "llama-box",
        replicas: 1,
        description: "",
        environmentVariables: "",
        cpuOffloading: true,
        distributedInferenceAcrossWorkers: true,
        placementStrategy: "spread",
        restartOnError: true,
    });

    const updateForm = (key: keyof typeof formData, value: unknown) => {
        setFormData((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            message({ variant: "error", description: t("deploymentNameRequired") });
            return;
        }

        if (!formData.modelScopeModelId.trim()) {
            message({ variant: "error", description: t("modelRequired") });
            return;
        }

        setIsSubmitting(true);
        try {
            await createDeploymentApi({
                name: formData.name.trim(),
                modelScopeModelId: formData.modelScopeModelId.trim(),
                modelScopeFilePath: formData.modelScopeFilePath.trim() || undefined,
                backend: formData.backend,
                replicas: formData.replicas,
                description: formData.description?.trim(),
                environmentVariables: formData.environmentVariables?.trim() || undefined,
                restartOnError: formData.restartOnError,
                placementStrategy: formData.placementStrategy,
                workerSelector: {},
                cpuOffloading: formData.cpuOffloading,
                distributedInferenceAcrossWorkers: formData.distributedInferenceAcrossWorkers,
                categories: [],
                backendParameters: [],
            });

            message({ variant: "success", description: t("deploymentCreatedSuccess") });
            onSuccess();
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || t("deploymentCreatedFailed");
            message({ variant: "error", description: errorMessage });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="h-full overflow-y-auto bg-background-login">
            <div className="max-w-6xl mx-auto p-6">
                <div className="flex items-center gap-4 mb-6">
                    <Button variant="ghost" size="icon" onClick={onBack}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h1 className="text-2xl font-bold">{t("createDeployment")}</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t("basicConfiguration")}</CardTitle>
                            <CardDescription>{t("basicConfigurationDesc")}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="deploymentName">{t("deploymentName")} *</Label>
                                <Input
                                    id="deploymentName"
                                    value={formData.name}
                                    onChange={(e) => updateForm("name", e.target.value)}
                                    placeholder={t("deploymentNamePlaceholder")}
                                />
                            </div>

                            <div>
                                <Label htmlFor="modelScopeId">ModelScope ID *</Label>
                                <Input
                                    id="modelScopeId"
                                    value={formData.modelScopeModelId}
                                    onChange={(e) => updateForm("modelScopeModelId", e.target.value)}
                                    placeholder="例如：unsloth/DeepSeek-R1-Distill-Qwen-1.5B-GGUF"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    {t("modelScopeIdHint", { defaultValue: "可在 GPUStack 模型列表中复制仓库 ID" })}
                                </p>
                            </div>

                            <div>
                                <Label htmlFor="modelScopeFile">ModelScope 文件路径</Label>
                                <Input
                                    id="modelScopeFile"
                                    value={formData.modelScopeFilePath}
                                    onChange={(e) => updateForm("modelScopeFilePath", e.target.value)}
                                    placeholder="可选，例如：DeepSeek-R1-Distill-Qwen-1.5B-UD-IQ1_S.gguf"
                                />
                            </div>

                            <div>
                                <Label htmlFor="backend">{t("backendType")}</Label>
                                <Select
                                    value={formData.backend}
                                    onValueChange={(value) => updateForm("backend", value)}
                                >
                                    <SelectTrigger id="backend">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {backendOptions.map((backend) => (
                                            <SelectItem key={backend.value} value={backend.value}>
                                                {backend.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="description">{t("description")}</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => updateForm("description", e.target.value)}
                                    placeholder={t("descriptionPlaceholder")}
                                    rows={3}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t("resourceConfiguration")}</CardTitle>
                            <CardDescription>{t("resourceConfigurationDesc")}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>{t("replicas")}: {formData.replicas}</Label>
                                <Slider
                                    value={[formData.replicas]}
                                    onValueChange={(value) => updateForm("replicas", value[0])}
                                    min={0}
                                    max={10}
                                    step={1}
                                    className="mt-2"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    {t("replicaHint", { defaultValue: "副本为 0 时将仅创建模型，不立即拉起推理实例" })}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t("runtimeOptions", { defaultValue: "运行配置" })}</CardTitle>
                            <CardDescription>{t("runtimeOptionsDesc", { defaultValue: "配置推理运行时的高级选项" })}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label htmlFor="cpuOffloading">CPU Offloading</Label>
                                    <p className="text-xs text-muted-foreground">{t("cpuOffloadHint", { defaultValue: "当 GPU 显存不足时将部分权重卸载到 CPU" })}</p>
                                </div>
                                <Switch
                                    id="cpuOffloading"
                                    checked={formData.cpuOffloading}
                                    onCheckedChange={(checked) => updateForm("cpuOffloading", checked)}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <Label htmlFor="distributed">{t("distributedInference", { defaultValue: "分布式推理" })}</Label>
                                    <p className="text-xs text-muted-foreground">{t("distributedInferenceHint", { defaultValue: "允许跨 Worker 切分模型进行推理" })}</p>
                                </div>
                                <Switch
                                    id="distributed"
                                    checked={formData.distributedInferenceAcrossWorkers}
                                    onCheckedChange={(checked) => updateForm("distributedInferenceAcrossWorkers", checked)}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <Label htmlFor="restartOnError">{t("restartOnError", { defaultValue: "故障自动重启" })}</Label>
                                    <p className="text-xs text-muted-foreground">{t("restartOnErrorHint", { defaultValue: "推理进程异常退出后自动拉起" })}</p>
                                </div>
                                <Switch
                                    id="restartOnError"
                                    checked={formData.restartOnError}
                                    onCheckedChange={(checked) => updateForm("restartOnError", checked)}
                                />
                            </div>

                            <div>
                                <Label htmlFor="placement">{t("placementStrategy", { defaultValue: "调度策略" })}</Label>
                                <Select
                                    value={formData.placementStrategy}
                                    onValueChange={(value) => updateForm("placementStrategy", value)}
                                >
                                    <SelectTrigger id="placement">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {placementOptions.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t("advancedConfiguration")}</CardTitle>
                            <CardDescription>{t("advancedConfigurationDesc")}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="envVars">{t("environmentVariables")}</Label>
                                <Textarea
                                    id="envVars"
                                    value={formData.environmentVariables}
                                    onChange={(e) => updateForm("environmentVariables", e.target.value)}
                                    placeholder={"KEY1=value1\nKEY2=value2"}
                                    rows={5}
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    {t("envVarsHelp")}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex justify-end gap-4 mt-6">
                    <Button variant="outline" onClick={onBack} disabled={isSubmitting}>
                        {t("cancel")}
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>{t("creating")}...</>
                        ) : (
                            <>
                                <Rocket className="h-4 w-4 mr-2" />
                                {t("createDeployment")}
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
