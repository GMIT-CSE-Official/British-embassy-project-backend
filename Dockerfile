FROM node:18-alpine

WORKDIR .

COPY package*.json ./

RUN yarn install

# Copy the rest of the project files (excluding node_modules)
COPY . .

EXPOSE 5000

CMD ["yarn", "run", "start"]