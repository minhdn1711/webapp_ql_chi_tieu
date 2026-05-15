#!/bin/bash

# Script cập nhật dự án trên VPS - webapp_chi_tieu

echo ">>> 1. Đang cập nhật mã nguồn từ GitHub..."
git pull origin main

# Đảm bảo mạng webdongho_webdongho-network tồn tại
if ! docker network ls | grep -q "webdongho_webdongho-network"; then
    echo ">>> Đang tạo mạng Docker: webdongho_webdongho-network..."
    docker network create webdongho_webdongho-network
fi

# Đảm bảo file .env tồn tại
if [ ! -f .env ]; then
    echo ">>> Đang tạo file .env từ .env.example..."
    cp .env.example .env
    sed -i 's/NODE_ENV=development/NODE_ENV=production/g' .env
fi

echo ">>> 2. Đảm bảo thư mục dữ liệu tồn tại..."
mkdir -p data

echo ">>> 3. Đang dừng các container cũ để đảm bảo sạch sẽ..."
docker-compose -f docker-compose.prod.yml down

echo ">>> 4. Đang build và khởi động lại các container..."
docker-compose -f docker-compose.prod.yml up -d --build

echo ">>> 5. Đang dọn dẹp các image và rác Docker cũ..."
docker image prune -f

echo ">>> 6. Khởi động lại Proxy để nhận diện container mới..."
docker restart webdongho-proxy

echo ">>> 7. Kiểm tra trạng thái các dịch vụ..."
docker ps | grep couple-expense

echo ">>> CẬP NHẬT HOÀN TẤT!"
