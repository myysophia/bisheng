import asyncio
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime
import aiohttp
import json
from urllib.parse import urljoin

from bisheng.settings import settings
from bisheng.api.services.base import BaseService

logger = logging.getLogger(__name__)


class GPUStackService(BaseService):
    """GPUStack集成服务"""
    
    def __init__(self):
        super().__init__()
        # 从config.yaml读取GPUStack配置
        gpustack_config = settings.get_from_db("gpustack") or {}
        self.gpustack_url = gpustack_config.get("url", "https://gpustack.agentgo.tech")
        self.gpustack_username = gpustack_config.get("username", "admin")
        self.gpustack_password = gpustack_config.get("password", "Qwer1234!!!")
        
        # 如果没有配置，使用默认值
        if not self.gpustack_url:
            self.gpustack_url = "https://gpustack.agentgo.tech"
        if not self.gpustack_username:
            self.gpustack_username = "admin"
        if not self.gpustack_password:
            self.gpustack_password = "Qwer1234!!!"
            
        self.session_cookie = None
        self.headers = {
            "Content-Type": "application/json"
        }
        
        logger.info(f"GPUStack service initialized with URL: {self.gpustack_url}")
    
    async def _login(self) -> str:
        """登录到GPUStack获取session cookie"""
        login_url = urljoin(self.gpustack_url, "/auth/login")
        
        async with aiohttp.ClientSession() as session:
            try:
                async with session.post(
                    login_url,
                    headers={"Content-Type": "application/x-www-form-urlencoded"},
                    data=f"username={self.gpustack_username}&password={self.gpustack_password}"
                ) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        logger.error(f"GPUStack login failed: {response.status} - {error_text}")
                        raise Exception(f"GPUStack login failed: {response.status}")
                    
                    # 从响应的Set-Cookie头中提取session cookie
                    cookies = response.cookies
                    if 'gpustack_session' in cookies:
                        session_cookie = cookies['gpustack_session'].value
                        logger.info("GPUStack login successful")
                        return session_cookie
                    else:
                        raise Exception("No session cookie found in login response")
            except aiohttp.ClientError as e:
                logger.error(f"Failed to login to GPUStack: {str(e)}")
                raise Exception(f"Failed to login to GPUStack: {str(e)}")
    
    async def _ensure_authenticated(self):
        """确保有有效的认证信息"""
        if not self.session_cookie:
            self.session_cookie = await self._login()
        
    async def _make_request(self, method: str, endpoint: str, **kwargs) -> Dict[str, Any]:
        """发送HTTP请求到GPUStack"""
        url = urljoin(self.gpustack_url, endpoint)
        
        # 确保有有效的认证信息
        await self._ensure_authenticated()
        
        # 准备cookies
        cookies = {"gpustack_session": self.session_cookie} if self.session_cookie else None
        
        async with aiohttp.ClientSession(cookies=cookies) as session:
            try:
                async with session.request(
                    method=method,
                    url=url,
                    headers=self.headers,
                    **kwargs
                ) as response:
                    if response.status == 401:
                        # 如果认证失败，重新登录并重试
                        logger.warning("Authentication failed, retrying with new login")
                        self.session_cookie = None
                        await self._ensure_authenticated()
                        cookies = {"gpustack_session": self.session_cookie} if self.session_cookie else None
                        
                        # 重新创建 session 并重试请求
                        async with aiohttp.ClientSession(cookies=cookies) as retry_session:
                            async with retry_session.request(
                                method=method,
                                url=url,
                                headers=self.headers,
                                **kwargs
                            ) as retry_response:
                                if retry_response.status >= 400:
                                    error_text = await retry_response.text()
                                    logger.error(f"GPUStack API error: {retry_response.status} - {error_text}")
                                    raise Exception(f"GPUStack API error: {retry_response.status}")
                                
                                return await retry_response.json()
                    elif response.status >= 400:
                        error_text = await response.text()
                        logger.error(f"GPUStack API error: {response.status} - {error_text}")
                        raise Exception(f"GPUStack API error: {response.status}")
                    
                    return await response.json()
            except aiohttp.ClientError as e:
                logger.error(f"Failed to connect to GPUStack: {str(e)}")
                raise Exception(f"Failed to connect to GPUStack service: {str(e)}")
    
    async def list_deployments(
        self,
        user_id: str,
        page: int = 1,
        per_page: int = 10,
        search: Optional[str] = None
    ) -> Dict[str, Any]:
        """获取部署列表"""
        try:
            # 从GPUStack获取模型实例列表
            params = {
                "page": page,
                "perPage": per_page
            }
            # GPUStack 当前未公开模糊搜索能力，search 参数暂不透传

            response = await self._make_request(
                "GET",
                "/v1/model-instances",
                params=params
            )
            
            # 转换为部署列表格式
            deployments = []
            for item in response.get("items", []):
                deployment = self._convert_to_deployment(item)
                deployments.append(deployment)
            
            return {
                "items": deployments,
                "total": response.get("pagination", {}).get("total", 0),
                "page": page,
                "per_page": per_page
            }
            
        except Exception as e:
            logger.error(f"Failed to list deployments: {str(e)}")
            raise
    
    async def create_deployment(
        self,
        user_id: str,
        deployment_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """创建新部署（支持 ModelScope 模型）"""
        try:
            model_payload = {
                "name": deployment_data["name"],
                "source": "model_scope",
                "model_scope_model_id": deployment_data["model_scope_model_id"],
                "model_scope_file_path": deployment_data.get("model_scope_file_path"),
                "backend": deployment_data.get("backend", "llama-box"),
                "replicas": deployment_data.get("replicas", 1),
                "description": deployment_data.get("description", ""),
                "categories": deployment_data.get("categories", []),
                "backend_parameters": deployment_data.get("backend_parameters", []),
                "env": deployment_data.get("environment_variables") or {},
                "restart_on_error": deployment_data.get("restart_on_error", True),
                "placement_strategy": deployment_data.get("placement_strategy", "spread"),
                "worker_selector": deployment_data.get("worker_selector") or {},
                "cpu_offloading": deployment_data.get("cpu_offloading"),
                "distributed_inference_across_workers": deployment_data.get(
                    "distributed_inference_across_workers"
                ),
                "gpu_selector": deployment_data.get("gpu_selector"),
            }

            cleaned_payload = {
                key: value
                for key, value in model_payload.items()
                if value is not None
            }

            model_response = await self._make_request(
                "POST",
                "/v1/models",
                json=cleaned_payload
            )

            model_id = model_response.get("id")
            desired_replicas = deployment_data.get("replicas", 1)
            await self._wait_for_model_ready(model_id, desired_replicas)

            return self._convert_to_deployment(model_response)

        except Exception as e:
            logger.error(f"Failed to create deployment: {str(e)}")
            raise
    
    async def get_deployment(
        self,
        user_id: str,
        deployment_id: str
    ) -> Optional[Dict[str, Any]]:
        """获取部署详情"""
        try:
            # 首先尝试获取model-instance详情
            try:
                instance_response = await self._make_request(
                    "GET",
                    f"/v1/model-instances/{deployment_id}"
                )
                model_id = instance_response.get("model_id")
                
                # 获取对应的模型详情
                model_response = await self._make_request(
                    "GET",
                    f"/v1/models/{model_id}"
                )
                
                # 合并instance和model数据
                deployment_data = {**model_response}
                deployment_data.update({
                    "id": deployment_id,  # 使用instance ID
                    "state": instance_response.get("state"),
                    "worker_name": instance_response.get("worker_name"),
                    "created_at": instance_response.get("created_at"),
                    "updated_at": instance_response.get("updated_at")
                })
                
                deployment = self._convert_to_deployment(deployment_data)
                
                # 获取模型所有实例
                instances_response = await self._make_request(
                    "GET",
                    f"/v1/models/{model_id}/instances"
                )
                deployment["instances"] = self._convert_instances(instances_response.get("items", []))
                
                return deployment
                
            except Exception:
                # 如果作为instance ID失败，尝试作为model ID
                model_response = await self._make_request(
                    "GET",
                    f"/v1/models/{deployment_id}"
                )
                
                # 获取模型实例
                instances_response = await self._make_request(
                    "GET",
                    f"/v1/models/{deployment_id}/instances"
                )
                
                deployment = self._convert_to_deployment(model_response)
                deployment["instances"] = self._convert_instances(instances_response.get("items", []))
                
                return deployment
            
        except Exception as e:
            logger.error(f"Failed to get deployment: {str(e)}")
            return None
    
    async def update_deployment(
        self,
        user_id: str,
        deployment_id: str,
        deployment_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """更新部署配置"""
        try:
            update_data = {}
            
            if "replicas" in deployment_data:
                update_data["replicas"] = deployment_data["replicas"]
            
            if "description" in deployment_data:
                update_data["description"] = deployment_data["description"]
            
            if "environment_variables" in deployment_data:
                update_data["env"] = deployment_data["environment_variables"]
            
            model_id = await self._resolve_model_id(deployment_id)
            response = await self._make_request(
                "PUT",
                f"/v1/models/{model_id}",
                json=update_data
            )
            
            return self._convert_to_deployment(response)
            
        except Exception as e:
            logger.error(f"Failed to update deployment: {str(e)}")
            raise
    
    async def delete_deployment(
        self,
        user_id: str,
        deployment_id: str
    ) -> None:
        """删除部署"""
        try:
            model_id = await self._resolve_model_id(deployment_id)
            await self._make_request(
                "DELETE",
                f"/v1/models/{model_id}"
            )
        except Exception as e:
            logger.error(f"Failed to delete deployment: {str(e)}")
            raise
    
    async def start_deployment(
        self,
        user_id: str,
        deployment_id: str
    ) -> Dict[str, Any]:
        """启动部署"""
        try:
            # 更新副本数为原始值
            model_id = await self._resolve_model_id(deployment_id)
            response = await self._make_request(
                "PUT",
                f"/v1/models/{model_id}",
                json={"replicas": 1}  # 至少启动1个副本
            )
            
            return self._convert_to_deployment(response)
            
        except Exception as e:
            logger.error(f"Failed to start deployment: {str(e)}")
            raise
    
    async def stop_deployment(
        self,
        user_id: str,
        deployment_id: str
    ) -> Dict[str, Any]:
        """停止部署"""
        try:
            # 将副本数设为0来停止部署
            model_id = await self._resolve_model_id(deployment_id)
            response = await self._make_request(
                "PUT",
                f"/v1/models/{model_id}",
                json={"replicas": 0}
            )
            
            return self._convert_to_deployment(response)
            
        except Exception as e:
            logger.error(f"Failed to stop deployment: {str(e)}")
            raise
    
    async def get_deployment_instances(
        self,
        user_id: str,
        deployment_id: str
    ) -> List[Dict[str, Any]]:
        """获取部署的所有实例"""
        try:
            model_id = await self._resolve_model_id(deployment_id)
            response = await self._make_request(
                "GET",
                f"/v1/models/{model_id}/instances"
            )
            
            return self._convert_instances(response.get("items", []))
            
        except Exception as e:
            logger.error(f"Failed to get deployment instances: {str(e)}")
            raise
    
    async def get_deployment_metrics(
        self,
        user_id: str,
        deployment_id: str,
        time_range: str = "1h"
    ) -> Dict[str, Any]:
        """获取部署的监控指标"""
        try:
            # 从GPUStack Dashboard API获取监控数据
            model_id = await self._resolve_model_id(deployment_id)
            response = await self._make_request(
                "GET",
                "/v1/dashboard",
                params={"model_id": model_id}
            )
            
            # 转换监控数据格式
            metrics = {
                "gpu": self._format_metrics_data(response.get("system_load", {}).get("history", {}).get("gpu", [])),
                "memory": self._format_metrics_data(response.get("system_load", {}).get("history", {}).get("vram", [])),
                "cpu": self._format_metrics_data(response.get("system_load", {}).get("history", {}).get("cpu", [])),
                "requests": []  # GPUStack暂不提供请求统计
            }
            
            return metrics
            
        except Exception as e:
            logger.error(f"Failed to get deployment metrics: {str(e)}")
            raise
    
    async def get_deployment_logs(
        self,
        user_id: str,
        deployment_id: str,
        instance_id: Optional[str] = None,
        log_level: Optional[str] = "all",
        lines: int = 100
    ) -> List[str]:
        """获取部署日志"""
        try:
            # 如果指定了实例ID，获取特定实例的日志
            if instance_id:
                endpoint = f"/v1/model-instances/{instance_id}/logs"
            else:
                # 获取第一个实例的日志
                instances = await self.get_deployment_instances(user_id, deployment_id)
                if not instances:
                    return []
                instance_id = instances[0]["id"]
                endpoint = f"/v1/model-instances/{instance_id}/logs"
            
            response = await self._make_request(
                "GET",
                endpoint,
                params={"lines": lines}
            )
            
            # 处理日志文本
            logs_text = response if isinstance(response, str) else str(response)
            logs = logs_text.split("\n")
            
            # 根据日志级别过滤
            if log_level != "all":
                logs = [log for log in logs if f"[{log_level.upper()}]" in log]
            
            return logs[-lines:]  # 返回最后N行
            
        except Exception as e:
            logger.error(f"Failed to get deployment logs: {str(e)}")
            return []
    
    async def get_available_resources(self) -> Dict[str, Any]:
        """获取可用资源"""
        try:
            # 获取GPU设备列表
            gpu_response = await self._make_request(
                "GET",
                "/v1/gpu-devices"
            )
            
            # 获取Worker列表
            worker_response = await self._make_request(
                "GET",
                "/v1/workers"
            )
            
            # 统计可用资源
            total_gpus = len(gpu_response.get("items", []))
            available_gpus = sum(1 for gpu in gpu_response.get("items", []) 
                               if gpu.get("status") == "available")
            
            total_workers = len(worker_response.get("items", []))
            active_workers = sum(1 for worker in worker_response.get("items", []) 
                               if worker.get("status") == "ready")
            
            return {
                "gpus": {
                    "total": total_gpus,
                    "available": available_gpus,
                    "types": list(set(gpu.get("name", "Unknown") 
                                    for gpu in gpu_response.get("items", [])))
                },
                "workers": {
                    "total": total_workers,
                    "active": active_workers
                }
            }
            
        except Exception as e:
            logger.error(f"Failed to get available resources: {str(e)}")
            raise
    
    async def get_available_models(self) -> List[Dict[str, Any]]:
        """获取可用于部署的模型列表"""
        try:
            model_list = []
            
            # 从GPUStack获取预定义的模型集
            try:
                model_sets = await self._make_request(
                    "GET",
                    "/v1/model-sets"
                )
                
                for model_set in model_sets.get("items", []):
                    model_list.append({
                        "id": model_set.get("name"),
                        "name": model_set.get("name"),
                        "type": "preset",
                        "provider": "gpustack"
                    })
            except Exception as e:
                logger.error(f"Failed to get model sets from GPUStack: {str(e)}")
            
            # 也可以获取已部署的模型作为参考
            try:
                models = await self._make_request(
                    "GET",
                    "/v1/models"
                )
                
                for model in models.get("items", []):
                    model_list.append({
                        "id": str(model.get("id")),
                        "name": model.get("name"),
                        "type": "deployed",
                        "provider": "gpustack"
                    })
            except Exception as e:
                logger.error(f"Failed to get models from GPUStack: {str(e)}")
            
            return model_list
            
        except Exception as e:
            logger.error(f"Failed to get available models: {str(e)}")
            return []

    async def list_modelscope_models(
        self,
        page_number: int = 1,
        page_size: int = 10,
        name: Optional[str] = None,
        tags: Optional[List[str]] = None,
        tasks: Optional[List[str]] = None,
        sort_by: str = "Default"
    ) -> Dict[str, Any]:
        """通过GPUStack代理获取ModelScope模型列表"""
        try:
            payload = {
                "PageSize": page_size,
                "PageNumber": page_number,
                "Name": name or "",
                "tags": tags or [],
                "tasks": tasks or [],
                "SortBy": sort_by,
            }

            response = await self._make_request(
                "PUT",
                "/proxy",
                params={
                    "url": "https://www.modelscope.cn/api/v1/dolphin/models"
                },
                json=payload
            )
            return response
        except Exception as e:
            logger.error(f"Failed to fetch ModelScope model list: {str(e)}")
            raise

    async def get_modelscope_model_detail(self, model_id: str) -> Dict[str, Any]:
        """获取单个ModelScope模型详情"""
        try:
            response = await self._make_request(
                "GET",
                "/proxy",
                params={
                    "url": f"https://modelscope.cn/api/v1/models/{model_id}"
                }
            )
            return response
        except Exception as e:
            logger.error(f"Failed to fetch ModelScope model detail: {str(e)}")
            raise
    
    # 辅助方法
    async def _wait_for_model_ready(
        self,
        model_id: str,
        desired_replicas: int = 1,
        timeout: int = 300
    ):
        """等待模型准备就绪"""
        if desired_replicas <= 0:
            return True

        start_time = datetime.now()
        
        while (datetime.now() - start_time).seconds < timeout:
            try:
                response = await self._make_request(
                    "GET",
                    f"/v1/models/{model_id}"
                )
                
                ready_replicas = response.get("ready_replicas", 0)
                if ready_replicas >= desired_replicas:
                    return True
                    
            except:
                pass
            
            await asyncio.sleep(5)  # 每5秒检查一次
        
        raise Exception("Model deployment timeout")
    
    def _convert_to_deployment(self, model_data: Dict[str, Any]) -> Dict[str, Any]:
        """将GPUStack模型数据转换为部署格式"""
        name = model_data.get("name") or model_data.get("model_name", "")
        model_scope_model_id = model_data.get("model_scope_model_id")

        gpu_info = None
        gpu_selector = model_data.get("gpu_selector") or {}
        if isinstance(gpu_selector, dict):
            gpu_count = gpu_selector.get("gpu_count")
            gpu_ids = gpu_selector.get("gpu_ids")
            if isinstance(gpu_count, int):
                gpu_info = f"{gpu_count}"
            elif isinstance(gpu_ids, list):
                gpu_info = f"{len(gpu_ids)}"

        if gpu_info is None:
            computed_claim = model_data.get("computed_resource_claim") or {}
            if isinstance(computed_claim, dict):
                gpu_info = computed_claim.get("gpu")

        memory = "0Gi"
        cpu_cores = "0"
        if isinstance(model_data.get("computed_resource_claim"), dict):
            claim = model_data["computed_resource_claim"]
            memory = str(claim.get("memory", memory))
            cpu_cores = str(claim.get("cpu", cpu_cores))

        if isinstance(model_data.get("memory"), str):
            memory = model_data.get("memory") or memory
        if isinstance(model_data.get("cpu"), (int, str)):
            cpu_cores = str(model_data.get("cpu"))

        return {
            "id": str(model_data.get("id", "")),
            "name": name,
            "modelName": name,
            "status": self._get_deployment_status(model_data),
            "replicas": model_data.get("replicas")
            or model_data.get("desired_replicas", 0)
            or 0,
            "readyReplicas": model_data.get("ready_replicas")
            or model_data.get("running_replicas", 0)
            or 0,
            "gpu": gpu_info,
            "memory": memory,
            "cpuCores": cpu_cores,
            "createdAt": model_data.get("created_at", ""),
            "updatedAt": model_data.get("updated_at", ""),
            "endpoint": self._get_endpoint(model_data),
            "backendType": model_data.get("backend", "unknown"),
            "backendVersion": model_data.get("backend_version", "latest"),
            "description": model_data.get("description", ""),
            "source": model_data.get("source"),
            "modelScopeModelId": model_scope_model_id,
            "modelId": str(model_data.get("model_id") or model_data.get("id", "")),
        }
    
    def _convert_instances(self, instances: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """转换实例数据格式"""
        converted = []
        for instance in instances:
            converted.append({
                "id": str(instance.get("id", "")),
                "name": instance.get("name", ""),
                "status": instance.get("state", "unknown"),
                "node": instance.get("worker_name", "unknown"),
                "gpu": f"{instance.get('gpu_count', 0)} GPU(s)",
                "memory": instance.get("memory", "0"),
                "cpu": f"{instance.get('cpu', 0)} cores",
                "start_time": instance.get("created_at", "")
            })
        return converted

    async def _resolve_model_id(self, deployment_id: str) -> str:
        """根据部署ID解析模型ID，兼容传入实例ID的情况"""
        try:
            await self._make_request("GET", f"/v1/models/{deployment_id}")
            return str(deployment_id)
        except Exception:
            instance_response = await self._make_request(
                "GET",
                f"/v1/model-instances/{deployment_id}"
            )
            model_id = instance_response.get("model_id")
            if model_id is None:
                raise Exception("Unable to resolve model id from deployment identifier")
            return str(model_id)
    
    def _get_deployment_status(self, model_data: Dict[str, Any]) -> str:
        """获取部署状态"""
        # 优先使用instance的state字段
        if "state" in model_data:
            state = model_data.get("state", "unknown").lower()
            if state == "running":
                return "running"
            elif state == "stopped":
                return "stopped"
            elif state in ["pending", "initializing", "starting"]:
                return "pending"
            elif state in ["error", "failed"]:
                return "error"
            else:
                return "stopped"
        
        # 如果没有state字段，使用replicas推断
        replicas = model_data.get("replicas", 0)
        ready_replicas = model_data.get("ready_replicas", 0)
        
        if replicas == 0:
            return "stopped"
        elif ready_replicas == replicas:
            return "running"
        elif ready_replicas > 0:
            return "pending"
        else:
            return "error"
    
    def _get_endpoint(self, model_data: Dict[str, Any]) -> str:
        """获取API端点"""
        if model_data.get("ready_replicas", 0) > 0:
            model_name = model_data.get("name", "")
            return f"{self.gpustack_url}/v1-openai/models/{model_name}"
        return ""
    
    def _format_metrics_data(self, data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """格式化监控数据"""
        formatted = []
        for item in data:
            formatted.append({
                "time": datetime.fromtimestamp(item.get("timestamp", 0)).strftime("%H:%M:%S"),
                "value": item.get("value", 0)
            })
        return formatted
