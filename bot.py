import os
import logging
import asyncio
import uvicorn
from fastapi import FastAPI, BaseModel
from pydantic import BaseModel
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import Application, CommandHandler, ContextTypes

# --- НАСТРОЙКИ ---
TOKEN = os.environ.get("BOT_TOKEN")
# Сюда будут сохраняться игроки (пока бот запущен)
players_db = {}

# --- СЕРВЕРНАЯ ЧАСТЬ (FASTAPI) ---
api = FastAPI()

class PlayerData(BaseModel):
    name: str
    pow: int
    rank: int
    hp: int
    str_val: int
    img: str

@api.post("/update_player")
async def update_player(data: PlayerData):
    players_db[data.name] = data.dict()
    return {"status": "ok"}

@api.get("/get_shadows")
async def get_shadows():
    return list(players_db.values())

# --- ЛОГИКА ТЕЛЕГРАМ БОТА ---
logging.basicConfig(level=logging.INFO)

def get_game_keyboard():
    keyboard = [[
        InlineKeyboardButton(
            "🎮 ИГРАТЬ В КЛИКЕР 🎮", 
            web_app=WebAppInfo(url="https://uruma88.github.io/rpg-clicer/")
        )
    ]]
    return InlineKeyboardMarkup(keyboard)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "👾 Привет! Нажми на кнопку, чтобы открыть игру:",
        reply_markup=get_game_keyboard()
    )

async def game_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "👇 Нажми на кнопку, чтобы открыть кликер:",
        reply_markup=get_game_keyboard()
    )

# --- ЗАПУСК ВСЕГО ВМЕСТЕ ---
async def run_bot():
    app = Application.builder().token(TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("game", game_command))
    
    async with app:
        await app.initialize()
        await app.start()
        print("✅ Бот запущен!")
        await app.updater.start_polling()
        # Держим бота запущенным
        while True:
            await asyncio.sleep(1)

async def run_api():
    # Запускаем сервер на порту 8080 (стандарт BotHost)
    config = uvicorn.Config(api, host="0.0.0.0", port=8080, log_level="info")
    server = uvicorn.Server(config)
    print("🚀 API Сервер запущен на порту 8080")
    await server.serve()

async def main():
    # Запускаем обе задачи параллельно
    await asyncio.gather(run_api(), run_bot())

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
