# [vserv-tech] Simple SFTP Server

## Reason

- I found [linuxserver.io/openssh-server](https://hub.docker.com/r/linuxserver/openssh-server) docker image is too complex for my use case.
- I found https://hub.docker.com/r/atmoz/sftp docker image lacking arm64 and having some complex configuration (the home folder of each user is not writeable, the home folder of each user contains it's .ssh folder)

=> Setting up a clean sshd-based sftp server docker image.
