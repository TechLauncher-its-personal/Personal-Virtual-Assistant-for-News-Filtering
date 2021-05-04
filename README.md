# Personal Virtual Assistant for News Filtering
This project aims to use machine learning and natural language processing to create a personal assistant that can filter news based on the user's personal preference.

## Client's Vision
The ISS (Institutional Shareholder Services) filters through 500k news articles daily to find controversial activities of public companies in the areas of environment, human/labour rights, and corruption. They then provide that information to their clients, large institutional investors around the globe. Currently, the ISS employs analysts equipped with different search and ML (Machine Learning) / NLP (Natural Language Processing) technologies to pre-filter news articles daily. In the future, the ISS would like to provide a text-based personal virtual assistant to their analysts and clients to help them more easily find articles of interest while navigating the news. The assistant would be able to learn about the preferences of each individual user by observing interaction patterns and asking clarifying questions.

## Client
Our client is Marcel Neuhausler, from the
[ISS (Institutional Shareholder Services)](https://www.issgovernance.com/)

## Client Expectations
- In-depth analysis of the Stanford Open Virtual Assistant project.
- Standalone deployment of an open source simple news filtering virtual assistant (Almond).
- Collection of training data for two different news topics.

## Project Impact
This project will provide a thorough examination of the possibility of using the [Stanford Open Virtual Assistant project's](https://oval.cs.stanford.edu/) open source virtual assistant, [Almond](https://almond.stanford.edu/), as a base to develop a  text-based personal assistant that can filter news articles. The finished product would also be useful for lowering the workload of the ISS analysts as well as a possible revenue stream if provided directly to their clients as a service.

## Milestones, Scheduling, Deliverables
### Milestones
1. Setup a landing page for the project with links to the repository, project documents, and planning board.
2. Create a presentation slide for information on the Stanford Open Virtual Assistant.
3. Deployed a standalone version of Almond-Cloud.
4. Implement a news filtering service under Almond-Devices/Skills.
5. Implement a training service under Almond-Devices/Skills.
6. Create a Jupyter Notebook for data preparation and NLP training.
7. Create a collection of labeled training data for two different news topics.

### Scheduling
We will hold three sprints (one every two weeks) in the following schedule:
1. Sprint 1: Week 3 to Week 4, focused on learning about Almond as well as data preparation.
2. Sprint 2: Week 5 to Week 6, focused on standalone deployment and service implementation.
3. Sprint 3: Teaching Break to Week 8, focused on finishing documentation, training, and UI/UX design.


### Deliverables
1. A presentation slide containing an introduction to the Stanford Open Virtual Assistant project.
2. A standalone deployment of Almond-Cloud, with a news filtering and training service implemented under Almond-Devices/Skills.
3. A Jupyter Notebook for data preparation and NLP training.
4. A collection of labeled training data for two different news topics.

## Constraints
1. Our team works remotely. It is almost impossible for us to hold offline meetings or events.
2. The client is based in America, so their timezone is very different compared to the team members' own time zones (Indonesia, China, Australia). As a result, effective communication time is very limited.
3. The team has limited experience in data training and labelling as well as the Almond system and as such would require a longer initial learning/setup period.


## Risks
1. There are privacy concerns in our project as we need to collect and analyze user information like their preference of news articles. The team must take great care to get permission to use data. 
2. Remote teams are more likely to be inefficient compared to traditional teams. Besides, this project requires great understanding and applying of the most advanced technologies and knowledge in ML and NLP fields. Our team requires much time to complete this project and it may be hard for us to evaluate time consumption of some difficult technical tasks.
3. This project may last for two semesters but our team members may change in the second semester. If work is not handovered perfectly between previous and new members, the project process would be greatly influenced.

## Resources (Open Source)
- [Stanford Open Virtual Assistant Platform](https://oval.cs.stanford.edu/)
- [Almond](https://almond.stanford.edu/)
- [Almond-cloud Repository](https://github.com/stanford-oval/almond-cloud)

## Other Resources, Services and Repositories (Our Work)
- [Project Flow Diagram](https://drive.google.com/file/d/1A3xHliFauqKhCYe5pOR4P0iPHeSq3G92/view?usp=sharing)
- [News Filter Service](https://itspersonal-newsfilter.herokuapp.com/test)
- [Sports News Filter Service](https://itspersonal-sports-newsfilter.herokuapp.com)
- [Technology News Filter Service](https://itspersonal-tech-newsfilter.herokuapp.com)
- [Sports News Filter Service Repository](https://github.com/TechLauncher-its-personal/sports-topic-service)
- [Technology News Filter Service Repository](https://github.com/TechLauncher-its-personal/tech-topic-service)
- [Sports Machine Learning Model Repository](https://github.com/TechLauncher-its-personal/sports-topic-model)
- [Technology Machine Learning Model Repository](https://github.com/TechLauncher-its-personal/tech-topic-model)

## Website Link
[Standalone Almond Deployment](http://personal.xhlife.com.au:8080/)

### How to test:
1. Login as an anonymous user (Username: anonymous, Password: testtest)
2. Go to the My Almond page.
3. Select Enabled Skills and check if Simple News Filter is active or not.

    a. If it is not active, select Configure New Skill.
    
    b. In the next page, find and select Simple News Filter.

    c. Return to the My Almond page.
4. To get the top 5 news for either the sports or tech topic, enter the following command:
```
\t @org.itspersonal.newsfilter.news_article(topic = enum sports);
OR
\t @org.itspersonal.newsfilter.news_article(topic = enum tech);
```
5. To add a new training data for a specific topic, enter the following command:
```
\t @org.itspersonal.newsfilter.training_news_article(topic = enum sports);
OR
\t @org.itspersonal.newsfilter.training_news_article(topic = enum tech);
```
6. When an article is returned, input "yes".
7. Wait for the system to show the label options. Select "Yes" if the article is relevant or "No" if the article is irrelevant to the topic.

## Tooling
Task | Tool
-----------|-------
Repository | [Github](https://github.com/TechLauncher-its-personal/Personal-Virtual-Assistant-for-News-Filtering)
Communication | Zoom, Slack, Outlook
Documentation | [Google Drive](https://drive.google.com/drive/folders/1ZKMCHTSK-XWvk-Dr2QA7UVDye39tRWGh)
UI/UX Design | Adobe Illustrator, Adobe Photoshop
Development Environment | Visual Studio Code, NotePad++
Deployment | Docker
Data Science / ML Environment | Jupyter
Planning | [Trello](https://trello.com/b/SmIMQxOa/its-personal)

## Statement of Work
[The statement of work is provided as a pdf.](https://drive.google.com/file/d/1JNqibPjaK--HdEf1ZZ0-wiybrKU3Hl51/view?usp=sharing)

## Tutorial Time and Tutor
Tutorial Time: Friday, 8-10 AM

Tutor: Manik Mahajan

## Project Members
Member | Role
-------|-----
Anggrio Wildanhadi Sutopo | Team Leader, Spokesperson, Git Master
Junjie Zou | Project Manager, Deputy Spokesperson
Zhihao Ye | ML/NLP Developer
Mingjie Shi | ML/NLP Developer
Yanan Wu | UI/UX Developer

## Weekly Meeting Schedule
Day | Time (AEDT) | Detail
----|------|-------
Monday | 4-6 PM | Team Meeting
Thursday | 12-1 PM | Client Meeting
Thursday | 2-4 PM | Team Meeting