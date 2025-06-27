import mongoose from "mongoose";
import bcrypt from "bcrypt";


const userSchema = new mongoose.Schema({
    name:{
        type : String,
        require : true
    },
    username:{
        type : String,
        require : true,
        unique : true
    },
    avatar : {
        type : String, 
        default : ""
    },
    email:{
        type : String,
        require : true,
    },
    password : {
        type :String,
        require : true
    }
},{timestamps: true})


userSchema.pre("save",async function(next){
    if(!this.isModified("password")){
        return next();
    }
    this.password = await bcrypt.hash(this.password,10);
    next();
})


export const User = mongoose.model("User",userSchema)