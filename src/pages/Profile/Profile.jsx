import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { getDatabase, ref, onValue, set, update } from "firebase/database";
import "./Profile.css";

const Profile = () => {
    const location = useLocation();
    const [employeeData, setEmployeeData] = useState(null);
    const [userId, setUserId] = useState(null);
    const [attendanceStatus, setAttendanceStatus] = useState(null);
    const [timeoutRecorded, setTimeoutRecorded] = useState();
    const [attendanceHistory, setAttendanceHistory] = useState([]);

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

    useEffect(() => {
        if (userId) {
            fetchAttendanceHistory(userId);
        }
    }, [userId]);

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

    const fetchAttendanceHistory = (userId) => {
        try {
            const database = getDatabase();
            const attendanceRef = ref(database, `employees/${userId}/attendance`);
    
            onValue(attendanceRef, (snapshot) => {
                const attendanceData = snapshot.val();
                console.log("Attendance history:", attendanceData); // Log the fetched attendance history
                if (attendanceData) {
                    const history = Object.entries(attendanceData).map(([date, data]) => {
                        const { status, timeIn, timeOut } = data;
                        const dateOnly = new Date(date).toLocaleDateString();
                        const timeInOnly = new Date(timeIn).toLocaleTimeString();
                        const timeOutOnly = timeOut ? new Date(timeOut).toLocaleTimeString() : null;
                        
                        return {
                            date: dateOnly,
                            timeIn: timeInOnly,
                            timeOut: timeOutOnly,
                            status
                        };
                    });
                    setAttendanceHistory(history);
                } else {
                    setAttendanceHistory([]);
                }
            });
        } catch (error) {
            console.error("Error fetching attendance history: ", error);
        }
    };

    const checkAttendanceStatus = (employeeData) => {
        console.log("Checking attendance status...");

        if (employeeData) {
            const currentDate = new Date().toISOString().split("T")[0];
            const currentHour = new Date().getHours();
            let newAttendanceStatus;

            // Check if the current hour is within work hours (8 AM to 5 PM)
            if (currentHour >= 8 && currentHour <= 17) {
                newAttendanceStatus = "Present";
                console.log("Present");
            } else {
                newAttendanceStatus = "Absent";
                console.log("Absent");
            }

            setAttendanceStatus(newAttendanceStatus);
        }
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
    const calculateTotalHours = (history) => {
        let totalHours = 0;
      
        history.forEach(entry => {
          const timeIn = entry.timeIn;
          const timeOut = entry.timeOut ? new Date(entry.timeOut) : null;
      
          const timeInDate = new Date(timeIn);
      
          // Check if timeInDate is valid
          if (isNaN(timeInDate.getTime())) {
            console.warn("Invalid timeIn:", entry);
            return; // Skip processing this entry
          }
      
          if (timeOut) {
            const diffInMs = Math.abs(timeOut - timeInDate);
            totalHours += diffInMs / (1000 * 60 * 60);
          } else {
            totalHours += 8;
            console.warn("Entry without timeOut:", entry);
          }
        });
      
        // Use round() to ensure integer result before formatting
        console.log("Total hours:", Math.round(totalHours));
        return Math.round(totalHours);
      };


    return (
        <div className="content">
            <div className="main">
                <h1 className="navbar__top-title">Welcome, <span className="employee__highlight-name">{employeeData && employeeData.firstName}</span></h1>
                <div className="profile__main">
                    {employeeData && (
                        <div className="profile__main-body">
                            <div className="employee__profile">
                                <img src={employeeData.image} alt="Employee" className="employee__profile-img"/>
                            </div>
                            <div className="profile__content">
                                <p className="profile__name-txt">
                                    {`${employeeData.firstName} ${
                                        employeeData.middleName || ""
                                    } ${employeeData.lastName}`}
                                </p>
                                <p className="profile__status-txt">Status Today</p>
                                <p className="profile__status-bar"><span className="dot">&#8226;</span> Present</p>
                            </div>
                        </div>
                    )}
                    <div className="profile__stats">
                        <div className="profile__attendance">
                            <p className="profile__total">{attendanceHistory.length}</p>
                            <p className="profile__stats-title">Total Attendance</p>
                        </div>
                        <div className="profile__hours">
                        <p className="profile__total">{calculateTotalHours(attendanceHistory)} hrs</p>

                            <p className="profile__stats-title">Total Hours</p>
                        </div>
                    </div>
                
                    <div className="profile__history">
                        <hr/>
                        <p className="profile__history-title">Recent Attendance History</p>

                        <hr/>
                        <div className="profile__sections">
                            <p>Date</p>
                            <p>Time In</p>
                            <p>Time Out</p>
                            <p>Status</p>
                        </div>
                        <div className="profile__result-history">
                        <div className="profile__history-column">
                            {attendanceHistory.slice().reverse().map((entry, index) => (
                            <p key={index}>{entry.date}</p>
                            ))}
                        </div>
                        <div className="profile__history-column">
                            {attendanceHistory.slice().reverse().map((entry, index) => (
                            <p key={index}>{entry.timeIn}</p>
                            ))}
                        </div>
                        <div className="profile__history-column">
                            {attendanceHistory.slice().reverse().map((entry, index) => (
                            <p key={index}>{entry.timeOut || "-"}</p>
                            ))}
                        </div>
                        <div className="profile__history-column">
                            {attendanceHistory.slice().reverse().map((entry, index) => (
                            <p key={index}>{entry.status}</p>
                            ))}
                        </div>

                        </div>
                    </div>
                    
                </div>
                <hr/>
                {/* Additional fields can be displayed as needed */}
                <button className="timeout__btn"
                    onClick={() =>
                        handleTimeoutRecord(new Date().toISOString())
                    }
                    disabled={timeoutRecorded}
                >
                    Timeout
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="timeout__icon">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                    </svg>
                </button>

            </div>
        </div>
    );
};

export default Profile;
