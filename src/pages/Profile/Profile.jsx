import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { useLocation } from "react-router-dom";
import {
    getDatabase,
    ref,
    onValue,
    update,
    get,
    push,
} from "firebase/database";
import "./Profile.css";

const Profile = () => {
    const location = useLocation();
    const [employeeData, setEmployeeData] = useState(null);
    const [userId, setUserId] = useState(null);
    const [attendanceStatus, setAttendanceStatus] = useState(null);
    const [timeoutRecorded, setTimeoutRecorded] = useState();
    const [attendanceHistory, setAttendanceHistory] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [attendanceLogs, setAttendanceLogs] = useState([]);
    const expectedWorkHours = 8;

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

    // Calculate total pages
    const totalPages = Math.ceil(attendanceHistory.length / itemsPerPage);

    // Calculate index of the last item on the current page
    const indexOfLastItem = currentPage * itemsPerPage;

    // Calculate index of the first item on the current page
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;

    // Slice the attendance history array to display only items for the current page
    const currentItems = attendanceHistory
        .slice()
        .reverse()
        .slice(indexOfFirstItem, indexOfLastItem);

    // Function to handle page change
    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

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
                }
            });
        } catch (error) {
            console.error("Error fetching employee data: ", error);
        }
    };

    const updateAttendanceInDatabase = (
        userId,
        date,
        status,
        timeIn,
        timeOut
    ) => {
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

                // Get the list of dates from attendance data
                const dates = Object.keys(attendanceData || {}).map(
                    (dateString) => new Date(dateString)
                );

                // Sort the dates in ascending order
                dates.sort((a, b) => b.getTime() - a.getTime());

                // Find the last attendance date
                const lastAttendanceDate = dates[dates.length - 1];

                // Convert dates to Date objects for comparison
                const lastAttendance = new Date(lastAttendanceDate);
                const latestAttendance = new Date(date);

                // Check if there is a gap between the last attendance and the latest attendance
                const skippedDates = getSkippedDates(
                    lastAttendance,
                    latestAttendance
                );

                // Mark absent for skipped dates if they don't already exist
                skippedDates.forEach((skippedDate) => {
                    // Ensure consistent date handling (convert to ISO format)
                    const formattedDate = skippedDate
                        .toISOString()
                        .split("T")[0];

                    if (!(formattedDate in attendanceData)) {
                        update(attendanceRef, {
                            [formattedDate]: { status: "Absent" },
                        })
                            .then(() =>
                                console.log(
                                    "Marked absent for date:",
                                    formattedDate
                                )
                            )
                            .catch((error) =>
                                console.error(
                                    "Error updating attendance in the database: ",
                                    error
                                )
                            );
                    } else {
                        console.log();
                    }
                });
            })
            .catch((error) =>
                console.error("Error fetching attendance data: ", error)
            );
    };

    const fetchAttendanceHistory = (userId) => {
        try {
            const database = getDatabase();
            const attendanceRef = ref(
                database,
                `employees/${userId}/attendance`
            );

            onValue(attendanceRef, (snapshot) => {
                const attendanceData = snapshot.val();
                // Log the fetched attendance history
                if (attendanceData) {
                    const history = Object.entries(attendanceData).map(
                        ([date, data]) => {
                            const { status, timeIn, timeOut } = data;
                            const dateOnly = new Date(
                                date
                            ).toLocaleDateString();
                            const timeInDate = timeIn ? new Date(timeIn) : null;
                            const timeOutDate = timeOut
                                ? new Date(timeOut)
                                : null;

                            const timeInOnly = timeInDate
                                ? timeInDate.toLocaleTimeString("en-US", {
                                      hour: "numeric",
                                      minute: "2-digit",
                                      hour12: true,
                                  })
                                : null;
                            const timeOutOnly = timeOutDate
                                ? timeOutDate.toLocaleTimeString("en-US", {
                                      hour: "numeric",
                                      minute: "2-digit",
                                      hour12: true,
                                  })
                                : null;

                            return {
                                date: dateOnly,
                                timeIn: timeInOnly,
                                timeOut: timeOutOnly,
                                status,
                            };
                        }
                    );

                    setAttendanceHistory(history);
                    handleAutomaticAbsenceMarking(
                        userId,
                        new Date().toISOString().split("T")[0]
                    );
                } else {
                    // Call handleAutomaticAbsenceMarking after fetching attendance data

                    setAttendanceHistory([]);
                }
            });
        } catch (error) {
            console.error("Error fetching attendance history: ", error);
        }
    };

    const totalAbsences = attendanceHistory.filter(
        (entry) => entry.status === "Absent"
    ).length;

    const checkAttendanceStatus = (employeeData) => {
        console.log("Checking attendance status...");

        if (employeeData) {
            const currentDate = new Date().toISOString().split("T")[0];
            const currentHour = new Date().getHours();
            let newAttendanceStatus;

            // Check if the current hour is within work hours (8 AM to 5 PM)
            if (currentHour >= 1 && currentHour <= 23) {
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

        // Get current date
        const currentDate = new Date().toISOString().split("T")[0];

        // Fetch attendance data for the current date
        if (userId) {
            const database = getDatabase();
            const attendanceRef = ref(
                database,
                `employees/${userId}/attendance/${currentDate}`
            );

            get(attendanceRef)
                .then((snapshot) => {
                    const attendanceData = snapshot.val();
                    if (attendanceData && attendanceData.timeIn) {
                        const timeIn = attendanceData.timeIn;
                        console.log("TimeIn for the day:", timeIn);

                        // Update the timeout in the database
                        const attendanceRef = ref(
                            database,
                            `employees/${userId}/attendance/${currentDate}`
                        );

                        update(attendanceRef, { timeOut })
                            .then(() =>
                                console.log("Timeout updated in the database")
                            )
                            .catch((error) =>
                                console.error(
                                    "Error updating timeout in the database: ",
                                    error
                                )
                            );
                    } else {
                        console.log("No timeIn record found for the day.");
                    }
                })
                .catch((error) =>
                    console.error("Error fetching attendance data: ", error)
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

    const totalAttendance = attendanceHistory.filter(
        (entry) => entry.status === "Present"
    ).length;

    const { formattedTotalTime, totalDays } = calculateTotalStats();
    const formattedTotalTimeWithoutDecimal = formattedTotalTime.split(".")[0];

    const handleDownloadPersonalLog = () => {
        // Create a new jsPDF instance
        const doc = new jsPDF();
        // Set the font size (adjust as needed)
        doc.setFontSize(12); // You might need to adjust this based on content length

        // Add user's profile information to the PDF
        if (employeeData) {
            doc.text(
                `Employee Name: ${employeeData.firstName} ${
                    employeeData.middleName || ""
                } ${employeeData.lastName}`,
                10,
                10
            );

            // Add a line break
            doc.text("", 10, 20);
        }

        // Add attendance logs to the PDF
        if (attendanceHistory.length > 0) {
            // Define table header
            const header = ["Date", "Time In", "Time Out", "Status"];

            // Generate table data
            const tableData = attendanceHistory.map((log) => [
                log.date,
                log.timeIn || "-",
                log.timeOut || "-",
                log.status,
            ]);

            // Add table to the PDF
            doc.autoTable({
                head: [header],
                body: tableData,
                theme: "grid",
                styles: { fontSize: 12 },
                startY: 30, // Start the table below the profile information
            });
        }

        // Trigger the download of the PDF
        doc.save(
            `${employeeData.firstName} ${employeeData.middleName || ""} ${
                employeeData.lastName
            }_attendance_logs.pdf`
        );
    };

    return (
        <div className="content">
            <div className="main">
                <h1 className="navbar__top-title">
                    Welcome,{" "}
                    <span className="employee__highlight-name">
                        {employeeData && employeeData.firstName}
                    </span>
                </h1>
                <div className="profile__main">
                    {employeeData && (
                        <div className="profile__main-body">
                            <div className="employee__profile">
                                <img
                                    src={employeeData.image}
                                    alt="Employee"
                                    className="employee__profile-img"
                                />
                            </div>
                            <div className="profile__content">
                                <p className="profile__name-txt">
                                    {`${employeeData.firstName} ${
                                        employeeData.middleName || ""
                                    } ${employeeData.lastName}`}
                                </p>
                                <p className="profile__status-txt">
                                    Status Today
                                </p>
                                <p className="profile__status-bar">
                                    <span className="dot">&#8226;</span> Present
                                </p>
                            </div>
                        </div>
                    )}
                    <div className="profile__stats">
                        <div className="profile__attendance">
                            <p className="profile__total">
                                {totalAttendance} days
                            </p>
                            <p className="profile__stats-title">
                                Total Attendance
                            </p>
                        </div>
                        <div className="profile__hours">
                            <p className="profile__total">
                                {formattedTotalTimeWithoutDecimal} hrs
                            </p>
                            <p className="profile__stats-title">Total Hours</p>
                        </div>
                        <div className="profile__attendance">
                            <p className="profile__total">
                                {totalAbsences} absents
                            </p>
                            <p className="profile__stats-title">
                                Total Absence
                            </p>
                        </div>
                    </div>

                    <div className="profile__history">
                        <hr />
                        <p className="profile__history-title">
                            Recent Attendance History
                        </p>

                        <hr />
                        <div className="profile__sections">
                            <p>Date</p>
                            <p>Time In</p>
                            <p>Time Out</p>
                            <p>Status</p>
                        </div>
                        <>
                            {currentItems.map((entry, index) => (
                                <div className="profile__result-history">
                                    <div className="profile__history-column">
                                        <p>{entry.date}</p>
                                    </div>
                                    <div className="profile__history-column">
                                        <p>{entry.timeIn || "-"}</p>
                                    </div>
                                    <div className="profile__history-column">
                                        <p>{entry.timeOut || "-"}</p>
                                    </div>
                                    <div className="profile__history-column">
                                        <p>{entry.status}</p>
                                    </div>
                                </div>
                            ))}
                        </>
                        <div className="pagination-container">
                            {/* Render pagination buttons */}
                            {Array.from({ length: totalPages }, (_, i) => (
                                <button
                                    key={i}
                                    onClick={() => handlePageChange(i + 1)}
                                    className={
                                        i + 1 === currentPage
                                            ? "pagination-btn pagination-active"
                                            : "pagination-btn"
                                    }
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <hr />
                {/* Additional fields can be displayed as needed */}
                <div className="profile-button-container">
                    <button
                        className="download__btn"
                        onClick={handleDownloadPersonalLog}
                    >
                        Download PDF
                    </button>
                    <button
                        className="timeout__btn"
                        onClick={() =>
                            handleTimeoutRecord(new Date().toISOString())
                        }
                        disabled={timeoutRecorded}
                    >
                        Timeout
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                            stroke="currentColor"
                            className="timeout__icon"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
                            />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Profile;
