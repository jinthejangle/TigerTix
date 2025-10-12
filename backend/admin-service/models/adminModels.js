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