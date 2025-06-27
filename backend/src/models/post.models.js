import mongoose, { mongo } from "mongoose";

const postSchema = new mongoose.Schema({
    title:{
        type : String,
        retuire : true
    },
    content : {
        type : String,
        retuire : true
    },
    coverImage : {
        type : String,
        default : ""
    },
    author : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
        retuire : true
    }
    
},{timestamps : true})

export const Post = mongoose.model("Post",postSchema);