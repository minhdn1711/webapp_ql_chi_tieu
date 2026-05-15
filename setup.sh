#!/bin/bash

# Script thiết lập tự động dự án webapp_chi_tieu - Hỗ trợ VPS & Local

# Kiểm tra tham số môi trường
IS_PROD=false
COMPOSE_FILE="docker-compose.yml"

for arg in "$@"; do
    if [ "$arg" == "--prod" ]; then
        IS_PROD=true
        COMPOSE_FILE="docker-compose.prod.yml"
    fi
done

echo ">>> Bắt đầu thiết lập hệ thống (Môi trường: $([ "$IS_PROD" = true ] && echo "Production" || echo "Local"))..."

# 0. Kiểm tra và cài đặt Docker (Dành cho Ubuntu/Debian)
if ! [ -x "$(command -v docker)" ]; then
    echo ">>> Docker chưa được cài đặt. Đang tiến hành cài đặt Docker..."
    sudo apt-get update
    sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io
    sudo usermod -aG docker $USER
    echo ">>> Đã cài đặt Docker. Vui lòng logout và login lại nếu gặp lỗi quyền truy cập."
fi

if ! [ -x "$(command -v docker-compose)" ]; then
    echo ">>> Docker Compose chưa được cài đặt. Đang tiến hành cài đặt..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo ">>> Đã cài đặt Docker Compose."
fi

# 1. Kiểm tra file .env
if [ ! -f .env ]; then
    echo ">>> Đang tạo file .env từ .env.example..."
    cp .env.example .env
    
    if [ "$IS_PROD" = true ]; then
        sed -i 's/NODE_ENV=development/NODE_ENV=production/g' .env
        echo ">>> Đã cấu hình .env sang môi trường Production."
    fi
fi

# 2. Đảm bảo thư mục dữ liệu tồn tại cho SQLite
if [ "$IS_PROD" = true ]; then
    echo ">>> Đang tạo thư mục data cho SQLite..."
    mkdir -p data
fi

# 3. Khởi động Docker
echo ">>> Đang khởi động các container Docker với file $COMPOSE_FILE..."
docker-compose -f $COMPOSE_FILE up -d --build

# 4. Kiểm tra sức khỏe hệ thống
echo ">>> Đang đợi các dịch vụ khởi động (5 giây)..."
sleep 5

echo -e "\n===================================================="
echo " THIẾT LẬP HOÀN TẤT!"
if [ "$IS_PROD" = true ]; then
    echo " - Môi trường: Production"
    echo " - Website: http://(IP_CUA_BAN)"
else
    echo " - Môi trường: Local"
    echo " - Website: http://localhost"
    echo " - Backend API: http://localhost:3000"
fi
echo "===================================================="
