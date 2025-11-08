# Models Explanation

## Simplified Models

All models have been simplified to use **one class per model** instead of separate Create/Update classes.

### Why We Had Create/Update Classes Before

Previously, we had:
- `Engineer`, `EngineerCreate`, `EngineerUpdate`
- `Prompt`, `PromptCreate`, `PromptUpdate`
- etc.

**Reason:** This pattern separates concerns:
- `Create` models: Only required fields for creation (no `id`)
- `Update` models: All fields optional (partial updates)
- Main models: Full model with all fields

### Why We Simplified

Now we use **one model** for everything:
- For **creating**: Send the model without `id` (MongoDB generates it)
- For **updating**: Use `exclude_unset=True` to only update provided fields

**Benefits:**
- Less code duplication
- Simpler to maintain
- Same functionality

## The `class Config` Explained

The `class Config` inside each model is **Pydantic configuration**:

```python
class Config:
    populate_by_name = True          # Allows using both field name and alias (e.g., 'id' or '_id')
    arbitrary_types_allowed = True   # Allows custom types like PyObjectId
    json_encoders = {ObjectId: str}   # How to serialize ObjectId to JSON string
```

**What it does:**
- `populate_by_name`: When MongoDB returns `_id`, Pydantic can map it to our `id` field
- `arbitrary_types_allowed`: Lets us use custom types like `PyObjectId` (our ObjectId wrapper)
- `json_encoders`: Tells Pydantic how to convert ObjectId to a string when returning JSON

**You need this** for MongoDB ObjectIds to work properly with FastAPI JSON responses.

## Removed Fields

- ✅ Removed `created_at` from all models
- ✅ Removed `updated_at` from all models

These are no longer stored in the database.

## MongoDB URL Location

Put your MongoDB connection string in:
```
backend/.env
```

See `backend/SETUP.md` for detailed instructions.

Example:
```env
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=stirixi_ai_atl
```

