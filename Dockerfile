# Folosește o imagine oficială Node.js
FROM node:18

# Setează directorul de lucru în container
WORKDIR /app

# Copiază fișierele de configurare și sursa
COPY package*.json ./
COPY . .

# Instalează dependențele
RUN npm install --production

# Expune portul 8080 (App Runner folosește implicit acest port)
EXPOSE 8080

# Rulează aplicația
CMD [ "npm", "start" ] 