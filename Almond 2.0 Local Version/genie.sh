# Various commands used in the local Almond Version
# Switch to non root user
su $username

# Check current user
whoami

# Create a new project called its-personal-devices
# Developer key obtained from the settings page of a developer account
# at almond.stanford.edu
sudo genie init-project --developer-key $Developer-Key its-personal-devices

# Move to the new folder that stores the devices
cd its-personal-devices

# Create a new device called org.itspersonal.newsfilter
genie init-device org.itspersonal.newsfilter

# At this stage, copy the files from the Almond News Filter Device folder
# to the org.itspersonal.newsfilter folder. Scenarios.txt must be put
# in the org.itspersonal.newsfilter/eval folder.
cd ../../Personal-Virtual-Assistant-for-News-Filtering
cp Almond\ News\ Filter\ Device/dataset.tt Almond\ News\ Filter\ Device/index.js Almond\ News\ Filter\ Device/manifest.tt Almond\ News\ Filter\ Device/icon.png ../genie-toolkit/its-personal-devices/org.itspersonal.newsfilter/
cp Almond\ News\ Filter\ Device/eval/scenarios.txt ../genie-toolkit/its-personal-devices/org.itspersonal.newsfilter/eval/
cp Almond\ News\ Filter\ Device/eval/dev/annotated.txt ../genie-toolkit/its-personal-devices/org.itspersonal.newsfilter/eval/dev/
cp Almond\ News\ Filter\ Device/eval/dev/annotated.txt ../genie-toolkit/its-personal-devices/org.itspersonal.newsfilter/eval/train/
cp Almond\ News\ Filter\ Device/eval/dev/annotated.txt ../genie-toolkit/its-personal-devices/everything/dev/
cp Almond\ News\ Filter\ Device/eval/dev/annotated.txt ../genie-toolkit/its-personal-devices/everything/train/
cp Almond\ 2.0\ Local\ Version/package.json ../genie-toolkit/its-personal-devices/

# Can probably skip these next 3 instructions since it was merged to the master branch
# from a pull request by us
cp Almond\ 2.0\ Local\ Version/initial-request.ts ../genie-toolkit/lib/templates/dialogue_acts/
# Update genie
cd ../genie-toolkit
npx make

# Pack the files of the device into a zip file for uploading
cd ../genie-toolkit/its-personal-devices

# Add the developer key to the Makefile
vim Makefile 
# change developer_key ?= invalid
# to
# developer_key ?= your account's developer key

# Make sure you are not using the root user for the next instruction
npm install
npx make build/org.itspersonal.newsfilter.zip

# Upload the device to the main Almond website for testing
# Access token obtained from the settings page of the account at
# almond.stanford.edu
genie upload-device \
  --access-token $Access-Token \
  --zipfile build/org.itspersonal.newsfilter.zip \
  --icon org.itspersonal.newsfilter/icon.png \
  --manifest org.itspersonal.newsfilter/manifest.tt \
  --dataset org.itspersonal.newsfilter/dataset.tt

# Generate training data
make subdatasets=2 target_pruning_size=150 datadir

# Run training
make model="newsfilter1" custom_train_nlu_flags="--train_batch_tokens=150 --pretrained_model=facebook/bart-base" train-user

# Test the device using the scenario test
node ./test/scenarios org.itspersonal.newsfilter --nlu-model=newsfilter1

# Run the local almond
cd ..
genie assistant --thingpedia-dir its-personal-devices --nlu-server file:///home/$username/genie-toolkit/its-personal-devices/everything/models/newsfilter1

# Example command to call the news filter device
# \t @org.itspersonal.newsfilter.news_article(topic = enum sports);
# Get sports / tech article
Give me sports articles
# Train a sports / tech topic
I want to train the sports topic

# Start the NLP model server
genie server --nlu-model file:///home/$username/genie-toolkit/its-personal-devices/everything/models/newsfilter1 --thingpedia /home/$username/genie-toolkit/its-personal-devices/everything/schema.tt