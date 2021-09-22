#update the toolchain
sudo add-apt-repository ppa:ubuntu-toolchain-r/ppa -y
sudo apt-get update

#dependencie
sudo apt-get -y install curl build-essential wget make g++ gettext graphicsmagick zip unzip git cvc4 graphicsmagick libsystemd-dev bubblewrap sqlcipher 

#sqlcipher-devel procps-ng python38 python38-pip



#go
wget https://golang.org/dl/go1.16.3.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.16.3.linux-amd64.tar.gz
export PATH=$PATH:/usr/local/go/bin
source ~/.bashrc
go version


#mariadb
wget https://downloads.mariadb.com/MariaDB/mariadb_repo_setup

echo "6528c910e9b5a6ecd3b54b50f419504ee382e4bdc87fa333a0b0fcd46ca77338 mariadb_repo_setup" \
    | sha256sum -c -

chmod +x mariadb_repo_setup

sudo ./mariadb_repo_setup \
   --mariadb-server-version="mariadb-10.5"

sudo apt update

sudo apt install mariadb-server mariadb-backup -y
sudo systemctl start mariadb




#yarn_intall
sudo apt update
curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
sudo apt update
sudo apt install --no-install-recommends yarn -y
yarn --version

#update_node>=8.04
curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v

apt install node-pre-gyp -y
apt-get install -y pkg-config
apt install node-typescript -y

#down load alomnd
git clone https://github.com/stanford-oval/almond-cloud/tree/stable-2-0
git clone https://github.com/stanford-oval/almond-cloud
cd almond-cloud

npm config set user 0 
npm config set unsafe-perm true 



npm install
# npm link is optional.
# We must replace almond-cloud with node dist/main.js

# Copy our own config.js to etc/almond-cloud/config.js
# in almond-cloud/
# bootstrap the project
node dist/main.js boostrap


npm install --unsafe-perm