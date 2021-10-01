# Update apt
sudo apt-get update

#install_tool_chain
sudo add-apt-repository ppa:ubuntu-toolchain-r/ppa -y
sudo apt-get update

# Install dependencies
apt-get -y install curl build-essential make g++ gettext graphicsmagick zip unzip git

# Install node 12 and npm 6
sudo curl -fsSL https://deb.nodesource.com/setup_12.x | bash -

sudo apt-get -y install nodejs

# Install pip3
sudo apt install python3-pip

# Install PyTorch and CUDA
sudo pip3 install torch==1.9.0+cu111 torchvision==0.10.0+cu111 torchaudio===0.9.0 -f https://download.pytorch.org/whl/torch_stable.html

# Install genieNLP
sudo pip3 install genienlp==0.7.0a2

# Clone this repository for easy copying files
git clone https://github.com/TechLauncher-its-personal/Personal-Virtual-Assistant-for-News-Filtering

# Create a non root user
useradd $username

# Switch to non root user
su $username

# Check current user
whoami

# Clone the local version of Almond
git clone https://github.com/stanford-oval/genie-toolkit

cd genie-toolkit

# Install the genie command
npm install --unsafe-perm

sudo npm link --unsafe-perm

# Update genie if any changes are made
# Example:
# initial-request.ts is updated in lib/templates/dialogue_acts/
npx make