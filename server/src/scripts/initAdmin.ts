import bcrypt from 'bcryptjs';
import { connectMongoDB, disconnectMongoDB } from '../config/db.js';
import { config } from '../config/env.js';
import { User } from '../models/User.js';

async function initAdmin() {
  console.log('[Init Admin] Connecting to MongoDB...');
  await connectMongoDB();

  try {
    const existingAdmin = await User.findOne({ email: config.admin.email });
    if (existingAdmin) {
      console.log(`[Init Admin] Admin already exists: ${existingAdmin.email} (${existingAdmin.name})`);
    } else {
      const passwordHash = await bcrypt.hash(config.admin.password, 10);
      const admin = await User.create({
        name: config.admin.name,
        email: config.admin.email,
        passwordHash,
        role: 'admin',
        studentIdCode: config.admin.studentId,
        department: config.admin.department,
      });

      console.log(`[Init Admin] Successfully created admin account:`);
      console.log(`  Name:  ${admin.name}`);
      console.log(`  Email: ${admin.email}`);
      console.log(`  Role:  ${admin.role}`);
      console.log(`  Dept:  ${admin.department}`);
    }
  } catch (error) {
    console.error('[Init Admin] Error initializing admin:', error);
  } finally {
    await disconnectMongoDB();
  }
}

initAdmin();
