import { Router, Request, Response } from 'express';
import { db } from '../db';

const router = Router();

// Endpoint to get moves for a specific game
router.get('/games/:gameId/moves', async (req: Request, res: Response) => {
  const { gameId } = req.params;

  try {
    const moves = await db.move.findMany({
      where: { gameId: parseInt(gameId) },
      orderBy: { createdAt: 'asc' },
      include: {
        player: true, // Include player information
      },
    });
    console.log('Fetched moves:', moves);
    res.json(moves);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching moves' });
  }
});

export default router;
