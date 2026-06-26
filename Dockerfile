FROM node:22-bookworm-slim

RUN apt-get update && apt-get install -y \
    git \
    curl \
    procps \
    build-essential \
    python3 \
    chromium \
    sudo \
    && rm -rf /var/lib/apt/lists/*

ENV PLAYWRIGHT_BROWSERS_PATH=/usr/bin \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    CHROME_BIN=/usr/bin/chromium

RUN npm install -g @anthropic-ai/claude-code

RUN useradd -m -u 1001 -G sudo claude && \
    echo 'claude ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers && \
    mkdir -p /workspace/node_modules && \
    chown -R claude:claude /workspace

USER claude
WORKDIR /workspace
