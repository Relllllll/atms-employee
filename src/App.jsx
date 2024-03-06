import { RouterProvider, createBrowserRouter } from "react-router-dom";
import Root from "./layout/Root/index.jsx";
import Loading from "./pages/Loading/Loading.jsx";
import FaceRecog from "./pages/FaceRecog/FaceRecog.jsx";
import Profile from "./pages/Profile/Profile";

const router = createBrowserRouter([
    {
        path: "/",
        element: <Loading />,
    },
    {
        element: <Root />,
        children: [
            {
                path: "/face-recog",
                element: <FaceRecog />,
            },
            {
                path: "/profile/:userId",
                element: <Profile />,
            },
        ],
    },
]);

const App = () => {
    return <RouterProvider router={router} />;
};

export default App;
