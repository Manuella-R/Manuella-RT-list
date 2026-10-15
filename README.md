# Just Do It.

A clean, themeable to-do list web app built with vanilla HTML, CSS, and JavaScript. Tasks are saved in your browser, so they're still there when you come back. No frameworks, no build step, no backend.

## Features

- **Add, complete, edit, and delete tasks**
  - ✔️ Check button toggles a task as completed
  - ✏️ Pencil button turns the task into an inline text field (press `Enter` to save)
  - 🗑️ Trash button deletes a task, with a confirmation prompt and a fall-away animation
- **Three color themes**: Standard, Light (pink), and Darker. Your choice is remembered between visits
- **Persistent storage** using the browser's `localStorage` (tasks and theme)
- **Daily reset prompt**: on the first visit of each new day, the app asks whether you'd like to start a fresh list
- **Live clock and date** displayed at the top of the page
- **Location display** that shows your city and country (only if you grant location permission)
- **Responsive layout** with breakpoints for tablet and mobile screens
- **GitHub corner** link in the top-left with a waving octocat animation

## Project Structure

```
Manuella-RT-list/
├── index.html        # Page markup and script/style includes
├── CSS/
│   ├── main.css      # Layout, themes, buttons, inputs, to-do items, responsive rules
│   └── corner.css    # GitHub corner octocat wave animation
├── JS/
│   ├── main.js       # To-do logic, themes, storage, geolocation, daily reset
│   └── time.js       # Live clock and date updater
└── README.md
```

## Getting Started

No installation needed.

1. Clone the repository:
   ```bash
   git clone https://github.com/Manuella-R/Manuella-RT-list.git
   cd Manuella-RT-list
   ```
2. Open `index.html` in your browser (double-click it, or serve the folder with any static server):
   ```bash
   # optional: serve locally
   python3 -m http.server 8000
   # then visit http://localhost:8000
   ```

An internet connection is needed for the Google Font, Font Awesome icons, and the reverse-geocoding API (see below).

## How to Use

| Action | How |
| --- | --- |
| Add a task | Type in the input box and press `Enter` or click the thumbs-up button |
| Mark complete / undo | Click the ✔️ check button |
| Edit a task | Click the ✏️ pencil, change the text, press `Enter` |
| Delete a task | Click 🗑️ and confirm |
| Change theme | Click one of the three colored circles at the top |
| Start a new day's list | Accept the prompt shown on the first visit of a new day |

## How It Works

- **`main.js`** builds each task as a `div.todo` containing an `<li>` and three buttons. Tasks are stored as an array of strings under the `todos` key in `localStorage`; the active theme is stored under `savedTheme`, and the last daily-reset date under `lastResetDate`.
- **Themes** are applied by setting a class on `<body>` (`standard`, `light`, `darker`) and swapping per-theme classes on inputs, buttons, and task items.
- **Location** uses the browser Geolocation API, then calls the [BigDataCloud reverse geocoding API](https://www.bigdatacloud.com/) to convert coordinates to a city and country. If permission is denied, the location line is simply left blank.
- **`time.js`** updates the time and date elements every second with `setInterval`.

## Built With

- HTML5
- CSS3 (custom themes, transitions, media queries)
- Vanilla JavaScript (ES6)
- [Font Awesome 6.5.1](https://fontawesome.com/) for icons
- [Google Fonts: Work Sans](https://fonts.google.com/specimen/Work+Sans)

## Known Limitations / Ideas for Improvement

- Edited task text is not yet saved to `localStorage`, so edits are lost on refresh (`updateLocalTodos` is stubbed out in `editCheck`).
- Tasks are stored as plain text, so deleting one of several identical tasks removes the first match.
- The edit button isn't re-styled when switching themes after tasks are already on the page.
- Possible future features: due dates, categories, drag-to-reorder, and a "clear completed" button.

## Contributing

Suggestions and pull requests are welcome. Fork the repo, create a feature branch, and open a PR.

## this is a forked project
