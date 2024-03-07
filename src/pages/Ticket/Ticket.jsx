import React, { useState } from "react";
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
        // Here you can call the function to send an email
        sendEmail(name, message);
        // Optionally, you can clear the form fields after submitting
        setName("");
        setMessage("");
    };

    return (
        <div className="ticket-container">
            <h1>Create Ticket</h1>
            <form onSubmit={handleSubmit} className="ticket-form">
                <div className="form-group">
                    <label htmlFor="name" className="label">Name:</label>
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
                    <label htmlFor="message" className="label">Message:</label>
                    <textarea
                        id="message"
                        value={message}
                        onChange={handleMessageChange}
                        required
                        className="input-field message-field"
                    ></textarea>
                </div>
                <button className="send-email-btn" type="submit">Send Email</button>
            </form>
        </div>
    );
};

export default Ticket;
