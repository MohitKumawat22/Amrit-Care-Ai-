import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Patient from "@/models/Patient";
import Appointment from "@/models/Appointment";
import Medicine from "@/models/Medicine";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    await connectDB();

    const hashedPassword = await bcrypt.hash("demo123456", 10);
    const today = new Date().toISOString().split("T")[0];

    // Clear existing test data
    await Patient.deleteMany({ username: { $in: ["rahul_k", "priya_s", "anjali_m", "vikram_s", "sneha_p"] } });
    await Medicine.deleteMany({});

    // Seed Patients with valid schema fields
    const patients = await Patient.create([
      {
        firstName: "Rahul",
        lastName: "Kumar",
        email: "rahul@example.com",
        username: "rahul_k",
        password: hashedPassword,
        phone: "+91 9876543210",
        age: 45,
        blood: "A+",
      },
      {
        firstName: "Priya",
        lastName: "Sharma",
        email: "priya@example.com",
        username: "priya_s",
        password: hashedPassword,
        phone: "+91 9876543211",
        age: 32,
        blood: "B+",
      },
      {
        firstName: "Anjali",
        lastName: "Mehta",
        email: "anjali@example.com",
        username: "anjali_m",
        password: hashedPassword,
        phone: "+91 9876543212",
        age: 60,
        blood: "O-",
      },
      {
        firstName: "Vikram",
        lastName: "Singh",
        email: "vikram@example.com",
        username: "vikram_s",
        password: hashedPassword,
        phone: "+91 9876543213",
        age: 29,
        blood: "AB+",
      },
      {
        firstName: "Sneha",
        lastName: "Patel",
        email: "sneha@example.com",
        username: "sneha_p",
        password: hashedPassword,
        phone: "+91 9876543214",
        age: 38,
        blood: "A-",
      },
    ]);

    // Seed Medicines
    const medicines = await Medicine.create([
      { name: "Paracetamol 500mg", type: "tablet", stock: 800, lowStockThreshold: 50 },
      { name: "Amoxicillin 250mg", type: "capsule", stock: 40, lowStockThreshold: 50 },
      { name: "Metformin 500mg", type: "tablet", stock: 325, lowStockThreshold: 50 },
      { name: "Atorvastatin 10mg", type: "tablet", stock: 24, lowStockThreshold: 30 },
      { name: "Ibuprofen 400mg", type: "tablet", stock: 275, lowStockThreshold: 50 },
    ]);

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully",
      counts: {
        patients: patients.length,
        medicines: medicines.length,
      },
    });
  } catch (error: any) {
    console.error("Seed Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
