FROM node:22-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates ffmpeg python3 python3-pip \
  && python3 -m pip install --break-system-packages --no-cache-dir --upgrade yt-dlp whisperx==3.8.6 \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json server.mjs ./

ENV HOST=0.0.0.0
ENV PORT=8788
ENV RHYTHM_ENGINE=whisperx

EXPOSE 8788

CMD ["node", "server.mjs"]
