# Account Map | Hackathon Version Polished

![3D Map View](./public/screen.png)

## Description

This web application helps users manage their different login methods to each account they have made.

## Team Members

- [Andrii Malakhovtsev](https://github.com/andrii-malakhovtsev) - <malakhovtsev.2@wright.edu>
- [Brianna Persinger](https://github.com/BBBree) - <persinger.9@wright.edu>
- [Owen Kemp](https://github.com/Striker2783) - <kemp.56@wright.edu>
- [Sulav Pradhan](https://github.com/sulav-pradhan) - <pradhan.49@wright.edu>
- [Wens Kedar Barambona](https://github.com/b-wens-kedar) - <barambona.3@wright.edu>

[About page with more members information](https://demo.accountmap.org/about)

## Awards
🏆 [Awarded](https://www.linkedin.com/posts/logankrause2_github-henrikd1215hackathon26-2-activity-7426641579467182080-mo65/) "[Riverside Research](https://github.com/riversideresearch)'s CyberSecurity Stalwarts" </br>
🏆 [Recommended](https://andrii-malakhovtsev.com/assets/accountmap-recommendation.pdf) by "Wright State University CEG/CS Alumni Society"

## History

### Planning phase
<img width="2587" height="1898" alt="image" src="https://github.com/user-attachments/assets/72a201ac-b8a4-4806-99f4-c4b0a437e915" />

### Trello Collaboration
<img width="1282" height="636" alt="image" src="https://github.com/user-attachments/assets/90e8a0f1-c675-4123-be5e-97f2b4c1997d" />


###



## How to Run

### Prerequisites

- Docker and Docker Compose Installed
- Node.js 24+ (for local development without Docker)
- Git

### Steps

1. Clone the Repository `git clone https://github.com/andrii-malakhovtsev/accountmap.git`

2. Install Docker

3. Set Working Directory `cd accountmap`

4. Docker Compose `docker compose up -d`

5. See the frontend at `http://localhost:8080`
   - Frontend: <http://localhost:8080>
   - Backend API: <http://localhost:8081>
   - PostgreSQL: <http://localhost:5432>

6. Stop all services `docker compose down`

7. Clean up volumes `docker compose down -v`

### Local Development

#### Backend Setup

```sh
cd backend
npm install
npm start
```

Required environment variables (or use defaults):

```sh
PORT=8081
DATABASE_URL=postgres://demouser:demopass@postgres:5432/demodb
GEMINI_API_KEY=key
```

#### Frontend Setup

```sh
cd frontend
npm install
npm start
```

#### Environment variable

```sh
REACT_APP_API_URL=<http://localhost:8081>
```

## Architecture

```
_______________________________________
Frontend (React)
Port: 8080
- User Interface with JSX components
- Graphs (react-force-graph)
- State Management (zustand)
_______________________________________
|
| Http Requests
v
_______________________________________
Backend API (Express.js)
- Port: 8081
- RESTful endpoints
- Prisma Setup (Database)
_______________________________________
|
| Prisma Interaction
v
_______________________________________
PostgresSQL DB
Port: 5432
- User Tables
- Relational Data
_______________________________________
```

## Project Structure

### Backend

```sh
prisma
   prisma.schema # The database schemas
   migrations # Database migrations
src
   lib
      prisma.ts # Exposes Prisma Connection
      utils.ts # Exposes Express.js
   index.ts # Setup for Express.js
   routes # Contains the endpoints
Dockerfile # Docker
package.json # Dependencies
```

### Frontend

```sh
components # Contains the components used in the UI
src
   assets # Images and such
   pages # Map or List Views
   store # State Management
   utils
      iconService.js # Icons
   App.jsx # Main UI
Dockerfile # Docker
package.json # Dependencies
```

## Images

### 3D View

![3D View](./public/screen.png)

### 2D View

![2D View](./public/2d.png)

### List Connections View

![List Connections View](<./public/list connections.png>)

### List Accounts View

![List Accounts View](<./public/list accounts.png>)
