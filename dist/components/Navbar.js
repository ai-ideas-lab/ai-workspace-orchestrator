import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
const Navbar = ({ user, onLogout }) => {
    const navigate = useNavigate();
    const handleLogout = () => {
        onLogout();
        navigate('/');
    };
    return (<nav className="navbar">
      <div className="navbar-brand">
        🤖 AI Workspace Orchestrator
      </div>
      
      <ul className="navbar-menu">
        <li>
          <Link to="/">仪表板</Link>
        </li>
        <li>
          <Link to="/workflows">工作流</Link>
        </li>
        <li>
          <Link to="/executions">执行记录</Link>
        </li>
        <li>
          <Link to="/settings">设置</Link>
        </li>
      </ul>

      <div className="navbar-user">
        <span>👤 {user?.name}</span>
        <button className="btn btn-secondary" onClick={handleLogout}>
          退出登录
        </button>
      </div>
    </nav>);
};
export default Navbar;
//# sourceMappingURL=Navbar.js.map