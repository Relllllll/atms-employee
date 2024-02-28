import { RouterProvider, createBrowserRouter } from "react-router-dom";
import Root from "./layout/Root/index.jsx";
import Loading from "./pages/Loading/Loading.jsx";
import FaceRecog from "./pages/FaceRecog/FaceRecog.jsx";
import Profile from "./pages/Profile/Profile";
import { FirebaseProvider } from "./config/FirebaseProvider.jsx";

const router = createBrowserRouter([
    {
        path: "/",
        element: <Root />,
        children: [
            {
                path: "/",
                element: <Loading />,
            },
            {
                path: "/face-recog",
                element: <FaceRecog />,
            },
            {
                path: "/profile",
                element: <Profile />,
            },
        ],
    },
]);

const App = () => {
    return (
        <FirebaseProvider> {/* Wrap your entire application with FirebaseProvider */}
            <RouterProvider router={router} />
        </FirebaseProvider>
    )
};

export default App;
