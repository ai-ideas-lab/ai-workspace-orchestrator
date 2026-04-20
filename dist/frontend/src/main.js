import React from 'react';
import ReactDOM from 'react-dom/client';
import AppWrapper from './components/AppWrapper';
import './index.css';
import 'antd/dist/reset.css';
const isDevelopment = process.env.NODE_ENV === 'development';
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(isDevelopment ? (<React.StrictMode>
      <AppWrapper />
    </React.StrictMode>) : (<AppWrapper />));
//# sourceMappingURL=main.js.map