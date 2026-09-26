import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Patient from "@/models/Patient";
import User from "@/models/User";
import bcrypt from "bcryptjs";

/**
 * POST /api/auth/register
 *
 * Handles two registration paths:
 *  1. Patient registration — body contains firstName, lastName, email, username, password
 *  2. Doctor/Staff registration — body contains name, email, password, role
 *
 * The caller determines the path via the presence of `role` (doctor) vs. `username` (patient).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, role, firstName, lastName, username, phone, age, blood } = body;

    // ── Basic validation ──
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    await connectDB();

    // ── Patient registration path ──
    if (firstName || username) {
      if (!firstName || !lastName || !username) {
        return NextResponse.json(
          { error: "First name, last name and username are required for patient registration." },
          { status: 400 }
        );
      }

      // Check for duplicates
      const existingEmail = await Patient.findOne({ email: email.toLowerCase() });
      if (existingEmail) {
        return NextResponse.json({ error: "An account with this email already exists." }, { status: 400 });
      }

      const existingUsername = await Patient.findOne({ username: username.toLowerCase() });
      if (existingUsername) {
        return NextResponse.json({ error: "This username is already taken. Please choose another." }, { status: 400 });
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      const newPatient = await Patient.create({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.toLowerCase().trim(),
        phone: phone?.trim() || "",
        username: username.toLowerCase().trim(),
        password: hashedPassword,
        age: age ? parseInt(String(age), 10) : undefined,
        blood: blood?.trim() || undefined,
      });

      return NextResponse.json(
        {
          message: "Patient registered successfully",
          patient: {
            id: newPatient._id,
            firstName: newPatient.firstName,
            lastName: newPatient.lastName,
            email: newPatient.email,
            username: newPatient.username,
            phone: newPatient.phone,
            age: newPatient.age,
            blood: newPatient.blood,
            createdAt: newPatient.createdAt,
          },
        },
        { status: 201 }
      );
    }

    // ── Doctor / Staff registration path ──
    if (!name || !role) {
      return NextResponse.json({ error: "Name and role are required for staff registration." }, { status: 400 });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json({ error: "User already exists." }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
    });

    return NextResponse.json(
      { message: "User registered successfully", userId: newUser._id },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Registration Error:", error);
    return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
  }
}
