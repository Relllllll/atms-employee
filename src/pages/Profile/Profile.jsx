import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { getDatabase, ref, onValue, set, update } from "firebase/database";

const Profile = () => {
    const location = useLocation();
    const [employeeData, setEmployeeData] = useState(null);
    const [userId, setUserId] = useState(null);
    const [attendanceStatus, setAttendanceStatus] = useState(null);
    const [timeoutRecorded, setTimeoutRecorded] = useState();

    useEffect(() => {
        const recognizedUserId = location.pathname.split("/profile/")[1];

        if (recognizedUserId) {
            setUserId(recognizedUserId);
            fetchEmployeeData(recognizedUserId);
        }
    }, [location.pathname]);

    useEffect(() => {
        // Check attendance when employee data is fetched
        if (employeeData) {
            checkAttendanceStatus(employeeData);
        }
    }, [employeeData]);

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

    const updateAttendanceInDatabase = (userId, date, status, timeIn) => {
        const database = getDatabase();
        const attendanceRef = ref(
            database,
            `employees/${userId}/attendance/${date}`
        );

        // Fetch the existing attendance data to check if timeIn is already set
        onValue(attendanceRef, (snapshot) => {
            const existingAttendanceData = snapshot.val();

            // If timeIn is not already set, update it
            if (!existingAttendanceData || !existingAttendanceData.timeIn) {
                update(attendanceRef, { status, timeIn })
                    .then(() =>
                        console.log(
                            "Attendance status and timeIn updated in the database"
                        )
                    )
                    .catch((error) =>
                        console.error(
                            "Error updating attendance in the database: ",
                            error
                        )
                    );
            } else {
                console.log("TimeIn is already set, skipping update.");
            }
        });
    };

    const handleTimeoutRecord = (timeOut) => {
        // Update the timeoutRecorded status in the state
        setTimeoutRecorded(true);
        console.log("Timeout recorded:", timeOut);

        // Update the timeout in the database
        if (userId) {
            const currentDate = new Date().toISOString().split("T")[0];
            const database = getDatabase();
            const attendanceRef = ref(
                database,
                `employees/${userId}/attendance/${currentDate}`
            );

            update(attendanceRef, { timeOut })
                .then(() => console.log("Timeout updated in the database"))
                .catch((error) =>
                    console.error(
                        "Error updating timeout in the database: ",
                        error
                    )
                );
        }
    };

    const checkAttendanceStatus = (employeeData) => {
        console.log("Checking attendance status...");

        if (employeeData) {
            const currentDate = new Date().toISOString().split("T")[0];
            const currentHour = new Date().getHours();

            // Check if the current hour is within work hours (8 AM to 5 PM)
            if (currentHour >= 8 && currentHour <= 17) {
                setAttendanceStatus("Present");
                console.log("Present");

                const timeIn = new Date().toISOString();
                const timeOut = null;

                updateAttendanceInDatabase(
                    userId,
                    currentDate,
                    attendanceStatus,
                    timeIn,
                    timeOut
                );
            } else {
                setAttendanceStatus("Absent");
                console.log("Absent");
                updateAttendanceInDatabase(
                    userId,
                    currentDate,
                    attendanceStatus,
                    null,
                    null
                );
            }
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
                    <button
                        onClick={() =>
                            handleTimeoutRecord(new Date().toISOString())
                        }
                        disabled={timeoutRecorded}
                    >
                        Record Timeout
                    </button>
                </div>
            )}
        </div>
    );
};

export default Profile;
