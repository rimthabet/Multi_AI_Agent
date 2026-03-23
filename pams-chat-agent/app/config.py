import os
from dotenv import load_dotenv

load_dotenv()

def env_int(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, str(default)))
    except ValueError:
        return default

class Config:
    # RAG DB
    RAG_DB_HOST = os.getenv("RAG_DB_HOST", "localhost")
    RAG_DB_PORT = env_int("RAG_DB_PORT", 5432)
    RAG_DB_NAME = os.getenv("RAG_DB_NAME", "ragdb")
    RAG_DB_USER = os.getenv("RAG_DB_USER", "postgres")
    RAG_DB_PASSWORD = os.getenv("RAG_DB_PASSWORD", "postgres")

    # DATA DB 
    DATA_DB_HOST = os.getenv("DATA_DB_HOST", "localhost")
    DATA_DB_PORT = env_int("DATA_DB_PORT", 5432)
    DATA_DB_NAME = os.getenv("DATA_DB_NAME", "maxula")
    DATA_DB_USER = os.getenv("DATA_DB_USER", "postgres")
    DATA_DB_PASSWORD = os.getenv("DATA_DB_PASSWORD", "postgres")

    
    EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "qwen3-embedding:4b")
    EMBEDDING_DIM = env_int("EMBEDDING_DIM", 2560)


    LLM_PROVIDER = os.getenv("LLM_PROVIDER", "ollama")
    OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434") 
    LLM_MODEL = os.getenv("LLM_MODEL","qwen2.5:7b")
    LLM_TIMEOUT_S = int(os.getenv("LLM_TIMEOUT_S", "360"))


    SQL_MAX_LIMIT = env_int("SQL_MAX_LIMIT", 200)
    SQL_TIMEOUT_MS = env_int("SQL_TIMEOUT_MS", 15000)
    
    DOC_TOP_K = env_int("DOC_TOP_K", 8)
    SCHEMA_TOP_K = env_int("SCHEMA_TOP_K", 50)
    SCHEMA_MAX_TABLES = env_int("SCHEMA_MAX_TABLES", 8)
    LLM_MAX_TOKENS = 500
    DOC_MIN_SCORE = env_int("DOC_MIN_SCORE", 0.38)

    MAX_ROWS_DISPLAY = int(os.getenv("MAX_ROWS_DISPLAY", "50"))
    MAX_CHARS_PER_CHUNK = int(os.getenv("MAX_CHARS_PER_CHUNK", "3000"))
    CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "200"))
   
    TESSERACT_CMD = os.getenv("TESSERACT_CMD", "")

    # Java OCR API (ocr-data-manager)
    JAVA_OCR_API_URL = os.getenv("JAVA_OCR_API_URL", "http://localhost:8083/api/extract-simple")
    JAVA_OCR_TIMEOUT = env_int("JAVA_OCR_TIMEOUT", 120)
