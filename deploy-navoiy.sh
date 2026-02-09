#!/bin/bash
# 🌍 Navoiy-Terra Quick Deploy Script
# ====================================
# Быстрая загрузка проекта на GitHub

echo "🌍 NAVOIY-TERRA GITHUB DEPLOYER"
echo "==============================="
echo ""

# Проверка Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не установлен"
    echo "Установите Node.js: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js найден: $(node --version)"

# Проверка токена
if [ -z "$GITHUB_TOKEN" ]; then
    echo ""
    echo "❌ GITHUB_TOKEN не найден"
    echo ""
    echo "Создайте токен:"
    echo "1. Перейдите на https://github.com/settings/tokens"
    echo "2. Generate new token (classic)"
    echo "3. Выберите права: repo, workflow"
    echo "4. Скопируйте токен"
    echo ""
    echo "Затем экспортируйте:"
    echo "  export GITHUB_TOKEN=\"your_token_here\""
    echo ""
    exit 1
fi

echo "✅ GITHUB_TOKEN найден"
echo ""

# Установка зависимостей
echo "📦 Установка зависимостей..."
npm install --silent

if [ $? -ne 0 ]; then
    echo "❌ Ошибка при установке зависимостей"
    exit 1
fi

echo "✅ Зависимости установлены"
echo ""

# Запуск деплоймента
echo "🚀 Запуск деплоймента..."
echo ""
node navoiy-github-deployer.js

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ ДЕПЛОЙМЕНТ УСПЕШНО ЗАВЕРШЕН!"
    echo ""
    echo "📍 Проверьте:"
    echo "   https://github.com/Secret-Uzbek/Navoiy-Terra-Corpus"
    echo "   https://github.com/Secret-Uzbek/FMP-CENTRAL-REPO"
    echo ""
else
    echo ""
    echo "❌ Ошибка при деплойменте"
    echo "См. логи выше для деталей"
    exit 1
fi
