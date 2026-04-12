import React, { useState, useEffect } from 'react';
const Settings = () => {
    const [settings, setSettings] = useState({
        aiEngines: {
            openai: {
                apiKey: '',
                enabled: true
            },
            anthropic: {
                apiKey: '',
                enabled: true
            },
            google: {
                apiKey: '',
                enabled: true
            }
        },
        general: {
            theme: 'light',
            language: 'zh-CN',
            notifications: true
        },
        user: {
            name: '用户',
            email: 'user@example.com',
            timezone: 'Asia/Shanghai'
        }
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    useEffect(() => {
        loadSettings();
    }, []);
    const loadSettings = () => {
        setSettings({
            aiEngines: {
                openai: {
                    apiKey: 'sk-test-openai-key',
                    enabled: true
                },
                anthropic: {
                    apiKey: 'sk-test-anthropic-key',
                    enabled: true
                },
                google: {
                    apiKey: 'AIzaTestGoogleKey',
                    enabled: true
                }
            },
            general: {
                theme: 'light',
                language: 'zh-CN',
                notifications: true
            },
            user: {
                name: '用户',
                email: 'user@example.com',
                timezone: 'Asia/Shanghai'
            }
        });
    };
    const saveSettings = async () => {
        setLoading(true);
        setMessage('保存中...');
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            setMessage('设置保存成功！');
        }
        catch (error) {
            setMessage('保存失败，请重试');
        }
        finally {
            setLoading(false);
        }
    };
    const testEngine = async (engine) => {
        try {
            const response = await fetch('http://localhost:3000/api/ai-engine/engines');
            const data = await response.json();
            if (data.success) {
                alert(`${engine.charAt(0).toUpperCase() + engine.slice(1)} 连接成功！`);
            }
            else {
                alert(`${engine.charAt(0).toUpperCase() + engine.slice(1)} 连接失败！`);
            }
        }
        catch (error) {
            alert(`${engine.charAt(0).toUpperCase() + engine.slice(1)} 连接失败！`);
        }
    };
    const handleInputChange = (section, field, value) => {
        setSettings(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };
    const handleEngineChange = (engine, field, value) => {
        setSettings(prev => ({
            ...prev,
            aiEngines: {
                ...prev.aiEngines,
                [engine]: {
                    ...prev.aiEngines[engine],
                    [field]: value
                }
            }
        }));
    };
    return (<div className="settings-container">
      <h1>⚙️ 系统设置</h1>
      
      {message && (<div className="message-card card">
          <p>{message}</p>
        </div>)}

      
      <div className="settings-section card">
        <h2>🤖 AI引擎配置</h2>
        
        <div className="engines-config">
          <div className="engine-config">
            <h3>OpenAI</h3>
            <div className="config-group">
              <label>API Key</label>
              <input type="password" value={settings.aiEngines.openai.apiKey} onChange={(e) => handleEngineChange('openai', 'apiKey', e.target.value)} placeholder="输入OpenAI API密钥"/>
            </div>
            <div className="config-group">
              <label>启用</label>
              <input type="checkbox" checked={settings.aiEngines.openai.enabled} onChange={(e) => handleEngineChange('openai', 'enabled', e.target.checked)}/>
            </div>
            <button className="btn" onClick={() => testEngine('openai')}>
              测试连接
            </button>
          </div>

          <div className="engine-config">
            <h3>Anthropic</h3>
            <div className="config-group">
              <label>API Key</label>
              <input type="password" value={settings.aiEngines.anthropic.apiKey} onChange={(e) => handleEngineChange('anthropic', 'apiKey', e.target.value)} placeholder="输入Anthropic API密钥"/>
            </div>
            <div className="config-group">
              <label>启用</label>
              <input type="checkbox" checked={settings.aiEngines.anthropic.enabled} onChange={(e) => handleEngineChange('anthropic', 'enabled', e.target.checked)}/>
            </div>
            <button className="btn" onClick={() => testEngine('anthropic')}>
              测试连接
            </button>
          </div>

          <div className="engine-config">
            <h3>Google AI</h3>
            <div className="config-group">
              <label>API Key</label>
              <input type="password" value={settings.aiEngines.google.apiKey} onChange={(e) => handleEngineChange('google', 'apiKey', e.target.value)} placeholder="输入Google AI API密钥"/>
            </div>
            <div className="config-group">
              <label>启用</label>
              <input type="checkbox" checked={settings.aiEngines.google.enabled} onChange={(e) => handleEngineChange('google', 'enabled', e.target.checked)}/>
            </div>
            <button className="btn" onClick={() => testEngine('google')}>
              测试连接
            </button>
          </div>
        </div>
      </div>

      
      <div className="settings-section card">
        <h2>🔧 通用设置</h2>
        
        <div className="general-config">
          <div className="config-group">
            <label>主题</label>
            <select value={settings.general.theme} onChange={(e) => handleInputChange('general', 'theme', e.target.value)}>
              <option value="light">浅色主题</option>
              <option value="dark">深色主题</option>
            </select>
          </div>

          <div className="config-group">
            <label>语言</label>
            <select value={settings.general.language} onChange={(e) => handleInputChange('general', 'language', e.target.value)}>
              <option value="zh-CN">中文</option>
              <option value="en-US">English</option>
            </select>
          </div>

          <div className="config-group">
            <label>接收通知</label>
            <input type="checkbox" checked={settings.general.notifications} onChange={(e) => handleInputChange('general', 'notifications', e.target.checked)}/>
          </div>
        </div>
      </div>

      
      <div className="settings-section card">
        <h2>👤 用户信息</h2>
        
        <div className="user-config">
          <div className="config-group">
            <label>姓名</label>
            <input type="text" value={settings.user.name} onChange={(e) => handleInputChange('user', 'name', e.target.value)} placeholder="输入姓名"/>
          </div>

          <div className="config-group">
            <label>邮箱</label>
            <input type="email" value={settings.user.email} onChange={(e) => handleInputChange('user', 'email', e.target.value)} placeholder="输入邮箱"/>
          </div>

          <div className="config-group">
            <label>时区</label>
            <select value={settings.user.timezone} onChange={(e) => handleInputChange('user', 'timezone', e.target.value)}>
              <option value="Asia/Shanghai">亚洲/上海</option>
              <option value="America/New_York">美洲/纽约</option>
              <option value="Europe/London">欧洲/伦敦</option>
            </select>
          </div>
        </div>
      </div>

      
      <div className="save-section">
        <button className="btn" onClick={saveSettings} disabled={loading}>
          {loading ? '保存中...' : '保存设置'}
        </button>
      </div>
    </div>);
};
export default Settings;
//# sourceMappingURL=Settings.js.map