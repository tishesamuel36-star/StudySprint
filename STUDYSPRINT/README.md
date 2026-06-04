# StudySprint

StudySprint is a frontend-only productivity app built with HTML, CSS, and JavaScript. It includes a task manager, Pomodoro timer, daily goals, and productivity statistics, all saved in browser localStorage.

## Features

- Add, edit, delete, and complete tasks
- Filter tasks by All, Active, and Completed
- Pomodoro timer with focus/break sessions, start/pause/reset controls
- Daily study goals with completion tracking
- Productivity statistics for tasks and session progress
- Automatic persistence in localStorage
- Responsive modern dashboard design

## Tech

- HTML5
- CSS3 (Grid/Flexbox)
- Vanilla JavaScript
- localStorage

## Setup

1. Open `index.html` in your browser.
2. Use the UI to add tasks, goals, and run the Pomodoro timer.

## Deployment

This is a static app. Deploy simply by hosting the `StudySprint` folder on any static hosting provider.

### Vercel deployment

1. Create a new Vercel project.
2. Point the project to the repository or import the `StudySprint` folder.
3. No build step is required.
4. Vercel will serve `index.html` automatically.

## Notes

- Data is stored locally in the browser and restored on reload.
- The browser may ask for notification permission to alert when a session ends.
