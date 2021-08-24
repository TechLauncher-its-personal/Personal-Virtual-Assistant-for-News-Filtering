# Update apt
apt-get update

# Install dependencies
apt-get -qq install curl build-essential make g++ gettext graphicsmagick zip unzip git

# Install node
curl -fsSL https://deb.nodesource.com/setup_12.x | bash -

apt-get -qq install nodejs

# Clone the local version of Almond
git clone --single-branch --branch release https://github.com/stanford-oval/genie-toolkit

cd genie-toolkit

# Install the genie command
npm install --unsafe-perm

npm link --unsafe-perm