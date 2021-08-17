# Personal Virtual Assistant for News Filtering
This project aims to use machine learning and natural language processing to create a personal assistant that can filter news based on the user's personal preference.

## Client's Vision
The ISS (Institutional Shareholder Services) filters through 500k news articles daily to find controversial activities of public companies in the areas of environment, human/labour rights, and corruption. They then provide that information to their clients, large institutional investors around the globe. Currently, the ISS employs analysts equipped with different search and ML (Machine Learning) / NLP (Natural Language Processing) technologies to pre-filter news articles daily. In the future, the ISS would like to provide a text-based personal virtual assistant to their analysts and clients to help them more easily find articles of interest while navigating the news. The assistant would be able to learn about the preferences of each individual user by observing interaction patterns and asking clarifying questions.

Last semester, the team managed to deploy a working implementation of [Almond](https://almond.stanford.edu/), an open source text based virtual assistant. The team also managed to create a news filter service that filters articles based on one of two topics, sports or technology, and implemented the ability for Almond to communicate with the service. The two parts still had some room for improvement, as the news filter showed articles that are irrelevant to the selected topic and Almond itself could only accept programming language as the user input. The client also found the UI (User Interface) design of Almond to be old fashioned and not interesting. As such, the client envisioned that the team would be able to improve the news filter, implement an NLP component to Almond, and implement a redesign of the Almond UI.

## Client
Our client is Marcel Neuhausler, from the
[ISS (Institutional Shareholder Services)](https://www.issgovernance.com/). Marcel is also joined by two other ISS employees, Chelsea Nicole Ramos and Derrick Liu.

## Client Expectations
- A working implementation of the NLP component of the virtual assistant, allowing the user to use human language to communicate with the assistant.
- A news filter service with improved accuracy that finds more relevant/related articles for the requested topic.
- An implementation of a redesign of the UI of the virtual assistant, with focus on a more modern and interesting look.

## Project Impact
This project will improve upon the previous semester’s implementation of the open source virtual assistant [Almond](https://almond.stanford.edu/) by adding the ability to understand natural language, improving the accuracy of the news filter, and redesigning the entire UI to be more modern. The client can then judge if the final result is suitable to be used as the base for implementing their own personal assistant that can be used for lowering the workload of the ISS analysts as well as a possible revenue stream if provided directly to their clients as a service.

## Milestones, Scheduling, Deliverables
### Milestones
1. Setup a new landing page for the project with links to the repository, project documents, and planning board.
2. Reimplement the device created for news filtering to be compatible with the newest local version of Almond.
3. Implement the NLP component of the news filter device.
4. Implement the new web UI design and connect it to the Almond API (Application Programming Interface).
5. Analyze the cause of the performance of the news filter service
6. Improve the accuracy of the news filter service.

### Scheduling
We will hold four sprints (one every two weeks) in the following schedule:
1. Sprint 1: Week 2 to Week 4, focused on deciding the project tools, implementing the local version of Almond, reimplementing the news filter device, finalizing the new UI design, start implementing the website, and start exploring ways to improve the accuracy of the news filter.
2. Sprint 2: Week 5 to Week 6, focused on implementing the NLP component of the news filter device, continuing the implementation of the website, and continuing  to explore ways to improve the accuracy of the news filter.
3. Sprint 3: Teaching Break to Week 8, focused on finishing documentation, continuing the implementation of the website, and finalizing the news filter.
4. Sprint 4: Week 9 to Week 10, focused on finishing documentation, finishing the implementation of the website, and testing the final version of Almond.

### Deliverables
1. A standalone deployment of a website that implements the new UI, connected to Almond-Cloud using its API, that can use the news filter service that has a working NLP component using Almond-Devices, given to the client through the code in Github. *to be updated with either fork, change ownership, or clone
2. A collection of training data used to train the news filter service, given to the client in the form of a JSON file containing labelled articles for the sports and tech topic. Increase the data to 4000 relevant articles for each topic and 4000 irrelevant articles, totalling at 12000 labeled articles.

## Constraints
1. Our team works remotely. It is almost impossible for us to hold offline meetings or events.
2. The client and the Almond team are both based in America, so their timezone is very different compared to the team members' own time zones (Indonesia, China, Australia). As a result, effective communication time is very limited.

## Risks
1. If we decide to collect more for this semester, finding additional data collection of articles may take more time than anticipated based on last semester’s difficulty in gathering data.
2. Our team is more likely to be inefficient compared to traditional teams since we are entirely remote/online.
3. It is not known how much of the previous semester’s code for Almond can be reused since we will use a different deployment method (changed from using a set package to connecting through the API).
4. The team has limited experience in NLP and web development and as such may require more time than anticipated or have some difficulties when implementing either part.
5. The accuracy of the news filter may be difficult to improve past a certain point.
6. Implementing the NLP component of the news filter device in Almond relies heavily on the existing documentation because it uses a custom language.

## Resources (Open Source)
- [Stanford Open Virtual Assistant Platform](https://oval.cs.stanford.edu/)
- [Almond](https://almond.stanford.edu/)
- [Almond-cloud Repository](https://github.com/stanford-oval/almond-cloud)

## Other Resources, Services and Repositories (Our Work)
- [Decision Log](https://docs.google.com/spreadsheets/d/1qPS4JSWMezUjgWUI55_U61ADeIDK21n1/edit?usp=sharing&ouid=109170627267257036138&rtpof=true&sd=true)
- [Reflection Log](https://docs.google.com/spreadsheets/d/1WNLbIKixGZ9geZHBl5R-w0JWmGj-6Khq_sHsn0tKzlU/edit?usp=sharing)
- [Risk Assessment Log](https://docs.google.com/spreadsheets/d/1rn0s8uDeVv5JOwVQiz8KWtciJwVRBcRq/edit?usp=sharing&ouid=109170627267257036138&rtpof=true&sd=true)
- [Sports News Filter Service](https://itspersonal-sports-newsfilter.herokuapp.com)
- [Technology News Filter Service](https://itspersonal-tech-newsfilter.herokuapp.com)
- [Sports News Filter Service Repository](https://github.com/TechLauncher-its-personal/sports-topic-service)
- [Technology News Filter Service Repository](https://github.com/TechLauncher-its-personal/tech-topic-service)
- [Sports Machine Learning Model Repository](https://github.com/TechLauncher-its-personal/sports-topic-model)
- [Technology Machine Learning Model Repository](https://github.com/TechLauncher-its-personal/tech-topic-model)

## Tooling
Task | Tool
-----------|-------
Repository | [Github](https://github.com/TechLauncher-its-personal/Personal-Virtual-Assistant-for-News-Filtering)
Communication | Zoom, Slack, Outlook, [Almond Community Forum](https://community.almond.stanford.edu/)
Documentation | [Google Drive](https://drive.google.com/drive/folders/1ZKMCHTSK-XWvk-Dr2QA7UVDye39tRWGh?usp=sharing)
UI/UX Design | Adobe Illustrator, Adobe Photoshop, Balsamiq Wireframe, Figma
Development Environment | Visual Studio Code, NotePad++
Web Framework | *Not yet determined
Data Science / ML Environment | Jupyter
ML / NLP Training | SpaCy, Genie
Planning | [Jira](https://itspersonal.atlassian.net/jira/software/projects/IP/boards/1) (Viewer account information available in the landing page Google Sheet)

## Statement of Work
The statement of work is located in the Statement of Work folder in the Google Drive [here](https://drive.google.com/file/d/1sWIT9vng-49B7W9xppUsKXoUTdRbxLwn/view?usp=sharing).

## Tutorial Time and Tutor
Tutorial Time: Wednesday, 12.00-14.00 AEST

Tutor: Elena Williams

Examiner: Charles Gretton

## Project Members
Member | Role
-------|-----
Anggrio Wildanhadi Sutopo | Team Leader, Spokesperson
Junjie Zou | ML/NLP Developer, Reflection Log Keeper, Spokesperson
Zhihao Ye | ML/NLP Developer, Decision Log Keeper
Mingjie Shi | Web Developer, Risk Assessment Log Keeper
Yanan Wu | UI/UX Developer, Notekeeper
Pengyue Yang | UI/UX Developer

## Weekly Meeting Schedule
Day | Time (AEST) | Type
----|------|-------
Monday | 21.00-23.00 AEST | Team Meeting
Tuesday | 11.00-12.00 AEST | Client Meeting
Wednesday | 12.00-14.00 AEST | Tutorial
Thursday | 21.00-23.00 AEST | Team Meeting
Saturday | 21.00-23.00 AEST | Team Meeting