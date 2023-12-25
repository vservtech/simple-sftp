# Inspiration from https://medium.com/@lejiend7/create-sftp-container-using-docker-e6f099762e42

FROM denoland/deno:alpine-1.39.1

RUN apk add --no-cache openssh-server zsh

COPY ./src .
COPY ./config /config

# Replace later with something that does useradd + starting sshd in one go
CMD [ "deno", "run", "-A", "useradd.ts"]
# CMD [ "deno", "test", "-A"]