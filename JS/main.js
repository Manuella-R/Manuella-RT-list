// Selectors
const toDoInput = document.querySelector('.todo-input');
const toDoBtn = document.querySelector('.todo-btn');
const toDoList = document.querySelector('.todo-list');
const standardTheme = document.querySelector('.standard-theme');
const lightTheme = document.querySelector('.light-theme');
const darkerTheme = document.querySelector('.darker-theme');

// Event Listeners
toDoBtn.addEventListener('click', addToDo);
toDoList.addEventListener('click', deleteCheck); // Fixed typo in function name
toDoList.addEventListener('click', editCheck); // Added event listener for edit button
document.addEventListener("DOMContentLoaded", getTodos);
standardTheme.addEventListener('click', () => changeTheme('standard'));
lightTheme.addEventListener('click', () => changeTheme('light'));
darkerTheme.addEventListener('click', () => changeTheme('darker'));

// Check if one theme has been set previously and apply it (or std theme if not found):
let savedTheme = localStorage.getItem('savedTheme');
savedTheme === null ?
    changeTheme('standard')
    : changeTheme(localStorage.getItem('savedTheme'));

// Functions
function addToDo(event) {
    event.preventDefault();

    const toDoDiv = document.createElement("div");
    toDoDiv.classList.add('todo', `${savedTheme}-todo`);

    const newToDo = document.createElement('li');
    if (toDoInput.value === '') {
        alert("You must write something!");
    } else {
        newToDo.innerText = toDoInput.value;
        newToDo.classList.add('todo-item');
        toDoDiv.appendChild(newToDo);

        savelocal(toDoInput.value);

        const checked = document.createElement('button');
        checked.innerHTML = '<i class="fa fa-check"></i>';
        checked.classList.add('check-btn', `${savedTheme}-button`);
        toDoDiv.appendChild(checked);

        const deleted = document.createElement('button');
        deleted.innerHTML = '<i class="fa fa-trash"></i>';
        deleted.classList.add('delete-btn', `${savedTheme}-button`);
        toDoDiv.appendChild(deleted);

        const edit = document.createElement('button');
        edit.innerHTML = '<i class="fas fa-pencil"></i>'; // Fixed closing tag
        edit.classList.add('edit-btn', `${savedTheme}-button`);
        toDoDiv.appendChild(edit);

        toDoList.appendChild(toDoDiv);
        toDoInput.value = '';
    }
}

function deleteCheck(event) { // Renamed function to deleteCheck
   // console.log(event.target);
   const item = event.target;

   // delete
   if(item.classList[0] === 'delete-btn')
   {
       // item.parentElement.remove();
       // animation
       item.parentElement.classList.add("fall");

       //removing local todos;
       removeLocalTodos(item.parentElement);

       item.parentElement.addEventListener('transitionend', function(){
           item.parentElement.remove();
       })
   }

   // check
   if(item.classList[0] === 'check-btn')
   {
       item.parentElement.classList.toggle("completed");
   }
}

function editCheck(event) {
    const item = event.target;

    // Check if the clicked element is an edit button
    if (item.classList.contains('edit-btn')) {
        const todoItem = item.parentElement;
        const todoText = todoItem.querySelector('.todo-item'); // Corrected selector

        // Create an input field and set its value to the current text content
        const inputField = document.createElement('input');
        inputField.setAttribute('type', 'text');
        inputField.classList.add('edit-input');
        inputField.value = todoText.textContent;

        // Replace the text with the input field
        todoItem.replaceChild(inputField, todoText); // Corrected order

        // Focus on the input field
        inputField.focus();

        // Event listener to handle editing
        inputField.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                // Save the edited text content
                todoText.textContent = inputField.value;
                // Remove the input field and restore the text element
                todoItem.replaceChild(todoText, inputField);
                // Perform any necessary actions (e.g., save changes to local storage)
                // updateLocalTodos(todoItem);
            }
        });
    }
}

function savelocal(todo) {
    let todos;
    if (localStorage.getItem('todos') === null) {
        todos = [];
    } else {
        todos = JSON.parse(localStorage.getItem('todos'));
    }

    todos.push(todo);
    localStorage.setItem('todos', JSON.stringify(todos));
}

function getTodos() {
    let todos;
    if (localStorage.getItem('todos') === null) {
        todos = [];
    } else {
        todos = JSON.parse(localStorage.getItem('todos'));
    }

    todos.forEach(function (todo) {
        const toDoDiv = document.createElement("div");
        toDoDiv.classList.add("todo", `${savedTheme}-todo`);

        const newToDo = document.createElement('li');

        newToDo.innerText = todo;
        newToDo.classList.add('todo-item');
        toDoDiv.appendChild(newToDo);

        const checked = document.createElement('button');
        checked.innerHTML = '<i class="fa fa-check"></i>';
        checked.classList.add("check-btn", `${savedTheme}-button`);
        toDoDiv.appendChild(checked);

        const deleted = document.createElement('button');
        deleted.innerHTML = '<i class="fa fa-trash"></i>';
        deleted.classList.add("delete-btn", `${savedTheme}-button`);
        toDoDiv.appendChild(deleted);

        const edit = document.createElement('button');
        edit.innerHTML = '<i class="fas fa-pencil"></i>';
        edit.classList.add("edit-btn", `${savedTheme}-button`);
        toDoDiv.appendChild(edit);

        toDoList.appendChild(toDoDiv);
    });
}

function removeLocalTodos(todo) {
    let todos;
    if (localStorage.getItem('todos') === null) {
        todos = [];
    } else {
        todos = JSON.parse(localStorage.getItem('todos'));
    }

    const todoIndex = todos.indexOf(todo.children[0].innerText);
    todos.splice(todoIndex, 1);
    localStorage.setItem('todos', JSON.stringify(todos));
}

function changeTheme(color) {
    localStorage.setItem('savedTheme', color);
    savedTheme = localStorage.getItem('savedTheme');

    document.body.className = color;

    color === 'darker' ?
        document.getElementById('title').classList.add('darker-title')
        : document.getElementById('title').classList.remove('darker-title');

    document.querySelector('input').className = `${color}-input`;

    document.querySelectorAll('.todo').forEach(todo => {
        Array.from(todo.classList).some(item => item === 'completed') ?
            todo.className = `todo ${color}-todo completed`
            : todo.className = `todo ${color}-todo`;
    });

    document.querySelectorAll('button').forEach(button => {
        Array.from(button.classList).some(item => {
            if (item === 'check-btn') {
                button.className = `check-btn ${color}-button`;
            } else if (item === 'delete-btn') {
                button.className = `delete-btn ${color}-button`;
            } else if (item === 'todo-btn') {
                button.className = `todo-btn ${color}-button`;
            }
        });
    });
}

function showPosition(position) {
    var latitude = position.coords.latitude;
    var longitude = position.coords.longitude;

    fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`)
        .then(response => response.json())
        .then(data => {
            var city = data.city;
            var country = data.countryName;

            document.getElementById("location").innerHTML = `City: ${city}  Country: ${country}`;
        })
        .catch(error => {
            console.error('Error fetching location data:', error);
            document.getElementById("location").innerHTML = "Error fetching location data";
        });
}

function showError(error) {
    switch (error.code) {
        case error.PERMISSION_DENIED:
            document.getElementById("location").innerHTML = "User denied the request for Geolocation.";
            break;
        case error.POSITION_UNAVAILABLE:
            document.getElementById("location").innerHTML = "Location information is unavailable.";
            break;
        case error.TIMEOUT:
            document.getElementById("location").innerHTML = "The request to get user location timed out.";
            break;
        case error.UNKNOWN_ERROR:
            document.getElementById("location").innerHTML = "An unknown error occurred.";
            break;
    }
}

if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(showPosition, showError);
} else {
    document.getElementById("location").innerHTML = "Geolocation is not supported by this browser.";
}