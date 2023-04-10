FROM debian:buster-slim
# FROM node:10-stretch-slim

#시스템 설치
RUN apt-get update \
 && mkdir -p /usr/share/man/man1/ \
 && apt-get install -y \
        curl \
        telnet \
        vim \
        procps \
        netcat \
        iputils-ping \
        net-tools \
        locales \
        build-essential \
        python2.7-minimal=2.7.16-2+deb10u1 \
 && sed -i "s/# ko_KR.UTF/ko_KR.UTF/" /etc/locale.gen \
 && locale-gen



RUN curl -sL https://deb.nodesource.com/setup_14.x | bash - \
 && apt-get install -y  nodejs \
 && npm install -g pm2 \
 && pm2 install pm2-logrotate \
 && pm2 set pm2-logrotate:max_size 1000M \
 && pm2 set pm2-logrotate:compress true

RUN apt-get install software-properties-common -y \
 && apt-add-repository 'deb http://security.debian.org/debian-security stretch/updates main' \
 && apt-get update -y \
 && apt-get install -y --no-install-recommends openjdk-8-jdk-headless


#앱 폴더
WORKDIR /workspace/app/

#npm install
COPY ./package.json ./
RUN  npm install --production

#정리 
RUN npm prune -f --production \
 && rm -rf /var/lib/apt/lists/* \
 && apt autoremove -y \
 && apt-get autoclean  -y \
 && apt-get clean -y \
 && apt-get remove -y build-essential \
 && apt-get purge -y --auto-remove \
 && rm -rf /root/.npm/_cacache



#보안체크사항
RUN chmod -s /usr/bin/* \
 && chmod -s /usr/sbin/* \
 && if [ -d "/root/.node-gyp" ]; then chown -R root:root /root/.node-gyp/*; fi
 
#환경
# EXPOSE 3312
ENV LANG ko_KR.UTF-8
ENV LC_ALL ko_KR.UTF-8
ENV TZ=Asia/Seoul

WORKDIR /workspace/app/dwwrap

#앱 copy
COPY ./ ./

CMD pm2 start pm2.json; pm2 log
