# ExamShield Backend

This is the FastAPI backend for the "ExamShield - AI Powered Online Examination and Student Behaviour Detection System".

## Folder Structure
- `app/routes/`: API endpoint routers.
- `app/models/`: SQLAlchemy database models.
- `app/schemas/`: Pydantic models for validation.
- `app/database/`: Database connection logic.
- `app/services/`: Reusable business logic.
- `app/utils/`: Helper functions.
- `app/middleware/`: Custom HTTP middlewares.
- `app/core/`: Security and configuration files.
- `app/ai/`: Artificial Intelligence integration logic.
- `uploads/`: Folder to temporarily store uploaded files (ignored by git).

## Environment
Ensure you have a `.env` file at `backend/.env` containing:
- `DATABASE_URL`: Your PostgreSQL connection string.
- `SECRET_KEY`: Your secure JWT secret.
- `JWT_ALGORITHM`: The JWT signing algorithm (e.g. HS256).
- `ACCESS_TOKEN_EXPIRE_MINUTES`: The token validity duration.

## Database
1. Install PostgreSQL.
2. Open pgAdmin.
3. Create a database named `examshield`.
4. Run migrations (to be added) or let SQLAlchemy create the tables automatically.

## Installation
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create and activate virtual environment (Windows):
   ```bash
   python -m venv venv
   venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Running Backend
Run the backend in development mode with hot-reload:
```bash
uvicorn app.main:app --reload
```
The API is available at `http://localhost:8000`.

## Future Modules
- User Authentication (JWT)
- Role Management (Admin vs Student)
- Exams & Questions endpoints
- AI Face Recognition pipeline
- Real-time Behaviour Monitoring via WebSockets
