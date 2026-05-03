import os
import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import Application, CommandHandler, ContextTypes

TOKEN = os.environ.get("BOT_TOKEN")

logging.basicConfig(level=logging.INFO)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "🎮 Привет! Нажми на кнопку, чтобы открыть игру:",
        reply_markup=get_game_keyboard()
    )

async def game_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "👇 Нажми на кнопку, чтобы открыть кликер:",
        reply_markup=get_game_keyboard()
    )

def get_game_keyboard():
    keyboard = [[
        InlineKeyboardButton(
            "🎮 ИГРАТЬ В КЛИКЕР 🎮",
            web_app=WebAppInfo(url="https://uruma88.github.io/rpg-clicer/")
        )
    ]]
    return InlineKeyboardMarkup(keyboard)

def main():
    app = Application.builder().token(TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("game", game_command))
    
    print("✅ Бот запущен!")
    app.run_polling()

if __name__ == "__main__":
    main()
