const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { createAuth } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const issueRoutes = require('./routes/issues');
const dashboardRoutes = require('./routes/dashboard');
const {notFound,errorHandler}=require('./middleware/errors');
function createApp(config) {
 const app=express(); const auth=createAuth(config);
 app.disable('x-powered-by'); app.use(helmet()); app.use(cors({origin:config.clientOrigin,credentials:true})); app.use(express.json({limit:'32kb'})); app.use(cookieParser());
 app.get('/api/v1/health',(_req,res)=>res.json({status:'ok'}));
 app.use('/api/v1/auth',authRoutes({config,auth})); app.use('/api/v1/issues',issueRoutes({auth})); app.use('/api/v1/dashboard',dashboardRoutes({auth}));
 app.use(notFound); app.use(errorHandler); return app;
}
module.exports={createApp};
