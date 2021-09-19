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
cd ../../Personal-Virtual-Assistant-for-News-Filtering
cp Almond\ News\ Filter\ Device/dataset.tt Almond\ News\ Filter\ Device/index.js Almond\ News\ Filter\ Device/manifest.tt ../genie-toolkit/its-personal-devices/org.itspersonal.newsfilter/
cp Almond\ News\ Filter\ Device/RSS\ icon.png ../genie-toolkit/its-personal-devices/org.itspersonal.newsfilter/icon.png
cp Almond\ News\ Filter\ Device/eval/scenarios.txt ../genie-toolkit/its-personal-devices/org.itspersonal.newsfilter/eval/
cp Almond\ News\ Filter\ Device/eval/dev/annotated.txt ../genie-toolkit/its-personal-devices/org.itspersonal.newsfilter/eval/dev/
cp Almond\ News\ Filter\ Device/eval/dev/annotated.txt ../genie-toolkit/its-personal-devices/org.itspersonal.newsfilter/eval/train/
cp Almond\ News\ Filter\ Device/eval/dev/annotated.txt ../genie-toolkit/its-personal-devices/everything/dev/
cp Almond\ News\ Filter\ Device/eval/dev/annotated.txt ../genie-toolkit/its-personal-devices/everything/train/
cp Almond\ 2.0\ Local\ Version/initial-request.ts ../genie-toolkit/lib/templates/dialogue_acts/

# Update genie
cd ../genie-toolkit
npx make

# Pack the files of the device into a zip file for uploading
cd its-personal-devices
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
make model="newsfilter1" train-user

# Test the device using the scenario test
node ./test/scenarios org.itspersonal.newsfilter

# Run the local almond
cd ..
genie assistant --thingpedia-dir its-personal-devices

# Example command to call the news filter device
\t @org.itspersonal.newsfilter.news_article(topic = enum sports);