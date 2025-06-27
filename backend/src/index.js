import express from "express";
import dotenv from "dotenv";
import { User } from "./models/user.models.js";
import { Post } from "./models/post.models.js";
import bcrypt from "bcrypt";
import { connectDB } from "./db/index.js";
import { upload } from "./middleware/multer.js";
import { uploadOnCloud } from "./utils/cloudinary.js";
import { log } from "console";
import jwt from "jsonwebtoken";
import { verifyToken } from "./middleware/auth.js";

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


//  routes //

// Authentication Routes

app.post("/auth/register", upload.single("avatar"), async (req, res) => {
    const { name, username, email, password } = req.body;
    if (!name || !username || !email || !password) {
        return res.status(400).json({ message: "All fields (name, username, email, password) are required." });
    }

    if (!req.file) {
        return res.status(400).json({ message: "Avatar file is required." });
    }

    try {
        const isUserExisted = await User.findOne({ username });
        if (isUserExisted) {
            return res.status(409).json({ message: "Username already exists. Please log in." });
        }

        const cloudResponse = await uploadOnCloud(req.file.path);
        const avatarUrl = cloudResponse?.url || "";

        const user = await User.create({
            name,
            username,
            avatar: avatarUrl,
            email,
            password
        });

        if (!user) {
            return res.status(500).json({ message: "User registration failed." });
        }

        const accessToken = jwt.sign(
            {
                id: user._id,
                username: user.username,
                email: user.email
            },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
        );

        const registeredUser = await User.findById(user._id).select("-password");

        res.status(201).json({
            user: registeredUser,
            accessToken,
            message: "User registered successfully."
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error.", error: error.message });
    }
});


app.post("/auth/login",async(req,res)=>{
    const {username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ message: "All fields (username, email, password) are required." });
    }

    const isUserExisted = await User.findOne({username})
    if(!isUserExisted) return res.status(400).json({message : "User didnt exists Register first "})

    if(!bcrypt.compare(password,isUserExisted.password)){
        return res.status(400).json({message : "Wrong Credentials try again "})
    }

    const accessToken = jwt.sign(
            {
                id: isUserExisted._id,
                username: isUserExisted.username,
                email: isUserExisted.email
            },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
        );

    res.status(200).json({
    user: isUserExisted,
    accessToken,
    message: "User signed in successfully."
    });

})

app.get("/auth/:userId",verifyToken,async(req,res)=>{
    const {userId} = req.params

    const user = await User.findById(userId).select("-password")
    if(!user) return res.status(400).json({message : "User doesnt exists "})

    res.status(200).json({
        user,
        message : "User Details  "})


})

// Post Routes

app.post("/posts",upload.single("coverImage"),verifyToken,async(req,res)=>{
    const {title,content}  = req.body;

    if (!title || !content) {
        return res.status(400).json({ message: "Title and content are required." });
    }

    console.log(req.file);

    const cloudResponse = await uploadOnCloud(req.file.path)
    const coverImageURL = cloudResponse?.url || " "
    
    const post = await Post.create({
        title,
        content,
        coverImage : coverImageURL,
        author : req.user.id
    })

    if(!post) return res.status(401).json({message : "Post not created "})
    
     res.status(200).json({
        post,
        message :  "Post has succesfully crated  "
     })   
})

app.put("/posts/:postId",upload.single("coverImage"),async(req,res)=>{
    const { postId } = req.params;
    const updateData = {};

    // Dynamically add fields to updateData if present in req.body
    if (req.body.title) updateData.title = req.body.title;
    if (req.body.content) updateData.content = req.body.content;

    // If file is uploaded, update coverImage
    if (req.file) {
        const cloudResponse = await uploadOnCloud(req.file.path);
        updateData.coverImage = cloudResponse?.url || " ";
    }

    if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: "At least one field (title, content, coverImage) must be provided to update." });
    }

    const updatedPost = await Post.findByIdAndUpdate(
        postId,
        { $set: updateData },
        { new: true }
    );

    if (!updatedPost) return res.status(401).json({ message: "No post corresponding to given ID" });

    res.status(200).json({
        post: updatedPost,
        message: "Post has been successfully updated"
    });
})

app.delete("/posts/:postId",async(req,res)=>{
    const {postId} = req.params;
    const post = await Post.findById(postId)

    if(!post) return res.status(401).json({message : "No post corresponding to given ID"})

    await Post.findByIdAndDelete(post._id)

    res.status(200).json({
        message : "Post deleted succefully "
    })
})

//get indivisual post 
app.get("/posts/:postId",async(req,res)=>{
    const {postId} = req.params;
    const post = await Post.findById(postId)

    if(!post) return res.status(401).json({message : "No post corresponding to given ID"})

    res.status(200).json({
        post,
        message : "Post fetched succefully "
    })
})

//get all posts (homescreen)
app.get("/posts/getAllPosts",verifyToken, async (req, res) => {
    try {
        const posts = await Post.aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "author",
                    foreignField: "_id",
                    as: "authorDetails"
                }
            },
            {
                $unwind: "$authorDetails"
            },
            {
                $sort: { createdAt: -1 } 
            }
        ]);

        res.status(200).json(posts);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch posts", error: error.message });
    }
});


//get all logged in users posts
app.get("/posts/fetch/mine",verifyToken,async(req,res)=>{
    try {
        const userId = req.user.id
        const myPosts = await Post.find({author : userId}).sort({createdAt : -1})
    
        return res.status(200).json({myPosts}) 
    } catch (error) {
        return res.status(400).json({message : "Error fetching posts",error}) 
    }
})



connectDB()
    .then(() => {
        app.listen(5000, () => {
            console.log("Server running on port 5000");
        });
    })
    .catch((err) => {
        console.error("Failed to connect to DB:", err);
    });
