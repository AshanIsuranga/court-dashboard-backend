const express = require('express');
require('dotenv').config();
const cors = require('cors');

const { testDB } = require('./config/db'); 

const BASE_API_PATH = '/court-web-portal/api';

const AuthRoutes = require('./routes/Auth');
const caseRoutes = require('./routes/Cases');
const scheduleRoutes = require('./routes/schedules');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
  origin: '*'
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test DB when server starts
testDB();

app.use(`${BASE_API_PATH}/auth`, AuthRoutes);
app.use(`${BASE_API_PATH}/cases`, caseRoutes);
app.use(`${BASE_API_PATH}/schedules`, scheduleRoutes);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

module.exports = app;