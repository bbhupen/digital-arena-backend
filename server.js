const express = require('express');
require('dotenv').config();

const PORT = process.env.PORT || 3000;


const userRoute = require("./src/controllers/userController");
const customerRoute = require("./src/controllers/customerController");
const purchaseRoute = require("./src/controllers/purchaseController");


const app = express();

app.use(express.json())

app.use("/", userRoute);
app.use("/", customerRoute);
app.use("/", purchaseRoute);



app.listen(PORT, () => {
    console.log(`App listening on PORT ${PORT}`);
})