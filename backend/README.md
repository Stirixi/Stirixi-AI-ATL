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
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_KEYPAIR_PATH=/absolute/path/to/authority-keypair.json
# or provide inline secret
# SOLANA_KEYPAIR_JSON=[1,2,3,...]
SOLANA_SBT_MINT=<token2022 mint address (optional)>
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
- `POST /api/v1/engineers/{id}/scores` - Publish a score snapshot, hash it on Solana, and store the record
- `GET /api/v1/engineers/{id}/scores?limit=10` - Paginated list of score snapshots (newest first)
- `GET /api/v1/engineers/{id}/scores/latest` - Latest on-chain-backed score entry (or `null` if none)

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
- `engineer_scores` - On-chain anchored ML score snapshots

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
│   │   ├── engineer_score.py
│   │   ├── prompt.py
│   │   ├── prospect.py
│   │   ├── project.py
│   │   ├── action.py
│   │   └── __init__.py
│   ├── services/
│   │   ├── __init__.py
│   │   └── solana_service.py
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

### Onboarding Engineers with SBTs (Demo Flow)

1. **Shared Solana config**
   ```env
   SOLANA_RPC_URL=https://api.devnet.solana.com
   SOLANA_KEYPAIR_PATH=../deploy/stirixi-authority.json
   SOLANA_SBT_MINT=2dC2AxMLWncw5qaHgwjKA9V3PdYhPjjrTwqD6LocwBzi
   ```
   - `deploy/stirixi-authority.json` is the repo authority keypair used for all Devnet writes.
   - `2dC2AxMLWncw5qaHgwjKA9V3PdYhPjjrTwqD6LocwBzi` is a Token-2022 mint (0 decimals, non-transferable) already deployed for the hackathon demo.

2. **Create a token account per engineer wallet**
   ```bash
   export SPL="$HOME/.cargo/bin/spl-token"
   ENGINEER_WALLET=FpoExampleWallet1111111111111111111111111111

   $SPL create-account \
     --program-2022 2dC2AxMLWncw5qaHgwjKA9V3PdYhPjjrTwqD6LocwBzi \
     --owner "$ENGINEER_WALLET"
   ```
   - The command returns a token account address (e.g., `G6o...SBTacct`). Store it with the engineer record so the frontend can show “SBT minted” status.

3. **Mint the first SBT + on-chain score**
   ```bash
   ENGINEER_TOKEN_ACCOUNT=G6oExampleTokenAcct222222222222222222

   $SPL mint \
     2dC2AxMLWncw5qaHgwjKA9V3PdYhPjjrTwqD6LocwBzi \
     1 "$ENGINEER_TOKEN_ACCOUNT" \
     --program-2022
   ```
   Then publish a score snapshot so the backend stores the Solana signature:
   ```bash
   curl -X POST http://localhost:8000/api/v1/engineers/<id>/scores \
     -H "Content-Type: application/json" \
     -d '{"overall_score":92,"period":"2025-Q1"}'
   ```
   The response includes `solana_signature`, `score_hash`, and `sbt_mint`, which the frontend can render in the engineer’s profile.

4. **Show existing SBTs from previous companies**
   ```bash
   CANDIDATE_WALLET=9pXExampleCandidate3333333333333333333333
   $SPL accounts --owner "$CANDIDATE_WALLET" --program-2022
   ```
   - Ask candidates for wallets that already hold SBTs; list them and surface the balances in the UI to prove prior employment.

5. **Frontend checklist for the demo**
   - Call `GET /api/v1/engineers/<id>/scores/latest` to confirm each engineer’s mint status.
   - Treat “no token account found for mint 2dC2Ax…” as “Needs Mint.” Run steps 2–3 before the live demo so every engineer has at least one on-chain proof.
   - Optionally link out to Solana Explorer with the stored `solana_signature` so judges can verify the mint on Devnet.
