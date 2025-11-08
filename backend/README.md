# FastAPI Backend for Stirixi AI ATL

FastAPI backend with MongoDB for the engineering metrics dashboard.

## Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

Or using a virtual environment (recommended):

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
cp .env.example .env
```

Edit `.env`:
```
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=stirixi_ai_atl
```

For MongoDB Atlas, use:
```
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
```

### 3. Start MongoDB

Make sure MongoDB is running locally or update `MONGODB_URL` to your MongoDB Atlas connection string.

### 4. Run the Server

```bash
python run.py
```

Or using uvicorn directly:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

## API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## API Endpoints

### Engineers
- `GET /api/v1/engineers/` - Get all engineers
- `GET /api/v1/engineers/{id}` - Get engineer by ID
- `POST /api/v1/engineers/` - Create engineer
- `PUT /api/v1/engineers/{id}` - Update engineer
- `DELETE /api/v1/engineers/{id}` - Delete engineer

### Prompts
- `GET /api/v1/prompts/` - Get all prompts (optional `?engineer_id=...`)
- `GET /api/v1/prompts/{id}` - Get prompt by ID
- `POST /api/v1/prompts/` - Create prompt
- `PUT /api/v1/prompts/{id}` - Update prompt
- `DELETE /api/v1/prompts/{id}` - Delete prompt

### Prospects
- `GET /api/v1/prospects/` - Get all prospects
- `GET /api/v1/prospects/{id}` - Get prospect by ID
- `POST /api/v1/prospects/` - Create prospect
- `PUT /api/v1/prospects/{id}` - Update prospect
- `DELETE /api/v1/prospects/{id}` - Delete prospect

### Projects
- `GET /api/v1/projects/` - Get all projects
- `GET /api/v1/projects/{id}` - Get project by ID
- `POST /api/v1/projects/` - Create project
- `PUT /api/v1/projects/{id}` - Update project
- `DELETE /api/v1/projects/{id}` - Delete project

### Actions
- `GET /api/v1/actions/` - Get all actions (optional filters: `?engineer_id=...&project_id=...&event=...`)
- `GET /api/v1/actions/{id}` - Get action by ID
- `POST /api/v1/actions/` - Create action
- `PUT /api/v1/actions/{id}` - Update action
- `DELETE /api/v1/actions/{id}` - Delete action

## Database Collections

The following MongoDB collections are created automatically:

- `engineers` - Engineer data
- `prompts` - AI prompt history
- `prospects` - Prospective hire data
- `projects` - Project data
- `actions` - Engineer actions/events

Indexes are automatically created on startup for optimal query performance.

## Project Structure

```
backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── engineers.py
│   │       ├── prompts.py
│   │       ├── prospects.py
│   │       ├── projects.py
│   │       ├── actions.py
│   │       └── __init__.py
│   ├── core/
│   │   ├── config.py
│   │   └── database.py
│   ├── models/
│   │   ├── engineer.py
│   │   ├── prompt.py
│   │   ├── prospect.py
│   │   ├── project.py
│   │   ├── action.py
│   │   └── __init__.py
│   └── main.py
├── requirements.txt
├── run.py
└── .env.example
```

## Next Steps

1. Update the models in `app/models/` if you need to adjust schemas
2. Add authentication/authorization if needed
3. Add validation and business logic
4. Add error handling and logging
5. Set up database migrations if needed

