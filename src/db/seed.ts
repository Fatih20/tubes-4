import "dotenv/config";
import { hashPasswordNode } from "@/lib/authUtils";
import db from "./index";
import { usersTable, courseTable } from "./schema";
import { generateKeyPair, keyToPEM } from "@/lib/crypto/rsa";
import { randomBytes } from "node:crypto";

async function seed() {
  console.log("Seeding database...");

  try {
    const initialData = [
      // Head Users
      {
        username: "yudis",
        role: "head",
      },
      {
        username: "baskara",
        role: "head",
      },
      // Advisor Users
      {
        username: "fazat",
        role: "advisors",
      },
      {
        username: "cya",
        role: "advisors",
      },
      {
        username: "imam",
        role: "advisors",
      },
      {
        username: "catur",
        role: "advisors",
      },
      {
        username: "dessy",
        role: "advisors",
      },
      // Student Users
      {
        username: "akbar",
        role: "students",
      },
      {
        username: "fatih",
        role: "students",
      },
      {
        username: "jazmy",
        role: "students",
      },
      {
        username: "johan",
        role: "students",
      },
      {
        username: "frankie",
        role: "students",
      },
    ];

    const userSeeds = initialData.map((seed) => {
      const key = generateKeyPair();

      return {
        username: seed.username,
        role: seed.role as "students" | "advisors" | "head",
        password: hashPasswordNode("password"),
        privateKey: keyToPEM(key.privateKey),
        publicKey: keyToPEM(key.publicKey),
        encryptionKey: randomBytes(32).toString("hex"),
      };
    });

    const seedCourses = [
      { code: "CS101", name: "Introduction to Computer Science", credits: 3 },
      { code: "MA201", name: "Calculus I", credits: 4 },
      { code: "PHY202", name: "University Physics I", credits: 4 },
      { code: "ENG101", name: "English Composition", credits: 3 },
      { code: "HIS103", name: "World History", credits: 3 },
      { code: "CHEM101", name: "General Chemistry", credits: 4 },
      { code: "PSY101", name: "Introduction to Psychology", credits: 3 },
      { code: "ECO201", name: "Principles of Microeconomics", credits: 3 },
      { code: "ART100", name: "Art Appreciation", credits: 2 },
      { code: "PE101", name: "Foundations of Physical Wellness", credits: 1 },
    ];

    // Insert Users
    console.log("Seeding users...");
    await db.insert(usersTable).values(userSeeds).onConflictDoNothing();

    // Insert Courses
    console.log("Seeding courses...");
    await db.insert(courseTable).values(seedCourses).onConflictDoNothing();

    console.log("Database seeding completed successfully.");
  } catch (error) {
    console.error("Error during database seeding:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

seed();
