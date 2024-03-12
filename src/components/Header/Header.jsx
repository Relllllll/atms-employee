import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import logo from "/logo.webp";
import "./Header.css";

const Header = () => {
    return (
        <div className="navbar__logo-container">
            <img src={logo} className="navbar__top-logo"/>
        </div>
    );
};

export default Header;
