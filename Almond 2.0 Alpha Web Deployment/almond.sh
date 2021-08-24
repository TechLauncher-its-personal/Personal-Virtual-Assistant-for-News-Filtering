#!/bin/sh


set -e
set -x


sudo apt update
#dependencie
sudo apt install nodejs cvc4 graphicsmagick libsystemd-dev bubblewrap -y

#Mysql
sudo apt update
sudo apt install mariadb-server -y
sudo mysql_secure_installation

sudo systemctl start mysql


#yarn_intall
sudo apt update
curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
sudo apt update
sudo apt install --no-install-recommends yarn -y
yarn --version
#update_node>=8.04
curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v

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

mkdir -p /etc/almond-cloud/


#mysql_setup
mysql
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


CREATE USER 'smj'@'%' IDENTIFIED BY 'Smj990804@qq.com';
GRANT ALL ON *.* TO 'smj'@'%';



CREATE USER 'mjj'@'localhost' IDENTIFIED BY 'Smj990804@qq.com';
GRANT ALL ON *.* TO 'mjj'@'%';







sudo apt  install firefox
firefox --version




sudo apt install nodejs cvc4 graphicsmagick libsystemd-dev bubblewrap -y

sudo apt update
sudo apt install mariadb-server
sudo mysql_secure_installation

sudo systemctl start mysql

mysql --version

git clone  --branch=master https://github.com/stanford-oval/almond-cloud.git stanford-oval/almond-cloud
cd stanford-oval/almond-cloud
git checkout -qf 0fa3897e6d8b1c5a3583c7dad24141e12016be9d

cd stanford-oval/almond-cloud
./travis/unlock-key.sh


export encrypted_6dd165f04fd2_key=[secure]

export encrypted_6dd165f04fd2_iv=[secure]

export MS_SPEECH_SUBSCRIPTION_KEY=[secure]

curl -sL https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.0/install.sh -o install_nvm.sh
bash install_nvm.sh
export NVM_DIR="$HOME/.nvm"
source ~/.bash_profile
command -v nvm
nvm install 12


mkdir geckodriver/
wget https://github.com/mozilla/geckodriver/releases/download/v0.22.0/geckodriver-v0.22.0-linux64.tar.gz
tar xvf geckodriver-v0.22.0-linux64.tar.gz -C geckodriver/

sudo add-apt-repository -y ppa:openstack-ci-core/bubblewrap
sudo apt-get update -q -y
sudo apt-get install -y graphicsmagick libsystemd-dev coreutils bubblewrap python3 python-pip

mysql -u root -e "
create database if not exists thingengine_test;
grant all privileges on thingengine_test.* to 'thingengine'@'%' identified by 'thingengine';
"
apt  install -y ruby


git clone https://github.com/travis-ci/travis-build
cd travis-build
mkdir -p ~/.travis
ln -s $PWD ~/.travis/travis-build
gem install bundler
gem update --system 
gem install rails

bundle install --gemfile ~/.travis/travis-build/Gemfile
bundler binstubs travis

gem update --system 
gem install rails


npx nyc ./tests/webalmond-integration.sh





git clone https://github.com/stanford-oval/genie-toolkit
cd genie-toolkit
npm install
npm link





