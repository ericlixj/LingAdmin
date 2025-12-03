FROM python:3.10

USER root

# 基础工具
RUN apt-get update && apt-get install -y wget unzip curl gnupg && rm -rf /var/lib/apt/lists/*

# 下载并解压 Chrome
RUN wget -O /tmp/chrome.zip https://storage.googleapis.com/chrome-for-testing-public/139.0.7258.68/linux64/chrome-linux64.zip && \
    unzip /tmp/chrome.zip -d /opt/chrome && \
    rm /tmp/chrome.zip && \
    ln -s /opt/chrome/chrome-linux64/chrome /usr/local/bin/google-chrome

# 安装 Chrome 依赖
RUN apt-get update 
RUN apt-get install -y --no-install-recommends \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    xdg-utils && \
    rm -rf /var/lib/apt/lists/*

ENV PYTHONUNBUFFERED=1

WORKDIR /app/

# Install uv
COPY --from=ghcr.io/astral-sh/uv:0.5.11 /uv /uvx /bin/

ENV PATH="/app/.venv/bin:$PATH"
ENV UV_COMPILE_BYTECODE=1
ENV UV_LINK_MODE=copy
ENV PYTHONPATH=/app

# Install dependencies
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --frozen --no-install-project

COPY ./scripts /app/scripts
COPY ./pyproject.toml ./uv.lock ./alembic.ini /app/
COPY ./app /app/app

# Sync the project
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync

# Install Playwright browsers and dependencies
RUN playwright install --with-deps chromium

# 启动 FastAPI (推荐用 uvicorn)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
