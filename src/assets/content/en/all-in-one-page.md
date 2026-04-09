# About Me

Software engineer focused on **Java**, **Spring Boot**, **automation**, and **AI integration**. I build business software that reduces manual work, simplifies workflows, and turns repetitive operations into reliable systems.
 
**Viacheslav Guzhov**
**Senior Software & Automation Engineer**  
Berlin, Germany  
Work permit: Germany

### Contact

- Email: [guzhov.viacheslav@gmail.com](mailto:guzhov.viacheslav@gmail.com)
- Telegram: [@g_slava](https://t.me/g_slava)
- WhatsApp: [Contact link](https://api.whatsapp.com/qr/NETY2M6VJROGA1)

### About My Work

My experience includes backend development, microservices, internal tools, business process automation, API integrations, and practical AI usage in production environments. I work across the full delivery cycle: from gathering requirements and solution design to implementation, testing, deployment, and rollout support.

---

# Work Experience

### Senior Software & Automation Engineer — Freelance

**Berlin, Germany**  
**February 2024 – Present**

#### What I Do

- Build full stack solutions with AI capabilities
- Improve business workflows by removing duplicate steps, simplifying structures, and automating repetitive work
- Integrate AI into business processes using AI agents and decision-support capabilities
- Develop task-specific AI skills for business workflows
- Deliver solutions end to end: requirements gathering, development, testing, deployment, and rollout support
- Create documentation and user guides to support adoption

#### Technologies & Tools

- **Backend:** Java, Spring Boot
- **Databases:** PostgreSQL, MongoDB
- **DevOps / CI/CD:** Docker, Jenkins, GitHub Actions
- **Frontend:** ReactJS, Vaadin, Angular
- **AI Tooling:** Claude Code, Codex, custom skills

~~

### Senior Software Developer — E-commerce Company

**Kharkiv, Ukraine**  
**January 2014 – August 2023**

#### What I Did

- Built Java backend services and microservices to automate key business processes across orders, inventory, and reporting
- Integrated internal systems with Amazon, ShipStation, AWS, and other APIs to replace manual work with reliable API-driven workflows
- Developed internal tools for inventory management and supplier document processing
- Participated in architecture decisions, planning, code reviews, mentoring, and stakeholder communication
- Introduced AI into production workflows for content creation, order processing, Amazon Ads automation, review analysis, and operational tasks

#### Key Achievements

- **~70% faster** order processing
- **~95% fewer** processing errors
- **~80%** of manual work in the company automated
- **5x faster** product content creation

#### Technologies & Tools

- **Languages:** Java (primary), Python, C#, VBA (legacy)
- **Backend:** Spring Boot, Spring Framework, Hibernate / JPA, REST APIs
- **Testing:** JUnit, Mockito, Spring Boot Test, Selenium, Selenide
- **Databases:** PostgreSQL, MySQL, MongoDB
- **Cloud & Integrations:** AWS (S3, Lambda, EC2), AWS SDK, Amazon MWS / SP-API, Amazon Ads API, ShipStation API
- **DevOps & Tools:** Docker, GitHub Actions, Maven, Swagger / OpenAPI, Git (GitHub, GitLab)
- **Frontend:** React, Vaadin

---

# Education

### Master of Software Engineering

**Kharkiv National University of Radio Electronics**  
Kharkiv, Ukraine  
**October 2022 – June 2024**  
Website: [nure.ua/en](https://nure.ua/en)

~~

### Bachelor's Degree in Computer Science

**Kharkiv National University of Radio Electronics**  
Kharkiv, Ukraine  
**September 2007 – June 2011**  
Website: [nure.ua/en](https://nure.ua/en)


---

# Technologies

The stack below reflects the tools I use most often to build backend systems, automation flows, AI-enabled workflows, and production-ready internal platforms.

## Java Backend

- Spring Boot
- Spring Framework
  - Spring Core
  - Spring Web
  - Spring Data
  - Spring Security
  - Spring Test
- Hibernate / JPA
- REST APIs / RESTful Services
- Microservices
- Swagger / OpenAPI

## Data & Storage

- PostgreSQL
- MySQL
- MongoDB

## AI & Agentic Development

- AI / LLM Integrations
- AI Skills
- AI Automation
- AI Agents
- AI-powered Decision Workflows
- MCP
- Claude Code
- Codex

## Cloud, Integrations & External APIs

- AWS
  - S3
  - EC2
  - Lambda
  - AWS SDK
- Amazon MWS / SP-API
- Amazon Ads API
- ShipStation API

## Frontend & UI

- React
- Vaadin
- Angular

## Testing & Quality

- JUnit
- Mockito
- Spring Boot Test
- Selenium
- Selenide
- Unit Testing
- UI Testing
- Integration Testing
- Testcontainers
- Code Reviews
- Technical Documentation
- System Design

## DevOps & Delivery

- Docker
- Jenkins
- GitHub Actions
- Git
- CI/CD

## Message Brokers

- RabbitMQ
- Apache Kafka

---

# Projects

Selected projects that show how I approach automation, internal tools, AI-assisted workflows, and systems that reduce operational load at scale.


## Inventory Management System

A system for inventory management that included:

- collecting orders from 10+ US marketplaces (Amazon, Walmart, eBay, Sears, BestBuy, and others) and storing their information in a unified format
- collecting information about all shipments from all company warehouses, as well as from Amazon Fulfillment and Walmart Fulfillment warehouses
- analytics and statistics for each product with parameters and filters controlled by the user
- information about product reviews from different marketplaces
- information about upcoming product deliveries and delivery history
- an AI chat where users could ask about information stored in the system
- a dashboard with statistics and a problem section

### Technologies

- Java 17
- Spring Boot
- PostgreSQL
- ReactJS
- RabbitMQ

~~

## Orders Processing Helper

An application that included near-complete automation of the order processing workflow. The application had a set of rules that users could configure, and based on these rules the following actions were performed:

- Pre-processing:
  - adding information required for processing if it was missing:
    - weight
    - dimensions
    - customs information for international orders
    - content warnings (for example, if the product contained lithium batteries)
    - information for packers
    - other product-specific information
- Order processing:
  - selecting the most cost-effective shipping method
  - generating a shipping label and invoice
  - processing PDF files for different formats and printer types
  - sending information to warehouses

### Technologies

- Java 17
- Spring Boot
- PostgreSQL
- Vaadin
- RabbitMQ

~~

## Amazon Ads App

An application that collected data about advertising campaigns and their performance through APIs and configured them according to predefined rules. The application also had a UI for users where AI suggested possible improvements, and the user could approve, adjust, or reject the change. The application suggested changes to keywords, negative keywords, and cost-per-click bids both at the campaign level and for each individual keyword. It also suggested creating campaigns for products that did not yet have advertising campaigns. The application sourced data from Helium10, the Amazon Ads API, and internet search performed by an AI agent.

### Technologies

- Java 17
- Spring Boot
- PostgreSQL
- Vaadin
- RabbitMQ

~~

## Product Content Creation App

This project was created for generating marketplace-specific content. The user entered product codes for which content needed to be generated, and the service generated a product description with all required fields filled in for the specific marketplace according to that marketplace's rules. The user could download the file or edit the result in the UI if needed. After that, the product was added to the marketplace.

### Technologies

- Java 17
- Spring Boot
- PostgreSQL
- ReactJS

~~

## Customer Support Bot

A customer support bot that automatically handled user requests within the company's rules and policies. If a request fell outside the allowed scenarios, was an exception, or required additional review, the system forwarded it to the appropriate support specialist. The solution operated based on data from the Inventory Management System and processed requests from multiple channels: live chats, emails, and marketplaces.

### Technologies

- Java 17
- Spring Boot
- PostgreSQL

~~

## Advanced Web Scrapers

- collecting data about stock tickers and analytics related to them
- automating actions on websites that did not have an API:
  - adding and editing products
  - downloading reports
  - adding shipment information
  - entering information for the customs broker
  - tracking news about legal changes that could affect the business
  - creating API modules so the application could later perform actions on websites through Selenium to automate work with marketplaces that had limited API capabilities
  - captcha solver

### Technologies

- Java 17
- Spring Boot
- PostgreSQL
- Selenium / Selenide

---

# Contact

If you want to discuss backend systems, automation, AI integration, or a potential collaboration, the fastest way is to message me directly.

- Email: [guzhov.viacheslav@gmail.com](mailto:guzhov.viacheslav@gmail.com)
- Telegram: [@g_slava](https://t.me/g_slava)
- WhatsApp: [Contact link](https://api.whatsapp.com/qr/NETY2M6VJROGA1)
