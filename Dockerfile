
FROM alpine:latest

# Get file to start
ARG file

# Update System
RUN apk add --update && apk upgrade

# Install system packages
RUN apk add nodejs \
    npm \
    git \
    python3

# Set app directory
WORKDIR /usr/src/app

# Copy files to application
ADD . /usr/src/app/

# Install dependancies
RUN npm install

# Expose port
EXPOSE 1343

# Start
CMD ["npm", "start"]