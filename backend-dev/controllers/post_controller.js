import Notification from "../models/notification_model.js";
import Post from "../models/post_model.js";
import User from "../models/user.model.js";
import { v2 as cloudinary } from "cloudinary";

// Create Post
export const createPost = async (req, res) => {
  try {
    const { text } = req.body;
    let { img } = req.body; // because reassign the imgages so we use let
    // get user id
    const userId = req.user._id.toString();

    // check user existed or not
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User Not Found" });

    if (!text && !img) {
      return res.status(400).json({ error: "Post must have text or image" });
    }

    //img upload in cloudinary
    if (img) {
      const uploadedResponse = await cloudinary.uploader.upload(img);
      img = uploadedResponse.secure_url;
    }

    // new Post
    const newPost = new Post({
      user: userId,
      text,
      img,
    });

    await newPost.save();
    res.status(201).json(newPost);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
    console.log("Error in createPost controller: ", error);
  }
};

// Delete Posts
export const deletePost = async (req, res) => {
  try {
    // get post
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // check you are the Owner of Post
    if (post.user.toString() !== req.user._id.toString()) {
      return res
        .status(401)
        .json({ error: "You are not authorized to delete this Post" });
    }

    // img delete from cloudinary
    if (post.img) {
      const imgId = post.img.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(imgId);
    }

    // delete document from the mongoDb
    await Post.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Post delete Successfully" });
  } catch (error) {
    console.log("Error in deletePost controller: ", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Comment on Posts
export const commentOnPost = async (req, res) => {
  try {
    const { text } = req.body;
    const postId = req.params.id;
    const userId = req.user._id;

    //not a text
    if (!text) {
      return res.status(400).json({ error: "Text field is required" });
    }

    // check the post db in or not
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ error: "Post not Found" });
    }

    // create Comment
    const comment = { user: userId, text };

    post.comments.push(comment);
    await post.save();

    res.status(200).json(post);
  } catch (error) {
    console.log("Error in commentOnPost controller: ", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Liked the Posts
export const likeUnlikePost = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id: postId } = req.params;

    // get the post
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ error: "Post not Found" });
    }

    // check user liked already or not
    const userLikedPost = post.likes.includes(userId);

    if (userLikedPost) {
      // unlike post
      await Post.updateOne({ _id: postId }, { $pull: { likes: userId } });
      await User.updateOne({ _id: userId }, { $pull: { likedPosts: postId } });
      res.status(200).json({ message: "Post Unliked successfully" });
    } else {
      // Like post
      post.likes.push(userId);
      await User.updateOne({ _id: userId }, { $pull: { likedPosts: postId } });
      await post.save();

      // Notification indecate to the user
      const notification = new Notification({
        from: userId,
        to: post.user,
        type: "like",
      });
      await notification.save();
      // response back to the client
      res.status(200).json({ message: "Post liked Successfully" });
    }
  } catch (error) {
    console.log("Error in likeUnlikePost controller: ", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// function for getallposts
export const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });

    if (posts.length === 0) {
      return res.status(200).json([]);
    }
    res.status(200).json(posts);
  } catch (error) {
    console.log("Error in getAllPost controller: ", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// function for get liked posts
export const getLikedPosts = async (req, res) => {
  const userId = req.params.id;

  try {
    //find the user by id
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    //find all post that liked
    const likedPosts = await Post.find({ _id: { $in: user.likedPosts } })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });
    res.status(200).json(likedPosts);
  } catch (error) {
    console.log("Error in getLikedPosts controller: ", error);
    res.status(500).json({ error: "Internal Server Errror" });
  }
};

// function for get following posts will be separate side
export const getFollowingPosts = async (req, res) => {
  try {
    //get user id
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not Found" });

    const following = user.following;

    const feedPosts = await Post.find({ user: { $in: following } })
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });
    res.status(200).json(feedPosts);
  } catch (error) {
    console.log("Error in getFollowingPosts controller: ", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get post of the user
export const getUserPosts = async (req, res) => {
  try {
    // get username
    const { username } = req.params;

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not Found" });

    // get post of the user
    const posts = await Post.find({ user: user._id })
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });

    res.status(200).json(posts);
  } catch (error) {
    console.log("Error in getUserPosts controller: ", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
