FROM node:10.4.1-alpine
RUN npm config set unsafe-perm true
WORKDIR /app
COPY . /app
RUN npm i -g yarn
RUN yarn install
RUN yarn build
RUN echo $' \n\
************************************ \n\
Finished compiling. Please run "./copy_binaries" in another terminal window (making sure you keep this terminal window runing as is). \n\
************************************ '
