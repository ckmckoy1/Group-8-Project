# Nature Sporting Goods Ecommerce Payment Processing

## Overview
This project is an implementation of a payment processing system for an eCommerce website that handles credit card authorizations, validates inputs, and interacts with mock payment authorization endpoints. The project consists of two main components:
1. **Frontend**: A static website where customers can input their payment details.
2. **Backend**: A Node.js server that manages the storage of transaction details and communicates with MongoDB.

It also provides UIs for viewing order status and settling shipments.

## Table of Contents
1. [Project Structure](#project-structure)
2. [Technologies Used](#technologies-used)
3. [Prerequisites](#prerequisites)
4. [Installation](#installation)
5. [Frontend](#frontend)
    - [Customer Payment UI](#customer-payment-ui)
6. [Backend](#backend)
    - [Order Management UI](#order-management-ui)
    - [Warehouse UI for Shipment Settlement](#warehouse-ui-for-shipment-settlement)
    - [Database Schema](#database-schema)
7. [Running the Project](#running-the-project)
8. [License](#license)

## Project Structure

| Folder/File        | Description                           |
|--------------------|---------------------------------------|
| `/frontend/assets`  | Images, icons, etc.                   |
| `/frontend/css`     | CSS for styling the UI                |
| `/frontend/js`      | JavaScript files for client-side logic|
| `/frontend/views`   | HTML files for the UIs                |
| `/backend`          | Node.js backend code                  |
| `/backend/models`   | Database schema definitions           |
| `/backend/routes`   | API endpoints and logic               |
| `index.html`        | Main entry point                      |
| `README.md`         | This file                             |
| `server.js`         | Server-side logic                     |

## Technologies Used
- **Frontend:**
  - HTML, CSS, JavaScript
  - Bootstrap (optional for responsive design)
  - GitHub Pages for hosting
- **Backend:**
  - Node.js with Express
  - MongoDB for storing order and transaction details
  - Heroku for hosting the backend
- **Mock Endpoints:**
  - Provided by MA for simulating payment authorization

## Prerequisites
Before running the project, ensure you have the following:
1. **Node.js** installed on your machine.
2. **MongoDB** installed locally or connected to a cloud provider (e.g., MongoDB Atlas).
3. A web browser that supports modern JavaScript.
4. Internet access for fetching the mock payment endpoints.

## Installation

1. **Clone the Repository:**
    ```bash
    git clone https://github.com/ckmckoy1/Group-8-Project.git
    cd Group-8-Project
    ```

### Frontend
2. **Serve the Frontend:**
    - You can deploy the `/frontend` folder to GitHub Pages.
    - Alternatively, serve it locally using a static file server:
    ```bash
    cd frontend
    npx serve
    ```

### Backend
3. **Set up the Backend:**
    - Navigate to the `/backend` folder:
    ```bash
    cd backend
    ```

4. **Install Node.js Dependencies:**
    ```bash
    npm install
    ```

5. **Configure MongoDB:**
    - Update the `MONGODB_URI` in `server.js` with your MongoDB connection string:
    ```javascript
    mongoose.connect('mongodb+srv://ckgaskell:<db_password>@group8.zid4l.mongodb.net/?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true })
    ```

6. **Run the Backend:**
    ```bash
    npm start
    ```

## Frontend

### 1. Customer Payment UI
The customer checkout page allows users to enter their order and credit card details. It includes fields for:

| **Field**            | **Description**                    |
|----------------------|------------------------------------|
| - Order ID           | Auto-generated                     |
| - First Name         | Customer's first name              |
| - Last Name          | Customer's last name               |
| - Address            | Customer's address                 |
| - Credit Card Number | Customer's credit card number      |
| - Expiration Date    | Credit card expiration date        |
| - CVV (Security Code)| Card's CVV security code           |
| - ZIP Code           | Customer's ZIP code                |

### 2. Client-Side Validations
Client-side JavaScript ensures the following validations:

- **Card Expiration Date**: Detects if the credit card is expired.
- **Card Type Detection**: Automatically detects if the card is Visa, MasterCard, or AmEx.
- **Field Masking**: Ensures that sensitive fields like the card number are properly masked during input.

### 3. Mock Endpoints for Payment Authorization
The frontend will interact with mock endpoints to simulate payment authorization:
- [Success Response](https://run.mocky.io/v3/266bd809-da31-49a2-9e05-7a379d941741)
- [Failure Response (Incorrect Card Details)](https://run.mocky.io/v3/023b1b8c-c9dd-40a5-a3bd-b21bcde402d4)
- [Failure Response (Insufficient Funds)](https://run.mocky.io/v3/ef002405-2fd7-4c62-87ee-42b0142cc588)

## Backend

### 4. Order Management UI
A separate UI in the backend allows users to view a list of orders created, along with their payment status. This UI includes sorting and filtering capabilities.

### 5. Warehouse UI for Shipment Settlement
A dedicated interface is provided for warehouse users to:
- Enter an Order ID and the final amount for the shipment.
- If the final amount exceeds the authorized amount, an error message is displayed.
- If the final amount is less than or equal to the authorized amount, a success message is displayed.

## Database Schema
The backend uses MongoDB to store the following details:

**Order Collection:**
- **OrderId:** Unique identifier for the order.
- **Customer Details:** First Name, Last Name, Address.
- **Card Details:** Masked card number, expiration date, etc.
- **Authorization Details:** Token, amount, expiration date, etc.

## Running the Project
**Start MongoDB:** Make sure MongoDB is running locally or on a cloud server.

**Run the Node.js server:**
    ```bash
    npm start
    ```

**Access the Application:** Open your browser and navigate to:
    [https://ckmckoy1.github.io/Group-8-Project/](https://ckmckoy1.github.io/Group-8-Project/)


## License
This project is licensed under the MIT License.
