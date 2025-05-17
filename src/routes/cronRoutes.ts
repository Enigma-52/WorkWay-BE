import { Router } from 'express';
const router = Router();

import greenhouse from '../cron/greenhouse'; 
import lever from '../cron/lever';
import { tweetLatestJobs } from '../cron/twitterBot';

router.get('/greenhouse', greenhouse);
router.get('/lever', lever);
router.get('/tweetLatestJobs', tweetLatestJobs);

export default router;
