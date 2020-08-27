from node:lts-alpine3.12

# Layer 1, add package.json and install deps.
RUN echo "Building amp-optimizer-docker" 
ADD package.json .
RUN yarn

# Layer 2: add index.js
ADD index.js .

CMD node ./index.js
