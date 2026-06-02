# syntax=docker/dockerfile:1.7 # Użycie składni, która umożliwia korzystanie z funkcji takich jak cache dla npm

# Etap 1: budowanie zależności
# Kopiujemy tylko package.json i package-lock.json, aby wykorzystać cache Dockera dla warstwy z zależnościami
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
# Używamy cache dla katalogu npm, aby przyspieszyć instalację zależności przy kolejnych budowaniach, jeśli package.json i package-lock.json się nie zmienią
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev

# Etap 2: budowanie finalnego obrazu runtime 
FROM node:20-alpine AS runtime

# Metadane OCI autora
LABEL org.opencontainers.image.authors="Michał Siłuch"

# Ustawienie katalogu roboczego i użytkownika, pod którym będzie działać aplikacja
WORKDIR /app

# Łatanie systemu operacyjnego i usuwanie podatnego NPM
RUN apk update && apk upgrade --available && \
    rm -rf /usr/local/lib/node_modules/npm \
           /usr/local/bin/npm \
           /usr/local/bin/npx \
           /usr/local/bin/npm-cli.js

# Kopiowanie zależności i plików aplikacji, ustawiajac właściciela na użytkownika node
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node index.js .
COPY --chown=node:node package.json .

USER node

EXPOSE 3000

# Healthcheck bez dodatkowych narzędzi, stąd odpowiedź HTTP wprost z Node.js
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD node -e "require('http').get('http://127.0.0.1:3000/',res=>process.exit(res.statusCode===200?0:1)).on('error',()=>process.exit(1))"

# Domyślne uruchomienie kontenera
CMD ["node", "index.js"]