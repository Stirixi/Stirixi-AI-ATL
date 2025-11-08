# MongoDB Collection Files

These files are ready for import into MongoDB. They have been processed to:
- ✅ Remove `_id` fields (MongoDB will generate them)
- ✅ Remove foreign key ObjectId references (will be added later)
- ✅ Keep only fields that match the schemas
- ✅ Format data correctly for MongoDB import

## Files

- `engineers.json` - 15 engineers
- `prompts.json` - 495 prompts (with empty `engineer` placeholder)
- `prospects.json` - 5 prospects
- `projects.json` - 4 projects
- `actions.json` - 68 actions (with empty `engineer` placeholder)

## Important Notes

### Foreign Key Placeholders

Some fields have empty string placeholders that need to be filled after import:

- **Prompts**: `engineer` field is set to `""` (empty string)
- **Actions**: `engineer` field is set to `""` (empty string)

These will need to be updated with actual ObjectIds after importing. You can use the linking script or update manually.

### Fields Removed

- `_id` - MongoDB will generate this
- `prompt_history` - Array of ObjectIds (will be added later)
- `recent_actions` - Array of ObjectIds (will be added later)
- `engineers` - Array of ObjectIds in projects (will be added later)
- `prospects` - Array of ObjectIds in projects (will be added later)
- `purpose` - Not in Prompt schema
- `tags` - Not in Project schema
- `summary` - Not in Prospect schema
- `performance` - Not in Prospect schema (if it exists)

## How to Import

### Option 1: MongoDB Compass

1. Open MongoDB Compass
2. Connect to your database
3. Select your database (`stirixi_ai_atl`)
4. For each collection:
   - Click "Add Data" → "Import File"
   - Select the corresponding JSON file
   - Choose "JSON" format
   - Click "Import"

### Option 2: MongoDB Atlas Web Interface

1. Go to your MongoDB Atlas cluster
2. Click "Browse Collections"
3. Select your database
4. For each collection:
   - Click "Insert Document"
   - Paste the JSON array content
   - Click "Insert"

### Option 3: Command Line (mongoimport)

```bash
# Import engineers
mongoimport --uri="your_connection_string" --db=stirixi_ai_atl --collection=engineers --file=engineers.json --jsonArray

# Import prospects
mongoimport --uri="your_connection_string" --db=stirixi_ai_atl --collection=prospects --file=prospects.json --jsonArray

# Import projects
mongoimport --uri="your_connection_string" --db=stirixi_ai_atl --collection=projects --file=projects.json --jsonArray

# Import prompts (after engineers are imported)
mongoimport --uri="your_connection_string" --db=stirixi_ai_atl --collection=prompts --file=prompts.json --jsonArray

# Import actions (after engineers are imported)
mongoimport --uri="your_connection_string" --db=stirixi_ai_atl --collection=actions --file=actions.json --jsonArray
```

## After Import

After importing, you'll need to update the foreign key references:

1. **Update prompts and actions** with engineer ObjectIds
2. **Update projects** with engineer and prospect ObjectIds
3. **Update engineers** with prompt_history and recent_actions arrays

You can do this manually via MongoDB Compass, or create a script to automate it.

