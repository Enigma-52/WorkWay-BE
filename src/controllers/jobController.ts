// src/controllers/jobController.ts
import { Request, Response } from 'express';
import { JobService } from '../services/jobService';
import { jobQuerySchema } from '../validators/jobValidators';  

export const getPaginatedJobs = async (req: Request, res: Response) => {
  try {
    // Extract filters and pagination data from the validated query
    const { lastPageMarker, pageSize, title, company, location, experienceLevel, employmentType, domain, workplaceType } = req.query;

    // Use JobService to fetch filtered jobs
    const jobs = await JobService.getJobsPaginated(
      lastPageMarker as string | undefined,
      Number(pageSize),
      {
        title: title as string | undefined,
        company: company as string | undefined,
        location: location as string | undefined,
        experienceLevel: experienceLevel as string | undefined,
        employmentType: employmentType as string | undefined,
        domain: domain as string | undefined,
        workplaceType: workplaceType as string | undefined,
      }
    );

    res.status(200).json(jobs);
  } catch (error) {
    console.error('Error fetching paginated jobs:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
