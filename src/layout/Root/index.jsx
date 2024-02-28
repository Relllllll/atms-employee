import { Outlet } from "react-router-dom";

const Root = () => {
    return (
        <div className="page-wrapper">
            <Outlet />
        </div>
    );
};

export default Root;
