FROM node:14.15.3-alpine3.12
LABEL maintainer = "Daniel Eagle"

ARG evVersion=1.7.2
ENV gitUser=EV
ENV gitEmail=eagle@versioner

RUN apk update && apk add --no-cache git curl \
  && npm install -g eagle-versioner@${evVersion} \
  && git config --global user.name ${gitUser} && git config --global user.email ${gitEmail} \
  && mkdir /git-repo

# Scan for image vulnerabilities
RUN set -euf \
  && curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/master/contrib/install.sh | sh -s -- -b /usr/local/bin \
  && trivy filesystem --exit-code 1 --severity HIGH,CRITICAL --no-progress /

WORKDIR /git-repo
CMD ["ev", "--"]
