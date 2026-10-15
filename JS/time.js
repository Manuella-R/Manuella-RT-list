// Live clock and date shown under the title
(function () {
    const timeElement = document.getElementById('time');
    const dateElement = document.getElementById('date');
    if (!timeElement || !dateElement) return;

    function updateTime() {
        const now = new Date();
        timeElement.textContent = now.toLocaleTimeString();
        dateElement.textContent = now.toDateString();
    }

    updateTime();
    setInterval(updateTime, 1000);
})();
