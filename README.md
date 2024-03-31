# **Todo Web Application**

Welcome to the Todo Web Application! This application allows users to manage their tasks efficiently by creating, marking as complete, and deleting todos. Users can sign in or sign up to access the full features of the application.

## **Technologies Used**

- Frontend: HTML, CSS (Tailwind CSS), JavaScript
- Backend: Node.js, Express.js
- Database: PostgreSQL
- Testing: Jest, Cypress
- Containerization: Docker
- Deployment: Render
- CI/CD Pipeline: Automated with GitHub Actions

## **Features**

### **Sign In and Sign Up:** 
Users can sign in to their existing accounts or sign up for a new account to access the todo management features.

![signup](https://raw.githubusercontent.com/vineethayasa/screenshots/main/todo_app/signup.png)


![login](https://raw.githubusercontent.com/vineethayasa/screenshots/main/todo_app/login.png)

### **Create New Todo:** 
Once signed in, users can create new todos by providing a title and description for each task.

### **Mark Todo as Complete:** 
Users can mark todos as complete once they finish working on them. This helps users keep track of their progress.

### **Delete Todo:** 
Users can delete todos that are no longer needed or relevant.

### **Todo Classification:**
Todos are classified into three categories:
- **Overdue:** Todos that are past their due date.
- **Due Today:** Todos that are due on the current day.
- **Due Later:** Todos that have a due date set for a future date.
- **Completed Items:** Todos that are completed.

![home](https://raw.githubusercontent.com/vineethayasa/screenshots/main/todo_app/home.png)

## **Additional Features**

### Internalization & Localization

The application supports internalization and localization to cater to users from different regions.

![dropdown](https://raw.githubusercontent.com/vineethayasa/screenshots/main/todo_app/dropdown.png)

![japanese](https://raw.githubusercontent.com/vineethayasa/screenshots/main/todo_app/japanese.png)

### Tests using Jest and Cypress

Comprehensive testing using Jest for unit testing and Cypress for end-to-end testing ensures the reliability and stability of the application.

![jest](https://raw.githubusercontent.com/vineethayasa/screenshots/main/todo_app/jest.png)

![cypress](https://raw.githubusercontent.com/vineethayasa/screenshots/main/todo_app/cypress1.png)
![cypress](https://raw.githubusercontent.com/vineethayasa/screenshots/main/todo_app/cypress2.png)

### Dockerized Deployment

The application is containerized using Docker, making it easy to deploy and run in different environments.

DockerFile

![docker](https://raw.githubusercontent.com/vineethayasa/screenshots/main/todo_app/dockerfile.png)

docker-compose.yml

![docker](https://raw.githubusercontent.com/vineethayasa/screenshots/main/todo_app/docker-compose.png)

### PM2 for Process Management

PM2 is used for process management, ensuring the application runs smoothly and efficiently.

![pm2](https://raw.githubusercontent.com/vineethayasa/screenshots/main/todo_app/pm2.png)

![pm2](https://raw.githubusercontent.com/vineethayasa/screenshots/main/todo_app/pm2logs.png)

### Sentry-Slack Notifications

Sentry integration with Slack provides real-time error monitoring and notifications, allowing the team to respond promptly to any issues.

![sentry](https://raw.githubusercontent.com/vineethayasa/screenshots/main/todo_app/sentry.png)
![sentry](https://raw.githubusercontent.com/vineethayasa/screenshots/main/todo_app/sentryerror.png)

![slack](https://raw.githubusercontent.com/vineethayasa/screenshots/main/todo_app/slack.png)
![slack](https://raw.githubusercontent.com/vineethayasa/screenshots/main/todo_app/slakerror.png)
### CI/CD Pipeline

The application has a Continuous Integration/Continuous Deployment (CI/CD) pipeline set up for seamless automation across various stages, including code validation, dockerization, deployment orchestration, and real-time Slack notifications for effective team communication.

![cicd](https://raw.githubusercontent.com/vineethayasa/screenshots/main/todo_app/cicd.png)


## **Installation**

Follow these steps to set up and run the Todo Web Application locally:

1. **Clone the Repository:**

    ```bash
    git clone https://github.com/vineethayasa/todo-app.git
    ```

2. **Navigate to the Project Directory:**

    ```bash
    cd todo-app
    ```

3. **Install Dependencies:**

    ```bash
    npm install
    ```

4. **PostgreSQL:**
   - Ensure PostgreSQL is installed and running on your system.
   - Update the database configuration in the `.env` file with your PostgreSQL database credentials.

5. **Create Database:**

    ```bash
    npx sequelize-cli db:create
    ```

6. **Run Migrations:**

    ```bash
    npx sequelize-cli db:migrate
    ```

7. **Start the Server:**

    ```bash
    npm start
    ```

8. **Access the Application:**

   Open your web browser and navigate to `http://localhost:3000` to access the Todo Web Application.

