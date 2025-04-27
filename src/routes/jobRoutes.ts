import { Router } from 'express';
import { getPaginatedJobs } from '../controllers/jobController';

const router = Router();

// GET /api/jobs
router.get('/', async (req, res) => {
    await getPaginatedJobs(req, res);
  });
  
export default router;
