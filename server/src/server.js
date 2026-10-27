require('dotenv').config({path:require('node:path').resolve(__dirname,'../../.env')});
const mongoose=require('mongoose'); const {loadConfig}=require('./config/env'); const {createApp}=require('./app');
async function start(){const config=loadConfig(); await mongoose.connect(config.mongoUri, {serverSelectionTimeoutMS:5000}); const server=createApp(config).listen(config.port,()=>console.log(`CampusFix API listening on http://localhost:${config.port}`));
 const shutdown=async()=>{server.close();await mongoose.disconnect();process.exit(0)};process.on('SIGINT',shutdown);process.on('SIGTERM',shutdown);}
start().catch(err=>{console.error(`CampusFix startup failed: ${err.message}`);process.exit(1)});
