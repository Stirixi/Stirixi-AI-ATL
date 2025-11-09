# MongoDB Setup

## Where to Put Your MongoDB URL

1. **Create a `.env` file** in the `backend/` directory:
   ```bash
   cd backend
   touch .env
   ```

2. **Add your MongoDB connection string** to the `.env` file:
   ```env
   MONGODB_URL=mongodb://localhost:27017
   MONGODB_DB_NAME=stirixi_ai_atl
   ```

   For **MongoDB Atlas** (cloud), use:
   ```env
   MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
   MONGODB_DB_NAME=stirixi_ai_atl
   ```

   For **local MongoDB**, use:
   ```env
   MONGODB_URL=mongodb://localhost:27017
   MONGODB_DB_NAME=stirixi_ai_atl
   ```

3. **Other environment variables** (optional):
   ```env
   API_HOST=0.0.0.0
   API_PORT=8000
   API_RELOAD=true
   CORS_ORIGINS=http://localhost:3000,http://localhost:3001
   ENVIRONMENT=development
   SOLANA_RPC_URL=https://api.devnet.solana.com
   SOLANA_KEYPAIR_PATH=/absolute/path/to/authority-keypair.json
   SOLANA_SBT_MINT=<token2022 mint address>
   ```

## Getting Your MongoDB Atlas Connection String

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your database password
6. Paste it into your `.env` file as `MONGODB_URL`

## Example `.env` File

```env
# MongoDB Configuration
MONGODB_URL=mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=stirixi_ai_atl

# FastAPI Configuration
API_HOST=0.0.0.0
API_PORT=8000
API_RELOAD=true

# CORS (for Next.js frontend)
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Environment
ENVIRONMENT=development

# Solana Token-2022 / SBTs
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_KEYPAIR_PATH=/absolute/path/to/authority-keypair.json
SOLANA_SBT_MINT=<token2022 mint address>
```

**Important:** Never commit your `.env` file to git! It's already in `.gitignore`.
