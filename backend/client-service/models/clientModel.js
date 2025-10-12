const getEvents = () => {
    fetch('http://localhost:5000/api/events')
    .then((response) => response.json())
    .then((json) =>console.log(json))
    .catch((err) => {
        console.error(err);
        alert('Failed to load events. Please try again later.');
      })
}

//TODO: Saw a buyticket method already, so didn't know if this was necessary
const purchaseTicket = (eventName) => {
}