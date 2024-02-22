function updateTime() {
    // Get the current date and time
    const now = new Date();
    
    // Format the time as desired (24-hour format in this example)
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    // Display the time
    document.getElementById('datetime').textContent = `${hours}:${minutes}:${seconds}`;
}

// Update the time immediately and then every second (1000 milliseconds)
updateTime();
setInterval(updateTime, 1000);function updateTime() {
    const now = new Date();

    // Get elements where you want to display the time and date
    const timeElement = document.getElementById('time');
    const dateElement = document.getElementById('date');

    // Format the time and date
    const timeString = now.toLocaleTimeString();
    const dateString = now.toDateString();

    // Update the content of the elements
    timeElement.textContent =  timeString;
    dateElement.textContent =  dateString;
}

// Call updateTime initially to set the time and date immediately
updateTime();

// Call updateTime every second (1000 milliseconds) to continuously update the time
setInterval(updateTime, 1000);
