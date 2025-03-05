FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# Copy package files first to leverage Docker cache
COPY package*.json ./

# Install dependencies
RUN npm install

# Bundle app source
COPY . .

# Expose WebSocket port
EXPOSE 8083

# Set environment variables
ENV KAFKA_BROKER=34.47.244.129:9092
ENV MONGODB_URI=mongodb+srv://tariqeyego:K0tn94fPWbB3XWKR@eyego.6gk2cxc.mongodb.net/?retryWrites=true&w=majority&appName=eyego

# Command to run the application
CMD ["node", "consumer.js"]