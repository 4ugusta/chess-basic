import express from 'express';
import cors from 'cors';
import { db } from './db';
import dotenv from 'dotenv';
import moveRoutes from './routes/moves';

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
  res.send('Hello, Chess Backend!');
});

app.use('/api', moveRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Handle server shutdown
process.on('SIGINT', async () => {
  await db.$disconnect();
  process.exit(0);
});
