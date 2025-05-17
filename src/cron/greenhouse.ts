import fetch from 'node-fetch';
import axios from 'axios';
import prisma from '../db/db';
import { companies } from '../companies/greenhouse';

// Type definitions
interface GreenhouseJob {
  id: string;
  title: string;
  updated_at: string;
  absolute_url: string;
  location: { name: string };
  applicants?: number;
}

interface ProcessedJob {
  job_id: string;
  title: string;
  company: string;
  company_img: string;
  updatedAt: Date;
  isExpired: boolean;
  absolute_url: string;
  location: string;
  source: string;
  experienceLevel: string;
  employmentType: string;
  domain: string;
  description: string;
  applicants: number;
}

const baseUrl = "https://boards-api.greenhouse.io/v1/boards/";

// Helper functions
const decodeHTMLEntities = (text: string): string => text
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/&amp;/g, '&');

const matchInTitle = (title: string, keywords: string[]): boolean =>
  keywords.some(k => title.toLowerCase().includes(` ${k.toLowerCase()} `));

const getExperienceLevel = (title: string): string => {
  if (matchInTitle(title, ["intern", "internship"])) return "Intern";
  if (matchInTitle(title, ["founder", "co-founder", "founding"])) return "Founding Team";
  if (matchInTitle(title, ["lead", "architect"])) return "Lead";
  if (matchInTitle(title, ["senior", "sr."])) return "Senior";
  if (matchInTitle(title, ["manager", "director"])) return "Manager";
  if (matchInTitle(title, ["staff", "principal"])) return "Staff";
  if (matchInTitle(title, ["junior", "jr.", "associate", "assistant"])) return "Junior";
  return "Mid-level";
};

const getEmploymentType = (title: string): string => {
  if (matchInTitle(title, ["internship", "intern", "trainee"])) return "Part-Time";
  if (matchInTitle(title, ["contract", "temporary"])) return "Contract";
  return "Full-Time";
};

const getDomain = (title: string): string => {
  const t = ` ${title.toLowerCase()} `;
  if (t.includes(" android ")) return "Android";
  if (t.includes(" backend ") || t.includes(" back-end ")) return "Backend";
  if (t.includes(" frontend ") || t.includes(" front-end ")) return "Frontend";
  if (t.includes(" ios ")) return "iOS";
  if (t.includes(" full stack ") || t.includes(" fullstack ") || t.includes(" full-stack ")) return "Full-stack";
  if (t.includes(" devops ")) return "DevOps";
  if (t.includes(" data scientist ") || t.includes(" data science") || t.includes(" machine learning ")) return "Data Science";
  return "Other";
};

const getGreenhouseDescription = async (company: string, jobId: string): Promise<string> => {
  try {
    const { data } = await axios.get<string>(
      `${baseUrl}${company}/jobs/${jobId}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' }, responseType: 'text' }
    );
    return decodeHTMLEntities(data);
  } catch (error) {
    console.error(`Error fetching description for ${company} job ${jobId}:`, error);
    return '';
  }
};

// Main functions
const fetchGreenhouseJobs = async (company: string): Promise<GreenhouseJob[]> => {
  try {
    const response = await fetch(`${baseUrl}${company.toLowerCase()}/jobs`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json() as { jobs?: GreenhouseJob[] };
    return data.jobs || [];
  } catch (error) {
    console.error(`Error fetching jobs for ${company}:`, error);
    return [];
  }
};

const processGreenhouseJob = async (company: string, job: GreenhouseJob): Promise<ProcessedJob> => ({
  job_id: String(job.id),
  title: job.title,
  company: company.charAt(0).toUpperCase() + company.slice(1),
  company_img: `https://logo.clearbit.com/${company.toLowerCase()}.com`,
  updatedAt: new Date(job.updated_at),
  isExpired: false,
  absolute_url: job.absolute_url,
  location: job.location?.name || 'Remote',
  source: "Greenhouse",
  experienceLevel: getExperienceLevel(job.title),
  employmentType: getEmploymentType(job.title),
  domain: getDomain(job.title),
  description: await getGreenhouseDescription(company, job.id),
  applicants: job.applicants || 0
});

const deduplicateJobs = (jobs: ProcessedJob[]): ProcessedJob[] => {
  const map = new Map<string, ProcessedJob>();
  for (const job of jobs) {
    const key = `${job.title}_${job.company}_${job.location}`.toLowerCase();
    const existing = map.get(key);
    if (!existing || job.updatedAt > existing.updatedAt) {
      map.set(key, job);
    }
  }
  return Array.from(map.values());
};

const saveJobsToSupabase = async (jobs: ProcessedJob[]): Promise<number> => {
  if (!jobs || !Array.isArray(jobs)) {
    console.error('Invalid jobs data:', jobs);
    return 0;
  }

  try {
    const validJobs = jobs.filter(job => {
      if (!job || !job.job_id) {
        console.warn('Skipping invalid job:', job);
        return false;
      }
      return true;
    });

    if (validJobs.length === 0) {
      console.warn('No valid jobs to save');
      return 0;
    }

    const results = await Promise.allSettled(
      validJobs.map(job => 
        prisma.job.upsert({
          where: { job_id: job.job_id },
          update: job,
          create: job,
        }).catch((error: any) => {
          console.error(`Failed to upsert job ${job.job_id}:`, error);
          return null;
        })
      )
    );

    const successfulCount = results.filter(
      (result): result is PromiseFulfilledResult<any> => 
        result.status === 'fulfilled' && result.value !== null
    ).length;

    const failedCount = results.length - successfulCount;
    
    if (failedCount > 0) {
      console.warn(`Failed to save ${failedCount} jobs`);
    }

    return successfulCount;
  } catch (error) {
    console.error("Error saving jobs to Supabase:", error);
    throw error;
  }
};

// Main execution
const greenhouse = async (): Promise<void> => {
  try {
    console.log("🚀 Starting Greenhouse Job Fetcher...");
    
    for (const company of companies) {
      console.log(`🔍 Fetching jobs for ${company}...`);
      const rawJobs = await fetchGreenhouseJobs(company);
      
      const processedJobs = await Promise.all(
        rawJobs.map(job => processGreenhouseJob(company, job))
      );
      
      const uniqueJobs = deduplicateJobs(processedJobs);
      console.log(`✅ ${company}: Fetched ${rawJobs.length}, ${uniqueJobs.length} after deduplication`);

      if (uniqueJobs.length > 0) {
        const savedCount = await saveJobsToSupabase(uniqueJobs);
        console.log(`📦 Saved ${savedCount} jobs for ${company} to Supabase`);
      }
    }
    
    console.log("🎯 Completed fetching all companies.");
  } catch (error) {
    console.error('❌ Unexpected error in Greenhouse fetcher:', error);
  } finally {
    await prisma.$disconnect();
  }
};

export default greenhouse;