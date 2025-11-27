export { };

declare global {
    interface Window {
        SearchSkillsPage: any;
        errorAlerts: (errorList: string[]) => void;
        _flow: any;
    }

    const __APP_ENV__: {
        BASE_URL: string;
        BISHENG_HOST: string;
        WORKBENCH_BASE_URL?: string;
        [key: string]: any;
    };
}

declare module "*.png" {
    const content: any;
    export default content;
}

declare module "*.svg" {
    const content: any;
    export default content;
}

declare module "*.webp" {
    const content: any;
    export default content;
}

declare module "*.mp4" {
    const content: any;
    export default content;
}
