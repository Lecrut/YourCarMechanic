# auth/Dockerfile
FROM node:20

# Ustaw katalog roboczy
WORKDIR /app

# Skopiuj package.json i pliki lock
COPY package*.json ./

# Zainstaluj zależności
RUN npm install && npm list

# Skopiuj resztę plików
COPY . .

# Otwórz port
EXPOSE 3000

# Uruchom aplikację
CMD ["node", "index.js"]
