#!/bin/sh


set -e
set -x


sudo apt update
#dependencie
sudo apt install nodejs cvc4 graphicsmagick libsystemd-dev bubblewrap -y
#sudo apt install nodejs cvc4 graphicsmagick libcairo2-dev libpango1.0-dev libgif-dev libjpeg-dev libcap-dev libsystemd-dev bubblewrap -y
#mariadb-server
sudo apt update

sudo apt install wget

wget https://downloads.mariadb.com/MariaDB/mariadb_repo_setup

echo "6528c910e9b5a6ecd3b54b50f419504ee382e4bdc87fa333a0b0fcd46ca77338 mariadb_repo_setup" \
    | sha256sum -c -

chmod +x mariadb_repo_setup

sudo ./mariadb_repo_setup \
   --mariadb-server-version="mariadb-10.5"

sudo apt update

sudo apt install mariadb-server mariadb-backup -y
sudo systemctl start mariadb




#Mysql
#sudo mysql_secure_installation
#sudo systemctl start mysql


#yarn_intall
sudo apt update

curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -

echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list

sudo apt update

sudo apt install --no-install-recommends yarn -y

yarn --version
#1.22.5

#update_node>=8.04
curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v
#v10.24.0

#make_intall
sudo apt install make  

#install_tool_chain
sudo add-apt-repository ppa:ubuntu-toolchain-r/ppa
sudo apt-get update

#install_necessary
sudo apt-get install build-essential -y

#g++ install
sudo apt-get install g++  -y

#install_almond
yarn global add github:stanford-oval/almond-cloud




#create a copy
mkdir -p /etc/almond-cloud/
#then move the config.js    
#from  /usr/local/share/.config/yarn/global/node_modules/almond-cloud   
      #/usr/local/share/.config/yarn/global/node_modules/almond-cloud/
#to /etc/almond-cloud/


#mysql_setup
mysql
CREATE USER 'sb'@'%' IDENTIFIED BY '990804';
GRANT ALL ON *.* TO 'sb'@'%';
CREATE DATABASE almond;
exit


#then get into    /etc/mysql/mariadb.conf.d/          50-server.conf
#find bind-address = 127.0.0.0   commit by:#)
#restart mariadb
sudo systemctl restart mariadb

#open 3306port
sudo ufw allow 3306
ufw status

####################
iptables-persistent
apt-get install iptables-persistent


iptables -P INPUT ACCEPT
iptables -P FORWARD ACCEPT
iptables -P OUTPUT ACCEPT
iptables -F
iptables-save
netfilter-persistent save
netfilter-persistent reload
################
#step4
almond-cloud bootstrap
#step5

mkdir -p /srv/almond-cloud/workdir
cd /srv/almond-cloud/workdir
almond-cloud run-almond  ##################freeze in here

####################################################################################################
#step6 setup the web
#almond-cloud run-frontend --port ...
#open80
sudo ufw allow 80
almond-cloud run-frontend --port 80
#open8080
sudo ufw allow 8080
almond-cloud run-frontend --port 8080















#set up pig for all access include remote
CREATE USER 'pig'@'%' IDENTIFIED BY '123456';
#set_privileges
GRANT ALL ON *.* TO 'pig'@'%';
#check wheaher is work
SELECT DISTINCT CONCAT('User: ''',user,'''@''',host,''';') AS query FROM mysql.user;
#add datebase_set
CREATE DATABASE almond;
#check almond
SHOW DATABASES;