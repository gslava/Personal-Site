# Inventory Management System
A system for inventory management that included:
- collecting orders from 10+ US marketplaces (Amazon, Walmart, eBay, Sears, BestBuy, and others) and storing their information in a unified format;
- collecting information about all shipments from all company warehouses, as well as from Amazon Fulfillment and Walmart Fulfillment warehouses;
- analytics and statistics for each product with parameters and filters controlled by the user;
- information about product reviews from different marketplaces;
- information about upcoming product deliveries and delivery history;
- an AI chat where users could ask about information stored in the system;
- a dashboard with statistics and a problem section.

### Technologies
- Java 17
- Spring Boot
- PostgreSQL
- ReactJS
- RabbitMQ

---

# Orders Processing Helper
An application that included near-complete automation of the order processing workflow. The application had a set of rules that users could configure, and based on these rules the following actions were performed:
- Pre-processing:
	- adding information required for processing if it was missing:
		- weight;
		- dimensions;
		- customs information for international orders;
		- content warnings (for example, if the product contained lithium batteries);
		- information for packers;
		- other product-specific information.
- Order processing:
	- selecting the most cost-effective shipping method;
	- generating a shipping label and invoice;
	- processing PDF files for different formats and printer types;
	- sending information to warehouses.

### Technologies
- Java 17
- Spring Boot
- PostgreSQL
- Vaadin
- RabbitMQ

---

# Amazon Ads App
An application that collected data about advertising campaigns and their performance through APIs and configured them according to predefined rules. The application also had a UI for users where AI suggested possible improvements, and the user could approve, adjust, or reject the change. The application suggested changes to keywords, negative keywords, and cost-per-click bids both at the campaign level and for each individual keyword. It also suggested creating campaigns for products that did not yet have advertising campaigns. The application sourced data from Helium10, the Amazon Ads API, and internet search performed by an AI agent.

### Technologies
- Java 17
- Spring Boot
- PostgreSQL
- Vaadin
- RabbitMQ

---

# Product Content Creation App
This project was created for generating marketplace-specific content. The user entered product codes for which content needed to be generated, and the service generated a product description with all required fields filled in for the specific marketplace according to that marketplace’s rules. The user could download the file or edit the result in the UI if needed. After that, the product was added to the marketplace.

### Technologies
- Java 17
- Spring Boot
- PostgreSQL
- ReactJS

---

# Customer Support Bot
A customer support bot that automatically handled user requests within the company’s rules and policies. If a request fell outside the allowed scenarios, was an exception, or required additional review, the system forwarded it to the appropriate support specialist. The solution operated based on data from the Inventory Management System and processed requests from multiple channels: live chats, emails, and marketplaces.

### Technologies
- Java 17
- Spring Boot
- PostgreSQL

---

# Advanced Web Scrapers
- collecting data about stock tickers and analytics related to them;
- automating actions on websites that did not have an API:
	- adding and editing products;
	- downloading reports;
	- adding shipment information;
	- entering information for the customs broker;
	- tracking news about legal changes that could affect the business;
	- creating API modules so the application could later perform actions on websites through Selenium to automate work with marketplaces that had limited API capabilities;
	- captcha solver.

### Technologies
- Java 17
- Spring Boot
- PostgreSQL
- Selenium / Selenide
