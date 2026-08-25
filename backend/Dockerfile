FROM node:20-slim

WORKDIR /app

# Copy package files and install
COPY package.json package-lock.json ./
RUN npm ci --omit dev

# Copy source
COPY src/ src/

# Copy Tectonic LaTeX compiler (Linux binary needed for Docker)
# On Windows this is .exe — for Docker we need the Linux version
# Download if not present
RUN if [ ! -f tectonic ]; then \
      apt-get update && apt-get install -y curl && \
      curl -sSL https://github.com/tectonic-typesetting/tectonic/releases/download/tectonic%400.15.0/tectonic-0.15.0-x86_64-unknown-linux-gnu.tar.gz | tar xz -C /usr/local/bin && \
      rm -rf /var/lib/apt/lists/*; \
    fi

# Create tmp directory for PDF compilation
RUN mkdir -p /tmp/tectonic

ENV PORT=4000
ENV NODE_ENV=production
ENV TECTONIC_DIR=/tmp/tectonic

EXPOSE 4000

CMD ["node", "src/index.js"]
