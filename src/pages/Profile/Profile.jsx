import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { getDatabase, ref, onValue, update, get,push } from "firebase/database";
import "./Profile.css";

const Profile = () => {
    const location = useLocation();
    const [employeeData, setEmployeeData] = useState(null);
    const [userId, setUserId] = useState(null);
    const [attendanceStatus, setAttendanceStatus] = useState(null);
    const [timeoutRecorded, setTimeoutRecorded] = useState();
    const [attendanceHistory, setAttendanceHistory] = useState([]);
    const [attendanceLogs, setAttendanceLogs] = useState([]);
    
    

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
            const attendanceLogsRef = ref(
                database,
                `employees/${userId}/attendance`
            );

            // Fetch employee data
            onValue(employeesRef, (snapshot) => {
                const employeeData = snapshot.val();
                setEmployeeData(employeeData);
            });

            // Fetch attendance logs
            onValue(attendanceLogsRef, (snapshot) => {
                const logsData = snapshot.val();
                if (logsData) {
                    const logsArray = Object.entries(logsData).map(
                        ([date, log]) => ({ date, ...log })
                    );
                    setAttendanceLogs(logsArray);
                    setStatusToday(getStatusForToday(logsArray));
                }
            });
        } catch (error) {
            console.error("Error fetching employee data: ", error);
        }
    };

    const updateAttendanceInDatabase = (userId, date, status, timeIn, timeOut) => {
        try {
            const database = getDatabase();
            const attendanceRef = ref(
                database,
                `employees/${userId}/attendance/${date}`
            );
            
            // Check if timeIn is not already set, then update it
            onValue(attendanceRef, (snapshot) => {
                const existingAttendanceData = snapshot.val();
                
                if (!existingAttendanceData) {
                    // Call function to mark absent for missing attendance record
                    handleAutomaticAbsenceMarking(userId, date);
                }
                if (!existingAttendanceData || !existingAttendanceData.timeIn) {
                    update(attendanceRef, { status, timeIn, timeOut })
                        .then(() =>
                            console.log("Attendance status and timeIn updated in the database")
                        )
                        .catch((error) =>
                            console.error("Error updating attendance in the database: ", error)
                        );
                }
                
            });
        } catch (error) {
            console.error("Error updating attendance in the database: ", error);
        }
    };
    const getSkippedDates = (startDate, endDate) => {
        const skippedDates = [];
        const currentDate = new Date(startDate);
        currentDate.setDate(currentDate.getDate() + 1);
        while (currentDate < endDate) {
            skippedDates.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1); // Increment date by 1 day
        }
        return skippedDates;
    };
    
    
    const handleAutomaticAbsenceMarking = (userId, date) => {
        console.log("Handling automatic absence marking for date:", date);
        const database = getDatabase();
        const attendanceRef = ref(database, `employees/${userId}/attendance`);
    
        get(attendanceRef)
            .then((snapshot) => {
                const attendanceData = snapshot.val();
                console.log("Fetched attendance data:", attendanceData);
    
                // Get the list of dates from attendance data
                const dates = Object.keys(attendanceData || {}).map(dateString => new Date(dateString));
                console.log("Date list:", dates);
    
                // Sort the dates in ascending order
                dates.sort((a, b) => b.getTime() - a.getTime());
    
                // Find the last attendance date
                const lastAttendanceDate = dates[dates.length - 1];
                console.log("Last attendance date:", lastAttendanceDate);
    
                // Convert dates to Date objects for comparison
                const lastAttendance = new Date(lastAttendanceDate);
                const latestAttendance = new Date(date);
                console.log("Latest attendance date:", latestAttendance);
    
                // Check if there is a gap between the last attendance and the latest attendance
                const skippedDates = getSkippedDates(lastAttendance, latestAttendance);
                console.log("Skipped dates:", skippedDates);
    
                // Mark absent for skipped dates if they don't already exist
                skippedDates.forEach((skippedDate) => {
                    // Ensure consistent date handling (convert to ISO format)
                    const formattedDate = skippedDate.toISOString().split('T')[0];
                    console.log("Checking date:", formattedDate);
                    if (!(formattedDate in attendanceData)) {
                        console.log("Marking absent for date:", formattedDate);
                        update(attendanceRef, { [formattedDate]: { status: "Absent" } })
                            .then(() => console.log("Marked absent for date:", formattedDate))
                            .catch((error) =>
                                console.error("Error updating attendance in the database: ", error)
                            );
                    } else {
                        console.log("Attendance already exists for date:", formattedDate);
                    }
                });
            })
            .catch((error) => console.error("Error fetching attendance data: ", error));
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
                        const timeInDate = timeIn ? new Date(timeIn): null ;
                        const timeOutDate = timeOut ? new Date(timeOut) : null;
    
                        const timeInOnly = timeInDate ? timeInDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }):null;
                        const timeOutOnly = timeOutDate ? timeOutDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : null;
    
                        return {
                            date: dateOnly,
                            timeIn: timeInOnly,
                            timeOut: timeOutOnly,
                            status
                        };
                    });
                    
                    setAttendanceHistory(history);
                    handleAutomaticAbsenceMarking(userId, new Date().toISOString().split('T')[0]);
                } else {
                     // Call handleAutomaticAbsenceMarking after fetching attendance data
                
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
            if (currentHour >= 5 && currentHour <= 23) {
                newAttendanceStatus = "Present";
                console.log("Present");
            } else {
                newAttendanceStatus = "Absent";
                console.log("Absent");
            }

            setAttendanceStatus(newAttendanceStatus);
        }
    };

    useEffect(() => {
        if (attendanceStatus && userId && employeeData) {
            const currentDate = new Date().toISOString().split("T")[0];
            const timeIn = new Date().toISOString();
            const timeOut = null;

            updateAttendanceInDatabase(
                userId,
                currentDate,
                attendanceStatus,
                timeIn,
                timeOut
            );
        }
    }, [attendanceStatus, userId, employeeData]);

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

    const calculateTotalStats = () => {
        let totalMilliseconds = 0;
        let totalDays = 0;
    
        attendanceLogs.forEach((log) => {
            if (log.timeIn && log.timeOut) {
                const timeIn = new Date(log.timeIn);
                const timeOut = new Date(log.timeOut);
                const millisecondsWorked = timeOut - timeIn;
                totalMilliseconds += millisecondsWorked;
    
                totalDays++;
            }
        });
    
        const totalSeconds = Math.floor(totalMilliseconds / 1000);
        const totalHours = totalSeconds / 3600;
    
        const hours = Math.floor(totalHours);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
    
        // Calculate remaining decimal part after subtracting whole hours
        const remainingDecimalHours = totalHours - hours;
        const decimalMinutes = Math.floor((remainingDecimalHours * 60) % 60);
        const decimalSeconds = Math.floor((remainingDecimalHours * 3600) % 60);
    
        const formattedTotalTime = `${hours}:${minutes}:${seconds}`;
        
    
        return {
            totalHours: totalHours.toFixed(2),
            totalDays,
            hours,
            minutes,
            seconds,
            formattedTotalTime: `${formattedTotalTime}.${decimalMinutes}${decimalSeconds}`, 

        };
    };
    
    const { formattedTotalTime, totalDays } = calculateTotalStats();
    const formattedTotalTimeWithoutDecimal = formattedTotalTime.split('.')[0];

    
    
    
    

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
                            <p className="profile__total">{totalDays} days</p>
                            <p className="profile__stats-title">Total Attendance</p>
                        </div>
                        <div className="profile__hours">
                            <p className="profile__total">{formattedTotalTimeWithoutDecimal} hrs</p>
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
                                    <p key={index}>{entry.timeIn || "-"}</p>
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
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="timeout__icon">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                    </svg>
                </button>

            </div>
        </div>
    );
};

export default Profile;