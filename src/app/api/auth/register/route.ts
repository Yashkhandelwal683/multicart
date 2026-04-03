import connectDb from "@/lib/db";
import User from "@/models/user.model";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req:NextRequest) {
    try {
        await connectDb()
        
        const text = await req.text()
        console.log("Raw request text:", text)
        
        if (!text) {
            return NextResponse.json({message:"Request body is empty"},{status:400})
        }
        
        let body
        try {
            body = JSON.parse(text)
        } catch (pe) {
            return NextResponse.json({message:"Invalid JSON: " + text}, {status:400})
        }
        
        console.log("Parsed body:", body)
        
        const {name, email, password, isAdmin} = body
        
        const existUser = await User.findOne({email})
        if(existUser){
            return NextResponse.json(
                {message:"User already exist"},
            {status:400})
        }
        if(isAdmin){
            const existingAdmin = await User.findOne({role:"admin"})
            if(existingAdmin){
                return NextResponse.json(
                    {message:"Admin already exists. Only one admin is allowed."},
                {status:403})
            }
        }
        if(password.length < 6){
             return NextResponse.json(
                {message:"Password must be atleast six characters"},
            {status:400})
        }
        const hashedPassword = await bcrypt.hash(password,10)
        const user = await User.create({
            name ,
            email , 
            password : hashedPassword,
            role: isAdmin ? "admin" : "user"
        })
        return NextResponse.json(
                {user},
            {status:200})

    } catch (error) {
        return NextResponse.json(
                {message:`register error ${error}`},
            {status:500})
    }
    
}