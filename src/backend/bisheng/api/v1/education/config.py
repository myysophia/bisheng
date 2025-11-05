"""
Configuration management for the Education System.

This module handles loading and managing configuration settings
for different environments (development, production, testing).
"""

import os
import yaml
from pathlib import Path
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
from loguru import logger


class DatabaseConfig(BaseModel):
    """Database configuration settings."""
    host: str = "localhost"
    port: int = 3306
    username: str = "bisheng"
    password: str = "password"
    database: str = "bisheng"
    pool_size: int = 10
    max_overflow: int = 20
    pool_timeout: int = 30
    pool_recycle: int = 3600
    echo: bool = False
    echo_pool: bool = False
    ssl_ca: Optional[str] = None
    ssl_cert: Optional[str] = None
    ssl_key: Optional[str] = None


class CDNConfig(BaseModel):
    """CDN configuration settings."""
    base_url: str = "https://cdn.example.com/education/"
    video_formats: list = Field(default_factory=lambda: ["mp4", "webm"])
    thumbnail_formats: list = Field(default_factory=lambda: ["jpg", "png", "webp"])
    cache_control: str = "public, max-age=86400"
    signed_urls: bool = False
    url_expiry: int = 3600


class APIConfig(BaseModel):
    """API configuration settings."""
    
    class RateLimit(BaseModel):
        enabled: bool = False
        requests_per_minute: int = 100
        burst_limit: int = 200
    
    class CORS(BaseModel):
        allow_origins: list = Field(default_factory=lambda: ["*"])
        allow_credentials: bool = True
        allow_methods: list = Field(default_factory=lambda: ["GET", "POST", "PUT", "DELETE", "OPTIONS"])
        allow_headers: list = Field(default_factory=lambda: ["*"])
    
    class Response(BaseModel):
        max_page_size: int = 100
        default_page_size: int = 20
    
    rate_limit: RateLimit = Field(default_factory=RateLimit)
    cors: CORS = Field(default_factory=CORS)
    response: Response = Field(default_factory=Response)


class CacheConfig(BaseModel):
    """Cache configuration settings."""
    
    class Redis(BaseModel):
        host: str = "localhost"
        port: int = 6379
        password: str = ""
        db: int = 1
    
    class TTL(BaseModel):
        courses: int = 3600
        chapters: int = 3600
        user_progress: int = 300
        guided_steps: int = 7200
    
    redis: Redis = Field(default_factory=Redis)
    ttl: TTL = Field(default_factory=TTL)


class LoggingConfig(BaseModel):
    """Logging configuration settings."""
    
    class File(BaseModel):
        enabled: bool = False
        path: str = "/var/log/bisheng/education.log"
        rotation: str = "1 day"
        retention: str = "30 days"
        compression: str = "gz"
    
    level: str = "INFO"
    format: str = "[{time:YYYY-MM-DD HH:mm:ss}] {level} | {name}:{line} | {message}"
    file: File = Field(default_factory=File)
    json_logs: bool = False
    loggers: Dict[str, str] = Field(default_factory=dict)


class SecurityConfig(BaseModel):
    """Security configuration settings."""
    
    class JWT(BaseModel):
        secret_key: str = "default-secret-key"
        algorithm: str = "HS256"
        access_token_expire_minutes: int = 60
        refresh_token_expire_days: int = 7
    
    class Encryption(BaseModel):
        enabled: bool = False
        key: Optional[str] = None
    
    jwt: JWT = Field(default_factory=JWT)
    api_key_header: str = "X-API-Key"
    require_https: bool = False
    encryption: Encryption = Field(default_factory=Encryption)


class PerformanceConfig(BaseModel):
    """Performance configuration settings."""
    
    class TaskQueue(BaseModel):
        enabled: bool = False
        max_workers: int = 4
    
    class Metrics(BaseModel):
        enabled: bool = False
        endpoint: str = "/metrics"
    
    query_timeout: int = 30
    max_connections: int = 100
    connection_timeout: int = 10
    task_queue: TaskQueue = Field(default_factory=TaskQueue)
    metrics: Metrics = Field(default_factory=Metrics)


class FeaturesConfig(BaseModel):
    """Feature flags configuration."""
    
    class Experimental(BaseModel):
        ai_recommendations: bool = False
        social_features: bool = False
    
    video_streaming: bool = True
    progress_tracking: bool = True
    guided_builder: bool = True
    analytics: bool = True
    experimental: Experimental = Field(default_factory=Experimental)


class MonitoringConfig(BaseModel):
    """Monitoring configuration settings."""
    
    class HealthCheck(BaseModel):
        enabled: bool = True
        endpoint: str = "/health"
    
    class Prometheus(BaseModel):
        enabled: bool = False
        endpoint: str = "/metrics"
    
    class Sentry(BaseModel):
        enabled: bool = False
        dsn: Optional[str] = None
        environment: str = "development"
    
    health_check: HealthCheck = Field(default_factory=HealthCheck)
    prometheus: Prometheus = Field(default_factory=Prometheus)
    sentry: Sentry = Field(default_factory=Sentry)


class BackupConfig(BaseModel):
    """Backup configuration settings."""
    
    class Database(BaseModel):
        enabled: bool = False
        schedule: str = "0 2 * * *"
        retention_days: int = 30
    
    class UserData(BaseModel):
        enabled: bool = False
        schedule: str = "0 3 * * 0"
        retention_weeks: int = 12
    
    database: Database = Field(default_factory=Database)
    user_data: UserData = Field(default_factory=UserData)


class EducationConfig(BaseModel):
    """Main education system configuration."""
    
    database: DatabaseConfig = Field(default_factory=DatabaseConfig)
    cdn: CDNConfig = Field(default_factory=CDNConfig)
    api: APIConfig = Field(default_factory=APIConfig)
    cache: CacheConfig = Field(default_factory=CacheConfig)
    logging: LoggingConfig = Field(default_factory=LoggingConfig)
    security: SecurityConfig = Field(default_factory=SecurityConfig)
    performance: PerformanceConfig = Field(default_factory=PerformanceConfig)
    features: FeaturesConfig = Field(default_factory=FeaturesConfig)
    monitoring: MonitoringConfig = Field(default_factory=MonitoringConfig)
    backup: BackupConfig = Field(default_factory=BackupConfig)


class ConfigManager:
    """Configuration manager for the education system."""
    
    def __init__(self):
        self._config: Optional[EducationConfig] = None
        self._environment = os.getenv('BISHENG_ENV', 'development')
    
    def load_config(self, config_path: Optional[str] = None) -> EducationConfig:
        """Load configuration from file or environment."""
        
        if self._config is not None:
            return self._config
        
        # Determine config file path
        if config_path is None:
            config_dir = Path(__file__).parent.parent.parent.parent.parent / "config"
            config_file = config_dir / f"education_{self._environment}.yaml"
        else:
            config_file = Path(config_path)
        
        # Load configuration
        config_data = {}
        if config_file.exists():
            try:
                with open(config_file, 'r', encoding='utf-8') as f:
                    config_data = yaml.safe_load(f) or {}
                logger.info(f"Loaded configuration from {config_file}")
            except Exception as e:
                logger.warning(f"Failed to load config file {config_file}: {e}")
        else:
            logger.warning(f"Config file not found: {config_file}, using defaults")
        
        # Expand environment variables
        config_data = self._expand_env_vars(config_data)
        
        # Create configuration object
        self._config = EducationConfig(**config_data)
        
        logger.info(f"Education system configuration loaded for environment: {self._environment}")
        return self._config
    
    def _expand_env_vars(self, data: Any) -> Any:
        """Recursively expand environment variables in configuration data."""
        
        if isinstance(data, dict):
            return {key: self._expand_env_vars(value) for key, value in data.items()}
        elif isinstance(data, list):
            return [self._expand_env_vars(item) for item in data]
        elif isinstance(data, str):
            # Expand environment variables like ${VAR:-default}
            import re
            pattern = r'\$\{([^}]+)\}'
            
            def replace_env_var(match):
                var_expr = match.group(1)
                if ':-' in var_expr:
                    var_name, default_value = var_expr.split(':-', 1)
                    return os.getenv(var_name, default_value)
                else:
                    return os.getenv(var_expr, '')
            
            return re.sub(pattern, replace_env_var, data)
        else:
            return data
    
    def get_database_url(self) -> str:
        """Get database URL from configuration."""
        config = self.load_config()
        db = config.database
        
        # Build connection URL
        url = f"mysql+pymysql://{db.username}:{db.password}@{db.host}:{db.port}/{db.database}"
        
        # Add SSL parameters if configured
        params = []
        if db.ssl_ca:
            params.append(f"ssl_ca={db.ssl_ca}")
        if db.ssl_cert:
            params.append(f"ssl_cert={db.ssl_cert}")
        if db.ssl_key:
            params.append(f"ssl_key={db.ssl_key}")
        
        if params:
            url += "?" + "&".join(params)
        
        return url
    
    def get_redis_url(self) -> str:
        """Get Redis URL from configuration."""
        config = self.load_config()
        redis = config.cache.redis
        
        if redis.password:
            return f"redis://:{redis.password}@{redis.host}:{redis.port}/{redis.db}"
        else:
            return f"redis://{redis.host}:{redis.port}/{redis.db}"
    
    @property
    def environment(self) -> str:
        """Get current environment."""
        return self._environment
    
    @property
    def is_production(self) -> bool:
        """Check if running in production environment."""
        return self._environment == 'production'
    
    @property
    def is_development(self) -> bool:
        """Check if running in development environment."""
        return self._environment == 'development'


# Global configuration manager instance
config_manager = ConfigManager()


def get_config() -> EducationConfig:
    """Get the current education system configuration."""
    return config_manager.load_config()


def get_database_url() -> str:
    """Get database URL for the current environment."""
    return config_manager.get_database_url()


def get_redis_url() -> str:
    """Get Redis URL for the current environment."""
    return config_manager.get_redis_url()