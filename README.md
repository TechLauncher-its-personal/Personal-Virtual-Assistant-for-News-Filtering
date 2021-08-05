# Personal Virtual Assistant for News Filtering
This project aims to use machine learning and natural language processing to create a personal assistant that can filter news based on the user's personal preference.

## Client's Vision
The ISS (Institutional Shareholder Services) filters through 500k news articles daily to find controversial activities of public companies in the areas of environment, human/labour rights, and corruption. They then provide that information to their clients, large institutional investors around the globe. Currently, the ISS employs analysts equipped with different search and ML (Machine Learning) / NLP (Natural Language Processing) technologies to pre-filter news articles daily. In the future, the ISS would like to provide a text-based personal virtual assistant to their analysts and clients to help them more easily find articles of interest while navigating the news. The assistant would be able to learn about the preferences of each individual user by observing interaction patterns and asking clarifying questions.

## Client
Our client is Marcel Neuhausler, from the
[ISS (Institutional Shareholder Services)](https://www.issgovernance.com/). Marcel is also joined by two other ISS employees, Chelsea Nicole Ramos and Derrick Liu.

## Client Expectations
- Implement the natural language processing component of the virtual assistant.
- Improve the accuracy of the news filter.
- Redesign the UI of the virtual assistant.

## Project Impact
This project will provide a thorough examination of the possibility of using the [Stanford Open Virtual Assistant project's](https://oval.cs.stanford.edu/) open source virtual assistant, [Almond](https://almond.stanford.edu/), as a base to develop a  text-based personal assistant that can filter news articles. The finished product would also be useful for lowering the workload of the ISS analysts as well as a possible revenue stream if provided directly to their clients as a service.

## Milestones, Scheduling, Deliverables
### Milestones
1. Setup a new landing page for the project with links to the repository, project documents, and planning board.
2. Redeploy a standalone version of Almond-Cloud using the newest version.
3. Create a wireframe for the new UI of Almond.
4. Create a prototype UI for the new design of Almond.
5. Implement the new UI design.
6. Implement the natural language processing component of Almond.
7. Improve the accuracy of the news filter service.

### Scheduling
We will hold four sprints (one every two weeks) in the following schedule:
1. Sprint 1: Week 2 to Week 4, focused on redeploying Almond, start designing the new UI, and start exploring ways to improve the accuracy of the news filter.
2. Sprint 2: Week 5 to Week 6, focused on implementing the natural language processing component of Almond, finishing the prototype of the new UI, and continuing  to explore ways to improve the accuracy of the news filter.
3. Sprint 3: Teaching Break to Week 8, focused on finishing documentation and implementing the new UI, and finalizing the new news filter.
4. Sprint 4: Week 9 to Week 10, focused on finishing documentation, finishing the implementation of the new UI, and testing the final version of Almond.

### Deliverables
1. A standalone deployment of the newest version of Almond-Cloud with a working natural language processing component, connected to a news filter service using Almond-Devices/Skills, that also implements the new UI.
2. A collection of wireframe and prototype designs for a new UI of Almond.
3. A collection of training data used to train the news filter.

## Constraints
1. Our team works remotely. It is almost impossible for us to hold offline meetings or events.
2. The client is based in America, so their timezone is very different compared to the team members' own time zones (Indonesia, China, Australia). As a result, effective communication time is very limited.
3. The team has limited experience in NLP training and may find it difficult to improve the performance/accuracy of the news filter.

## Risks
1. Finding additional data collection of articles may take more time than anticipated based on last semester’s difficulty in gathering data, if we decide to collect more for this semester.
2. The accuracy of the news filter may be difficult to improve past a certain point. 
3. Remote teams are more likely to be inefficient compared to traditional teams. Besides, this project requires great understanding and applying of the most advanced technologies and knowledge in ML and NLP fields. Our team requires much time to complete this project and it may be hard for us to evaluate time consumption of some difficult technical tasks.

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
Communication | Zoom, Slack, Outlook, Almond Community Forum
Documentation | [Google Drive](https://drive.google.com/drive/folders/1ZKMCHTSK-XWvk-Dr2QA7UVDye39tRWGh?usp=sharing) (2021 Second Semester)
UI/UX Design | Adobe Illustrator, Adobe Photoshop
Development Environment | Visual Studio Code, NotePad++
Data Science / ML Environment | Jupyter
Planning | [Jira](https://itspersonal.atlassian.net/jira/software/projects/IP/boards/1)

## Statement of Work
The statement of work is located in the Statement of Work folder in the Google Drive.

## Tutorial Time and Tutor
Tutorial Time: Wednesday, 12.00-14.00 AEST

Tutor: Elena Williams

Examiner: Charles Gretton

## Project Members
Member | Role
-------|-----
Anggrio Wildanhadi Sutopo | Team Leader, Spokesperson
Junjie Zou | ML/NLP Developer, Spokesperson
Zhihao Ye | ML/NLP Developer
Mingjie Shi | Web Developer
Yanan Wu | UI/UX Developer
Pengyue Yang | UI/UX Developer

## Weekly Meeting Schedule
Day | Time (AEST) | Type
----|------|-------
Monday | 21.00-23.00 AEST | Team Meeting
Tuesday | 11.00-12.00 AEST | Client Meeting
Wednesday | 12.00-14.00 AEST | Tutorial
Thursday | 21.00-23.00 AEST | Team Meeting
Saturday | 21.00-23.00 AEST | Team Meeting