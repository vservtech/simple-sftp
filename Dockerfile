# Inspiration from https://medium.com/@lejiend7/create-sftp-container-using-docker-e6f099762e42

FROM alpine:3.19

RUN apk add --no-cache openssh-server