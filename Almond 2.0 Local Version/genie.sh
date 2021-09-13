# Various commands used in the local Almond Version

# Create a new project called its-personal-devices
# Developer key obtained from the settings page of a developer account
# at almond.stanford.edu
genie init-project --developer-key $Developer-Key its-personal-devices

# Move to the new folder that stores the devices
cd its-personal-devices

# Create a new device called org.itspersonal.newsfilter
genie init-device org.itspersonal.newsfilter

# At this stage, copy the files from the Almond News Filter Device folder
# to the org.itspersonal.newsfilter folder. Scenarios.txt must be put
# in the org.itspersonal.newsfilter/eval folder.

# Pack the files of the device into a zip file for uploading
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

# Run the local almond
genie assistant --thingpedia-dir its-personal-devices

# Example command to call the news filter device
\t @org.itspersonal.newsfilter.news_article(topic = enum sports);

# Generate training data
make subdatasets=2 target_pruning_size=150 datadir

# Run training
make model="newsfilter1" train-user

# Test the device using the scenario test
node ./test/scenarios org.itspersonal.newsfilter