#!/bin/bash

# Script cập nhật dự án trên VPS - webapp_chi_tieu

echo ">>> 1. Đang cập nhật mã nguồn từ GitHub..."
git pull origin main

echo ">>> 2. Đảm bảo thư mục dữ liệu tồn tại..."
mkdir -p data

echo ">>> 3. Đang dừng các container cũ để đảm bảo sạch sẽ..."
docker-compose -f docker-compose.prod.yml down

echo ">>> 4. Đang build và khởi động lại các container..."
# Lệnh này sẽ tự động cài npm install và build React bên trong Docker
docker-compose -f docker-compose.prod.yml up -d --build

echo ">>> 5. Đang dọn dẹp các image và rác Docker cũ..."
docker image prune -f

echo ">>> 6. Kiểm tra trạng thái các dịch vụ..."
docker ps | grep couple-expense

echo ">>> CẬP NHẬT HOÀN TẤT!"
