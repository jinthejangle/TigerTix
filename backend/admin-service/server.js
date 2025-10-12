import React, { useEffect, useState } from 'react';

const express = require('express');
const cors = require('cors');
const app = express();
const routes = require('./routes/adminRoutes');

app.use(cors());
app.use('/api', routes);

const PORT = 5001;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));

const createEvent = () => {
    const [name, setName] = useState('');
    const [date, setDate]= useState('');
    const [tickets, setTickets] = useState('');

    const eventSubmit = (event) => {
        event.preventDefault();
        const newEvent = {name, date, tickets};

        fetch('http://localhost:5001/api/events', {
            method: 'POST',
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(newEvent)
        })
    }
}