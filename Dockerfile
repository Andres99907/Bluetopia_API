FROM keymetrics/pm2:latest-alpine

# Set Enviroment
COPY . /app
WORKDIR /app

# Install app dependencies
ENV NPM_CONFIG_LOGLEVEL warn
ENV NODE_ENV production
RUN npm install --production

# Expose the listening port of your app
EXPOSE 3000

# Show current folder structure in logs
# RUN ls -al -R

CMD [ "pm2-runtime", "start", "server/server.js" ]
# ENTRYPOINT pm2 start server/server.js