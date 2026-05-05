import os
import mimetypes
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import uvicorn

app = FastAPI()

# Правильные типы для Godot
mimetypes.add_type('application/wasm', '.wasm')
mimetypes.add_type('application/x-pck', '.pck')

# Заголовки безопасности (COOP/COEP) - БЕЗ НИХ НОВАЯ ИГРА НЕ ЗАПУСТИТСЯ
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
    response.headers["Cross-Origin-Embedder-Policy"] = "require-corp"
    return response

current_dir = os.path.dirname(os.path.abspath(__file__))

@app.get("/")
async def serve_game():
    return FileResponse(os.path.join(current_dir, "index.html"))

# Раздача .wasm и .pck
app.mount("/", StaticFiles(directory=current_dir), name="static")

if __name__ == "__main__":
    # Используем порт 3000, так как логи BotHost показали его
    uvicorn.run(app, host="0.0.0.0", port=3000)
