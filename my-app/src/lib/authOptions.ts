import { NextAuthOptions } from"next-auth";
import CredentialsProvider from"next-auth/providers/credentials";
import connectDB from"@/lib/mongodb";
import User from"@/models/User";
import bcrypt from"bcryptjs";

export const authOptions: NextAuthOptions = {
 providers: [
 CredentialsProvider({
 name:"credentials",
 credentials: {
 email: { label:"Email", type:"email" },
 password: { label:"Password", type:"password" },
 },
 async authorize(credentials) {
 if (!credentials?.email || !credentials?.password) {
 throw new Error("Missing credentials");
 }

 await connectDB();
 const user = await User.findOne({ email: credentials.email });

 if (!user || !user.password) {
 throw new Error("Invalid credentials");
 }

 const isCorrectPassword = await bcrypt.compare(
 credentials.password,
 user.password
 );

 if (!isCorrectPassword) {
 throw new Error("Invalid credentials");
 }

 return {
 id: user._id.toString(),
 name: user.name,
 email: user.email,
 role: user.role,
 };
 },
 }),
 ],
 callbacks: {
 async jwt({ token, user }) {
 if (user) {
 token.id = user.id;
 token.role = (user as any).role;
 }
 return token;
 },
 async session({ session, token }) {
 if (session.user) {
 (session.user as any).id = token.id;
 (session.user as any).role = token.role;
 }
 return session;
 },
 },
 session: {
 strategy:"jwt",
 },
  secret: process.env.NEXTAUTH_SECRET || "amritcare-nextauth-dev-secret-key-32chars-min!",
  pages: {
    signIn: "/doctor/login",
  },
};
