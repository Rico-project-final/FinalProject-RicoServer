import initApp from "./server";
import https from "https"
import fs from "fs"
import agenda from '../src/jobs/agendaThread';
import '../src/jobs/weeklyReviewAnalyzeJob'; // make sure job is loaded


const port = Number(process.env.PORT); // Convert port to a number

initApp().then(async ({app , server}) => {
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

await agenda.start();
await agenda.cancel({ name: 'weekly review analyze' }); // avoid duplicates
await agenda.every('0 9 * * 1', 'weekly review analyze'); // every Monday 9 AM
console.log('📅 Agenda started and weekly review analyze job scheduled.');
});

