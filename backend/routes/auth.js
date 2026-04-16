const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const SECRET = process.env.JWT_SECRET;

/* ----------- SIGNUP ----------- */

router.post("/signup", async (req, res) => {
  try {

    const { name, email, password } = req.body;

    if(!name || !email || !password){
      return res.status(400).json({
        message: "Name, email and password are required"
      });
    }

    const existingUser = await User.findOne({ email });

    if(existingUser){
      return res.status(400).json({
        message: "User already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name: name,
      email: email,
      password: hashedPassword
    });

    await newUser.save();

    res.status(201).json({
      message: "Signup successful"
    });

  } 
  catch(err){
    console.error(err);

    res.status(500).json({
      message: "Server error"
    });
  }
});


/* ----------- LOGIN ----------- */

router.post("/login", async (req, res) => {
  try {

    const { email, password } = req.body;

    if(!email || !password){
      return res.status(400).json({
        message: "Email and password required"
      });
    }

    const user = await User.findOne({ email });

    if(!user){
      return res.status(400).json({
        message: "User not found"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if(!isMatch){
      return res.status(400).json({
        message: "Incorrect password"
      });
    }

    const token = jwt.sign(
      { id: user._id },
      SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      message: "Login successful",
      token: token
    });

  } 
  catch(err){
    console.error(err);

    res.status(500).json({
      message: "Server error"
    });
  }
});


module.exports = router;