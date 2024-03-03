import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { getDatabase, ref, onValue, set } from "firebase/database";

const Profile = () => {
    const location = useLocation();
    const [employeeData, setEmployeeData] = useState(null);
    const [attendanceStatus, setAttendanceStatus] = useState(null);

    useEffect(() => {
        const recognizedUserId = location.pathname.split("/profile/")[1];

        if (recognizedUserId) {
            fetchEmployeeData(recognizedUserId);
        }
    }, [location.pathname]);

    const fetchEmployeeData = (userId) => {
        try {
            const database = getDatabase();
            const employeesRef = ref(database, `employees/${userId}`);

            onValue(employeesRef, (snapshot) => {
                const employeeData = snapshot.val();
                setEmployeeData(employeeData);
            });
        } catch (error) {
            console.error("Error fetching employee data: ", error);
        }
    };

    return (
        <div>
            <h1>Profile</h1>
            {employeeData && (
                <div>
                    <p>
                        Name:{" "}
                        {`${employeeData.firstName} ${
                            employeeData.middleName || ""
                        } ${employeeData.lastName}`}
                    </p>
                    <p>Age: {employeeData.age}</p>
                    <p>Contact Number: {employeeData.contactNum}</p>
                    <p>Address: {employeeData.address}</p>
                    {/* Additional fields can be displayed as needed */}
                    <img src={employeeData.image} alt="Employee" />
                </div>
            )}
        </div>
    );
};

export default Profile;
