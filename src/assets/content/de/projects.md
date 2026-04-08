# Inventory Management System
Ein System zur Verwaltung von Lagerbeständen, das Folgendes umfasste:
- das Sammeln von Bestellungen aus 10+ US-Marktplätzen (Amazon, Walmart, eBay, Sears, BestBuy und weiteren) sowie die Speicherung dieser Informationen in einem einheitlichen Format;
- das Sammeln von Informationen über alle Sendungen aus sämtlichen Lagern des Unternehmens sowie aus den Lagern von Amazon Fulfillment und Walmart Fulfillment;
- Analysen und Statistiken zu jedem Produkt mit Parametern und Filtern, die vom Benutzer gesteuert wurden;
- Informationen über Produktbewertungen aus verschiedenen Marktplätzen;
- Informationen über zukünftige Warenlieferungen sowie die Historie der Lieferungen;
- einen AI-Chat, in dem Informationen abgefragt werden konnten, die im System gespeichert waren;
- ein Dashboard mit Statistiken und einem Bereich für Probleme.

### Technologien
- Java 17
- Spring Boot
- PostgreSQL
- ReactJS
- RabbitMQ

---

# Orders Processing Helper
Eine Anwendung, die nahezu eine vollständige Automatisierung des Bestellverarbeitungsprozesses umfasste. Die Anwendung verfügte über ein Regelwerk, das von den Benutzern konfiguriert werden konnte. Auf Basis dieser Regeln wurden folgende Schritte ausgeführt:
- Pre-processing:
	- Ergänzung von Informationen, die für die Bearbeitung erforderlich waren, falls sie fehlten:
		- Gewicht;
		- Abmessungen;
		- Zollinformationen für internationale Bestellungen;
		- Hinweise zum Inhalt (zum Beispiel, wenn das Produkt Lithium-Batterien enthielt);
		- Informationen für die Verpackungsmitarbeiter;
		- weitere produktspezifische Informationen.
- Bestellverarbeitung:
	- Auswahl der wirtschaftlichsten Versandmethode;
	- Erstellung von Versandlabel und Rechnung;
	- Verarbeitung von PDF-Dateien für unterschiedliche Formate und verschiedene Drucker;
	- Übermittlung von Informationen an die Lager.

### Technologien
- Java 17
- Spring Boot
- PostgreSQL
- Vaadin
- RabbitMQ

---

# Amazon Ads App
Eine Anwendung, die über API Daten zu Werbekampagnen, deren Statistiken sammelte und sie anhand vordefinierter Regeln konfigurierte. Die Anwendung verfügte außerdem über ein UI für Benutzer, in dem AI Verbesserungsvorschläge machte und der Benutzer die Änderung bestätigen, anpassen oder ablehnen konnte. Die Anwendung schlug Änderungen bei Keywords, negativen Keywords sowie beim Cost-per-Click sowohl auf Kampagnenebene als auch für jedes einzelne Keyword vor. Außerdem schlug sie die Erstellung von Kampagnen für Produkte vor, für die noch keine Werbekampagnen erstellt worden waren. Die Daten bezog die Anwendung aus Helium10, der Amazon Ads API sowie aus der Internetsuche mithilfe eines AI-Agenten.

### Technologien
- Java 17
- Spring Boot
- PostgreSQL
- Vaadin
- RabbitMQ

---

# Product Content Creation App
Dieses Projekt wurde für die Generierung von Content für einen bestimmten Marktplatz erstellt. Der Benutzer gab die Produktcodes ein, für die Content generiert werden sollte, und der Service erzeugte eine Produktbeschreibung mit allen ausgefüllten Feldern für den jeweiligen Marktplatz gemäß dessen Regeln. Der Benutzer konnte die Datei herunterladen oder das Ergebnis bei Bedarf im UI bearbeiten. Anschließend wurde das Produkt auf dem Marktplatz angelegt.

### Technologien
- Java 17
- Spring Boot
- PostgreSQL
- ReactJS

---

# Customer Support Bot
Ein Bot für den Kundensupport, der Benutzeranfragen automatisch im Rahmen der Regeln und Richtlinien des Unternehmens bearbeitete. Wenn eine Anfrage außerhalb der zulässigen Szenarien lag, ein Ausnahmefall war oder eine zusätzliche Prüfung erforderte, leitete das System sie an den zuständigen Support-Mitarbeiter weiter. Die Lösung arbeitete auf Basis der Daten aus dem Inventory Management System und verarbeitete Anfragen aus verschiedenen Kanälen: Live-Chats, E-Mails und Marktplätzen.

### Technologien
- Java 17
- Spring Boot
- PostgreSQL

---

# Advanced Web Scrapers
- Sammlung von Daten zu Stock Tickers sowie deren Analyse;
- Automatisierung von Aktionen auf Websites, die keine API hatten:
	- Hinzufügen und Bearbeiten von Produkten;
	- Herunterladen von Berichten;
	- Hinzufügen von Versandinformationen;
	- Eintragung von Informationen für den Zollbroker;
	- Verfolgung von Nachrichten über gesetzliche Änderungen, die Auswirkungen auf das Geschäft haben konnten;
	- Erstellung von API-Modulen, damit das Programm anschließend über Selenium Aktionen auf Websites ausführen konnte, um Marktplätze mit eingeschränkter API zu automatisieren;
	- Captcha Solver.

### Technologien
- Java 17
- Spring Boot
- PostgreSQL
- Selenium / Selenide
