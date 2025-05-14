import initApp from "./server";
import https from "https"
import fs from "fs"
import agenda from '../src/jobs/agendaThread';
import '../src/jobs/weeklyReviewAnalyzeJob';
import '../src/jobs/dailyTaskManager'; 
import { initializeSocket } from './socket';

const port = Number(process.env.PORT); 

initApp().then(async ({app , server}) => {
  initializeSocket(server);
  if(process.env.NODE_ENV !== "production"){
  server.listen(port, () => {
    console.log(`Rico app listening at http://localhost:${port}`);
  });
}
// else{
//   const prop = {
//      key : fs.readFileSync("../client-key.pem"),
//      cert : fs.readFileSync("../client-cert.pem")
//   }
//   const httpsServer = https.createServer(prop,app)
// //   initializeSocket(httpsServer)
//   httpsServer.listen(port , '0.0.0.0',   () => {
//     console.log(`Rico app listening at https://localhost:${port}`);
//   });
// }
// try {
//   await agenda.start();
//   console.log('📅 Agenda started successfully');
// } catch (err) {
//   console.error('❌ Failed to start Agenda:', err);
// }

});

