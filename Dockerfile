FROM apify/actor-node-basic
# TODO: Check if following code is needed, it seems its already included in actor-node-basic

# Copy package.json & package-lock.json
COPY package*.json ./

RUN npm ci --only=production

# Copy remaining
COPY . ./
