
# 🔍 Memory Search Engine

A modern, AI-powered search engine that combines traditional search results with advanced LLM reasoning, all wrapped in a sleek, interactive frontend. This project utilizes Retrieval-Augmented Generation (RAG) concepts to provide synthesized answers alongside direct source citations.

## ✨ Features

- **AI-Powered Answers**: Generates concise summaries and answers using Google Gemini Pro.
- **Multi-Provider Search**: Orchestrates search across multiple providers (Exa, SerpAPI, etc.) for comprehensive results.
- **Smart Query Optimization**: Optional LLM-based query refinement to improve search relevance.
- **Domain Filtering**: Filter search results by specific domains (e.g., Reddit, Twitter, YouTube).
- **Interactive UI**:
  - **Plasma Background**: Dynamic, calming background animation using OGL.
  - **Dark/Light Mode**: Fully responsive theming.
  - **Real-time Feedback**: Loading states, error handling, and animated transitions.
- **Hybrid Scoring**: Ranks results based on both semantic meaning and keyword matching.

## 🛠 Tech Stack

### Backend
- **Framework**: FastAPI (Python)
- **AI/LLM**: Google Gemini (via `google-generativeai`)
- **Search Providers**: Exa.ai, SerpAPI
- **Vector Search**: `sentence-transformers`, `faiss-cpu` (for RAG capabilities)
- **Database/Cache**: Redis (via Docker)
- **Utilities**: `pydantic`, `python-dotenv`, `numpy`

### Frontend
- **Framework**: React (Vite)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Graphics**: OGL (WebGL for Plasma effect)

## 🚀 Getting Started

### Prerequisites
- **Python 3.8+**
- **Node.js 16+**
- **Docker & Docker Compose** (optional but recommended for backend/redis)
- **API Keys**:
  - Google Gemini API Key
  - Exa API Key
  - SerpAPI Key (optional)

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/memory-search-engine.git
cd memory-search-engine
```

### 2. Backend Setup
You can run the backend either directly or using Docker.

#### Option A: Docker (Recommended)
Make sure Docker is running.
Create a `.env` file in the `backend` directory with your API keys:

```env
GEMINI_API_KEY=your_gemini_key_here
EXA_API_KEY=your_exa_key_here
SERPAPI_KEY=your_serpapi_key_here
# BRAVE_API_KEY=your_brave_key_here (Optional)
```

Run the backend and Redis services:
```bash
docker-compose up --build
```
The backend server will start at `http://127.0.0.1:8000`.

#### Option B: Manual Setup
Navigate to the backend directory and set up the Python environment.

```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

Ensure you have a local Redis instance running or update the connection string if needed.
Run the backend server:
```bash
uvicorn app:app --reload
```

### 3. Frontend Setup
Open a new terminal and navigate to the frontend directory.

```bash
cd frontend
npm install
```

Run the development server:
```bash
npm run dev
```
The application will be available at `http://localhost:5173`.

## 📂 Project Structure

```
memory-search-engine/
├── backend/
│   ├── app.py              # Main FastAPI application
│   ├── orchestrator.py     # Manages search providers
│   ├── reasoner.py         # AI reasoning logic (Gemini)
│   ├── search.py           # Core search engine logic
│   ├── llm.py              # LLM utilities for query normalization
│   ├── models.py           # Pydantic data models
│   ├── vector_memory/      # Vector database storage
│   └── requirements.txt    # Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI components (Plasma, AnswerPanel)
│   │   ├── App.tsx         # Main application logic
│   │   └── main.tsx        # Entry point
│   ├── package.json        # Frontend dependencies
│   └── tailwind.config.js  # Tailwind configuration
└── docker-compose.yml      # Container orchestration (Redis + Backend)
```

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
