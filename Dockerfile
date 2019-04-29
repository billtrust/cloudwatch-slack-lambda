FROM node:8.10-stretch

WORKDIR /lambda

COPY . .

RUN npm install -g serverless jshint && \
    npm install && \
    apt update && \
    apt install -y dos2unix && \
	dos2unix scripts/*.sh && \
	chmod +x scripts/*.sh

ENTRYPOINT [ "npm", "test" ]
