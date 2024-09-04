# Nature Sporting Goods Ecommerce Payment Processing

## Overview
This project is an implementation of a payment processing system for an eCommerce website that handles credit card authorizations, validates inputs, and interacts with mock payment authorization endpoints. It includes a frontend where customers can input their payment details and a backend that manages the storage of transaction details. It also provides UIs for viewing order status and settling shipments.

## Table of Contents
1. [Project Structure](#project-structure)
2. [Technologies Used](#technologies-used)
3. [Prerequisites](#prerequisites)
4. [Installation](#installation)
5. [Functionality](#functionality)
    - [Customer Payment UI](#customer-payment-ui)
    - [Client-Side Validations](#client-side-validations)
    - [Mock Endpoints for Payment Authorization](#mock-endpoints-for-payment-authorization)
    - [Order Management UI](#order-management-ui)
    - [Warehouse UI for Shipment Settlement](#warehouse-ui-for-shipment-settlement)
6. [Database Schema](#database-schema)
7. [Running the Project](#running-the-project)
8. [License](#license)

## Project Structure

| Folder/File        | Description                           |
|--------------------|---------------------------------------|
| `/assets`          | Images, icons, etc.                   |
| `/css`             | CSS for styling the UI                |
| `/js`              | JavaScript files for client-side logic|
| `/views`           | HTML files for the UIs                |
| `/server`          | Node.js backend for handling requests |
| `/models`          | Database schema definitions           |
| `index.html`       | Main entry point                      |
| `README.md`        | This file                             |
| `server.js`        | Server-side logic                     |

## Technologies Used
- **Frontend:**
  - HTML, CSS, JavaScript
  - Bootstrap (optional for responsive design)
- **Backend:**
  - Node.js with Express
  - MongoDB for storing order and transaction details
- **Mock Endpoints:**
  - Provided by MA for simulating payment authorization

## Prerequisites
Before running the project, ensure you have the following:
1. **Node.js** installed on your machine.
2. **MongoDB** installed locally or connected to a cloud provider.
3. A web browser that supports modern JavaScript.
4. Internet access for fetching the mock payment endpoints.

## Installation

1. **Clone the Repository:**
    ```bash
    git clone https://github.com/ckmckoy1/Group-8-Project/tree/main.git
    cd nature-sporting-goods-checkout
    ```

2. **Install Node.js Dependencies:**
    ```bash
    npm install
    ```

3. **Configure MongoDB:**
    Make sure MongoDB is running locally or change the `MONGODB_URI` in `server.js` to connect to a remote database.

## Functionality
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
Based on the card details entered, the system will call the following mock endpoints:

- [Success Response](https://run.mocky.io/v3/266bd809-da31-49a2-9e05-7a379d941741)
- [Failure Response (Incorrect Card Details)](https://run.mocky.io/v3/023b1b8c-c9dd-40a5-a3bd-b21bcde402d4)
- [Failure Response (Insufficient Funds)](https://run.mocky.io/v3/ef002405-2fd7-4c62-87ee-42b0142cc588)

### 4. Order Management UI
A separate UI allows users to view a list of orders created, along with their payment status. This UI includes sorting and filtering capabilities, enabling users to search for specific orders based on the criteria they select.

### 5. Warehouse UI for Shipment Settlement
A dedicated interface is provided for Eddie Bauer warehouse users to:

- Enter an Order ID and the final amount for the shipment.
- If the final amount exceeds the authorized amount, an error message is displayed.
- If the final amount is less than or equal to the authorized amount, a success message is displayed.

## Database Schema
The project uses MongoDB to store the following details:

**Order Collection:**

- **OrderId:** Unique identifier for the order.
- **Customer Details:** First Name, Last Name, Address.
- **Card Details:** Masked card number, expiration date, etc.
- **Authorization Details:** Token, amount, expiration date, etc.

**Transaction Collection:**
Stores all transactions with details like authorization status, amount, and timestamps.

## Running the Project
**Start MongoDB:** Make sure MongoDB is running locally or on a cloud server.

**Run the Node.js server:**
    ```bash
    npm start
    ```

**Access the Application:** Open your browser and navigate to:
    ```bash
    http://localhost:3000
    ```

## License
This project is licensed under the MIT License.

