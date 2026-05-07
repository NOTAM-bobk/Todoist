# ✅ Neo Tasks

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)](https://vercel.com)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

A modern, feature-rich task manager with **Push Notifications**, **Reminders**, and **Notes**.  
> **Note:** This is the active version. The old URL link is deprecated — please use the [Vercel deployment](#-live-demo) below.

![Neo Tasks Screenshot](image_bd669a.png)

## ✨ Live Demo

👉 **[View the Live Application](https://neo-task.edgeone.app/)** 👈

## 🚀 Features

- 📋 **Task Management** - Create, edit, and organize your daily tasks.
- ⏰ **Reminders** - Set due dates and receive browser notifications.
- 📝 **Notes** - Keep additional information alongside your tasks.
- 🔔 **Push Notifications** - Real-time alerts (requires VAPID keys setup).
- 💾 **Persistent Storage** - Your data saves locally and syncs seamlessly.
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile.

## 🛠️ Tech Stack

| Area | Technology |
|------|-------------|
| Frontend | HTML5, CSS3, JavaScript |
| Notifications | Web Push API, VAPID keys |
| Service Worker | Native `sw.js`, `worker.js` |
| Hosting | Vercel (primary) |
| Backend APIs | Cloudflare Workers (`wrangler.toml`) |

## 🧑‍💻 Local Development

To run this project locally:

1. **Clone the repository**
   ```bash
   git clone https://github.com/NOTAM-bobk/Todoist.git
   cd Todoist
