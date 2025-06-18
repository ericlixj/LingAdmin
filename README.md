
# LingAdmin
![image](https://github.com/user-attachments/assets/c1d155d0-3f3d-44da-9393-d910246cfd1e)


*Flexible · Efficient · Open-source universal admin panel*

LingAdmin is a modern universal admin panel built on **FastAPI fullstack template** and **Refine (React)**. It is high-performance, flexible, easy to extend, and helps developers quickly build admin systems.

---

## ✨ Features

- ⚡ High-performance backend powered by FastAPI
- 🎨 Modern frontend using Refine + React (supports Ant Design, Material UI, etc.)
- 🔐 Built-in RBAC system (user, role, permission management)
- 🔑 JWT authentication (secure login & token management)
- 💾 SQLModel + Alembic (supports MySQL / SQLite)
- 🛠️ Clear and modular code structure, easy to customize
- 🌱 Lightweight, easy to maintain, suitable for personal and SMB projects

---

## 🌈 Tech Stack

| Backend | Frontend | Database | Others |
|----------|----------|----------|--------|
| FastAPI | Refine + React | PostgreSQL | SQLModel / Alembic / JWT / Axios |

---

## 🏁 Quick Start

\`\`\`bash
# Clone the repo
git clone https://github.com/ericlixj/lingadmin.git
cd lingadmin

# Start Docker containers, it will start all containers, do build things. after that, it will stop the backend and frontend service just for development.
./develop_docker.sh

# Start backend
cd backend
./start.sh

# Start frontend
cd ../frontend
npm install
npm run dev
\`\`\`

---

## 🛠 Modules

- [x] User management
- [x] Role management
- [x] Permission management (role-permission binding)
- [x] Login / logout
- [x] General CRUD pages
- [ ] Operation logs (coming soon)
- [ ] Dashboard / data visualization (planned)
- [ ] Plugin system (planned)

---

## 📌 Project Structure

\`\`\`
lingadmin/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── crud/
│   │   ├── models/
│   │   ├── schemas/
│   │   └── main.py
├── frontend/
│   └── (React + Refine app)
└── README.md
\`\`\`

---

## 📦 Deployment

- Local development: `uvicorn` + `npm` / `yarn`
- Planned: Docker / docker-compose deployment

---

## ❤️ License

MIT License — free to use, star ⭐ the repo, and contributions welcome!

---

## 🤝 Contribution Guide

1. Fork this repository
2. Create a new branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'feat: describe your change'`
4. Push the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📮 Contact

- GitHub: [your-username](https://github.com/your-username)
- Email: yourname@example.com

---

## 🔥 Badges

[![MIT License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![FastAPI](https://img.shields.io/badge/backend-FastAPI-blue)](https://fastapi.tiangolo.com/)
[![Refine](https://img.shields.io/badge/frontend-Refine-ff69b4)](https://refine.dev/)

---

## 💡 Logo Ideas

A minimal "灵" character outline, a gear + lightning bolt symbol, or a clean tech-style icon.
