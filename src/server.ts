import express, { Request, Response } from 'express';
import jobRoutes from './routes/jobRoutes';

const app = express();
const port = Number(process.env.PORT) || 8080;

app.get('/', (req: Request, res: Response) => {
  res.send('Hello, world!');
});

app.use('/api/jobs', jobRoutes);


app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});