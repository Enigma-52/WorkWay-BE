import express, { Request, Response } from 'express';
import jobRoutes from './routes/jobRoutes';
import cronRoutes from './routes/cronRoutes';
import cors from "cors";


const app = express();

app.use(cors()); 


const port = Number(process.env.PORT) || 8080;

app.get('/', (req: Request, res: Response) => {
  res.send('Hello, world!');
});

app.use('/api/jobs', jobRoutes);
app.use('/api/cron', cronRoutes);


app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});