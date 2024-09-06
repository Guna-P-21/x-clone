//pakages
import bcrypt from "bcryptjs";
import { v2 as cloudinary } from "cloudinary";

//models
import User from "../models/user.model.js";
import Notification from "../models/notification_model.js";

// Create getUserProfile function
export const getUserProfile = async (req, res) => {
  // grabing from params
  const { username } = req.params;

  try {
    const user = await User.findOne({ username }).select("-password");

    // there is notusername
    if (!user) {
      return res.status(404).json({ error: "User Not Found" });
    }
    // return user response
    res.status(200).json(user);
  } catch (error) {
    console.log("Error in getUserProfile:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// create followUnfollowUser function
export const followUnfollowUser = async (req, res) => {
  try {
    // get id from Params
    const { id } = req.params;
    // two different user to modify user will click follow or Un follow
    const userToModify = await User.findById(id);
    const currentUser = await User.findById(req.user._id);

    // User can follow himself or Not
    if (id === req.user._id.toString()) {
      return res
        .status(400)
        .json({ error: "You can't follow / unfollow yourself" });
    }
    // check user to modify current user find or not
    if (!userToModify || !currentUser)
      return res.status(400).json({ error: "User Not Found" });

    // this function do follow or unfollow functionalities
    const isFollowing = currentUser.following.includes(id);

    if (isFollowing) {
      // Unfollow the User in db
      await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } });
      await User.findByIdAndUpdate(req.user._id, { $pull: { following: id } });
      // Send notification to the user
      /*
      const newNotification = new Notification({
        type: "unfollow",
        form: req.user._id,
        to: userToModify._id,
      });
      */
      // to return the id of the user as a respone
      res.status(200).json({ message: "User unfollowing Successfully" });
    } else {
      // Follow the User in db
      await User.findByIdAndUpdate(id, { $push: { followers: req.user._id } });
      await User.findByIdAndUpdate(req.user._id, { $push: { following: id } });

      // Send Notification to the user
      const newNotification = new Notification({
        type: "follow",
        from: req.user._id,
        to: userToModify._id,
      });

      await newNotification.save();

      // to return the id of the user as a response
      res.status(200).json({ message: "User Followed Successfully" });
    }
  } catch (error) {
    console.log("Error in followUnfollowUser : ", error.message);
    res.status(500).json({ error: error.message });
  }
};

// THis function for suggestion the user Profile
export const getSuggestedUsers = async (req, res) => {
  try {
    // before function we wand exculded current user from the execution array
    const userId = req.user._id;

    const usersFollowedByMe = await User.findById(userId).select("following");

    // Aggrigate the User id in database of MongpDB
    const users = await User.aggregate([
      {
        $match: {
          _id: { $ne: userId },
        },
      },
      { $sample: { size: 10 } },
    ]);

    // Filter out the users that I'm already following
    const filteredUsers = users.filter(
      (user) => !usersFollowedByMe.following.includes(user._id)
    );
    const suggestedUsers = filteredUsers.slice(0, 4);

    suggestedUsers.forEach((user) => (user.password = null));

    res.status(200).json(suggestedUsers);
  } catch (error) {
    console.log("Error in getSuggestedUsers: ", error.message);
    res.status(500).json({ error: error.message });
  }
};

// This function for update Users profile
export const updateUser = async (req, res) => {
  // user update the Profile
  const { fullName, email, username, currentPassword, newPassword, bio, link } =
    req.body;
  // update the profile img && cover img, we can reassign the value later in the function so we use let keyword
  let { profileImg, coverImg } = req.body;

  // Id of the current User from the request
  const userId = req.user._id;

  try {
    //reassign the value so use let keyword 
    let user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not Found" });

    // User can change the current password to new password, User give only current password then through error
    if (
      (!newPassword && currentPassword) ||
      (!currentPassword && newPassword)
    ) {
      return res.status(400).json({
        error: "Please Provide both current password and new password",
      });
    }

    // when user give current password incorrect
    if (currentPassword && newPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch)
        return res.status(400).json({ error: "Current Password is incorrect" });

      if (newPassword.length < 6) {
        return res
          .status(400)
          .json({ error: "Password must be at least 6 characters long" });
      }
      //again bcrypt the password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    if (profileImg) {
      //delete the existing img in cloudinary
      if (user.profileImg) {
        await cloudinary.uploader.destroy(
          user.profileImg.split("/").pop().split(".")[0]
        );
      }
      // Upload the new image
      const uploadedResponse = await cloudinary.uploader.upload(profileImg);
      profileImg = uploadedResponse.secure_url;
    }

    if (coverImg) {
      //delete the existing cover img in cloudinary
      if (user.coverImg) {
        await cloudinary.uploader.destroy(
          user.coverImg.split("/").pop().split(".")[0]
        );
      }
      // upload new cover image in cloudinary
      const uploadedResponse = await cloudinary.uploader.upload(coverImg);
      coverImg = uploadedResponse.secure_url;
    }

    // Changes are stored in  again  database
    user.fullName = fullName || user.fullName;
    user.email = email || user.email;
    user.username = username || user.username;
    user.bio = bio || user.bio;
    user.link = link || user.link;
    user.profileImg = profileImg || user.profileImg;
    user.coverImg = coverImg || user.coverImg;

    // save Database
    user = await user.save();

    // password should be null in response
    user.password = null;

    return res.status(200).json(user);
  } catch (error) {
    console.log("Error in updateUser: ", error.message);
    res.status(500).json({ error: error.message });
  }
};
