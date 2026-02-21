import { NavLink } from "react-router-dom";
import "./Navigation.css";

function Navigation() {
  return (
    <nav className="navigation">
      <NavLink
        to="/"
        className={({ isActive }) =>
          isActive ? "nav-link active" : "nav-link"
        }
      >
        ホーム
      </NavLink>
      <NavLink
        to="/medications"
        className={({ isActive }) =>
          isActive ? "nav-link active" : "nav-link"
        }
      >
        処方箋管理
      </NavLink>
      <NavLink
        to="/calendar"
        className={({ isActive }) =>
          isActive ? "nav-link active" : "nav-link"
        }
      >
        カレンダー
      </NavLink>
    </nav>
  );
}

export default Navigation;
