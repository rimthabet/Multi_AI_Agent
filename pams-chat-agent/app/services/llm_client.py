import requests

from app.config import Config


def llm_generate(prompt: str, system: str | None = None, max_tokens: int | None = None) -> str:
    url = Config.OLLAMA_BASE_URL.rstrip("/") + "/v1/chat/completions"

    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    payload = {
        "model": Config.LLM_MODEL,
        "messages": messages,
        "temperature": 0.1,
        "stream": False,
    }
    if max_tokens is not None:
        payload["max_tokens"] = max_tokens
    elif hasattr(Config, "LLM_MAX_TOKENS") and Config.LLM_MAX_TOKENS:
        payload["max_tokens"] = Config.LLM_MAX_TOKENS

    r = requests.post(url, json=payload, timeout=Config.LLM_TIMEOUT_S)
    r.raise_for_status()
    data = r.json()
    return (data["choices"][0]["message"]["content"] or "").strip()