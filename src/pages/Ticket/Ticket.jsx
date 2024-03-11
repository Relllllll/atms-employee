import React, { useState } from "react";
import { sendTicketMessage } from "../../firebase";
import "./Ticket.css"; // Import your CSS file for styling

const Ticket = () => {
    const [name, setName] = useState("");
    const [message, setMessage] = useState("");

    const handleNameChange = (e) => {
        const sanitizedValue = e.target.value.replace(/[^0-9-]/g, '');
    // Update the state with the sanitized value
    setName(sanitizedValue);
    };

    const handleMessageChange = (e) => {
        setMessage(e.target.value);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const date = new Date().toLocaleDateString();
        // Here you can call the function to send a ticket message
        console.log("Sending Message:", name, message, date);
        sendTicketMessage(name, message, date);
        // Optionally, you can clear the form fields after submitting
        setName("");
        setMessage("");
    };

    return (
        <div className="ticket-container">
            <h1>Create Ticket</h1>
            <form onSubmit={handleSubmit} className="ticket-form">
                <div className="form-group">
                    <label htmlFor="name" className="label">Id Number:</label>
                    <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={handleNameChange}
                        required
                        className="input-field"
                        pattern="[0-9-]*"
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
                <button className="send-email-btn" type="submit">Send Message</button>
            </form>
        </div>
    );
};

export default Ticket;
