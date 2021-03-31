from bottle import route, run
import feedparser
import random
import os

@route('/test')
def get_test():
    # Gives the 5 top stories from CNN, BBC, ABC, NYTimes, and Fox News to test article output
    cnnRss = feedparser.parse("http://rss.cnn.com/rss/edition.rss")
    cnnEntries = cnnRss["entries"] # title, summary, link, published
    bbcRss = feedparser.parse("http://feeds.bbci.co.uk/news/rss.xml")
    bbcEntries = bbcRss["entries"] # title, summary, link, published
    abcRss = feedparser.parse("https://www.abc.net.au/news/feed/45910/rss.xml")
    abcEntries = abcRss["entries"] # title, summary, link, published
    nytimesRss = feedparser.parse("https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml")
    nytimesEntries = nytimesRss["entries"] # title, summary, link, published
    foxnewsRss = feedparser.parse("http://feeds.foxnews.com/foxnews/latest")
    foxnewsEntries = foxnewsRss["entries"] # title, summary, link, published
    myData = cnnEntries[:1] + bbcEntries[:1] + abcEntries[:1] + nytimesEntries[:1] + foxnewsEntries[:1]
    return {"data":myData}

@route('/<topic>')
def get_topic(topic):
    # TODO: Check articles until one passes the test for a certain topic, then return that article
    cnnRss = feedparser.parse("http://rss.cnn.com/rss/edition.rss")
    cnnEntries = cnnRss["entries"] # title, summary, link, published
    myData = cnnEntries[:1]
    return {"data":myData, "topic":topic}

@route('/training/<topic>')
def get_training(topic):
    # TODO: Add article to training data, ask user if it is relevant to the topic or not
    cnnRss = feedparser.parse("http://rss.cnn.com/rss/edition.rss")
    cnnEntries = cnnRss["entries"] # title, summary, link, published
    myData = cnnEntries[:1]
    return {"data":myData, "training":topic}

@route('/')
def get_ping():
    return("pong")

if os.environ.get('APP_LOCATION') == 'heroku':
    run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
else:
    run(host='0.0.0.0', port=8090, debug=True)