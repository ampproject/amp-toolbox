from node:lts-alpine3.12

# Layer 1, add package.json and install deps.
RUN echo "Building amp-optimizer-docker" 
COPY package.json .
RUN yarn

# Layer 2: add src files
COPY *.js ./

EXPOSE 3000
CMD ["node", "./index.js"]
