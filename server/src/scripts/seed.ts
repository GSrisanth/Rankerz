import bcrypt from 'bcryptjs';
import { Types } from 'mongoose';
import { connectMongoDB, disconnectMongoDB } from '../config/db.js';
import { connectRedis, disconnectRedis } from '../config/redis.js';
import { config } from '../config/env.js';
import { User, IUser } from '../models/User.js';
import { Contest } from '../models/Contest.js';
import { Submission } from '../models/Submission.js';
import { Participation } from '../models/Participation.js';
import { RedisLeaderboardService } from '../services/redisLeaderboard.service.js';

const SAMPLE_STUDENTS = [
  { name: 'Arjun Sharma', email: 'arjun.sharma@rankerz.edu', studentIdCode: '23BCE1001', dept: 'CSE' },
  { name: 'Priya Patel', email: 'priya.patel@rankerz.edu', studentIdCode: '23BCE1042', dept: 'CSE' },
  { name: 'Rahul Varma', email: 'rahul.varma@rankerz.edu', studentIdCode: '23BAI1015', dept: 'AI&ML' },
  { name: 'Ananya Iyer', email: 'ananya.iyer@rankerz.edu', studentIdCode: '23BDS1008', dept: 'Data Science' },
  { name: 'Rohan Gupta', email: 'rohan.gupta@rankerz.edu', studentIdCode: '23BCE1120', dept: 'CSE' },
  { name: 'Sneha Nair', email: 'sneha.nair@rankerz.edu', studentIdCode: '23BEC1033', dept: 'ECE' },
  { name: 'Aditya Rao', email: 'aditya.rao@rankerz.edu', studentIdCode: '23BCE1055', dept: 'CSE' },
  { name: 'Pooja Reddy', email: 'pooja.reddy@rankerz.edu', studentIdCode: '23BAI1088', dept: 'AI&ML' },
  { name: 'Vikram Deshmukh', email: 'vikram.d@rankerz.edu', studentIdCode: '23BIT1012', dept: 'IT' },
  { name: 'Kavya Subramanian', email: 'kavya.s@rankerz.edu', studentIdCode: '23BDS1044', dept: 'Data Science' },
  { name: 'Siddharth Jain', email: 'siddharth.j@rankerz.edu', studentIdCode: '23BCE1099', dept: 'CSE' },
  { name: 'Divya Krishnan', email: 'divya.k@rankerz.edu', studentIdCode: '23BEC1077', dept: 'ECE' },
  { name: 'Manish Mehra', email: 'manish.m@rankerz.edu', studentIdCode: '23BME1005', dept: 'Mechanical' },
  { name: 'Ishita Banerjee', email: 'ishita.b@rankerz.edu', studentIdCode: '23BCE1150', dept: 'CSE' },
  { name: 'Gaurav Kulkarni', email: 'gaurav.k@rankerz.edu', studentIdCode: '23BAI1060', dept: 'AI&ML' },
  { name: 'Tanvi Joshi', email: 'tanvi.j@rankerz.edu', studentIdCode: '23BDS1090', dept: 'Data Science' },
  { name: 'Karthik Menon', email: 'karthik.m@rankerz.edu', studentIdCode: '23BIT1040', dept: 'IT' },
  { name: 'Meera Nambiar', email: 'meera.n@rankerz.edu', studentIdCode: '23BEC1018', dept: 'ECE' },
  { name: 'Nikhil Agarwal', email: 'nikhil.a@rankerz.edu', studentIdCode: '23BCE1210', dept: 'CSE' },
  { name: 'Sanjana Chawla', email: 'sanjana.c@rankerz.edu', studentIdCode: '23BAI1112', dept: 'AI&ML' },
  { name: 'Varun Pillai', email: 'varun.p@rankerz.edu', studentIdCode: '23BCE1084', dept: 'CSE' },
  { name: 'Shruti Hegde', email: 'shruti.h@rankerz.edu', studentIdCode: '23BDS1025', dept: 'Data Science' },
  { name: 'Harish Choudhary', email: 'harish.c@rankerz.edu', studentIdCode: '23BEC1091', dept: 'ECE' },
  { name: 'Deepika Sen', email: 'deepika.s@rankerz.edu', studentIdCode: '23BIT1082', dept: 'IT' },
  { name: 'Abhishek Roy', email: 'abhishek.r@rankerz.edu', studentIdCode: '23BCE1175', dept: 'CSE' },
  { name: 'Ritu Bhattacharya', email: 'ritu.b@rankerz.edu', studentIdCode: '23BAI1034', dept: 'AI&ML' },
  { name: 'Kunal Kapoor', email: 'kunal.k@rankerz.edu', studentIdCode: '23BME1032', dept: 'Mechanical' },
  { name: 'Swati Sundaram', email: 'swati.s@rankerz.edu', studentIdCode: '23BDS1061', dept: 'Data Science' },
  { name: 'Yashvardhan Mishra', email: 'yash.m@rankerz.edu', studentIdCode: '23BCE1230', dept: 'CSE' },
  { name: 'Aparna Varma', email: 'aparna.v@rankerz.edu', studentIdCode: '23BEC1050', dept: 'ECE' },
  { name: 'Pranav Saxena', email: 'pranav.s@rankerz.edu', studentIdCode: '23BCE1070', dept: 'CSE' },
  { name: 'Bhavna Chauhan', email: 'bhavna.c@rankerz.edu', studentIdCode: '23BAI1072', dept: 'AI&ML' },
  { name: 'Rishi Nanda', email: 'rishi.n@rankerz.edu', studentIdCode: '23BCV1009', dept: 'Civil' },
  { name: 'Tara Venkatesh', email: 'tara.v@rankerz.edu', studentIdCode: '23BDS1019', dept: 'Data Science' },
  { name: 'Saurabh Pandey', email: 'saurabh.p@rankerz.edu', studentIdCode: '23BCE1188', dept: 'CSE' },
];

async function seed() {
  console.log('===============================================================');
  console.log('  RANKERZ SEED SCRIPT — Populating MongoDB & Redis Data Stores');
  console.log('===============================================================');

  await connectMongoDB();
  await connectRedis();

  try {
    // 1. Ensure Admin exists
    let admin = await User.findOne({ email: config.admin.email });
    if (!admin) {
      const passwordHash = await bcrypt.hash(config.admin.password, 10);
      admin = await User.create({
        name: config.admin.name,
        email: config.admin.email,
        passwordHash,
        role: 'admin',
        studentIdCode: config.admin.studentId,
        department: config.admin.department,
      });
      console.log(`[Seed] Created admin: ${admin.name} (${admin.email})`);
    } else {
      console.log(`[Seed] Existing admin found: ${admin.email}`);
    }

    // 2. Seed Student Accounts
    console.log(`[Seed] Seeding ${SAMPLE_STUDENTS.length} student accounts...`);
    const defaultStudentPassword = await bcrypt.hash('StudentRankerz@2025', 10);
    const studentDocs: IUser[] = [];

    for (const s of SAMPLE_STUDENTS) {
      let user = await User.findOne({ email: s.email });
      if (!user) {
        user = await User.create({
          name: s.name,
          email: s.email,
          passwordHash: defaultStudentPassword,
          role: 'student',
          studentIdCode: s.studentIdCode,
          department: s.dept,
        });
      }
      studentDocs.push(user);
    }
    console.log(`[Seed] ${studentDocs.length} student accounts verified.`);

    // 3. Create Contests
    console.log('[Seed] Seeding Contests...');
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 3600000);
    const twoHoursLater = new Date(now.getTime() + 7200000);
    const yesterdayStart = new Date(now.getTime() - 86400000);
    const yesterdayEnd = new Date(now.getTime() - 82800000);
    const tomorrowStart = new Date(now.getTime() + 86400000);
    const tomorrowEnd = new Date(now.getTime() + 90000000);

    const CONTEST_SPECS = [
      {
        title: 'CodeSprint 2025: Grand Algorithmic Championship',
        description: 'Flagship competitive coding battle covering Dynamic Programming, Graph Theory, and Redis Skip-List optimizations.',
        contestType: 'coding_contest' as const,
        startTime: oneHourAgo,
        endTime: twoHoursLater,
        durationMinutes: 180,
        status: 'live' as const,
        maxParticipants: 500,
        maxScore: 1000,
        scorePrecision: 0,
        scoringRule: 'best_attempt' as const,
        tieBreakingRule: 'earlier_submission' as const,
      },
      {
        title: 'CSE3009 NoSQL Mid-Term Theory & Query Exam',
        description: 'Comprehensive assessment on Key-Value, Document, Columnar, and Graph NoSQL paradigms, CAP theorem, and Mongoose Aggregations.',
        contestType: 'exam' as const,
        startTime: yesterdayStart,
        endTime: yesterdayEnd,
        durationMinutes: 60,
        status: 'completed' as const,
        maxParticipants: 100,
        maxScore: 100,
        scorePrecision: 1,
        scoringRule: 'latest_attempt' as const,
        tieBreakingRule: 'earlier_submission' as const,
      },
      {
        title: 'Data Structures & Graph Algorithms Blitz',
        description: 'Fast-paced live contest focusing on Trees, Priority Queues, Dijkstra, and Topological Sort.',
        contestType: 'coding_contest' as const,
        startTime: oneHourAgo,
        endTime: twoHoursLater,
        durationMinutes: 90,
        status: 'live' as const,
        maxParticipants: 200,
        maxScore: 300,
        scorePrecision: 0,
        scoringRule: 'best_attempt' as const,
        tieBreakingRule: 'earlier_submission' as const,
      },
      {
        title: 'AI & Deep Learning Hackathon Qualifiers',
        description: 'Qualifier round for Transformer architecture design, model fine-tuning, and vector similarity retrieval.',
        contestType: 'coding_contest' as const,
        startTime: tomorrowStart,
        endTime: tomorrowEnd,
        durationMinutes: 120,
        status: 'scheduled' as const,
        maxParticipants: 300,
        maxScore: 500,
        scorePrecision: 0,
        scoringRule: 'latest_attempt' as const,
        tieBreakingRule: 'fewest_attempts' as const,
      },
    ];

    const contestDocs = [];
    for (const spec of CONTEST_SPECS) {
      let contest = await Contest.findOne({ title: spec.title });
      if (!contest) {
        contest = await Contest.create({
          ...spec,
          createdBy: admin._id,
        });
      } else {
        // Ensure status and rules are up to date
        contest.status = spec.status;
        contest.startTime = spec.startTime;
        contest.endTime = spec.endTime;
        contest.maxScore = spec.maxScore;
        await contest.save();
      }
      contestDocs.push(contest);
    }
    console.log(`[Seed] ${contestDocs.length} contests configured.`);

    // 4. Seed Participations, Submissions, and Redis Sorted Sets
    console.log('[Seed] Generating Participations, Submissions, and Redis Sorted Sets...');

    for (const contest of contestDocs) {
      const contestId = contest._id.toString();
      // Clear existing Redis Sorted Set for clean repeatable state
      await RedisLeaderboardService.clearLeaderboard(contestId);

      // Determine how many students participate in this contest
      const participantCount = contest.status === 'scheduled' ? 12 : studentDocs.length;
      const participants = studentDocs.slice(0, participantCount);

      console.log(`  -> Contest: "${contest.title}" (${contest.status}) — Seeding ${participants.length} participants...`);

      for (let i = 0; i < participants.length; i++) {
        const student = participants[i];
        const studentId = student._id.toString();

        if (contest.status === 'scheduled') {
          // Just registered, no submissions yet
          await Participation.findOneAndUpdate(
            { contestId: contest._id, studentId: student._id },
            {
              contestId: contest._id,
              studentId: student._id,
              currentScore: 0,
              bestScore: 0,
              attemptsCount: 0,
              participationStatus: 'registered',
              registeredAt: new Date(now.getTime() - Math.floor(Math.random() * 86400000)),
            },
            { upsert: true, new: true }
          );
          await RedisLeaderboardService.updateScore(contestId, studentId, 0, 0);
          continue;
        }

        // For live and completed contests, simulate realistic scores with natural distribution
        // Top 5 students score high (85-98%), mid-range students score (55-84%), bottom score (20-50%)
        const max = contest.maxScore;
        let baseScorePct: number;
        if (i < 5) {
          baseScorePct = 0.88 + Math.random() * 0.11; // 88% - 99%
        } else if (i < 18) {
          baseScorePct = 0.65 + Math.random() * 0.22; // 65% - 87%
        } else if (i < 28) {
          baseScorePct = 0.45 + Math.random() * 0.20; // 45% - 65%
        } else {
          baseScorePct = 0.20 + Math.random() * 0.25; // 20% - 45%
        }

        const calculatedFinalScore = Math.round(max * baseScorePct);
        const completionTimeMs = Math.floor(10000 + (1 - baseScorePct) * 180000 + Math.random() * 15000);

        // Generate 1 to 3 historical submission attempts
        const attemptsCount = i % 4 === 0 ? 3 : i % 2 === 0 ? 2 : 1;
        let lastSubmissionId: Types.ObjectId | undefined;

        for (let a = 1; a <= attemptsCount; a++) {
          const attemptScore =
            a === attemptsCount ? calculatedFinalScore : Math.round(calculatedFinalScore * (0.6 + a * 0.15));

          const sub = await Submission.create({
            contestId: contest._id,
            studentId: student._id,
            score: attemptScore,
            maximumScore: contest.maxScore,
            percentage: Number(((attemptScore / contest.maxScore) * 100).toFixed(1)),
            completionTimeMs: Math.floor(completionTimeMs * (0.8 + a * 0.1)),
            attemptNumber: a,
            status: 'evaluated',
            submittedAt: new Date(contest.startTime.getTime() + a * 600000 + i * 30000),
          });

          lastSubmissionId = sub._id as Types.ObjectId;
        }

        // Upsert Participation
        await Participation.findOneAndUpdate(
          { contestId: contest._id, studentId: student._id },
          {
            contestId: contest._id,
            studentId: student._id,
            currentScore: calculatedFinalScore,
            bestScore: calculatedFinalScore,
            attemptsCount,
            latestSubmissionId: lastSubmissionId,
            participationStatus: 'submitted',
            registeredAt: contest.startTime,
            lastUpdatedAt: new Date(),
          },
          { upsert: true, new: true }
        );

        // Update Redis Sorted Set (ZADD) with deterministic tie-breaker
        await RedisLeaderboardService.updateScore(contestId, studentId, calculatedFinalScore, completionTimeMs);
      }

      // Verify Redis Sorted Set count
      const redisTotal = await RedisLeaderboardService.getTotalParticipants(contestId);
      console.log(`    ✓ Redis Sorted Set populated: ${redisTotal} members in contest:${contestId}:leaderboard`);
    }

    console.log('===============================================================');
    console.log('  SEEDING COMPLETED SUCCESSFULLY!');
    console.log('===============================================================');
    console.log('Admin Credentials:');
    console.log(`  Email:    ${config.admin.email}`);
    console.log(`  Password: ${config.admin.password}`);
    console.log('Student Test Credentials:');
    console.log(`  Email:    student1: arjun.sharma@rankerz.edu / StudentRankerz@2025`);
    console.log(`  Email:    student2: priya.patel@rankerz.edu  / StudentRankerz@2025`);
    console.log('===============================================================');
  } catch (error) {
    console.error('[Seed] Error during seeding:', error);
  } finally {
    await disconnectMongoDB();
    await disconnectRedis();
  }
}

seed();
