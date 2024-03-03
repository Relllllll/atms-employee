import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ClipLoader from "react-spinners/ClipLoader";
import "../Loading/Loading.css"

const Loading = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            navigate("/face-recog");
        }, 5000);

        return () => clearTimeout(timeoutId);
    }, [navigate]);
    return (
        <div className="loading">
            <img src="/logo.png" className="loading__img" />
            <ClipLoader color="#f7b137" size={50} className="clip-loader"/>
        </div>
    );
};

export default Loading;
