#!/bin/bash

# Iklim-Eval Proje Kurulumu (Linux)
echo "======================================================"
echo "         IKLIM-EVAL PROJE KURULUMU STARTING..."
echo "======================================================"
echo ""

# 1. Python kontrolü
if ! command -v python3 &> /dev/null; then
    echo "[HATA] python3 bulunamadi! Lutfen Python yukleyin."
    exit 1
fi

# 2. Sanal ortam (venv) olusturma
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
if [ ! -d "$SCRIPT_DIR/venv" ]; then
    echo "[1/3] Sanal ortam olusturuluyor..."
    python3 -m venv "$SCRIPT_DIR/venv"
else
    echo "[1/3] venv zaten mevcut."
fi

# 3. Bagimliliklarin kurulumu
echo "[2/3] Bagimliliklar yukleniyor..."
"$SCRIPT_DIR/venv/bin/pip" install --upgrade pip
"$SCRIPT_DIR/venv/bin/pip" install -r "$SCRIPT_DIR/requirements.txt"

if [ $? -ne 0 ]; then
    echo "[HATA] Kutuphaneler yuklenirken bir sorun olustu!"
    exit 1
fi

# 4. .env dosyasi kontrolu
if [ ! -f "$SCRIPT_DIR/.env" ]; then
    echo "ANTHROPIC_API_KEY=sk-ant-buraya-yaziniz" > "$SCRIPT_DIR/.env"
    echo "ANTHROPIC_MODEL=claude-3-haiku-20240307" >> "$SCRIPT_DIR/.env"
    echo "[3/3] .env dosyasi olusturuldu."
else
    echo "[3/3] .env mevcut."
fi

echo ""
echo "======================================================"
echo "   KURULUM TAMAMLANDI!"
echo "======================================================"
echo ""
