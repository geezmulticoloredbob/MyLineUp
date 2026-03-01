🏟 MyLineup (Working Name)

A personalised sports dashboard that allows users to follow their favourite teams and players across multiple leagues in one unified interface.

📌 Overview

MyLineup is a full-stack MERN web application that allows users to:

Select favourite teams and/or players

View upcoming fixtures

See match results

Track ladders / league tables

Access player and team statistics

Watch video highlights

Get everything in one central dashboard

Initial supported leagues:

NBA

English Premier League (EPL)

AFL

🚀 Tech Stack

Frontend

React

React Router

Axios

Tailwind or Material UI (TBD)

Backend

Node.js

Express.js

Database

MongoDB (Mongoose ODM)

Authentication

JWT (planned)

APIs (To Be Decided)

NBA API

Football (EPL) API

AFL API

YouTube or highlights provider

🧠 Core Features (MVP)
1️⃣ User Accounts

Register / Login

Secure authentication (JWT)

Store favourite teams & players

2️⃣ Personal Dashboard

Aggregated feed of:

Upcoming matches

Recent results

Team standings

Player stats

Highlights

3️⃣ League Pages

Each league has:

Fixtures

Ladder / Table

Team list

Player list

4️⃣ Team Pages

Team info

Current roster

Fixtures

Recent results

Season stats

5️⃣ Player Pages

Profile

Season stats

Recent performances

Related highlights

🗄 Database Design (High-Level)
User

username

email

password (hashed)

favouriteTeams[]

favouritePlayers[]

Team

name

league

externalApiId

Player

name

team

league

externalApiId

(Stats likely pulled live via API rather than stored initially)

🔄 Data Flow

User logs in

User selects favourites

Backend fetches data from external sports APIs

Backend aggregates and formats data

Frontend renders dashboard

📅 Project Roadmap
Phase 1 – Foundation

Repo setup

MERN boilerplate

Auth system

Basic routing

Phase 2 – League Integration

Integrate NBA API

Integrate EPL API

Integrate AFL API

Phase 3 – Personalisation

Save favourites

Build dashboard logic

Phase 4 – Polish

UI refinement

Error handling

Performance optimisation

Phase 5 – Mobile Version

React Native app using same backend

🧩 Future Features

Push notifications

Live match tracking

Fantasy integration

Dark/light theme toggle

Social sharing

AI-powered insights

🛠 Local Development Setup (Placeholder)
git clone <repo>
cd mylineup
npm install
npm run dev

(Will update once backend/frontend folders are structured.)

🎯 Vision

To create a single, personalised sports hub that eliminates the need to use multiple apps to track favourite teams and players.