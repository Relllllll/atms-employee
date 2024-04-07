import React, { useState } from "react";
import { sendTicketMessage } from "../../firebase";
import "./Ticket.css"; // Import your CSS file for styling

const Ticket = () => {
    const [name, setName] = useState("");
    const [message, setMessage] = useState("");

    const handleNameChange = (e) => {
        setName(e.target.value);
    };

    const handleMessageChange = (e) => {
        setMessage(e.target.value);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const date = new Date().toLocaleDateString();
        const time = new Date().toLocaleTimeString();
        // Here you can call the function to send a ticket message
        console.log("Sending Message:", name, message, date, time);
        sendTicketMessage(name, message, date, time);
        // Optionally, you can clear the form fields after submitting
        setName("");
        setMessage("");
    };

    return (
        <div className="ticket-container">
            <h1>Create Report</h1>
            <form onSubmit={handleSubmit} className="ticket-form">
                <div className="form-group">
                    <label htmlFor="name" className="label">
                        Id Number:
                    </label>
                    <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={handleNameChange}
                        required
                        className="input-field"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="message" className="label">
                        Message:
                    </label>
                    <textarea
                        id="message"
                        value={message}
                        onChange={handleMessageChange}
                        required
                        className="input-field message-field"
                    ></textarea>
                </div>
                <button className="send-email-btn" type="submit">
                    Send Report
                </button>
            </form>
        </div>
    );
};

export default Ticket;
