import {v2 as cloudinary} from "cloudinary";
import dotenv from "dotenv";
import fs from "fs";

cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET 
});

export const uploadOnCloud = async(localFilePath)=> {
        try {
            if(!localFilePath) return null;
            //upload file on cloud
            const res = await cloudinary.uploader.upload(localFilePath, {resource_type : "auto"})

            console.log("File uploaded succesfully on cloudinary "+ res.url);
            fs.unlinkSync(localFilePath)
            return res;
            
        } catch (error) {
            fs.unlinkSync(localFilePath) //remove the local saved temp  file 
            return null;
        }
    }

