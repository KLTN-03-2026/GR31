# Sử dụng Python 3.11 làm base image. Phiên bản "slim-bookworm" dựa trên Debian 11 (Bullseye).
FROM python:3.11-slim-bullseye

# Đặt thư mục làm việc trong container
WORKDIR /app

# Sao chép requirements.txt vào thư mục làm việc
COPY requirements.txt .

# Bước 1: Cài đặt các phụ thuộc hệ thống cơ bản, unixODBC và các công cụ cần thiết
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential \
    unixodbc-dev \
    unixodbc \
    cmake \
    git \
    curl \
    gnupg \
    apt-transport-https \
    # Thêm libssl-dev vì msodbcsql18 thường phụ thuộc vào nó
    libssl-dev \
    # Cài đặt locales và thiết lập môi trường LANG để tránh các lỗi liên quan đến locale
    locales \
    && rm -rf /var/lib/apt/lists/*

# Thiết lập locale mặc định
ENV LANG=C.UTF-8 \
    LC_ALL=C.UTF-8

# Bước 2: Cài đặt Microsoft ODBC Driver 17 for SQL Server
RUN curl -fsSL https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > /etc/apt/trusted.gpg.d/microsoft.gpg && \
    echo "deb [arch=amd64,arm64,armhf] https://packages.microsoft.com/debian/11/prod bullseye main" > /etc/apt/sources.list.d/mssql-release.list && \
    apt-get update && \
    ACCEPT_EULA=Y apt-get install -y msodbcsql17 \
    && rm -rf /var/lib/apt/lists/*

# Bước 3: Cài đặt các thư viện Python từ requirements.txt
RUN pip install --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Sao chép toàn bộ mã nguồn của bạn vào thư mục làm việc trong container
# Đảm bảo .dockerignore được cấu hình đúng để loại trừ các file không cần thiết
COPY . /app

# Xóa file config.py nếu bạn đã chuyển cấu hình lên Azure (uncomment nếu cần)
# RUN rm -f config.py

# Mở cổng mà FastAPI của bạn sẽ lắng nghe (8000 theo Uvicorn)
EXPOSE 8000

# Lệnh mặc định để chạy ứng dụng khi container khởi động
CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000"]

# Có thể thêm USER để tăng cường bảo mật nếu cần thiết
# USER nobody:nogroup
