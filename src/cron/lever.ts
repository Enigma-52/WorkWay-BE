import fetch from "node-fetch";
import prisma from "../db/db";
import { companyNameList } from '../companies/lever';



interface Job {
  id: string;
  text: string;
  updated_at: string;
  hostedUrl: string;
  categories: { location: string };
  createdAt: number;
  additional: string;
  description: string;
  lists: object;
  salaryRange: object;
  workplaceType: string;
  applicants: any;
}

const removeUndefined = (obj: any) =>
  Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined));

const getExperienceLevel = (title: string) => {
  const t = ' ' + title.toLowerCase() + ' ';
  if (t.includes(" intern ") || t.includes(" internship ")) return "Intern";
  if (t.includes(" founder ") || t.includes(" founding ")) return "Founding Team";
  if (t.includes(" lead ") || t.includes(" architect ")) return "Lead";
  if (t.includes(" senior ") || t.includes(" sr. ")) return "Senior";
  if (t.includes(" manager ") || t.includes(" director ")) return "Manager";
  if (t.includes(" staff ") || t.includes(" principal ")) return "Staff";
  if (t.includes(" junior ") || t.includes(" jr. ") || t.includes(" associate ") || t.includes(" assistant ")) return "Junior";
  return "Mid-level";
};

const getEmploymentType = (title: string) => {
  const t = ' ' + title.toLowerCase() + ' ';
  if (t.includes(" intern ") || t.includes(" internship ") || t.includes(" trainee ")) return "Part-Time";
  if (t.includes(" contract ") || t.includes(" temporary ")) return "Contract";
  return "Full-Time";
};

const getDomain = (title: string) => {
  const t = ' ' + title.toLowerCase() + ' ';
  if (t.includes(" android ")) return "Android";
  if (t.includes(" backend ") || t.includes(" back-end ")) return "Backend";
  if (t.includes(" frontend ") || t.includes(" front-end ")) return "Frontend";
  if (t.includes(" ios ")) return "iOS";
  if (t.includes(" full stack ") || t.includes(" fullstack ") || t.includes(" full-stack ")) return "Full-stack";
  if (t.includes(" devops ")) return "DevOps";
  if (t.includes(" data scientist ") || t.includes(" data science") || t.includes(" machine learning ")) return "Data Science";
  return "Other";
};

const formatJobData = (job: Job, company: string) => removeUndefined({
  job_id: job.id,
  title: job.text,
  company: company.charAt(0).toUpperCase() + company.slice(1),
  company_img: `https://logo.clearbit.com/${company.toLowerCase()}.com`,
  updatedAt: new Date(job.createdAt),  
  isExpired: false,
  absolute_url: job.hostedUrl,
  location: job.categories?.location,
  source: "Lever",
  experienceLevel: getExperienceLevel(job.text),
  employmentType: getEmploymentType(job.text),
  domain: getDomain(job.text),
  additional: job.additional,
  description: job.description,
  lists: job.lists,
  salaryRange: job.salaryRange,
  workplaceType: job.workplaceType,
  applicants: job.applicants || 0,
});

const deduplicateJobs = (jobs: any[]) => {
  const map = new Map();
  for (const job of jobs) {
    const key = `${job.title}_${job.company}_${job.location}`.toLowerCase();
    if (!map.has(key) || job.updatedAt > map.get(key).updatedAt) {
      map.set(key, job);
    }
  }
  return Array.from(map.values());
};

const saveJobsToSupabase = async (jobs: any[]) => {
  try {
    // Upsert jobs (update if exists, create if not)
    const upsertPromises = jobs.map(job => 
      prisma.job.upsert({
        where: { job_id: job.job_id },
        update: job,
        create: job,
      })
    );

    await Promise.all(upsertPromises);
    return jobs.length;
  } catch (error) {
    console.error("Error saving jobs to Supabase:", error);
    throw error;
  }
};


const fetchAllJobs = async () => {
  for (const companyName of companyNameList.slice(0, 10)) {
    const url = `https://api.lever.co/v0/postings/${companyName.toLowerCase()}?mode=json`;

    try {
      const response = await fetch(url);
      const rawJobs = await response.json() as [];
      const formattedJobs = rawJobs.map(job => formatJobData(job, companyName));
      const uniqueJobs = deduplicateJobs(formattedJobs);

      console.log(`✅ ${companyName}: Fetched ${rawJobs.length}, Reduced to ${uniqueJobs.length} after deduplication.`);

      const savedCount = await saveJobsToSupabase(uniqueJobs);
      console.log(`📦 Saved ${savedCount} jobs for ${companyName} to Supabase.`);

    } catch (err) {
      console.error(`❌ Error fetching jobs for ${companyName}:`, err);
    }
  }
};

const lever = async () => {
  try {
    console.log("🚀 Starting Lever Job Fetcher...");
    await fetchAllJobs();
    console.log("🎯 Completed fetching all companies.");
  } catch (err) {
    console.error('❌ Unexpected error in Lever fetcher:', err);
  }
};

lever();

export default lever;
