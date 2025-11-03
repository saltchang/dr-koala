<div align="center">
  <img src="./frontend/assets/dr-koala.svg" alt="The Logo of Dr. Koala" width="128" height="128"/>

  <h1>Dr. Koala</h1>

  <p>An AI-powered web application for answering users' questions by searching the web.</p>

  <p>Demo app: <a href="https://dr-koala.saltchang.com" target="_blank">https://dr-koala.saltchang.com</a></p>
</div>

## Table of Contents

- [Table of Contents](#table-of-contents)
- [Project Structure](#project-structure)
- [AI Agents Collaboration](#ai-agents-collaboration)
- [Preview](#preview)
- [Getting Started](#getting-started)
  - [Setup Environment Variables](#setup-environment-variables)
    - [Backend Environment Variables](#backend-environment-variables)
    - [Frontend Environment Variables](#frontend-environment-variables)
  - [Quick Start with Docker Compose](#quick-start-with-docker-compose)
  - [Database Setup](#database-setup)
  - [Start the Server](#start-the-server)
    - [Running Both Backend and Frontend](#running-both-backend-and-frontend)
    - [Running Backend Only](#running-backend-only)
    - [Running Frontend Only](#running-frontend-only)
    - [With VSCode Debugger](#with-vscode-debugger)
  - [Start the Frontend](#start-the-frontend)
    - [Manual Setup](#manual-setup)
    - [Using Make Command](#using-make-command)
  - [Running Tests](#running-tests)
    - [With uv in Command Line](#with-uv-in-command-line)
    - [With Docker](#with-docker)
  - [API Documentation](#api-documentation)
- [VSCode/Cursor Settings](#vscodecursor-settings)
- [License](#license)

## Project Structure

Dr. Koala is built with Next.js as the frontend and FastAPI as the backend. Both follow the principles of [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html). This project is using [python-clean-arch](https://github.com/saltchang/python-clean-arch) as the template.

Based on the concept of clean architecture, the backend application contains the following major layers:

- Core layer (`/core`): The entities layer, which contains the core business rules and logic
- Service layer (`/service`): The use cases layer, which contains the application of business rules and logic
- Repository layer (`/repository`): The infrastructure layer, which contains the data access logic
- API layer (`/api`): The presentation layer, which contains the HTTP API endpoints

The frontend application contains the following major folders:

- Components folder (`/components`): The UI components folder, which contains the reusable UI components
- Modules folder (`/modules`): The module components folder, which contains the business logic for each page
- Hooks folder (`/hooks`): The hooks folder, which contains the custom hooks for the application, including the API integration logic
- Routes(pages) folder (`/pages`): The route components folder (in Next.js, it is the pages directory), which defines the routes for the application

## AI Agents Collaboration

Dr. Koala uses [AutoGen](https://github.com/microsoft/autogen) as the multi-agent framework. The prompt templates for the agents are defined in the `app/core/constant/agent_configs.toml` file.

There are 3 main agents in Dr. Koala:

- **Primary Agent**: For understanding the user's intentions, questions, and requirements by analyzing the user's input then planning the search, generation, and review tasks. Adjust the processing plan if needed.
- **Search Agent**: For searching the web with the Brave Search MCP tool.
- **Generation Agent**: For generating the final answer based on the searched results in the markdown format.

## Preview

![Preview](./docs/preview.png)

## Getting Started

### Setup Environment Variables

#### Backend Environment Variables

Create a new `.env` file by running the following command:

```bash
cp .env.example .env
```

Required environment variables:

- `DATABASE_URL`: PostgreSQL connection string
- `XAI_API_KEY`: Your xAI API key for Grok
- `BRAVE_SEARCH_API_KEY`: Your Brave Search API key for web searching

#### Frontend Environment Variables

Setup the frontend environment variables:

```bash
cd frontend
cp .env.example .env
```

Optional environment variables:

- `NEXT_PUBLIC_API_URL`: Backend API URL (default to `http://localhost:7086`, no need to change when running locally)

### Quick Start with Docker Compose

You can quickly start the server with docker compose:

```bash
# Development
docker compose up -d

# Production
docker compose -f docker-compose.prod.yml up -d
```

### Database Setup

In this example, we use PostgreSQL as the database. If you have it installed locally, you can set the `DATABASE_URL` in the `.env` file to connect to your local database:

```bash
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/dr_koala
```

Or you can use docker compose file we provided to quickly setup one:

```bash
docker compose -f docker-compose.db.yml up -d
```

You can change the `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` in the `.env` file to change the database info of docker container.

Please remember to align the `DATABASE_URL` with the `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` in the `.env` file.

After the database is running, you can initialize the database by running the following commands:

```bash
make init-db
```

### Start the Server

You can start both the backend and frontend together, or run them separately.

#### Running Both Backend and Frontend

To start both servers simultaneously:

```bash
make run
```

This will start:

- Backend API server at [http://localhost:7086](http://localhost:7086)
- Frontend application at [http://localhost:3076](http://localhost:3076)

Press `Ctrl+C` to stop both servers.

#### Running Backend Only

[uv](https://docs.astral.sh/uv/) is used to manage the dependencies and virtual environment, make sure you have it installed before you start.

1. Install dependencies

    ```bash
    uv sync
    ```

2. Run the backend server

    ```bash
    make run-backend
    ```

The backend API will be available at [http://localhost:7086](http://localhost:7086).

#### Running Frontend Only

Make sure you have installed the frontend dependencies first (see [Start the Frontend](#start-the-frontend) section).

```bash
make run-frontend
```

The frontend will be available at [http://localhost:3076](http://localhost:3076).

#### With VSCode Debugger

VSCode is recommended for development, before you start, make sure you have installed the [Python](https://marketplace.visualstudio.com/items?itemName=ms-python.python) and [Python Debugger](https://marketplace.visualstudio.com/items?itemName=ms-python.debugpy) extensions.

1. First, you need to install the dependencies (see [Running Backend Only](#running-backend-only))

2. Then, select the correct python interpreter in VSCode by press `cmd + shift + p` and search `Python: Select Interpreter`. The python interpreter should be the one you installed in the first step, usually you can find the uv-managed virtual environment in the list.

3. Then, you need to set up the debugger configuration for VSCode:

    ```bash
    cp .vscode/launch.example.json .vscode/launch.json
    ```

4. Choose the "FastAPI" configuration from the VSCode and run it.

### Start the Frontend

The frontend application is built with Next.js and requires Node.js to run.

#### Manual Setup

1. Navigate to the frontend directory

    ```bash
    cd frontend
    ```

2. Setup frontend environment variables

    ```bash
    cp .env.example .env
    ```

    You can customize the API URL in `.env`:
    - `NEXT_PUBLIC_API_URL`: Backend API URL (default: `http://localhost:7086`)

3. Install dependencies

    ```bash
    pnpm i
    ```

4. Run the development server

    ```bash
    pnpm dev
    ```

The frontend application should be available at [http://localhost:3076](http://localhost:3076).

#### Using Make Command

After installing dependencies, you can also use the make command from the project root:

```bash
make run-frontend
```

### Running Tests

#### With uv in Command Line

Make sure you have installed the dependencies with [uv](https://docs.astral.sh/uv/):

```bash
uv sync
```

Then, you can run the unit tests by the following command:

```bash
make run-unit-tests
```

#### With Docker

You can also run the unit tests with docker:

```bash
docker build -f Dockerfile.dev -t app-test --build-arg RUN_MODE=test . && docker run app-test
```

### API Documentation

Once the server is running, visit the Swagger UI at [http://localhost:7086/docs](http://localhost:7086/docs)

## VSCode/Cursor Settings

For VSCode/Cursor, run the following command to setup the editor config:

```bash
cp .vscode/settings.example.json .vscode/settings.json
```

## License

[MIT](./LICENSE)
