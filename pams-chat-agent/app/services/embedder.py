from sentence_transformers import SentenceTransformer
from app.config import Config
from typing import List, Union
import requests
import logging

logger = logging.getLogger(__name__)

_model = None
_model_name = None


def _is_ollama_model(model_name: str) -> bool:
    """
    Détecte si le modèle est un modèle Ollama.
    Les modèles Ollama contiennent souvent ':' (ex: qwen3-embedding:4b)
    ou certains noms spécifiques.
    """
    ollama_indicators = [":", "qwen", "mxbai", "nomic"]
    return any(indicator in model_name.lower() for indicator in ollama_indicators)


def _get_model():
    """Obtenir le modèle SentenceTransformer (pour modèles Hugging Face uniquement)"""
    global _model, _model_name
    if _model_name is None:
        _model_name = getattr(Config, "EMBEDDING_MODEL", "qwen3-embedding:4b")
        logger.info(f"Embedding model configured: {_model_name}")
    
    # Ne charger le modèle que si ce n'est PAS un modèle Ollama
    if _model is None and not _is_ollama_model(_model_name):
        logger.info(f"Loading SentenceTransformer model: {_model_name}")
        _model = SentenceTransformer(_model_name)
    elif _is_ollama_model(_model_name) and _model is None:
        logger.info(f"Using Ollama API for model: {_model_name}")
      
    
    return _model


def _embed_with_ollama(text: str, model_name: str, retries: int = 3) -> List[float]:
    """
    Génère un embedding via l'API Ollama avec retry automatique.
    """
    url = Config.OLLAMA_BASE_URL.rstrip("/") + "/api/embeddings"
    payload = {
        "model": model_name,
        "prompt": text
    }

    for attempt in range(1, retries + 1):
        try:
            response = requests.post(url, json=payload, timeout=300)
            response.raise_for_status()
            data = response.json()
            return data["embedding"]
        except Exception as e:
            logger.error(f"Erreur lors de l'appel à l'API Ollama: {e}")
            if attempt < retries:
                import time
                wait = attempt * 5  # 5s, 10s
                logger.warning(f"  Retry {attempt}/{retries} dans {wait}s...")
                time.sleep(wait)
            else:
                raise

def enrich_text_for_embedding(text: str, metadata: dict = None) -> str:
    """
    Enrichit le texte avec des métadonnées contextuelles pour améliorer l'embedding.
    
    Args:
        text: Texte source à embedder
        metadata: Métadonnées optionnelles (doc_type, title, section, etc.)
    
    Returns:
        Texte enrichi
    """
    if not text:
        return ""
    
    enriched = text
    
    if metadata:
        if metadata.get("title"):
            enriched = f"Document: {metadata['title']}\n\n{enriched}"
        
        if metadata.get("doc_type"):
            enriched = f"Type: {metadata['doc_type']}\n{enriched}"
        
        if metadata.get("section"):
            enriched = f"Section: {metadata['section']}\n{enriched}"
    
    return enriched

def embed_text(text: str, metadata: dict = None, enrich: bool = False) -> List[float]:
    """
    Génère un embedding pour le texte donné.
    
    Args:
        text: Texte à embedder
        metadata: Métadonnées optionnelles pour enrichissement
        enrich: Si True, enrichit le texte avec les métadonnées
    
    Returns:
        Vecteur d'embedding normalisé
    """
    if enrich and metadata:
        text = enrich_text_for_embedding(text, metadata)
    
    model_name = getattr(Config, "EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
    
    # Utiliser l'API Ollama si c'est un modèle Ollama
    if _is_ollama_model(model_name):
        return _embed_with_ollama(text, model_name)
    
    # Sinon utiliser SentenceTransformer
    m = _get_model()
    vec = m.encode([text], normalize_embeddings=True)[0]
    return vec.tolist()

def embed_texts_batch(texts: List[str], batch_size: int = 32) -> List[List[float]]:
    """
    Génère des embeddings pour plusieurs textes en batch (plus efficace).
    
    Args:
        texts: Liste de textes à embedder
        batch_size: Taille du batch
    
    Returns:
        Liste de vecteurs d'embedding
    """
    if not texts:
        return []
    
    model_name = getattr(Config, "EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
    
    
    if _is_ollama_model(model_name):
        # 3 workers : bon équilibre entre parallélisme et saturation Ollama
        logger.info(f"Génération de {len(texts)} embeddings via Ollama (3 workers)...")
        from concurrent.futures import ThreadPoolExecutor, as_completed

        embeddings = [None] * len(texts)

        with ThreadPoolExecutor(max_workers=3) as executor:
            future_to_idx = {
                executor.submit(_embed_with_ollama, text, model_name): i
                for i, text in enumerate(texts)
            }

            completed = 0
            for future in as_completed(future_to_idx):
                idx = future_to_idx[future]
                try:
                    embeddings[idx] = future.result()
                    completed += 1
                    if completed % 10 == 0 or completed == len(texts):
                        logger.info(f"  Embeddings: {completed}/{len(texts)}")
                        print(f"[EMBED] {completed}/{len(texts)}")
                except Exception as e:
                    logger.error(f"Erreur embedding {idx}: {e}")
                    print(f"[EMBED] ERREUR {idx}: {e}")
                    embeddings[idx] = [0.0] * Config.EMBEDDING_DIM

        return embeddings
    
    # Sinon utiliser SentenceTransformer (supporte le batch)
    logger.info(f"Génération de {len(texts)} embeddings via SentenceTransformer...")
    m = _get_model()
    vecs = m.encode(texts, batch_size=batch_size, normalize_embeddings=True, show_progress_bar=True)
    return [v.tolist() for v in vecs]

def to_pgvector(vec) -> str:
    """
    Convert a python list[float] to pgvector text format: '[0.1,0.2,...]'
    """
    return "[" + ",".join(f"{float(x):.6f}" for x in vec) + "]"
