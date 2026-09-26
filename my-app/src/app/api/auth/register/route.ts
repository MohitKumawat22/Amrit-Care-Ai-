import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/supabase";
import bcrypt from "bcryptjs";

/**
 * POST /api/auth/register
 *
 * Handles two registration paths:
 *  1. Patient registration — body contains firstName, lastName, email, username, password
 *  2. Doctor/Staff registration — body contains name, email, password, role
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

    // ── Patient registration path ──
    if (firstName || username) {
      if (!firstName || !lastName || !username) {
        return NextResponse.json(
          { error: "First name, last name and username are required for patient registration." },
          { status: 400 }
        );
      }

      // Check for duplicate email
      const { data: existingEmail } = await supabase
        .from("patients")
        .select("id")
        .eq("email", email.toLowerCase())
        .single();

      if (existingEmail) {
        return NextResponse.json({ error: "An account with this email already exists." }, { status: 400 });
      }

      // Check for duplicate username
      const { data: existingUsername } = await supabase
        .from("patients")
        .select("id")
        .eq("username", username.toLowerCase())
        .single();

      if (existingUsername) {
        return NextResponse.json({ error: "This username is already taken. Please choose another." }, { status: 400 });
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      const { data: newPatient, error: insertErr } = await supabase
        .from("patients")
        .insert({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.toLowerCase().trim(),
          phone: phone?.trim() || "",
          username: username.toLowerCase().trim(),
          password: hashedPassword,
          age: age ? parseInt(String(age), 10) : null,
          blood: blood?.trim() || null,
        })
        .select()
        .single();

      if (insertErr) {
        console.error("Patient insert error:", insertErr);
        return NextResponse.json({ error: "Registration failed." }, { status: 500 });
      }

      return NextResponse.json(
        {
          message: "Patient registered successfully",
          patient: {
            id: newPatient.id,
            firstName: newPatient.first_name,
            lastName: newPatient.last_name,
            email: newPatient.email,
            username: newPatient.username,
            phone: newPatient.phone,
            age: newPatient.age,
            blood: newPatient.blood,
            createdAt: newPatient.created_at,
          },
        },
        { status: 201 }
      );
    }

    // ── Doctor / Staff registration path ──
    if (!name || !role) {
      return NextResponse.json({ error: "Name and role are required for staff registration." }, { status: 400 });
    }

    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email.toLowerCase())
      .single();

    if (existingUser) {
      return NextResponse.json({ error: "User already exists." }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const { data: newUser, error: userErr } = await supabase
      .from("users")
      .insert({
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role,
      })
      .select("id")
      .single();

    if (userErr) {
      console.error("User insert error:", userErr);
      return NextResponse.json({ error: "Registration failed." }, { status: 500 });
    }

    return NextResponse.json(
      { message: "User registered successfully", userId: newUser.id },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Registration Error:", error);
    return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
  }
}
