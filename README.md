# Just Do It. ✅

A clean, themeable to-do list web app built with vanilla HTML, CSS, and JavaScript. Your tasks are saved in your browser, so they're still there when you come back. No frameworks, no build step, no backend, which also means it runs happily on **GitHub Pages**.

## Features

**Tasks**
- Add, complete, edit, and delete tasks
- **Categories**: tag a task (Work, Personal, Study, Home, Health, or anything you type) and filter the list with one click
- **Due dates**: tasks show "Due today", "Due tomorrow", or "Overdue since Oct 13" (overdue tasks are highlighted)
- **Drag to reorder**: grab the handle on the left (works with mouse and touch), or focus it and use the ↑ / ↓ arrow keys
- **Sort by due date** in one click
- **Clear completed** removes everything you've ticked off
- Edits to the text, category, and due date are all saved (`Enter` saves, `Esc` cancels)

**Saving your list**
- **Download** your list as a text file (`.txt`), a spreadsheet (`.csv`), or a backup (`.json`)
- **Restore from backup** by loading a `.json` file you downloaded earlier (it's added to your current list)

**Everything else**
- Three color themes: Standard, Light (pink), and Darker. Your choice is remembered
- Live clock and date, plus an optional city/country display (only if you grant location permission)
- Daily check-in: on the first visit of a new day, the app offers to clear your completed tasks (unfinished ones stay)
- Responsive layout for desktop, tablet, and phone
- Keyboard accessible, with labels for screen readers and support for "reduce motion" settings

## Project Structure

```
Manuella-RT-list/
├── index.html        # Page markup
├── assets/
│   └── favicon.png   # Browser tab icon
├── CSS/
│   ├── main.css      # Layout, themes (CSS variables), toolbar, tasks, responsive rules
│   └── corner.css    # GitHub corner octocat wave animation
├── JS/
│   ├── main.js       # Task logic, storage, themes, drag & drop, download/restore
│   └── time.js       # Live clock and date
└── README.md
```

## Deploying to GitHub Pages

The app is fully static, so GitHub Pages can host it as-is:

1. Push these files to your repository's `main` branch (keep the folder names exactly as above; GitHub Pages is case-sensitive, so `CSS/` and `JS/` must stay uppercase).
2. In the repository, go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**, choose **main** and the **/ (root)** folder, then **Save**.
4. After a minute or so, your site will be live at `https://<your-username>.github.io/Manuella-RT-list/`.

All file paths in the project are relative, so it works both at that address and when opened locally.

## Running Locally

No installation needed. Clone the repo and open `index.html` in your browser:

```bash
git clone https://github.com/Manuella-R/Manuella-RT-list.git
cd Manuella-RT-list
# optional: serve it locally instead of opening the file directly
python3 -m http.server 8000   # then visit http://localhost:8000
```

An internet connection is needed for the Google Font, Font Awesome icons, and the optional location lookup.

## How to Use

| Action | How |
| --- | --- |
| Add a task | Type it in, optionally add a category and due date, then press `Enter` or click 👍 |
| Mark complete / undo | Click ✔️ |
| Edit | Click ✏️, change the fields, press `Enter` (or the save button) |
| Delete | Click 🗑️ and confirm |
| Reorder | Drag the ⋮⋮ handle, or focus it and press ↑ / ↓ |
| Filter by category | Click a category chip above the list |
| Download your list | **Save list** → choose `.txt`, `.csv`, or `.json` |
| Restore a backup | **Save list** → **Restore from backup…** → pick your `.json` file |
| Change theme | Click one of the three colored circles at the top |

## About Your Data (Important on GitHub Pages)

Tasks are stored in your browser's `localStorage`. That means:

- **Data stays on your device.** There's no server and no account; nothing you type is sent anywhere.
- **It's per browser and per device.** Tasks on your laptop won't appear on your phone. Use **Save list → backup (.json)** and **Restore from backup** to move a list between devices.
- **Clearing your browser's site data deletes your tasks.** Download a backup now and then if your list matters to you.
- **Private/incognito windows** may not keep data after you close them. If the browser blocks storage, the app will tell you.
- GitHub Pages serves all of a user's project sites from `<username>.github.io`, so they share one `localStorage`. This app prefixes its keys with `justdoit:` to avoid clashing with your other projects.

If you used the earlier version of this app, your existing tasks and theme are picked up automatically the first time you open this version.

**Location privacy:** if you allow location access, your coordinates are sent to the [BigDataCloud](https://www.bigdatacloud.com/) reverse-geocoding API to look up your city. If you'd rather not use this, deny the browser prompt (the app works fine without it) or remove the `showLocation()` call at the bottom of `JS/main.js`.

## How It Works

- Each task is an object with a unique id: `{ id, text, done, category, due }`. The whole list is saved as JSON under the `justdoit:todos` key, and re-saved after every change. Unique ids mean deleting, editing, and reordering always act on exactly the task you clicked, even when two tasks have identical text.
- Themes are set by one class on `<body>` (`standard`, `light`, `darker`). Each theme only defines CSS variables, and every element reads from them, so any new element is themed automatically.
- Drag-and-drop uses Pointer Events (so it works with mouse, touch, and pen). When a category filter is active, reordering only moves the visible tasks and keeps the hidden ones in their places.
- Imported files are validated and cleaned before use, task text is always inserted as plain text (never HTML), and CSV exports neutralize cells that start with `=`, `+`, `-`, or `@` so spreadsheet apps can't run them as formulas.

## Built With

- HTML5
- CSS3 (custom properties for theming, transitions, media queries)
- Vanilla JavaScript (ES6+)
- [Font Awesome 6.5.1](https://fontawesome.com/) for icons
- [Google Fonts: Work Sans](https://fonts.google.com/specimen/Work+Sans)

## Ideas for the Future

- Recurring tasks (daily / weekly)
- Search box
- Reminders / notifications for tasks due today
- Optional sync across devices

## Contributing

Suggestions and pull requests are welcome. Fork the repo, create a feature branch, and open a PR.

## Author

Created by [Manuella-R](https://github.com/Manuella-R).
