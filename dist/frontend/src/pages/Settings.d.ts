import React from 'react';
interface Settings {
    aiEngines: {
        openai: {
            apiKey: string;
            enabled: boolean;
        };
        anthropic: {
            apiKey: string;
            enabled: boolean;
        };
        google: {
            apiKey: string;
            enabled: boolean;
        };
    };
    general: {
        theme: 'light' | 'dark';
        language: 'zh-CN' | 'en-US';
        notifications: boolean;
    };
    user: {
        name: string;
        email: string;
        timezone: string;
    };
}
declare const Settings: React.FC;
export default Settings;
//# sourceMappingURL=Settings.d.ts.map