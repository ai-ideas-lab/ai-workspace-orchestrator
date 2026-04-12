import { createGlobalStyle } from 'styled-components';
export const GlobalStyles = createGlobalStyle `
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: ${props => props.theme.background};
    color: ${props => props.theme.text};
    transition: background-color 0.3s ease, color 0.3s ease;
  }

  #root {
    min-height: 100vh;
  }

  /* 自定义滚动条 */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: ${props => props.theme.scrollbarTrack};
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb {
    background: ${props => props.theme.scrollbarThumb};
    border-radius: 4px;
    border: 1px solid ${props => props.theme.scrollbarThumbBorder};
  }

  ::-webkit-scrollbar-thumb:hover {
    background: ${props => props.theme.scrollbarThumbHover};
  }

  /* 自定义菜单样式 */
  .custom-menu {
    transition: all 0.3s ease;
  }

  .custom-menu .ant-menu-item,
  .custom-menu .ant-menu-submenu-title {
    transition: all 0.3s ease;
    margin: 2px 8px;
    border-radius: 6px;
  }

  .custom-menu .ant-menu-item:hover,
  .custom-menu .ant-menu-submenu-title:hover {
    background-color: ${props => props.theme.menuHover};
  }

  .custom-menu .ant-menu-item-selected {
    background-color: ${props => props.theme.menuSelected};
    border-left: 3px solid #1890ff;
  }

  /* 自定义子菜单样式 */
  .custom-submenu .ant-menu-sub {
    background-color: ${props => props.theme.submenuBackground};
    border-radius: 6px;
    margin: 2px 8px;
  }

  /* 自定义卡片样式 */
  .ant-card {
    transition: all 0.3s ease;
    border-radius: 12px;
    box-shadow: ${props => props.theme.cardShadow};
  }

  .ant-card:hover {
    box-shadow: ${props => props.theme.cardShadowHover};
    transform: translateY(-2px);
  }

  /* 自定义按钮样式 */
  .ant-btn {
    border-radius: 6px;
    transition: all 0.3s ease;
  }

  .ant-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .ant-btn-primary {
    background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
    border: none;
  }

  .ant-btn-primary:hover {
    background: linear-gradient(135deg, #40a9ff 0%, #1890ff 100%);
  }

  /* 自定义输入框样式 */
  .ant-input,
  .ant-input-password,
  .ant-select {
    border-radius: 6px;
    border: 1px solid ${props => props.theme.inputBorder};
    transition: all 0.3s ease;
  }

  .ant-input:focus,
  .ant-input-password:focus,
  .ant-select:focus,
  .ant-select-focused .ant-select-selector {
    border-color: #1890ff;
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
  }

  /* 自模态框样式 */
  .ant-modal {
    border-radius: 12px;
    padding: 0;
  }

  .ant-modal-header {
    border-radius: 12px 12px 0 0;
    background: ${props => props.theme.modalHeader};
  }

  .ant-modal-content {
    border-radius: 12px;
    overflow: hidden;
  }

  /* 自定义表格样式 */
  .ant-table {
    border-radius: 12px;
    overflow: hidden;
  }

  .ant-table-thead > tr > th {
    background: ${props => props.theme.tableHeader};
    border-bottom: 2px solid ${props => props.theme.tableHeaderBorder};
    font-weight: 600;
  }

  .ant-table-tbody > tr:hover > td {
    background: ${props => props.theme.tableRowHover};
  }

  /* 自定义标签样式 */
  .ant-tag {
    border-radius: 16px;
    padding: 2px 8px;
    font-size: 12px;
    border: none;
    transition: all 0.3s ease;
  }

  /* 自定义统计卡片样式 */
  .ant-statistic {
    padding: 16px;
  }

  .ant-statistic-title {
    color: ${props => props.theme.textSecondary};
    font-size: 14px;
    margin-bottom: 8px;
  }

  .ant-statistic-content {
    color: ${props => props.theme.text};
    font-size: 24px;
    font-weight: 600;
  }

  /* 自定义进度条样式 */
  .ant-progress-bg {
    background: linear-gradient(90deg, #1890ff 0%, #096dd9 100%);
    border-radius: 10px;
  }

  .ant-progress-text {
    font-size: 12px;
    font-weight: 500;
  }

  /* 自定义时间线样式 */
  .ant-timeline {
    margin: 16px 0;
  }

  .ant-timeline-item {
    padding-bottom: 16px;
  }

  .ant-timeline-item-tail {
    border-left: 2px solid ${props => props.theme.timelineBorder};
  }

  .ant-timeline-item-head {
    background: ${props => props.theme.timelineHead};
    border: 2px solid ${props => props.theme.timelineBorder};
    width: 12px;
    height: 12px;
    border-radius: 50%;
  }

  /* 自定义空状态样式 */
  .ant-empty {
    padding: 48px 0;
  }

  .ant-empty-image {
    height: 120px;
  }

  .ant-empty-description {
    color: ${props => props.theme.textSecondary};
    font-size: 14px;
  }

  /* 响应式设计 */
  @media (max-width: 768px) {
    .ant-layout-sider {
      position: fixed;
      height: 100vh;
      left: 0;
      top: 0;
      z-index: 1000;
    }

    .ant-layout {
      margin-left: ${props => props.siderCollapsed ? 0 : 260}px;
      transition: margin-left 0.3s ease;
    }

    .ant-layout-content {
      margin: 24px 16px 24px 16px;
      padding: 16px;
    }
  }

  @media (max-width: 576px) {
    .ant-layout {
      margin-left: 0 !important;
    }

    .ant-layout-sider {
      transform: translateX(-100%);
      transition: transform 0.3s ease;
    }

    .ant-layout-sider-collapsed {
      transform: translateX(0);
    }

    .ant-card {
      margin-bottom: 16px;
    }

    .ant-btn {
      width: 100%;
      margin-bottom: 8px;
    }
  }

  /* 动画效果 */
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .fade-in {
    animation: fadeIn 0.3s ease-out;
  }

  @keyframes slideIn {
    from {
      transform: translateX(-100%);
    }
    to {
      transform: translateX(0);
    }
  }

  .slide-in {
    animation: slideIn 0.3s ease-out;
  }

  /* 打印样式 */
  @media print {
    .no-print {
      display: none !important;
    }

    .ant-card {
      box-shadow: none;
      border: 1px solid #ddd;
    }

    .ant-btn {
      display: none !important;
    }
  }

  /* 高对比度模式支持 */
  @media (prefers-contrast: high) {
    * {
      border-width: 2px !important;
    }

    .ant-card {
      border: 2px solid currentColor !important;
    }
  }

  /* 减少动画模式支持 */
  @media (prefers-reduced-motion: reduce) {
    * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }

  /* 焦点样式 */
  *:focus {
    outline: 2px solid #1890ff;
    outline-offset: 2px;
    border-radius: 4px;
  }

  /* 链接样式 */
  a {
    color: #1890ff;
    text-decoration: none;
    transition: color 0.3s ease;
  }

  a:hover {
    color: #40a9ff;
    text-decoration: underline;
  }

  /* 选择文本样式 */
  ::selection {
    background-color: #1890ff;
    color: white;
  }

  /* 代码高亮样式 */
  code {
    background: ${props => props.theme.codeBackground};
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
    font-size: 13px;
  }

  pre {
    background: ${props => props.theme.codeBackground};
    padding: 16px;
    border-radius: 8px;
    overflow-x: auto;
    border: 1px solid ${props => props.theme.codeBorder};
  }
`;
//# sourceMappingURL=global.js.map