const express = require('express');
require('dotenv').config();

const PORT = process.env.PORT || 3000;


const userRoute = require("./src/controllers/userController")
const salesRoute = require("./src/controllers/salesController");


const app = express();

app.use(express.json())

app.use("/", userRoute);



app.listen(PORT, () => {
    console.log(`App listening on PORT ${PORT}`);
})