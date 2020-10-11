from node:lts-alpine3.12

# Layer 1, add package.json and install deps.
RUN echo "Building my sample app"
ADD package.json .
RUN yarn

# Layer 2: add src files
ADD index.js .
ADD index.html .

CMD node ./index.js
