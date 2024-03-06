import Footer from "../../components/Footer/Footer";
import Header from "../../components/Header/Header";
import { Outlet } from "react-router-dom";

const Root = () => {
    return (
        <div className="page-wrapper">
            <Header />
            <Outlet />
            <Footer/>
        </div>
    );
};

export default Root;
