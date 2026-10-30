# Student360

**One app for a college student's whole day: classes, attendance, deadlines, exams, study time, money and events.**

Student360 is a free, open-source web app that tells you something most college portals don't: *what to do next*. Tap Present or Absent for today's classes and it instantly shows whether your attendance is safe, for example "You can skip 2 more classes" or "Attend the next 6 in a row to reach 75%".

Free, open source and private: everything stays on your own device.

[Dashboard]
<img width="947" height="498" alt="dashboard" src="https://github.com/user-attachments/assets/fe80a29e-3d79-4d97-8250-d5ebf7514637" />


---

## Why we built it

College life is spread across too many places. Attendance is on one portal (if it's shown at all), marks are on another, deadlines live in a WhatsApp group, and expenses live in your head. Most tools only *show* numbers. They don't help you decide anything, and they rarely warn you until it's too late.

We wanted a single app that:

- takes ten seconds a day to use,
- answers the question every student actually asks ("can I skip tomorrow?"),
- works for any college, not just one,
- and keeps your data on your own device.

## What it does

| Page | What you can do |
|---|---|
| **Today** | See today's classes and mark each one Present, Absent or Cancelled with one tap |
| **Dashboard** | Overall attendance, subjects below target, CGPA, deadlines this week, next exam and spending at a glance, plus charts |
| **Timetable** | Build your weekly class schedule (subject, day, time, room, type) |
| **Attendance** | Per-subject percentage, a clear status, and a plain message: how many classes you can skip, or how many you must attend in a row to get back to target. Full history, editable |
| **Academics** | Marks per subject and semester, SGPA and CGPA on a 10-point scale, and a planner for the SGPA you'll need next |
| **Exams** | Exam dates with a countdown, and an end-sem calculator that shows the marks you need to pass or reach a grade |
| **Assignments** | Deadlines with priority and status, and colour cues for due-soon and overdue |
| **Study** | Focus timer (Pomodoro style) with a study-hours log and weekly goal |
| **Expenses** | Log spending by category, set a monthly budget and see where the money goes |
| **Events** | Hackathons, club events and fests with registration status, team details and deadlines |
| **Insights** | A risk predictor that warns you *before* attendance or marks slip, and a what-if simulator ("what if I skip 3 more classes?") |
| **Assistant** | Ask questions in plain language and get answers from your own data |
| **Settings** | Attendance target, grading scale, exam weightages, semester names, budget, timer lengths, light/dark theme, backup and restore |
| **Updates** | An in-app roadmap of what's released and what's coming |

### How the attendance maths works

Attendance is stored as individual records (date, subject, present or absent), plus an optional "opening balance" for classes you attended before you started using the app.

With `A` classes attended, `H` classes held and a target of `T`%:

- If `A ├ù 100 ΓëÑ T ├ù H`, you're safe, and you can still skip `floor(A ├ù 100 / T) ΓêÆ H` classes.
- Otherwise you must attend the next `ceil((T ├ù H ΓêÆ 100 ├ù A) / (100 ΓêÆ T))` classes in a row.

## What makes it different

- **Open source (MIT).** Anyone can use it, change it, or build on it.
- **Configurable for any college.** Attendance target, grading scale, exam weightages and semester names are all editable in Settings, so it isn't tied to one university's rules.
- **Private by design.** There are no accounts and no servers. Everything is stored in your own browser, and nothing leaves your device.
- **Free to run.** No paid services, no API keys, and it works offline once loaded.
- **Your data stays yours.** Export everything to a JSON file and import it back whenever you like.

## Try it

You don't need to set anything up to see it working properly:

1. Open the app and go to **Settings**.
2. Click **Load demo data**. The app fills with sample subjects, attendance, marks, exams and expenses.
3. Look around: the Dashboard, the Insights page and the Attendance page show the most.
4. Click **Clear all data** to start fresh, the way a new student would.

New users always start with an empty app. The demo data only appears when you ask for it.

## Run it on your computer

You'll need [Node.js](https://nodejs.org) (version 18 or newer) and [Git](https://git-scm.com).

```bash
git clone https://github.com/sudhanshu-ps/Student360.git
cd Student360
npm install
npm run dev
```

Then open the local address shown in your terminal (usually `http://localhost:5173`).

## Built with

- [React](https://react.dev) and TypeScript
- [TanStack Router](https://tanstack.com/router) for pages
- [Tailwind CSS](https://tailwindcss.com) for styling
- [Vite](https://vite.dev) for development and builds
- [Lucide](https://lucide.dev) icons and [Sonner](https://sonner.emilkowal.ski) notifications
- Browser `localStorage` for saving data

The full list of dependencies is in `package.json`.

## Status and credits

**Where it stands (v1.0):** this is the first release. Everything in the table above works in this repository, and the roadmap below is clear about what isn't built yet.

**Credits:**
- Built by our team, with AI coding tools used to help write and refine parts of the code and design.
- All third-party libraries are listed above and are used under their own open-source licences.

## Roadmap

| Version | Status | Planned |
|---|---|---|
| **v1.0** | Released | Dashboard, Today, timetable, attendance, academics, exams and end-sem calculator, assignments, study timer, expenses, events, risk predictor, what-if simulator, assistant, backup and restore |
| **v1.1** | Upcoming | Resume builder and checklist with PDF export; shared club and society calendar |
| **v1.2** | Upcoming | Login, multi-user accounts and device sync; local AI assistant using an open-source model (Ollama) |
| **v1.3** | Upcoming | Installable app with offline mode and reminders; split expenses, savings goals and fee-due reminders |

More ideas are tracked on the in-app **Updates** page.

## Screenshots


| [Dashboard]
<img width="947" height="498" alt="dashboard" src="https://github.com/user-attachments/assets/7359c396-3240-4af5-9394-6ecd50f0ddda" />
| [Attendance]
<img width="945" height="494" alt="attendance" src="https://github.com/user-attachments/assets/f797d1c3-0280-4a9c-88e9-93934b370648" />
| [Today]
<img width="958" height="496" alt="today" src="https://github.com/user-attachments/assets/ff01d6bb-46ef-4631-9df6-a5ced1905fe1" />
 | [Insights]
 <img width="947" height="496" alt="insights" src="https://github.com/user-attachments/assets/8698eec6-4b6c-4b0e-a1bd-1848d585ea8a" />

## Team

| Name | Role | GitHub |
|---|---|---|
| Sudhanshu Pratap Singh | Team lead, development | [@sudhanshu-ps](https://github.com/sudhanshu-ps) |
| Arihant Jain | Team member |  [@Arihant0607](https://github.com/Arihant0607) |
| Sunit Majhi | Team member
| Vinayak Bhardwaj | Team member

## Contributing

Ideas and fixes are welcome. Open an issue to talk about a change, or fork the repo and send a pull request. If you add a new college's grading scale, we'd love to see it.

## Licence

Released under the [MIT Licence](LICENSE).
